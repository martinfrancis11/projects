"""
Flask web application for stock market monitor
"""

import logging
from flask import Flask, render_template, jsonify, request
from datetime import datetime
from stock_monitor import StockMonitor
import config
from charts import chart_provider

# Setup logging
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.config['JSON_SORT_KEYS'] = False

# Global stock monitor instance
# Uses configuration from config.py (mock data or live APIs)
# To use live data, set USE_MOCK_DATA = False in config.py
monitor = StockMonitor(use_mock_data=config.USE_MOCK_DATA)

# Add stocks from config
for symbol in config.WATCHLIST:
    target = config.PRICE_TARGETS.get(symbol)
    monitor.add_stock(symbol, target_price=target)

logger.info("Web app initialized with stock monitor")


@app.route('/')
def index():
    """Main dashboard page"""
    return render_template('index.html')


@app.route('/api/watchlist')
def api_watchlist():
    """API endpoint to get watchlist data"""
    monitor.check_prices()
    watchlist = []
    
    for stock in monitor.get_watchlist_summary():
        watchlist.append({
            'symbol': stock['symbol'],
            'price': stock['last_price'],
            'target': stock['target_price'],
            'last_check': stock['last_check'].isoformat() if stock['last_check'] else None,
            'status': _get_status(stock)
        })
    
    return jsonify(watchlist)


@app.route('/api/stock/<symbol>')
def api_stock(symbol):
    """API endpoint to get detailed stock information"""
    symbol = symbol.upper()
    price = monitor.get_stock_price(symbol)
    history = monitor.data_handler.get_price_history(symbol, limit=50)
    
    return jsonify({
        'symbol': symbol,
        'current_price': price,
        'history': history,
        'alerts': monitor.alert_manager.get_triggered_alerts()
    })


@app.route('/api/alerts')
def api_alerts():
    """API endpoint to get triggered alerts"""
    alerts = monitor.alert_manager.get_triggered_alerts()
    return jsonify(alerts)


@app.route('/api/analysis/<symbol>')
def api_analysis(symbol):
    """API endpoint to get technical analysis"""
    symbol = symbol.upper()
    history = monitor.data_handler.get_price_history(symbol, limit=100)
    
    if not history:
        return jsonify({'error': 'No data available'}), 404
    
    prices = [h['price'] for h in history]
    
    # Calculate indicators
    sma_20 = monitor.analysis.calculate_sma(prices, 20)
    ema_12 = monitor.analysis.calculate_ema(prices, 12)
    rsi = monitor.analysis.calculate_rsi(prices, 14)
    volatility = monitor.analysis.calculate_volatility(prices, 20)
    trend = monitor.analysis.analyze_trend(prices, 20)
    
    return jsonify({
        'symbol': symbol,
        'sma_20': sma_20[-1] if sma_20[-1] else None,
        'ema_12': ema_12[-1] if ema_12[-1] else None,
        'rsi': rsi[-1] if rsi[-1] else None,
        'volatility': volatility,
        'trend': trend,
        'current_price': prices[-1] if prices else None
    })


@app.route('/api/refresh', methods=['POST'])
def api_refresh():
    """API endpoint to manually refresh prices"""
    monitor.check_prices()
    return jsonify({'status': 'success', 'timestamp': datetime.now().isoformat()})


@app.route('/api/add-stock', methods=['POST'])
def api_add_stock():
    """API endpoint to add a stock to watchlist"""
    data = request.get_json()
    symbol = data.get('symbol', '').upper()
    target_price = data.get('target_price')
    
    if not symbol:
        return jsonify({'error': 'Symbol required'}), 400
    
    monitor.add_stock(symbol, target_price=target_price)
    logger.info(f"Added stock {symbol} via web interface")
    
    return jsonify({'status': 'success', 'symbol': symbol})


@app.route('/api/remove-stock', methods=['POST'])
def api_remove_stock():
    """API endpoint to remove a stock from watchlist"""
    data = request.get_json()
    symbol = data.get('symbol', '').upper()
    
    if not symbol:
        return jsonify({'error': 'Symbol required'}), 400
    
    monitor.remove_stock(symbol)
    logger.info(f"Removed stock {symbol} via web interface")
    
    return jsonify({'status': 'success', 'symbol': symbol})


@app.route('/api/chart/<symbol>')
def api_chart(symbol):
    """API endpoint to get chart data with technical indicators
    
    Returns candlestick data with SMA, EMA, RSI, MACD indicators
    """
    symbol = symbol.upper()
    
    # Get technical analysis with all indicators
    chart_data = chart_provider.get_technical_analysis(symbol, days=90)
    
    if not chart_data:
        return jsonify({'error': f'Unable to fetch chart data for {symbol}'}), 404
    
    # Format the response for frontend charting
    return jsonify({
        'symbol': symbol,
        'dates': chart_data['dates'],
        'candles': [
            {
                'date': c['date'],
                'open': c['open'],
                'high': c['high'],
                'low': c['low'],
                'close': c['close'],
                'volume': c['volume']
            }
            for c in chart_data['candles']
        ],
        'indicators': {
            'sma_20': chart_data['sma_20'],
            'sma_50': chart_data['sma_50'],
            'ema_12': chart_data['ema_12'],
            'ema_26': chart_data['ema_26'],
            'rsi_14': chart_data['rsi_14'],
            'macd': chart_data['macd']
        },
        'count': chart_data['count'],
        'current_price': chart_data['closes'][-1] if chart_data['closes'] else None
    })


@app.route('/api/chart-intraday/<symbol>')
def api_chart_intraday(symbol):
    """API endpoint to get intraday chart data
    
    Returns 1-hour candlestick data for the past 7 days
    """
    symbol = symbol.upper()
    
    # Get intraday data (60 minute resolution)
    chart_data = chart_provider.get_intraday_candles(symbol, resolution=60)
    
    if not chart_data:
        return jsonify({'error': f'Unable to fetch intraday data for {symbol}'}), 404
    
    return jsonify({
        'symbol': symbol,
        'resolution': 60,
        'datetimes': chart_data['datetimes'],
        'candles': [
            {
                'datetime': c['datetime'],
                'open': c['open'],
                'high': c['high'],
                'low': c['low'],
                'close': c['close'],
                'volume': c['volume']
            }
            for c in chart_data['candles']
        ],
        'count': chart_data['count'],
        'current_price': chart_data['closes'][-1] if chart_data['closes'] else None
    })


@app.route('/api/stock-summary/<symbol>')
def api_stock_summary(symbol):
    """API endpoint to get complete stock summary with chart data"""
    symbol = symbol.upper()
    
    # Get current price
    price = monitor.get_stock_price(symbol)
    
    # Get chart data
    chart_data = chart_provider.get_daily_candles(symbol, days=30)
    
    if not chart_data:
        return jsonify({'error': f'Unable to fetch data for {symbol}'}), 404
    
    # Get technical indicators
    closes = chart_data['closes']
    sma_20 = chart_provider.calculate_sma(closes, 20)
    rsi_14 = chart_provider.calculate_rsi(closes, 14)
    
    # Calculate price change
    if len(closes) >= 2:
        price_change = closes[-1] - closes[-5] if len(closes) >= 5 else closes[-1] - closes[0]
        price_change_pct = (price_change / closes[-5] * 100) if len(closes) >= 5 else (price_change / closes[0] * 100)
    else:
        price_change = 0
        price_change_pct = 0
    
    return jsonify({
        'symbol': symbol,
        'current_price': price or closes[-1],
        'price_change': price_change,
        'price_change_pct': price_change_pct,
        'high_52week': max(closes) if closes else None,
        'low_52week': min(closes) if closes else None,
        'sma_20': sma_20[-1] if sma_20[-1] else None,
        'rsi_14': rsi_14[-1] if rsi_14[-1] else None,
        'volume': chart_data['volumes'][-1] if chart_data['volumes'] else None,
        'chart': {
            'dates': chart_data['dates'],
            'closes': chart_data['closes'],
            'volumes': chart_data['volumes']
        }
    })


def _get_status(stock):
    """Determine stock status based on price vs target"""
    price = stock.get('last_price') or stock.get('price')
    target = stock.get('target_price') or stock.get('target')
    
    if price is None or target is None:
        return 'unknown'
    
    if price >= target:
        return 'target-reached'
    elif price > target * 0.95:
        return 'near-target'
    else:
        return 'normal'


if __name__ == '__main__':
    logger.info("Starting Flask web server on http://localhost:5000")
    app.run(debug=True, host='localhost', port=5000)
