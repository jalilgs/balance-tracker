// ---- Element references ----
const balanceEl = document.getElementById("balance");
const incomeAmountEl = document.getElementById("income-amount");
const expenseAmountEl = document.getElementById("expense-amount");
const transactionListEl = document.getElementById("transaction-list");
const listEmptyEl = document.getElementById("list-empty");
const transactionFormEl = document.getElementById("transaction-form");
const descriptionEl = document.getElementById("description");
const amountEl = document.getElementById("amount");
const categoryEl = document.getElementById("category");
const dateEl = document.getElementById("date");
const submitBtn = document.getElementById("submit-btn");
const cancelEditBtn = document.getElementById("cancel-edit-btn");
const formTitleEl = document.getElementById("form-title");
const searchInputEl = document.getElementById("search-input");
const categoryFilterEl = document.getElementById("category-filter");
const exportJsonBtn = document.getElementById("export-json-btn");
const exportCsvBtn = document.getElementById("export-csv-btn");
const importInputEl = document.getElementById("import-input");
const themeToggleBtn = document.getElementById("theme-toggle");

// ---- Constants / state ----
const CATEGORIES = ["Salary", "Food", "Transport", "Bills", "Entertainment", "Shopping", "Health", "Other"];
const THEME_KEY = "expense-tracker-theme";

let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let editingId = null;

// ---- Init ----
populateCategorySelects();
dateEl.value = todayString();
applyTheme(localStorage.getItem(THEME_KEY) || "light");
renderAll();

// ---- Event listeners ----
transactionFormEl.addEventListener("submit", handleFormSubmit);
cancelEditBtn.addEventListener("click", cancelEdit);
searchInputEl.addEventListener("input", updateTransactionList);
categoryFilterEl.addEventListener("change", updateTransactionList);
exportJsonBtn.addEventListener("click", exportAsJson);
exportCsvBtn.addEventListener("click", exportAsCsv);
importInputEl.addEventListener("change", handleImport);
themeToggleBtn.addEventListener("click", toggleTheme);

// ---- Helpers ----
function todayString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function populateCategorySelects() {
    categoryEl.innerHTML = CATEGORIES
        .map((cat) => `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`)
        .join("");

    categoryFilterEl.innerHTML =
        `<option value="all">All Categories</option>` +
        CATEGORIES.map((cat) => `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`).join("");
}

function saveTransactions() {
    localStorage.setItem("transactions", JSON.stringify(transactions));
}

function renderAll() {
    updateTransactionList();
    updateSummary();
}

// ---- Form handling (add + edit) ----
function handleFormSubmit(e) {
    e.preventDefault();

    const description = descriptionEl.value.trim();
    const amount = parseFloat(amountEl.value);
    const category = categoryEl.value;
    const date = dateEl.value || todayString();

    if (!description) {
        return;
    }

    if (isNaN(amount) || amount === 0) {
        alert("Please enter an amount that isn't zero.");
        return;
    }

    if (editingId !== null) {
        transactions = transactions.map((t) =>
            t.id === editingId ? { ...t, description, amount, category, date } : t
        );
        editingId = null;
        submitBtn.textContent = "Add Transaction";
        cancelEditBtn.style.display = "none";
        formTitleEl.textContent = "Add Transaction";
    } else {
        transactions.push({
            id: Date.now(),
            description,
            amount,
            category,
            date,
        });
    }

    saveTransactions();
    renderAll();

    transactionFormEl.reset();
    dateEl.value = todayString();
    categoryEl.value = CATEGORIES[0];
}

function editTransaction(id) {
    const transaction = transactions.find((t) => t.id === id);
    if (!transaction) return;

    descriptionEl.value = transaction.description;
    amountEl.value = transaction.amount;
    categoryEl.value = transaction.category;
    dateEl.value = transaction.date;

    editingId = id;
    submitBtn.textContent = "Update Transaction";
    cancelEditBtn.style.display = "block";
    formTitleEl.textContent = "Edit Transaction";
    descriptionEl.focus();
}

function cancelEdit() {
    editingId = null;
    transactionFormEl.reset();
    dateEl.value = todayString();
    categoryEl.value = CATEGORIES[0];
    submitBtn.textContent = "Add Transaction";
    cancelEditBtn.style.display = "none";
    formTitleEl.textContent = "Add Transaction";
}

function removeTransaction(id) {
    if (editingId === id) {
        cancelEdit();
    }

    transactions = transactions.filter((transaction) => transaction.id !== id);

    saveTransactions();
    renderAll();
}

// ---- Filtering / rendering the list ----
function getFilteredTransactions() {
    const searchTerm = searchInputEl.value.trim().toLowerCase();
    const categoryFilter = categoryFilterEl.value;

    return transactions.filter((t) => {
        const matchesSearch = !searchTerm || t.description.toLowerCase().includes(searchTerm);
        const matchesCategory = categoryFilter === "all" || t.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });
}

function updateTransactionList() {
    transactionListEl.innerHTML = "";

    const filtered = getFilteredTransactions();

    const sorted = [...filtered].sort((a, b) => {
        if (a.date !== b.date) {
            return a.date < b.date ? 1 : -1;
        }
        return b.id - a.id;
    });

    listEmptyEl.style.display = sorted.length === 0 ? "block" : "none";

    sorted.forEach((transaction) => {
        const transactionEl = createTransactionElement(transaction);
        transactionListEl.appendChild(transactionEl);
    });
}

function createTransactionElement(transaction) {
    const li = document.createElement("li");
    li.classList.add("transaction");
    li.classList.add(transaction.amount > 0 ? "income" : "expense");

    li.innerHTML = `
    <div class="transaction-info">
        <span class="transaction-description">${escapeHtml(transaction.description)}</span>
        <span class="transaction-meta">
            <span class="category-badge">${escapeHtml(transaction.category || "Other")}</span>
            <span class="transaction-date">${escapeHtml(transaction.date || "")}</span>
        </span>
    </div>
    <div class="transaction-actions">
        <span class="transaction-amount">${formatCurrency(transaction.amount)}</span>
        <button type="button" class="edit-btn" title="Edit">&#9998;</button>
        <button type="button" class="delete-btn" title="Delete">&times;</button>
    </div>
    `;

    li.querySelector(".edit-btn").addEventListener("click", () => editTransaction(transaction.id));
    li.querySelector(".delete-btn").addEventListener("click", () => removeTransaction(transaction.id));

    return li;
}

function updateSummary() {
    const balance = transactions.reduce((acc, transaction) => acc + transaction.amount, 0);

    const income = transactions
        .filter((transaction) => transaction.amount > 0)
        .reduce((acc, transaction) => acc + transaction.amount, 0);

    const expenses = transactions
        .filter((transaction) => transaction.amount < 0)
        .reduce((acc, transaction) => acc + transaction.amount, 0);

    balanceEl.textContent = formatCurrency(balance);
    incomeAmountEl.textContent = formatCurrency(income);
    expenseAmountEl.textContent = formatCurrency(expenses);
}

function formatCurrency(number) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "DZD",
    }).format(number);
}

// ---- Export ----
function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function exportAsJson() {
    if (transactions.length === 0) {
        alert("There are no transactions to export.");
        return;
    }
    const dataStr = JSON.stringify(transactions, null, 2);
    downloadFile(dataStr, "transactions.json", "application/json");
}

function exportAsCsv() {
    if (transactions.length === 0) {
        alert("There are no transactions to export.");
        return;
    }
    const escapeCsv = (value) => `"${String(value).replace(/"/g, '""')}"`;
    const header = ["Description", "Amount", "Category", "Date"].map(escapeCsv).join(",");
    const rows = transactions.map((t) =>
        [t.description, t.amount, t.category, t.date].map(escapeCsv).join(",")
    );
    const csvContent = [header, ...rows].join("\n");
    downloadFile(csvContent, "transactions.csv", "text/csv");
}

// ---- Import ----
function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const imported = JSON.parse(event.target.result);

            if (!Array.isArray(imported)) {
                throw new Error("Imported file must contain an array of transactions.");
            }

            const normalized = imported
                .filter((t) => t && typeof t.description === "string" && typeof t.amount === "number" && t.amount !== 0)
                .map((t) => ({
                    id: typeof t.id === "number" ? t.id : Date.now() + Math.floor(Math.random() * 1000),
                    description: t.description,
                    amount: t.amount,
                    category: CATEGORIES.includes(t.category) ? t.category : "Other",
                    date: typeof t.date === "string" && t.date ? t.date : todayString(),
                }));

            if (normalized.length === 0) {
                alert("No valid transactions were found in that file.");
                return;
            }

            transactions = transactions.concat(normalized);
            saveTransactions();
            renderAll();
            alert(`Imported ${normalized.length} transaction(s).`);
        } catch (err) {
            alert("Couldn't import that file. Please make sure it's a valid JSON export from this app.");
        } finally {
            importInputEl.value = "";
        }
    };
    reader.readAsText(file);
}

// ---- Theme ----
function applyTheme(theme) {
    document.body.setAttribute("data-theme", theme);
    themeToggleBtn.textContent = theme === "dark" ? "☀️" : "🌙";
    localStorage.setItem(THEME_KEY, theme);
}

function toggleTheme() {
    const current = document.body.getAttribute("data-theme") === "dark" ? "dark" : "light";
    applyTheme(current === "dark" ? "light" : "dark");
}
