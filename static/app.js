const API_BASE = '/api';

const i18n = {
    en: {
        'nav_dashboard': 'Dashboard', 'nav_expenses': 'Expenses', 'nav_logout': 'Logout',
        'title_manage_expenses': 'Manage Expenses', 'btn_manage_categories': 'Categories', 'btn_add_expense': 'Add Expense',
        'btn_save': 'Save', 'all_categories': 'All Categories', 'recent_transactions': 'Recent Transactions',
        'this_month': 'This Month', 'budget': 'Budget', 'total_expenses': 'Total Expenses',
        'cat_breakdown': 'Category Breakdown', 'monthly_trend': 'Monthly Spending Trend', 'ai_prediction': 'AI Budget Prediction',
        'th_date': 'Date', 'th_category': 'Category', 'th_desc': 'Description', 'th_amount': 'Amount', 'th_actions': 'Actions'
    },
    hi: {
        'nav_dashboard': 'डैशबोर्ड', 'nav_expenses': 'खर्च', 'nav_logout': 'लॉग आउट',
        'title_manage_expenses': 'खर्च प्रबंधित करें', 'btn_manage_categories': 'श्रेणियाँ', 'btn_add_expense': 'नया खर्च जुड़ें',
        'btn_save': 'सेव करें', 'all_categories': 'सभी श्रेणियाँ', 'recent_transactions': 'हाल ही के लेन-देन',
        'this_month': 'इस महीने', 'budget': 'बजट', 'total_expenses': 'कुल खर्च',
        'cat_breakdown': 'श्रेणी वर्गीकरण', 'monthly_trend': 'मासिक खर्च प्रवृत्ति', 'ai_prediction': 'AI बजट भविष्यवाणी',
        'th_date': 'तारीख', 'th_category': 'श्रेणी', 'th_desc': 'विवरण', 'th_amount': 'रकम', 'th_actions': 'क्रियाएँ'
    },
    es: {
        'nav_dashboard': 'Tablero', 'nav_expenses': 'Gastos', 'nav_logout': 'Cerrar sesión',
        'title_manage_expenses': 'Gestionar Gastos', 'btn_manage_categories': 'Categorías', 'btn_add_expense': 'Añadir Gasto',
        'btn_save': 'Guardar', 'all_categories': 'Todas las Categorías', 'recent_transactions': 'Transacciones Recientes',
        'this_month': 'Este Mes', 'budget': 'Presupuesto', 'total_expenses': 'Gastos Totales',
        'cat_breakdown': 'Desglose de Categorías', 'monthly_trend': 'Tendencia Mensual', 'ai_prediction': 'Predicción de Presupuesto AI',
        'th_date': 'Fecha', 'th_category': 'Categoría', 'th_desc': 'Descripción', 'th_amount': 'Cantidad', 'th_actions': 'Acciones'
    }
};

const auth = {
    setToken: (token, username) => { localStorage.setItem('token', token); localStorage.setItem('username', username); },
    getToken: () => localStorage.getItem('token'),
    getUsername: () => localStorage.getItem('username'),
    logout: () => { localStorage.removeItem('token'); localStorage.removeItem('username'); window.location.href = '/login'; },
    isLoggedIn: () => !!localStorage.getItem('token')
};

async function apiCall(endpoint, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (auth.getToken()) headers['Authorization'] = `Bearer ${auth.getToken()}`;
    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    if (res.status === 401 && endpoint !== '/login') return auth.logout();
    if (!res.ok) {
        let err; try { err = await res.json(); } catch(e) { err = { message: 'Error' }; }
        throw new Error(err.message);
    }
    const ct = res.headers.get('content-type');
    return ct && ct.includes('json') ? res.json() : res.blob();
}

function showAlert(msg, type = 'danger') {
    const cont = document.getElementById('alert-container');
    if(!cont) return;
    cont.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show">${msg}<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>`;
    setTimeout(() => { cont.innerHTML = ''; }, 4000);
}

function applyLanguage(lang) {
    localStorage.setItem('lang', lang);
    document.getElementById('langDisplay').innerText = lang.toUpperCase();
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if(i18n[lang] && i18n[lang][key]) {
            if(el.tagName === 'INPUT' && el.placeholder) el.placeholder = i18n[lang][key];
            else el.innerText = i18n[lang][key];
        }
    });
}

document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        applyLanguage(e.target.getAttribute('data-lang'));
    });
});

const themeBtn = document.getElementById('darkModeToggle');
if (themeBtn) {
    const ct = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-bs-theme', ct);
    themeBtn.innerHTML = ct === 'dark' ? '<i class="bi bi-sun-fill"></i>' : '<i class="bi bi-moon-fill"></i>';
    themeBtn.addEventListener('click', () => {
        const nt = document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-bs-theme', nt);
        localStorage.setItem('theme', nt);
        themeBtn.innerHTML = nt === 'dark' ? '<i class="bi bi-sun-fill"></i>' : '<i class="bi bi-moon-fill"></i>';
        if(typeof renderCharts === 'function') renderCharts();
    });
}

const navItems = document.getElementById('nav-items');
if (navItems) {
    if (auth.isLoggedIn()) {
        navItems.innerHTML = `
            <li class="nav-item"><a class="nav-link" href="/dashboard"><i class="bi bi-graph-up"></i> <span data-i18n="nav_dashboard">Dashboard</span></a></li>
            <li class="nav-item"><a class="nav-link" href="/expenses"><i class="bi bi-receipt"></i> <span data-i18n="nav_expenses">Expenses</span></a></li>
            <li class="nav-item"><a class="nav-link text-white" href="#" id="logoutBtn"><i class="bi bi-box-arrow-right"></i> <span data-i18n="nav_logout">Logout</span> (${auth.getUsername()})</a></li>
        `;
        document.getElementById('logoutBtn').addEventListener('click', (e) => { e.preventDefault(); auth.logout(); });
    } else {
        navItems.innerHTML = `<li class="nav-item"><a class="nav-link" href="/login">Login</a></li><li class="nav-item"><a class="nav-link" href="/register">Register</a></li>`;
    }
}

if (window.location.pathname === '/' || window.location.pathname === '/login') {
    if (auth.isLoggedIn() && window.location.pathname === '/') window.location.href = '/dashboard';
    const form = document.getElementById('loginForm');
    if (form) form.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const res = await apiCall('/login', { method: 'POST', body: JSON.stringify({ username: form.username.value, password: form.password.value }) });
            auth.setToken(res.token, res.username); window.location.href = '/dashboard';
        } catch (err) { showAlert(err.message); }
    });
}

const regForm = document.getElementById('registerForm');
if (regForm) regForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        await apiCall('/register', { method: 'POST', body: JSON.stringify({ username: regForm.username.value, password: regForm.password.value }) });
        showAlert('Registration successful! Please login.', 'success'); setTimeout(() => window.location.href = '/login', 1500);
    } catch (err) { showAlert(err.message); }
});

if(auth.isLoggedIn() && window.io) {
    const socket = io();
    socket.on('expense_updated', () => {
        if(window.location.pathname === '/dashboard' && typeof loadDashboard === 'function') { loadDashboard(); loadRecentTransactions(); loadPrediction(); }
        if(window.location.pathname === '/expenses' && typeof fetchExpenses === 'function') fetchExpenses();
    });
    socket.on('budget_updated', () => {
        if(window.location.pathname === '/dashboard' && typeof loadDashboard === 'function') loadDashboard();
    });
}
applyLanguage(localStorage.getItem('lang') || 'en');
