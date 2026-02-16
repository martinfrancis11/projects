"""
Configuration settings for stock market monitor
"""

import os
from dotenv import load_dotenv

load_dotenv()

# Default watchlist of stocks to monitor
WATCHLIST = [
    'AAPL',  # Apple
    'GOOGL', # Google
    'MSFT',  # Microsoft
    'TSLA',  # Tesla
    'AMZN',  # Amazon
]

# Alert thresholds (percentage change)
PRICE_ALERT_THRESHOLD = 2.0  # Alert if price changes by 2%

# Update interval in seconds
UPDATE_INTERVAL = 60  # Check prices every 60 seconds

# Data storage directory
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')

# API configuration
API_TIMEOUT = 10  # seconds

# Logging configuration
LOG_LEVEL = 'INFO'
LOG_FILE = os.path.join(DATA_DIR, 'stock_monitor.log')

# Price cache settings (to avoid rate limiting)
CACHE_DURATION = 60  # Cache prices for 1 minute (in seconds)
ENABLE_CACHE = True  # Enable price caching

# Data provider selection
USE_MOCK_DATA = False  # Set to False to try live APIs (Finnhub, yfinance, CoinGecko)
DEFAULT_PROVIDER = 'finnhub'  # 'mock', 'finnhub', 'yfinance', or 'coingecko'

# Price alert targets (symbol: target_price)
PRICE_TARGETS = {
    'AAPL': 150.0,
    'GOOGL': 130.0,
    'MSFT': 350.0,
}

# Email notifications (if enabled)
EMAIL_ALERTS_ENABLED = False
EMAIL_ADDRESS = os.getenv('ALERT_EMAIL', '')
EMAIL_PASSWORD = os.getenv('EMAIL_PASSWORD', '')
