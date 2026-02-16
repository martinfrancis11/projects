DATA SOURCES CONFIGURATION
==========================

The Stock Market Monitor now supports multiple data sources with automatic fallback.

## Default Mode: MOCK DATA ✓

The app uses reliable mock data by default. This means:
- ✓ No API errors
- ✓ Realistic price movements
- ✓ Perfect for testing and demos
- ✓ No configuration needed

Run immediately:
```bash
python web_app.py
# Visit: http://localhost:5000

python main.py --demo
```

## Live Data Mode (Optional)

To fetch REAL prices from Yahoo Finance, Finnhub, or other sources:

### Option 1: Use Free APIs (Requires Sign-up)

Get FREE API keys from any of these services:

**Finnhub** (Recommended - 60 calls/minute free)
- Sign up: https://finnhub.io/
- Add to .env:  FINNHUB_API_KEY=your_key

**IEX Cloud** (100 messages/month free)
- Sign up: https://iexcloud.io/
- Add to .env: IEX_API_KEY=your_key

**Polygon.io** (5 calls/minute free)
- Sign up: https://polygon.io/
- Add to .env: POLYGON_API_KEY=your_key

**Alpha Vantage** (5 calls/minute free)
- Sign up: https://www.alphavantage.co/
- Add to .env: ALPHA_VANTAGE_KEY=your_key

**CoinGecko** (Completely FREE - no key needed!)
- No sign-up required
- Great for crypto prices (BTC, ETH, etc.)

### Option 2: Switch from Mock to Live

1. Create `.env` file:
   ```bash
   cp .env.example .env
   ```

2. Add your API key:
   ```
   FINNHUB_API_KEY=sk_...your_key...
   ```

3. Edit `web_app.py`:
   ```python
   # Change from:
   monitor = StockMonitor(use_mock_data=True)
   
   # To:
   monitor = StockMonitor(use_mock_data=False)
   ```

4. Restart the app:
   ```bash
   python web_app.py
   ```

## Data Source Priority

When `use_mock_data=False`, the app tries in this order:

1. **Free Web Scrapers** (if available)
2. **Finnhub API** (if key provided)
3. **IEX Cloud** (if key provided)
4. **Polygon.io** (if key provided)
5. **Alpha Vantage** (if key provided)
6. **Yahoo Finance (yfinance)** - with retries
7. **CoinGecko** - for cryptocurrencies
8. **Fallback to Mock Data** (always works!)

## Current Setup

- **Default Mode**: Mock Data (Reliable)
- **Real Stock Prices**: Optional (requires API key)
- **Fallback**: Always uses mock data if APIs fail
- **Caching**: Prices cached for 5 minutes to reduce API calls

## Files Modified

- `stock_monitor.py` - Multi-source price fetching
- `web_app.py` - Uses mock data by default
- `main.py` - Uses mock data by default
- `free_scrapers.py` - Free data providers
- `api_keys.py` - API key configuration
- `alt_providers.py` - Alternative API providers

## Testing

```bash
# Test with mock data (recommended)
python main.py --demo
python web_app.py

# Test with real data (if API key configured)
# Edit web_app.py and change: use_mock_data=False
python web_app.py
```

## Troubleshooting

**Q: I want REAL stock prices, not mock data**
A: Get a free API key from Finnhub or IEX Cloud, add it to .env, and change use_mock_data=False

**Q: What if my API key runs out of requests?**
A: The app automatically falls back to mock data - no errors!

**Q: How often are prices updated?**
A: By default every 60 seconds (configurable in config.py)

**Q: Can I use multiple API keys?**
A: Yes! The app tries all configured sources automatically.

## Summary

- **Default**: Works immediately with mock data ✓
- **Live Data**: Optional, free, no credit card required ✓
- **Reliable**: Fallback system ensures the app always works ✓
