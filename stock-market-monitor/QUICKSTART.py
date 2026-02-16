"""
Quick start guide for Stock Market Monitor
"""

# ============================================================
# RUNNING THE APPLICATION
# ============================================================

# 1. CLI Mode (with mock data)
#    python main.py --demo
#
#    or continuous monitoring:
#    python main.py

# 2. Web Dashboard (with mock data)
#    python web_app.py
#    Then open: http://localhost:5000


# ============================================================
# DATA MODES
# ============================================================

# MOCK DATA (DEFAULT - for testing/demo)
# - Simulates realistic stock prices
# - No API rate limiting issues
# - Perfect for development and testing
# - Recommended when Yahoo Finance API is unavailable

# LIVE DATA (when API is available)
# - Edit web_app.py: Change "use_mock_data=True" to "use_mock_data=False"
# - Edit main.py: Create monitor with "use_mock_data=False"
# - Requires working Yahoo Finance API connection


# ============================================================
# CONFIGURATION
# ============================================================

# Edit config.py to customize:
# - WATCHLIST: Stocks to monitor
# - PRICE_TARGETS: Price targets for alerts
# - UPDATE_INTERVAL: Refresh frequency (CLI mode)
# - CACHE_DURATION: Cache duration in seconds
# - ENABLE_CACHE: Toggle price caching


# ============================================================
# TROUBLESHOOTING
# ============================================================

# If you see "Too Many Requests" errors:
# 1. The app automatically falls back to mock data
# 2. Caching is enabled to reduce API calls
# 3. Retry mechanism with exponential backoff is active

# To force mock data mode:
# - Web: Change web_app.py line: monitor = StockMonitor(use_mock_data=True)
# - CLI: Change main.py line: monitor = StockMonitor(use_mock_data=True)

# To enable live data when available:
# - Change "use_mock_data=True" to "use_mock_data=False"
