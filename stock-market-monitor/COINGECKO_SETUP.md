# Using CoinGecko API for Stock Prices

## Overview

CoinGecko is a **completely free** cryptocurrency and partially stocks data API with **NO authentication required**. This document explains how to use it with the Stock Market Monitor.

## Current Status

- **Default Mode**: Mock data (reliable, no API issues)
- **Live Mode Available**: Free web scrapers including CoinGecko support

## Supported Assets on CoinGecko

### Cryptocurrencies (Full Support - No Issues)
- BTC (Bitcoin)
- ETH (Ethereum)
- XRP (Ripple)
- LTC (Litecoin)
- BNB (Binance Coin)
- And 10,000+ other cryptocurrencies

### Stocks (Limited Support)
CoinGecko has limited stock price support via their free API. Stocks that work:
- MSFT (Microsoft) - $195.87+ 
- AAPL (Apple) - Limited data quality
- Limited coverage for other major stocks

## Using CoinGecko API

### How It Works

The free web scrapers now include CoinGecko as a fallback provider:

```
Price Fetching Priority:
1. Yahoo Finance (yfinance) - Most stocks
2. CoinGecko API - Cryptocurrencies and some stocks (NO AUTH!)
3. Polygon.io - Free tier stocks
4. CryptoCompare - Cryptocurrency data
5. Mock Data - Fallback (always works)
```

### Switch to Live CoinGecko API

1. **Edit config.py:**
   ```python
   USE_MOCK_DATA = False  # Enable live data providers
   ```

2. **Restart the application:**
   ```bash
   python web_app.py    # Web dashboard with live prices
   python main.py       # CLI mode with live prices
   ```

The system will automatically:
- Try to fetch from Yahoo Finance first
- Fall back to CoinGecko if Yahoo Finance fails
- Fall back to mock data if all APIs fail

### Testing CoinGecko

Test cryptocurrency prices (guaranteed to work):
```bash
python -c "
from free_scrapers import free_provider
print(free_provider.get_price('BTC'))   # Bitcoin
print(free_provider.get_price('ETH'))   # Ethereum
"
```

### Why Mock Data by Default?

1. **Reliability**: Mock data never fails or rate-limits
2. **Testing**: Perfect for development and demos
3. **API Limits**: All free APIs have rate limits:
   - Yahoo Finance: Rate limited after ~100 requests/hour
   - CoinGecko: 10-50 calls/minute free
   - Polygon.io: 3 calls/minute free tier
   - CryptoCompare: 100 calls/hour free

4. **No Setup Required**: Works immediately without API keys or configuration

## Better Alternatives for Stock Prices

If you need reliable live stock prices, get a **FREE API key** from:

### **Finnhub** (Recommended)
- 60 API calls/minute free
- Free tier includes all stock data
- Sign up: https://finnhub.io/

Usage:
```python
# Create .env file
echo "FINNHUB_API_KEY=sk_..." > .env

# Enable in config.py
USE_MOCK_DATA = False

# The app will automatically use Finnhub
```

### **IEX Cloud**
- 100 messages/month free
- All stock market data included
- Sign up: https://iexcloud.io/

### **Polygon.io**
- 5 calls/minute free
- Stock and forex data
- Sign up: https://polygon.io/

### **Alpha Vantage**
- 5 calls/minute free
- Stock, forex, crypto
- Sign up: https://www.alphavantage.co/

## Complete Data Source Hierarchy

When `USE_MOCK_DATA = False`, the app tries:

1. **Free Web Scrapers** (no config needed):
   - Yahoo Finance (yfinance) - if not rate limited
   - CoinGecko - for stocks and crypto
   - Polygon.io - stock quotes
   - CryptoCompare - cryptocurrency

2. **Configured API Providers** (with API key):
   - Finnhub (if FINNHUB_API_KEY set)
   - IEX Cloud (if IEX_API_KEY set)
   - Alpha Vantage (if ALPHA_VANTAGE_KEY set)

3. **Final Fallback**:
   - Mock data (always works!)

## Configuration Files

### `.env` (Optional - for API Keys)
```bash
# Add any of these optional API keys
FINNHUB_API_KEY=sk_...
IEX_API_KEY=pk_...
POLYGON_API_KEY=...
ALPHA_VANTAGE_KEY=...
```

### `config.py` (Main Settings)
```python
USE_MOCK_DATA = True/False   # Enable/disable live APIs
ENABLE_CACHE = True          # Cache prices for 1 minute
CACHE_DURATION = 60          # Cache duration in seconds
```

## Code Example

Use live prices with automatic fallback to mock data:

```python
from stock_monitor import StockMonitor

# Enable live API providers
monitor = StockMonitor(use_mock_data=False)
monitor.add_stock('AAPL')
monitor.add_stock('BTC')  # CoinGecko for crypto

# Price fetching automatically:
# 1. Try free providers (yfinance, CoinGecko, etc)
# 2. Try paid providers (Finnhub, IEX, etc) if API key set
# 3. Fall back to mock data if all fail
price = monitor.get_stock_price('AAPL')
print(f"AAPL: ${price:.2f}")
```

## Troubleshooting

**Q: CoinGecko returns 0 or very wrong prices for stocks?**
A: CoinGecko's stock coverage is limited. Use Finnhub (free API key) for reliable stock prices.

**Q: I want real stock prices without signing up for anything?**
A: Unfortunately, no completely free stock API works reliably without rate limiting. Yahoo Finance works but gets rate-limited. Your best option is the **free tier of Finnhub** (takes 20 seconds to sign up).

**Q: Mock data shows prices, but live API returns None?**
A: The API is likely rate-limited or not returning data. Check the logs for details. The app will automatically fall back to mock data.

**Q: How often are prices updated?**
A: Every 60 seconds by default (configurable in `config.py`). With caching enabled, same price served for 1 minute to reduce API calls.

**Q: Can I use multiple API keys?**
A: Yes! The app tries all configured providers in order. Just add multiple API keys to `.env`.

## Summary

✅ **Current Best Setup**: 
- Default: Mock data (100% reliable)
- Optional: Add free Finnhub API key for real prices
- Alternative: CoinGecko for cryptocurrencies (no auth!)

🚀 **To Go Live**: Get free API key from Finnhub and enable `USE_MOCK_DATA = False`
