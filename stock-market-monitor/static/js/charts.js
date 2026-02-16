// Chart.js utilities for stock visualization

let chartInstances = {
    price: null,
    volume: null,
    rsi: null,
    macd: null
};

const chartColors = {
    primary: '#0066cc',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    light: '#f8f9fa',
    grid: '#e9ecef'
};

async function loadChartData(symbol) {
    try {
        const response = await fetch(`/api/chart/${symbol}`);
        if (!response.ok) {
            throw new Error(`Unable to fetch chart data for ${symbol}`);
        }
        
        const data = await response.json();
        displayCharts(symbol, data);
        updateIndicators(data.indicators);
        
        // Show chart container, hide no-selection message
        document.getElementById('chartContainer').style.display = 'block';
        document.getElementById('noChartSelected').style.display = 'none';
        
        // Update chart header
        document.getElementById('chartSymbol').textContent = symbol;
        const lastClose = data.candles[data.candles.length - 1].close;
        const firstClose = data.candles[0].close;
        const change = lastClose - firstClose;
        const changePct = (change / firstClose * 100).toFixed(2);
        
        document.getElementById('chartPrice').textContent = `$${lastClose.toFixed(2)}`;
        document.getElementById('chartChange').textContent = 
            `${change >= 0 ? '+' : ''}${change.toFixed(2)} (${changePct}%)`;
        document.getElementById('chartChange').className = 
            `price-change ${change >= 0 ? 'positive' : 'negative'}`;
        
    } catch (error) {
        console.error('Error loading chart:', error);
        alert('Error loading chart data: ' + error.message);
    }
}

function displayCharts(symbol, chartData) {
    // Prepare data
    const dates = chartData.dates;
    const opens = chartData.candles.map(c => c.open);
    const highs = chartData.candles.map(c => c.high);
    const lows = chartData.candles.map(c => c.low);
    const closes = chartData.candles.map(c => c.close);
    const volumes = chartData.candles.map(c => c.volume);
    
    const indicators = chartData.indicators;
    const sma20 = indicators.sma_20;
    const sma50 = indicators.sma_50;
    const ema12 = indicators.ema_12;
    const ema26 = indicators.ema_26;
    const rsi14 = indicators.rsi_14;
    const macd = indicators.macd;
    
    // Price Chart with Moving Averages
    drawPriceChart(dates, closes, sma20, sma50, ema12, ema26);
    
    // Volume Chart
    drawVolumeChart(dates, volumes, closes);
    
    // RSI Chart
    drawRSIChart(dates, rsi14);
    
    // MACD Chart
    drawMACDChart(dates, macd, ema12, ema26);
}

function drawPriceChart(dates, closes, sma20, sma50, ema12, ema26) {
    const ctx = document.getElementById('priceChart').getContext('2d');
    
    if (chartInstances.price) {
        chartInstances.price.destroy();
    }
    
    chartInstances.price = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [
                {
                    label: 'Close Price',
                    data: closes,
                    borderColor: chartColors.primary,
                    backgroundColor: 'rgba(0, 102, 204, 0.05)',
                    borderWidth: 2,
                    fill: true,
                    pointRadius: 0,
                    pointHoverRadius: 5,
                    tension: 0.3
                },
                {
                    label: 'SMA 20',
                    data: sma20,
                    borderColor: '#ff6b6b',
                    borderWidth: 1.5,
                    fill: false,
                    pointRadius: 0,
                    pointHoverRadius: 3,
                    borderDash: [5, 5],
                    tension: 0.3
                },
                {
                    label: 'SMA 50',
                    data: sma50,
                    borderColor: '#ffd93d',
                    borderWidth: 1.5,
                    fill: false,
                    pointRadius: 0,
                    pointHoverRadius: 3,
                    borderDash: [5, 5],
                    tension: 0.3
                },
                {
                    label: 'EMA 12',
                    data: ema12,
                    borderColor: '#6bcf7f',
                    borderWidth: 1.5,
                    fill: false,
                    pointRadius: 0,
                    pointHoverRadius: 3,
                    tension: 0.3
                },
                {
                    label: 'EMA 26',
                    data: ema26,
                    borderColor: '#4d96ff',
                    borderWidth: 1.5,
                    fill: false,
                    pointRadius: 0,
                    pointHoverRadius: 3,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        boxWidth: 12,
                        font: { size: 11 }
                    }
                },
                title: {
                    display: false
                }
            },
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Price ($)'
                    },
                    grid: {
                        color: chartColors.grid
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function drawVolumeChart(dates, volumes, closes) {
    const ctx = document.getElementById('volumeChart').getContext('2d');
    
    if (chartInstances.volume) {
        chartInstances.volume.destroy();
    }
    
    // Color bars based on price movement
    const colors = closes.map((close, i) => {
        if (i === 0) return chartColors.primary;
        return close >= closes[i - 1] ? '#28a745' : '#dc3545';
    });
    
    chartInstances.volume = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dates,
            datasets: [
                {
                    label: 'Volume',
                    data: volumes,
                    backgroundColor: colors,
                    borderWidth: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Volume'
                    },
                    grid: {
                        color: chartColors.grid
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function drawRSIChart(dates, rsi14) {
    const ctx = document.getElementById('rsiChart').getContext('2d');
    
    if (chartInstances.rsi) {
        chartInstances.rsi.destroy();
    }
    
    chartInstances.rsi = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [
                {
                    label: 'RSI (14)',
                    data: rsi14,
                    borderColor: chartColors.primary,
                    backgroundColor: 'rgba(0, 102, 204, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    pointRadius: 0,
                    tension: 0.3
                },
                {
                    label: 'Overbought (70)',
                    data: Array(dates.length).fill(70),
                    borderColor: '#dc3545',
                    borderWidth: 1,
                    fill: false,
                    pointRadius: 0,
                    borderDash: [5, 5]
                },
                {
                    label: 'Oversold (30)',
                    data: Array(dates.length).fill(30),
                    borderColor: '#28a745',
                    borderWidth: 1,
                    fill: false,
                    pointRadius: 0,
                    borderDash: [5, 5]
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        boxWidth: 12,
                        font: { size: 11 }
                    }
                }
            },
            scales: {
                y: {
                    min: 0,
                    max: 100,
                    title: {
                        display: true,
                        text: 'RSI'
                    },
                    grid: {
                        color: chartColors.grid
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function drawMACDChart(dates, macd, ema12, ema26) {
    const ctx = document.getElementById('macdChart').getContext('2d');
    
    if (chartInstances.macd) {
        chartInstances.macd.destroy();
    }
    
    // Calculate MACD signal line (9-period EMA of MACD)
    const signalLine = calculateEMA(macd.filter(v => v !== null), 9);
    
    // Pad with nulls to match original length
    const paddedSignal = Array(dates.length - signalLine.length).fill(null).concat(signalLine);
    
    // Calculate histogram
    const histogram = macd.map((m, i) => {
        if (m === null || paddedSignal[i] === null) return null;
        return m - paddedSignal[i];
    });
    
    chartInstances.macd = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dates,
            datasets: [
                {
                    label: 'MACD Histogram',
                    data: histogram,
                    backgroundColor: histogram.map(h => h === null ? 'transparent' : (h >= 0 ? '#28a745' : '#dc3545')),
                    borderWidth: 0,
                    order: 2
                },
                {
                    label: 'MACD Line',
                    data: macd,
                    borderColor: '#0066cc',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    type: 'line',
                    pointRadius: 0,
                    tension: 0.3,
                    order: 1
                },
                {
                    label: 'Signal Line',
                    data: paddedSignal,
                    borderColor: '#ff6b6b',
                    backgroundColor: 'transparent',
                    borderWidth: 1.5,
                    type: 'line',
                    pointRadius: 0,
                    borderDash: [5, 5],
                    tension: 0.3,
                    order: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        boxWidth: 12,
                        font: { size: 11 }
                    }
                }
            },
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'MACD'
                    },
                    grid: {
                        color: chartColors.grid
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function updateIndicators(indicators) {
    const getIndicatorValue = (value) => value ? value.toFixed(2) : '-';
    
    document.getElementById('sma20Value').textContent = getIndicatorValue(indicators.sma_20[indicators.sma_20.length - 1]);
    document.getElementById('sma50Value').textContent = getIndicatorValue(indicators.sma_50[indicators.sma_50.length - 1]);
    document.getElementById('rsi14Value').textContent = getIndicatorValue(indicators.rsi_14[indicators.rsi_14.length - 1]);
    document.getElementById('ema12Value').textContent = getIndicatorValue(indicators.ema_12[indicators.ema_12.length - 1]);
    document.getElementById('ema26Value').textContent = getIndicatorValue(indicators.ema_26[indicators.ema_26.length - 1]);
}

function calculateEMA(values, period) {
    if (values.length < period) return [];
    
    const ema = [];
    const multiplier = 2 / (period + 1);
    
    let sma = 0;
    for (let i = 0; i < period; i++) {
        sma += values[i];
    }
    sma /= period;
    ema.push(sma);
    
    for (let i = period; i < values.length; i++) {
        const newEMA = values[i] * multiplier + ema[ema.length - 1] * (1 - multiplier);
        ema.push(newEMA);
    }
    
    return ema;
}

// Initialize chart tab switching
function initChartTabs() {
    const tabBtns = document.querySelectorAll('.chart-tabs .tab-btn');
    const tabContents = document.querySelectorAll('.chart-content .chart-tab');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');
            
            // Remove active class from all buttons and tabs
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked button and corresponding tab
            btn.classList.add('active');
            document.getElementById(tabName).classList.add('active');
            
            // Trigger resize to update chart
            if (chartInstances.price) chartInstances.price.resize();
            if (chartInstances.volume) chartInstances.volume.resize();
            if (chartInstances.rsi) chartInstances.rsi.resize();
            if (chartInstances.macd) chartInstances.macd.resize();
        });
    });
}

document.addEventListener('DOMContentLoaded', initChartTabs);
