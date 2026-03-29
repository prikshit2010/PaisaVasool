let expensesList = [];
let editId = null;
let customCategories = [];
const defaultCategories = ['Food', 'Transport', 'Utilities', 'Entertainment', 'Shopping', 'Healthcare', 'Other'];

document.addEventListener('DOMContentLoaded', async () => {
    if (!auth.isLoggedIn()) return;
    document.getElementById('expDate').valueAsDate = new Date();
    await loadCategories();
    await fetchExpenses();
    
    document.getElementById('expenseForm').addEventListener('submit', saveExpense);
    document.getElementById('searchInput').addEventListener('input', filterTable);
    document.getElementById('filterCategory').addEventListener('change', filterTable);
    document.getElementById('categoryForm').addEventListener('submit', addCategory);
    
    document.getElementById('expenseModal').addEventListener('hidden.bs.modal', () => {
        document.getElementById('expenseForm').reset();
        document.getElementById('expenseId').value = '';
        document.getElementById('expDate').valueAsDate = new Date();
        document.getElementById('modalTitle').innerText = i18n[localStorage.getItem('lang')||'en']['btn_add_expense'];
        editId = null;
    });
});

async function loadCategories() {
    try {
        const res = await apiCall('/categories');
        customCategories = res;
        const allCats = [...defaultCategories, ...res.map(c => c.name)];
        
        const filterSelect = document.getElementById('filterCategory');
        const formSelect = document.getElementById('expCategory');
        const listBody = document.getElementById('categoryListBody');
        
        // preserve the all selected
        const currFilter = filterSelect.value;
        filterSelect.innerHTML = `<option value="" data-i18n="all_categories">${i18n[localStorage.getItem('lang')||'en']['all_categories'] || 'All Categories'}</option>`;
        formSelect.innerHTML = '';
        listBody.innerHTML = '';
        
        allCats.forEach(c => {
            filterSelect.innerHTML += `<option value="${c}">${c}</option>`;
            formSelect.innerHTML += `<option value="${c}">${c}</option>`;
        });
        filterSelect.value = currFilter;
        
        defaultCategories.forEach(c => {
            listBody.innerHTML += `<li class="list-group-item disabled bg-light">${c} <em>(Default)</em></li>`;
        });
        res.forEach(c => {
            listBody.innerHTML += `<li class="list-group-item d-flex justify-content-between align-items-center">${c.name} 
                <button class="btn btn-sm btn-danger" onclick="deleteCategory(${c.id})"><i class="bi bi-trash"></i></button></li>`;
        });
    } catch(err) { console.error('Failed to load categories'); }
}

async function addCategory(e) {
    e.preventDefault();
    const name = document.getElementById('newCategoryName').value;
    try {
        await apiCall('/categories', { method: 'POST', body: JSON.stringify({name}) });
        document.getElementById('newCategoryName').value = '';
        await loadCategories();
    } catch(e) { showAlert('Failed to add category'); }
}

async function deleteCategory(id) {
    await apiCall(`/categories?id=${id}`, { method: 'DELETE' });
    await loadCategories();
}

async function fetchExpenses() {
    try {
        expensesList = await apiCall('/expenses');
        renderTable(expensesList);
    } catch(err) { showAlert('Failed to load expenses'); }
}

function renderTable(data) {
    const tbody = document.getElementById('allExpensesTable');
    tbody.innerHTML = '';
    const catIcons = {'Food': 'bi-cup-hot', 'Transport': 'bi-car-front', 'Utilities': 'bi-lightning', 'Entertainment': 'bi-film', 'Shopping': 'bi-bag', 'Healthcare': 'bi-heart-pulse', 'Other': 'bi-three-dots'};
    data.forEach(e => {
        const icon = catIcons[e.category] || 'bi-bookmark';
        tbody.innerHTML += `<tr>
            <td>${e.date}</td>
            <td><i class="bi ${icon} me-2 text-primary"></i> ${e.category}</td>
            <td>${e.description}</td>
            <td class="fw-bold">₹${e.amount.toFixed(2)}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editExpense(${e.id})"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteExpense(${e.id})"><i class="bi bi-trash"></i></button>
            </td></tr>`;
    });
    if(data.length === 0) tbody.innerHTML = '<tr><td colspan="5" class="text-center">No expenses found</td></tr>';
}

function filterTable() {
    const q = document.getElementById('searchInput').value.toLowerCase();
    const cat = document.getElementById('filterCategory').value;
    renderTable(expensesList.filter(e => e.description.toLowerCase().includes(q) && (cat === '' || e.category === cat)));
}

async function saveExpense(e) {
    e.preventDefault();
    const payload = { amount: document.getElementById('expAmount').value, category: document.getElementById('expCategory').value, date: document.getElementById('expDate').value, description: document.getElementById('expDesc').value };
    try {
        if (editId) {
            await apiCall(`/expenses/${editId}`, { method: 'PUT', body: JSON.stringify(payload) });
        } else {
            await apiCall('/expenses', { method: 'POST', body: JSON.stringify(payload) });
        }
        bootstrap.Modal.getInstance(document.getElementById('expenseModal')).hide();
        // table fetches via socket instead!
    } catch(err) { showAlert(err.message); }
}

async function deleteExpense(id) {
    if(!confirm('Are you sure?')) return;
    await apiCall(`/expenses/${id}`, { method: 'DELETE' });
}

window.editExpense = (id) => {
    const exp = expensesList.find(e => e.id === id);
    if(!exp) return;
    editId = id;
    document.getElementById('expenseId').value = id;
    document.getElementById('expAmount').value = exp.amount;
    document.getElementById('expCategory').value = exp.category;
    document.getElementById('expDate').value = exp.date;
    document.getElementById('expDesc').value = exp.description;
    document.getElementById('modalTitle').innerText = 'Edit Expense';
    new bootstrap.Modal(document.getElementById('expenseModal')).show();
};
window.deleteCategory = deleteCategory;
window.deleteExpense = deleteExpense;
