const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const db = require("./db");
require("dotenv").config();


const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

const SECRET = "secretkey";

// Test route
app.get("/", (req,res)=>{
  res.send("Server running");
});

// Register
app.post("/register", async (req,res)=>{
  try {
    const { email, password } = req.body;
    if(!email || !password) {
      return res.status(400).json({message:"Email and password required"});
    }

    const hash = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    db.query(
      "INSERT INTO users(email,password,verification_token) VALUES(?,?,?)",
      [email, hash, verificationToken],
      (err) => {
        if(err) {
          if(err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({message:"User already exists"});
          }
          return res.status(400).json({message:"Registration failed"});
        }
        // In production, send email with verification token
        res.json({
          message:"Registered successfully. Please verify your email.",
          verificationToken: verificationToken // For testing - remove in production
        });
      }
    );
  } catch(error) {
    res.status(500).json({message:"Server error"});
  }
});

// Login
app.post("/login", (req,res)=>{
  try {
    const { email, password } = req.body;
    if(!email || !password) {
      return res.status(400).json({message:"Email and password required"});
    }

    db.query("SELECT * FROM users WHERE email=?",[email], async (err,rows)=>{
      if(err) return res.status(500).json({message:"Database error"});
      if(!rows.length) return res.status(401).json({message:"User not found"});

      const match = await bcrypt.compare(password, rows[0].password);
      if(!match) return res.status(401).json({message:"Wrong password"});

      // Check email verification (optional - can be skipped for demo)
      // if(!rows[0].email_verified) {
      //   return res.status(401).json({message:"Please verify your email first"});
      // }

      const token = jwt.sign({id: rows[0].id}, SECRET);
      res.json({token, userId: rows[0].id});
    });
  } catch(error) {
    res.status(500).json({message:"Server error"});
  }
});

function auth(req,res,next){
  try{
    const token = req.headers.token || req.headers.authorization?.replace('Bearer ', '');
    if(!token) return res.status(401).json({message:"No token provided"});
    
    req.user = jwt.verify(token, SECRET).id;
    next();
  }catch(error){
    res.status(401).json({message:"Invalid or expired token"});
  }
}

// ADD TRANSACTION
app.post("/transaction", auth, (req,res)=>{
  try {
    const { amount, type, category, description, date } = req.body;
    
    if(!amount || !type || !category || !date) {
      return res.status(400).json({message:"Missing required fields"});
    }

    const transactionDate = date || new Date().toISOString().split('T')[0];

    db.query(
      "INSERT INTO transactions(user_id,amount,type,category,description,date) VALUES(?,?,?,?,?,?)",
      [req.user, amount, type, category, description || '', transactionDate],
      (err, result) => {
        if(err) {
          console.error(err);
          return res.status(400).json({message:"Failed to save transaction"});
        }
        res.json({message:"Transaction saved", id: result.insertId});
      }
    );
  } catch(error) {
    res.status(500).json({message:"Server error"});
  }
});

// GET ALL USER TRANSACTIONS (with filtering and search)
app.get("/transactions", auth, (req,res)=>{
  try {
    const { type, category, startDate, endDate, search } = req.query;
    let query = "SELECT * FROM transactions WHERE user_id=?";
    const params = [req.user];

    if(type) {
      query += " AND type=?";
      params.push(type);
    }
    if(category) {
      query += " AND category LIKE ?";
      params.push(`%${category}%`);
    }
    if(startDate) {
      query += " AND date >= ?";
      params.push(startDate);
    }
    if(endDate) {
      query += " AND date <= ?";
      params.push(endDate);
    }
    if(search) {
      query += " AND (description LIKE ? OR category LIKE ?)";
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += " ORDER BY date DESC, id DESC";

    db.query(query, params, (err, rows)=>{
      if(err) {
        console.error(err);
        return res.status(400).json({message:"Error fetching transactions"});
      }
      res.json(rows);
    });
  } catch(error) {
    res.status(500).json({message:"Server error"});
  }
});

// UPDATE TRANSACTION
app.put("/transaction/:id", auth, (req,res)=>{
  try {
    const { id } = req.params;
    const { amount, type, category, description, date } = req.body;

    db.query(
      "UPDATE transactions SET amount=?, type=?, category=?, description=?, date=? WHERE id=? AND user_id=?",
      [amount, type, category, description || '', date, id, req.user],
      (err, result) => {
        if(err) {
          console.error(err);
          return res.status(400).json({message:"Failed to update transaction"});
        }
        if(result.affectedRows === 0) {
          return res.status(404).json({message:"Transaction not found"});
        }
        res.json({message:"Transaction updated"});
      }
    );
  } catch(error) {
    res.status(500).json({message:"Server error"});
  }
});

// DELETE TRANSACTION
app.delete("/transaction/:id", auth, (req,res)=>{
  try {
    const { id } = req.params;

    db.query(
      "DELETE FROM transactions WHERE id=? AND user_id=?",
      [id, req.user],
      (err, result) => {
        if(err) {
          console.error(err);
          return res.status(400).json({message:"Failed to delete transaction"});
        }
        if(result.affectedRows === 0) {
          return res.status(404).json({message:"Transaction not found"});
        }
        res.json({message:"Transaction deleted"});
      }
    );
  } catch(error) {
    res.status(500).json({message:"Server error"});
  }
});

app.get("/summary", auth, (req,res)=>{
  db.query(
    `SELECT 
      SUM(CASE WHEN type='income' THEN amount ELSE 0 END) income,
      SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) expense
     FROM transactions WHERE user_id=?`,
    [req.user],
    (e,r)=>res.json({
      income:r[0].income||0,
      expense:r[0].expense||0,
      balance:(r[0].income||0)-(r[0].expense||0)
    })
  );
});

// ADD / UPDATE BUDGET
app.post("/budget", auth, (req,res)=>{
  const { category, amount } = req.body;
  db.query(
    "REPLACE INTO budgets(user_id,category,amount) VALUES(?,?,?)",
    [req.user, category, amount],
    ()=>res.json({message:"Budget saved"})
  );
});

// GET BUDGETS
app.get("/budgets", auth, (req,res)=>{
  db.query(
    "SELECT * FROM budgets WHERE user_id=?",
    [req.user],
    (e,r)=>res.json(r)
  );
});
app.get("/budget-progress", auth, (req, res) => {
  db.query(
    `SELECT 
      b.category,
      b.amount AS budget,
      IFNULL(SUM(t.amount), 0) AS spent
     FROM budgets b
     LEFT JOIN transactions t
       ON LOWER(b.category) = LOWER(t.category)
       AND t.type = 'expense'
       AND t.user_id = b.user_id
     WHERE b.user_id = ?
     GROUP BY b.category`,
    [req.user],
    (err, rows) => {
      if (err) {
        console.log(err);
        return res.json([]);   // ✅ ALWAYS return JSON
      }
      res.json(rows);         // ✅ NEVER send empty response
    }
  );
});
app.get("/chart-data", auth, (req,res)=>{
  db.query(
    `SELECT category, SUM(amount) total
     FROM transactions
     WHERE user_id=? AND type='expense'
     GROUP BY category`,
    [req.user],
    (e,r)=>{
      if(e) {
        console.error(e);
        return res.json([]);
      }
      res.json(r);
    }
  );
});

// ================= INCOME SOURCES =================

// ADD INCOME SOURCE
app.post("/income-source", auth, (req,res)=>{
  try {
    const { source_name, amount, frequency, next_date } = req.body;
    
    if(!source_name || !amount || !frequency || !next_date) {
      return res.status(400).json({message:"All fields required"});
    }

    db.query(
      "INSERT INTO income_sources(user_id,source_name,amount,frequency,next_date) VALUES(?,?,?,?,?)",
      [req.user, source_name, amount, frequency, next_date],
      (err, result) => {
        if(err) {
          console.error(err);
          return res.status(400).json({message:"Failed to save income source"});
        }
        res.json({message:"Income source saved", id: result.insertId});
      }
    );
  } catch(error) {
    res.status(500).json({message:"Server error"});
  }
});

// GET INCOME SOURCES
app.get("/income-sources", auth, (req,res)=>{
  db.query(
    "SELECT * FROM income_sources WHERE user_id=? ORDER BY created_at DESC",
    [req.user],
    (err, rows) => {
      if(err) {
        console.error(err);
        return res.json([]);
      }
      res.json(rows);
    }
  );
});

// UPDATE INCOME SOURCE
app.put("/income-source/:id", auth, (req,res)=>{
  try {
    const { id } = req.params;
    const { source_name, amount, frequency, next_date, is_active } = req.body;

    db.query(
      "UPDATE income_sources SET source_name=?, amount=?, frequency=?, next_date=?, is_active=? WHERE id=? AND user_id=?",
      [source_name, amount, frequency, next_date, is_active !== undefined ? is_active : true, id, req.user],
      (err, result) => {
        if(err) {
          console.error(err);
          return res.status(400).json({message:"Failed to update income source"});
        }
        if(result.affectedRows === 0) {
          return res.status(404).json({message:"Income source not found"});
        }
        res.json({message:"Income source updated"});
      }
    );
  } catch(error) {
    res.status(500).json({message:"Server error"});
  }
});

// DELETE INCOME SOURCE
app.delete("/income-source/:id", auth, (req,res)=>{
  try {
    const { id } = req.params;

    db.query(
      "DELETE FROM income_sources WHERE id=? AND user_id=?",
      [id, req.user],
      (err, result) => {
        if(err) {
          console.error(err);
          return res.status(400).json({message:"Failed to delete income source"});
        }
        if(result.affectedRows === 0) {
          return res.status(404).json({message:"Income source not found"});
        }
        res.json({message:"Income source deleted"});
      }
    );
  } catch(error) {
    res.status(500).json({message:"Server error"});
  }
});

// VERIFY EMAIL
app.post("/verify-email", (req,res)=>{
  try {
    const { token } = req.body;
    
    db.query(
      "UPDATE users SET email_verified=TRUE, verification_token=NULL WHERE verification_token=?",
      [token],
      (err, result) => {
        if(err) {
          return res.status(400).json({message:"Verification failed"});
        }
        if(result.affectedRows === 0) {
          return res.status(404).json({message:"Invalid verification token"});
        }
        res.json({message:"Email verified successfully"});
      }
    );
  } catch(error) {
    res.status(500).json({message:"Server error"});
  }
});

app.listen(5000, ()=>console.log("Server running on port 5000"));
