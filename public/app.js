console.log("app.js loaded");
let budgetChartInstance = null;
let expenseChartInstance = null;

const api = "personal-finance-tracker-seven-bay.vercel.app";

/* ================= AUTH ================= */

function checkAuth() {
  const token = localStorage.getItem("token");
  if (!token && !location.pathname.includes("index.html")) {
    location.href = "index.html";
    return false;
  }
  return true;
}

function logout() {
  localStorage.removeItem("token");
  location.href = "index.html";
}

async function login() {
  try {
    if (!email.value || !password.value) {
      alert("Please enter email and password");
      return;
    }

    const res = await fetch(api + "/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.value,
        password: password.value
      })
    });

    const data = await res.json();

    if (data.token) {
      localStorage.setItem("token", data.token);
      location.href = "dashboard.html";
    } else {
      alert(data.message || "Login failed");
    }
  } catch (error) {
    alert("Error connecting to server");
  }
}

async function register() {
  try {
    if (!email.value || !password.value) {
      alert("Please enter email and password");
      return;
    }

    const res = await fetch(api + "/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.value,
        password: password.value
      })
    });

    const data = await res.json();
    alert(data.message || "Registered successfully");
    
    if (data.verificationToken) {
      console.log("Verification token:", data.verificationToken);
    }
  } catch (error) {
    alert("Registration failed");
  }
}

/* ================= DASHBOARD ================= */

async function loadSummary() {
  try {
    const res = await fetch(api + "/summary", {
      headers: { token: localStorage.getItem("token") }
    });
    
    if (res.status === 401) {
      logout();
      return;
    }

    const d = await res.json();
    if (document.getElementById("inc")) {
      document.getElementById("inc").innerText = formatCurrency(d.income || 0);
    }
    if (document.getElementById("exp")) {
      document.getElementById("exp").innerText = formatCurrency(d.expense || 0);
    }
    if (document.getElementById("bal")) {
      document.getElementById("bal").innerText = formatCurrency(d.balance || 0);
      document.getElementById("bal").style.color = d.balance >= 0 ? "#4caf50" : "#f44336";
    }
  } catch (error) {
    console.error("Error loading summary:", error);
  }
}

function formatCurrency(amount) {
  return "₹" + parseFloat(amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function addTransaction() {
  try {
    const amountEl = document.getElementById("amount");
    const typeEl = document.getElementById("type");
    const categoryEl = document.getElementById("category");
    const descEl = document.getElementById("desc");
    const dateEl = document.getElementById("date");

    if (!amountEl.value || !categoryEl.value || !dateEl.value) {
      alert("Please fill in all required fields");
      return;
    }

    const res = await fetch(api + "/transaction", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        token: localStorage.getItem("token")
      },
      body: JSON.stringify({
        amount: parseFloat(amountEl.value),
        type: typeEl.value,
        category: categoryEl.value,
        description: descEl.value || "",
        date: dateEl.value
      })
    });

    const data = await res.json();
    
    if (res.ok) {
      alert("Transaction saved");
      amountEl.value = "";
      categoryEl.value = "";
      descEl.value = "";
      dateEl.value = new Date().toISOString().split('T')[0]; // Reset to today
      await loadSummary();
      await loadProgress();
      await loadCharts();
    } else {
      alert(data.message || "Failed to save transaction");
    }
  } catch (error) {
    alert("Error saving transaction");
  }
}

async function saveBudget() {
  try {
    const bcatEl = document.getElementById("bcat");
    const bamtEl = document.getElementById("bamt");

    if (!bcatEl.value || !bamtEl.value) {
      alert("Please enter category and amount");
      return;
    }

    const res = await fetch(api + "/budget", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        token: localStorage.getItem("token")
      },
      body: JSON.stringify({
        category: bcatEl.value,
        amount: parseFloat(bamtEl.value)
      })
    });

    const data = await res.json();
    
    if (res.ok) {
      alert("Budget saved");
      bcatEl.value = "";
      bamtEl.value = "";
      await loadProgress();
      await loadCharts();
    } else {
      alert(data.message || "Failed to save budget");
    }
  } catch (error) {
    alert("Error saving budget");
  }
}

/* ================= BUDGET PROGRESS ================= */

async function loadProgress() {
  try {
    const res = await fetch(api + "/budget-progress", {
      headers: { token: localStorage.getItem("token") }
    });

    const data = await res.json();
    const progressEl = document.getElementById("progress");
    
    if (!progressEl) return;
    
    progressEl.innerHTML = "";

    if (data.length === 0) {
      progressEl.innerHTML = "<p class='no-data'>No budget data. Set a budget to see progress.</p>";
      return;
    }

    data.forEach(b => {
      const percent = Math.min(100, (b.spent / b.budget) * 100);
      const color = percent >= 100 ? "#f44336" : percent >= 80 ? "#ff9800" : "#4caf50";
      
      progressEl.innerHTML += `
        <div class="budget-item">
          <div class="budget-header">
            <span class="budget-category">${b.category}</span>
            <span class="budget-amount">${formatCurrency(b.spent)} / ${formatCurrency(b.budget)}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width:${percent}%; background-color:${color}"></div>
          </div>
          <div class="budget-percent">${percent.toFixed(1)}%</div>
        </div>
      `;
    });
  } catch (error) {
    console.error("Error loading progress:", error);
  }
}

/* ================= CHARTS ================= */

async function loadCharts() {
  try {
    const token = localStorage.getItem("token");

    /* ========== BAR CHART (Budget vs Spent) ========== */
    const p = await fetch(api + "/budget-progress", {
      headers: { token }
    });
    const prog = await p.json();

    const barCanvas = document.getElementById("budgetChart");
    if (barCanvas) {
      if (budgetChartInstance) {
        budgetChartInstance.destroy();
      }

      if (prog.length > 0) {
        budgetChartInstance = new Chart(barCanvas, {
          type: "bar",
          data: {
            labels: prog.map(x => x.category),
            datasets: [
              {
                label: "Budget",
                data: prog.map(x => parseFloat(x.budget)),
                backgroundColor: "rgba(54, 162, 235, 0.6)",
                borderColor: "rgba(54, 162, 235, 1)",
                borderWidth: 1
              },
              {
                label: "Spent",
                data: prog.map(x => parseFloat(x.spent)),
                backgroundColor: "rgba(255, 99, 132, 0.6)",
                borderColor: "rgba(255, 99, 132, 1)",
                borderWidth: 1
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: { beginAtZero: true }
            }
          }
        });
      } else {
        if (barCanvas.parentElement) {
          barCanvas.parentElement.innerHTML = "<p class='no-data'>No budget data available for chart</p>";
        }
      }
    }

    /* ========== PIE CHART (Expenses) ========== */
    const r = await fetch(api + "/chart-data", {
      headers: { token }
    });
    const data = await r.json();

    const pieCanvas = document.getElementById("expenseChart");
    if (pieCanvas) {
      if (expenseChartInstance) {
        expenseChartInstance.destroy();
      }

      if (data.length > 0) {
        expenseChartInstance = new Chart(pieCanvas, {
          type: "pie",
          data: {
            labels: data.map(x => x.category),
            datasets: [
              {
                data: data.map(x => parseFloat(x.total)),
                backgroundColor: [
                  "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF",
                  "#FF9F40", "#FF6384", "#C9CBCF", "#4BC0C0", "#FF6384"
                ]
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false
          }
        });
      } else {
        if (pieCanvas.parentElement) {
          pieCanvas.parentElement.innerHTML = "<p class='no-data'>No expense data available for chart</p>";
        }
      }
    }
  } catch (error) {
    console.error("Error loading charts:", error);
  }
}

/* ================= INCOME SOURCES ================= */

async function loadIncomeSources() {
  try {
    const res = await fetch(api + "/income-sources", {
      headers: { token: localStorage.getItem("token") }
    });

    const data = await res.json();
    const incomeSourcesEl = document.getElementById("incomeSources");
    
    if (!incomeSourcesEl) return;
    
    incomeSourcesEl.innerHTML = "";

    if (data.length === 0) {
      incomeSourcesEl.innerHTML = "<p class='no-data'>No income sources. Add one below.</p>";
      return;
    }

    data.forEach(source => {
      incomeSourcesEl.innerHTML += `
        <div class="income-source-item">
          <div>
            <strong>${source.source_name}</strong>
            <span class="badge ${source.is_active ? 'active' : 'inactive'}">${source.is_active ? 'Active' : 'Inactive'}</span>
          </div>
          <div>${formatCurrency(source.amount)} - ${source.frequency}</div>
          <div>Next: ${new Date(source.next_date).toLocaleDateString()}</div>
          <button onclick="deleteIncomeSource(${source.id})" class="btn-danger">Delete</button>
        </div>
      `;
    });
  } catch (error) {
    console.error("Error loading income sources:", error);
  }
}

async function addIncomeSource() {
  try {
    const sourceNameEl = document.getElementById("sourceName");
    const sourceAmountEl = document.getElementById("sourceAmount");
    const sourceFreqEl = document.getElementById("sourceFreq");
    const sourceDateEl = document.getElementById("sourceDate");

    if (!sourceNameEl.value || !sourceAmountEl.value || !sourceFreqEl.value || !sourceDateEl.value) {
      alert("Please fill in all fields");
      return;
    }

    const res = await fetch(api + "/income-source", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        token: localStorage.getItem("token")
      },
      body: JSON.stringify({
        source_name: sourceNameEl.value,
        amount: parseFloat(sourceAmountEl.value),
        frequency: sourceFreqEl.value,
        next_date: sourceDateEl.value
      })
    });

    const data = await res.json();
    
    if (res.ok) {
      alert("Income source saved");
      sourceNameEl.value = "";
      sourceAmountEl.value = "";
      sourceFreqEl.value = "";
      sourceDateEl.value = "";
      loadIncomeSources();
    } else {
      alert(data.message || "Failed to save income source");
    }
  } catch (error) {
    alert("Error saving income source");
  }
}

async function deleteIncomeSource(id) {
  if (!confirm("Are you sure you want to delete this income source?")) return;

  try {
    const res = await fetch(api + "/income-source/" + id, {
      method: "DELETE",
      headers: { token: localStorage.getItem("token") }
    });

    const data = await res.json();
    
    if (res.ok) {
      loadIncomeSources();
    } else {
      alert(data.message || "Failed to delete income source");
    }
  } catch (error) {
    alert("Error deleting income source");
  }
}

/* ================= TRANSACTION HISTORY ================= */

async function loadTransactions() {
  try {
    const typeFilter = document.getElementById("typeFilter")?.value || "";
    const categoryFilter = document.getElementById("categoryFilter")?.value || "";
    const startDateFilter = document.getElementById("startDateFilter")?.value || "";
    const endDateFilter = document.getElementById("endDateFilter")?.value || "";
    const searchFilter = document.getElementById("searchFilter")?.value || "";

    let url = api + "/transactions?";
    const params = [];
    
    if (typeFilter) params.push(`type=${typeFilter}`);
    if (categoryFilter) params.push(`category=${categoryFilter}`);
    if (startDateFilter) params.push(`startDate=${startDateFilter}`);
    if (endDateFilter) params.push(`endDate=${endDateFilter}`);
    if (searchFilter) params.push(`search=${encodeURIComponent(searchFilter)}`);

    url += params.join("&");

    const res = await fetch(url, {
      headers: { token: localStorage.getItem("token") }
    });

    if (res.status === 401) {
      logout();
      return;
    }

    const transactions = await res.json();
    const listEl = document.getElementById("list");
    
    if (!listEl) return;
    
    listEl.innerHTML = "";

    if (transactions.length === 0) {
      listEl.innerHTML = "<li class='no-data'>No transactions found</li>";
      return;
    }

    transactions.forEach(t => {
      const typeClass = t.type === "income" ? "income" : "expense";
      const date = new Date(t.date).toLocaleDateString();
      
      listEl.innerHTML += `
        <li class="transaction-item ${typeClass}" data-id="${t.id}" data-type="${t.type}">
          <div class="transaction-main">
            <div>
              <strong>${t.category}</strong>
              <span class="transaction-type">${t.type.toUpperCase()}</span>
            </div>
            <div class="transaction-amount">${formatCurrency(t.amount)}</div>
          </div>
          <div class="transaction-details">
            <div>${t.description || "No description"}</div>
            <div>${date}</div>
          </div>
          <div class="transaction-actions">
            <button onclick="editTransaction(${t.id})" class="btn-edit">Edit</button>
            <button onclick="deleteTransaction(${t.id})" class="btn-danger">Delete</button>
          </div>
        </li>
      `;
    });
  } catch (error) {
    console.error("Error loading transactions:", error);
  }
}

function applyFilters() {
  loadTransactions();
}

function clearFilters() {
  if (document.getElementById("typeFilter")) document.getElementById("typeFilter").value = "";
  if (document.getElementById("categoryFilter")) document.getElementById("categoryFilter").value = "";
  if (document.getElementById("startDateFilter")) document.getElementById("startDateFilter").value = "";
  if (document.getElementById("endDateFilter")) document.getElementById("endDateFilter").value = "";
  if (document.getElementById("searchFilter")) document.getElementById("searchFilter").value = "";
  loadTransactions();
}

async function deleteTransaction(id) {
  if (!confirm("Are you sure you want to delete this transaction?")) return;

  try {
    const res = await fetch(api + "/transaction/" + id, {
      method: "DELETE",
      headers: { token: localStorage.getItem("token") }
    });

    const data = await res.json();
    
    if (res.ok) {
      loadTransactions();
      if (location.pathname.includes("dashboard")) {
        loadSummary();
        loadProgress();
        loadCharts();
      }
    } else {
      alert(data.message || "Failed to delete transaction");
    }
  } catch (error) {
    alert("Error deleting transaction");
  }
}

async function editTransaction(id) {
  try {
    // Fetch current transaction data
    const res = await fetch(api + "/transactions", {
      headers: { token: localStorage.getItem("token") }
    });
    
    if (res.status === 401) {
      logout();
      return;
    }

    const transactions = await res.json();
    const transaction = transactions.find(t => t.id === id);
    
    if (!transaction) {
      alert("Transaction not found");
      return;
    }

    // Simple edit - in production, use a modal
    const newAmount = prompt("Enter new amount:", transaction.amount);
    if (!newAmount) return;

    const newCategory = prompt("Enter new category:", transaction.category);
    if (!newCategory) return;

    const newDescription = prompt("Enter new description:", transaction.description || "");
    const newDate = prompt("Enter new date (YYYY-MM-DD):", transaction.date);
    if (!newDate) return;

    updateTransaction(id, {
      amount: parseFloat(newAmount),
      category: newCategory,
      description: newDescription || "",
      date: newDate,
      type: transaction.type
    });
  } catch (error) {
    alert("Error loading transaction data");
  }
}

async function updateTransaction(id, data) {
  try {
    const res = await fetch(api + "/transaction/" + id, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        token: localStorage.getItem("token")
      },
      body: JSON.stringify(data)
    });

    const result = await res.json();
    
    if (res.ok) {
      alert("Transaction updated");
      loadTransactions();
      if (location.pathname.includes("dashboard")) {
        loadSummary();
        loadProgress();
        loadCharts();
      }
    } else {
      alert(result.message || "Failed to update transaction");
    }
  } catch (error) {
    alert("Error updating transaction");
  }
}

/* ================= AUTO LOAD ================= */

document.addEventListener("DOMContentLoaded", () => {
  // Check authentication for protected pages
  if (!location.pathname.includes("index.html")) {
    if (!checkAuth()) return;
  }

  // Set default date to today
  const dateInputs = document.querySelectorAll('input[type="date"]');
  dateInputs.forEach(input => {
    if (!input.value) {
      input.value = new Date().toISOString().split('T')[0];
    }
  });

  if (location.pathname.includes("dashboard")) {
    loadSummary();
    loadProgress();
    loadCharts();
    loadIncomeSources();
  }

  if (location.pathname.includes("history")) {
    loadTransactions();
  }
});
