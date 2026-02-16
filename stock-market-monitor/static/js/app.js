// Stock Market Monitor - Frontend Application

const API_BASE = '/api';
let currentStock = null;

// Initialize app on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    loadWatchlist();
    // Auto-refresh every 60 seconds
    setInterval(loadWatchlist, 60000);
});

function initializeEventListeners() {
    document.getElementById('refreshBtn').addEventListener('click', refreshPrices);
    document.getElementById('addStockBtn').addEventListener('click', openAddStockModal);
    document.getElementById('addStockForm').addEventListener('submit', addStock);
    document.querySelector('.close').addEventListener('click', closeAddStockModal);
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('addStockModal');
        if (e.target === modal) closeAddStockModal();
    });
}

async function loadWatchlist() {
    try {
        const response = await fetch(`${API_BASE}/watchlist`);
        const stocks = await response.json();
        renderWatchlist(stocks);
        loadAlerts();
        
        // Auto-load chart for first stock
        if (stocks.length > 0 && !currentStock) {
            console.log('Auto-loading chart for first stock:', stocks[0].symbol);
            await loadChartAndAnalysis(stocks[0].symbol);
        }
        updateLastUpdate();
    } catch (error) {
        console.error('Error loading watchlist:', error);
        document.getElementById('watchlistContainer').innerHTML = 
            '<p style="color: red;">Error loading watchlist. Please try again.</p>';
    }
}

function renderWatchlist(stocks) {
    const container = document.getElementById('watchlistContainer');
    
    if (stocks.length === 0) {
        container.innerHTML = '<p>No stocks in watchlist. Add one to get started!</p>';
        return;
    }

    container.innerHTML = stocks.map(stock => `
        <div class="stock-card ${stock.status}">
            <div class="stock-header">
                <span class="stock-symbol">${stock.symbol}</span>
                <button class="remove-btn" onclick="removeStock('${stock.symbol}')">Remove</button>
            </div>
            <div class="stock-price">${stock.price ? `$${stock.price.toFixed(2)}` : 'N/A'}</div>
            <div class="stock-info">
                <div class="info-item">
                    <span class="info-label">Target Price</span>
                    <span class="info-value">${stock.target ? `$${stock.target.toFixed(2)}` : 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Last Update</span>
                    <span class="info-value">${formatTime(stock.last_check)}</span>
                </div>
            </div>
            ${getStatusBadge(stock.status)}
            <button class="btn btn-primary" style="width: 100%; margin-top: 10px;" 
                    onclick="loadChartAndAnalysis('${stock.symbol}')">View Chart & Analysis</button>
        </div>
    `).join('');
}

function getStatusBadge(status) {
    const statusMap = {
        'target-reached': { text: '🎯 Target Reached', class: 'status-target-reached' },
        'near-target': { text: '📍 Near Target', class: 'status-near-target' },
        'normal': { text: '📊 Normal', class: 'status-normal' },
        'unknown': { text: '❓ Unknown', class: 'status-normal' }
    };
    
    const statusInfo = statusMap[status] || statusMap['unknown'];
    return `<span class="stock-status ${statusInfo.class}">${statusInfo.text}</span>`;
}

async function loadChartAndAnalysis(symbol) {
    currentStock = symbol;
    // Load both chart and analysis
    await loadChartData(symbol);
    await loadAnalysis(symbol);
}

async function loadAnalysis(symbol) {
    currentStock = symbol;
    
    try {
        const response = await fetch(`${API_BASE}/analysis/${symbol}`);
        if (!response.ok) throw new Error('Analysis data not available');
        
        const data = await response.json();
        renderAnalysis(symbol, data);
    } catch (error) {
        console.error('Error loading analysis:', error);
        document.getElementById('analysisContainer').innerHTML = 
            `<p style="color: red;">Not enough data for ${symbol}. Historical data will be available after multiple price checks.</p>`;
    }
}

function renderAnalysis(symbol, data) {
    const container = document.getElementById('analysisContainer');
    
    container.innerHTML = `
        <div class="analysis-card">
            <h3>Stock</h3>
            <div class="value">${symbol}</div>
            <div class="unit">Current Price: $${data.current_price ? data.current_price.toFixed(2) : 'N/A'}</div>
        </div>
        <div class="analysis-card">
            <h3>SMA (20)</h3>
            <div class="value">${data.sma_20 ? data.sma_20.toFixed(2) : 'N/A'}</div>
            <div class="unit">20-day Moving Average</div>
        </div>
        <div class="analysis-card">
            <h3>EMA (12)</h3>
            <div class="value">${data.ema_12 ? data.ema_12.toFixed(2) : 'N/A'}</div>
            <div class="unit">12-day Exponential MA</div>
        </div>
        <div class="analysis-card">
            <h3>RSI (14)</h3>
            <div class="value">${data.rsi ? data.rsi.toFixed(2) : 'N/A'}</div>
            <div class="unit">Relative Strength Index</div>
        </div>
        <div class="analysis-card">
            <h3>Volatility</h3>
            <div class="value">${data.volatility ? data.volatility.toFixed(2) : 'N/A'}</div>
            <div class="unit">20-day Standard Deviation %</div>
        </div>
        <div class="analysis-card">
            <h3>Trend</h3>
            <span class="trend ${data.trend.toLowerCase()}">${data.trend || 'Unknown'}</span>
        </div>
    `;
}

async function loadAlerts() {
    try {
        const response = await fetch(`${API_BASE}/alerts`);
        const alerts = await response.json();
        
        if (alerts.length === 0) {
            document.getElementById('alertsContainer').style.display = 'none';
            return;
        }
        
        const container = document.getElementById('alertsList');
        container.innerHTML = alerts.map(alert => `
            <div class="alert-item">
                <strong>${alert.symbol}</strong> - $${alert.value.toFixed(2)}<br>
                <small>${alert.message}</small><br>
                <tiny>${formatTime(alert.triggered_at)}</tiny>
            </div>
        `).join('');
        
        document.getElementById('alertsContainer').style.display = 'block';
    } catch (error) {
        console.error('Error loading alerts:', error);
    }
}

async function refreshPrices() {
    const btn = document.getElementById('refreshBtn');
    btn.disabled = true;
    btn.textContent = '⏳ Refreshing...';
    
    try {
        const response = await fetch(`${API_BASE}/refresh`, { method: 'POST' });
        if (response.ok) {
            await loadWatchlist();
            btn.textContent = '✓ Refreshed!';
            setTimeout(() => {
                btn.disabled = false;
                btn.textContent = '🔄 Refresh Prices';
            }, 1000);
        }
    } catch (error) {
        console.error('Error refreshing prices:', error);
        btn.disabled = false;
        btn.textContent = '🔄 Refresh Prices';
    }
}

function openAddStockModal() {
    document.getElementById('addStockModal').style.display = 'block';
    document.getElementById('symbolInput').focus();
}

function closeAddStockModal() {
    document.getElementById('addStockModal').style.display = 'none';
    document.getElementById('addStockForm').reset();
}

async function addStock(e) {
    e.preventDefault();
    
    const symbol = document.getElementById('symbolInput').value.toUpperCase();
    const targetPrice = document.getElementById('targetInput').value;
    
    try {
        const response = await fetch(`${API_BASE}/add-stock`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                symbol: symbol,
                target_price: targetPrice ? parseFloat(targetPrice) : null
            })
        });
        
        if (response.ok) {
            closeAddStockModal();
            await loadWatchlist();
        } else {
            alert('Error adding stock. Please try again.');
        }
    } catch (error) {
        console.error('Error adding stock:', error);
        alert('Error adding stock');
    }
}

async function removeStock(symbol) {
    if (!confirm(`Remove ${symbol} from watchlist?`)) return;
    
    try {
        const response = await fetch(`${API_BASE}/remove-stock`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symbol: symbol })
        });
        
        if (response.ok) {
            await loadWatchlist();
        }
    } catch (error) {
        console.error('Error removing stock:', error);
    }
}

function updateLastUpdate() {
    const now = new Date();
    document.getElementById('lastUpdate').textContent = 
        `Last updated: ${now.toLocaleTimeString()}`;
}

function formatTime(isoString) {
    if (!isoString) return 'N/A';
    
    try {
        const date = new Date(isoString);
        return date.toLocaleTimeString();
    } catch {
        return 'N/A';
    }
}
