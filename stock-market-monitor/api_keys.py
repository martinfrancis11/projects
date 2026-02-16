"""
API Configuration for Stock Monitor
Users can add their own free API keys here
"""

import os
from dotenv import load_dotenv

load_dotenv()

# API Keys (Get free keys from these services)
# ============================================

# Polygon.io - Free tier: 5 API calls/minute
# Sign up: https://polygon.io/
POLYGON_API_KEY = os.getenv('POLYGON_API_KEY', '')

# IEX Cloud - Free tier: 100 messages/month
# Sign up: https://iexcloud.io/
IEX_API_KEY = os.getenv('IEX_API_KEY', '')

# Finnhub - Free tier: 60 API calls/minute
# Sign up: https://finnhub.io/
FINNHUB_API_KEY = os.getenv('FINNHUB_API_KEY', '')

# Alpha Vantage - Free tier: 5 API calls/minute
# Sign up: https://www.alphavantage.co/
ALPHA_VANTAGE_KEY = os.getenv('ALPHA_VANTAGE_KEY', '')

# CoinGecko - Free tier: completely free, no key needed
# No sign up required!

# OpenExchangeRates - Free tier: 1000 API calls/month
# Sign up: https://openexchangerates.org/
OPENEXCHANGE_API_KEY = os.getenv('OPENEXCHANGE_API_KEY', '')


# Default data mode
# When no APIs are configured, use mock data
USE_MOCK_DATA_DEFAULT = True

print("""
═══════════════════════════════════════════════════════════
  STOCK MARKET MONITOR - API CONFIGURATION
═══════════════════════════════════════════════════════════

No API keys found. Running in MOCK DATA mode.

To use REAL STOCK PRICES, add free API keys:

1. Get free keys from:
   - Finnhub:       https://finnhub.io/
   - IEX Cloud:     https://iexcloud.io/
   - Polygon.io:    https://polygon.io/
   - Alpha Vantage: https://www.alphavantage.co/
   - CoinGecko:     https://coingecko.com/ (no key needed!)

2. Add to .env file:
   FINNHUB_API_KEY=your_key_here
   IEX_API_KEY=your_key_here
   POLYGON_API_KEY=your_key_here

3. Restart the app

Current mode: {'MOCK DATA' if USE_MOCK_DATA_DEFAULT else 'LIVE DATA'}
═══════════════════════════════════════════════════════════
""")
