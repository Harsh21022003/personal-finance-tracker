

require("dotenv").config();
const mysql = require("mysql2");

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "Harsh@1238",
  database: "finance_app",
  waitForConnections: true,
  connectionLimit: 10
});

db.getConnection((err) => {
  if (err) console.log("DB ERROR", err);
  else console.log("MySQL Connected");
});

module.exports = db;
