let catChartInstance = null;
let barChartInstance = null;
let globalDashData = null;

document.addEventListener('DOMContentLoaded', async () => {
    if (!auth.isLoggedIn()) {
        window.location.href = '/login';
        return;
    }
    
    await loadDashboard();
    await loadPrediction();
    await loadRecentTransactions();
    
    document.getElementById('exportBtn').addEventListener('click', async () => {
        try {
            const blob = await apiCall('/export');
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'expenses_report.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (err) {
            showAlert('Failed to export CSV');
        }
    });
});

async function loadDashboard() {
    try {
        const data = await apiCall('/dashboard');
        globalDashData = data;
        
        document.getElementById('thisMonthTotal').innerText = `₹${data.monthly_total.toFixed(2)}`;
        document.getElementById('allTimeTotal').innerText = `₹${data.total_expenses.toFixed(2)}`;
        
        let budget = data.budget || 83000;
        const budgetElem = document.getElementById('currentBudgetDisplay');
        if(budgetElem) budgetElem.innerText = `₹${budget}`;
        
        if(data.monthly_total > budget) {
            showAlert(`Alert: You have exceeded your monthly budget of ₹${budget}!`, 'warning');
        }
        
        renderCharts();
    } catch (err) {
        console.error(err);
    }
}

async function loadPrediction() {
    try {
        const data = await apiCall('/predict');
        const cardClass = data.predicted > globalDashData?.monthly_total ? 'bg-danger' : 'bg-success';
        
        const card = document.getElementById('budgetCard');
        card.className = `card text-white ${cardClass} shadow-sm h-100 summary-card`;
        
        document.getElementById('predictedBudget').innerText = `₹${data.predicted}`;
        document.getElementById('aiTip').innerText = data.message;
    } catch (err) {
        document.getElementById('predictedBudget').innerText = 'N/A';
    }
}

async function loadRecentTransactions() {
    try {
        const expenses = await apiCall('/expenses');
        const tbody = document.getElementById('recentExpensesTable');
        tbody.innerHTML = '';
        
        const catIcons = {
            'Food': 'bi-cup-hot',
            'Transport': 'bi-car-front',
            'Utilities': 'bi-lightning',
            'Entertainment': 'bi-film',
            'Shopping': 'bi-bag',
            'Healthcare': 'bi-heart-pulse',
            'Other': 'bi-three-dots'
        };
        
        expenses.slice(0, 5).forEach(e => {
            const tr = document.createElement('tr');
            const icon = catIcons[e.category] || 'bi-bookmark';
            tr.innerHTML = `
                <td>${e.date}</td>
                <td><i class="bi ${icon} me-2 text-primary"></i> ${e.category}</td>
                <td>${e.description}</td>
                <td class="fw-bold">₹${e.amount.toFixed(2)}</td>
            `;
            tbody.appendChild(tr);
        });
        if(expenses.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">No recent transactions</td></tr>';
        }
    } catch (err) {
        console.error(err);
    }
}

function renderCharts() {
    if(!globalDashData) return;
    const isDark = document.documentElement.getAttribute('data-bs-theme') === 'dark';
    const textColor = isDark ? '#f8fafc' : '#1e293b';
    const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
    
    Chart.defaults.color = textColor;
    
    const catCtx = document.getElementById('categoryChart').getContext('2d');
    if (catChartInstance) catChartInstance.destroy();
    catChartInstance = new Chart(catCtx, {
        type: 'doughnut',
        data: {
            labels: globalDashData.category_labels,
            datasets: [{
                data: globalDashData.category_data,
                backgroundColor: ['#4f46e5', '#38bdf8', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#94a3b8']
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
    
    const barCtx = document.getElementById('monthlyChart').getContext('2d');
    if (barChartInstance) barChartInstance.destroy();
    barChartInstance = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: globalDashData.monthly_labels,
            datasets: [{
                label: 'Spending (₹)',
                data: globalDashData.monthly_data,
                backgroundColor: '#4f46e5',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { grid: { color: gridColor } },
                x: { grid: { color: gridColor } }
            }
        }
    });
}

window.editBudget = async () => {
    let budget = globalDashData?.budget || 83000;
    let newBudget = prompt("Enter your new monthly budget (₹):", budget);
    if(newBudget !== null && newBudget.trim() !== '') {
        const val = parseFloat(newBudget);
        if(!isNaN(val) && val >= 0) {
            try {
                await apiCall('/budget', {
                    method: 'POST',
                    body: JSON.stringify({budget: val})
                });
                showAlert('Budget updated successfully!', 'success');
                await loadDashboard();
            } catch(e) {
                showAlert('Failed to update budget');
            }
        } else {
            showAlert('Invalid budget amount');
        }
    }
};
