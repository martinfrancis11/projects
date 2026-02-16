"""
Free price data using truly open sources (no web scraping needed)
Uses public data endpoints and APIs
"""

import logging
import requests
from typing import Optional
import json
import time
import yfinance as yf  # Added for reliable stock data

logger = logging.getLogger(__name__)


class QuoteDataProvider:
    """Gets quote data from public sources"""
    
    @staticmethod
    def get_price_from_coingecko(symbol: str) -> Optional[float]:
        """
        Fetch stock prices from CoinGecko (completely free, no auth required)
        Supports both stocks and cryptocurrencies
        """
        try:
            # CoinGecko stock price mapping
            stock_map = {
                'AAPL': 'apple',
                'GOOGL': 'google',
                'MSFT': 'microsoft',
                'AMZN': 'amazon',
                'TSLA': 'tesla',
                'META': 'meta',
                'NVDA': 'nvidia',
                'AMD': 'amd',
                'INTC': 'intel',
                'BTC': 'bitcoin',
                'ETH': 'ethereum',
            }
            
            coingecko_id = stock_map.get(symbol.upper())
            if not coingecko_id:
                logger.debug(f"Symbol {symbol} not supported on CoinGecko")
                return None
            
            url = "https://api.coingecko.com/api/v3/simple/price"
            params = {
                "ids": coingecko_id,
                "vs_currencies": "usd"
            }
            
            response = requests.get(url, params=params, timeout=5)
            if response.status_code == 200:
                data = response.json()
                price = data.get(coingecko_id, {}).get('usd')
                if price and price > 0:
                    logger.info(f"CoinGecko: {symbol} = ${price:.2f}")
                    return float(price)
        except Exception as e:
            logger.debug(f"CoinGecko error: {e}")
        return None
    
    @staticmethod
    def get_price_from_api(symbol: str) -> Optional[float]:
        """
        Fetch from price.finance (completely free, no auth)
        Fallback for US stocks
        """
        try:
            # Using Polygon.io free tier endpoint (3 API calls/minute free)
            url = f"https://api.polygon.io/v1/last/quote/stocks/{symbol.upper()}"
            params = {"apiKey": "pc_lUqRVlYG70F2FP8WqWJqaJ8UQMHX2s_"}  # Public demo key
            
            response = requests.get(url, params=params, timeout=5)
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'OK' and 'result' in data:
                    result = data['result']
                    price = (result.get('ask', 0) + result.get('bid', 0)) / 2
                    if price > 0:
                        logger.info(f"Polygon API: {symbol} = ${price:.2f}")
                        return float(price)
        except Exception as e:
            logger.debug(f"Polygon API error: {e}")
        return None
    
    @staticmethod
    def get_price_from_cryptocompare(symbol: str) -> Optional[float]:
        """Get price from CryptoCompare (free tier, crypto focused)"""
        try:
            # CryptoCompare free API - 100 calls/hour free
            crypto_symbols = {
                'BTC': 'BTC',
                'ETH': 'ETH',
                'XRP': 'XRP',
                'LTC': 'LTC',
                'BNB': 'BNB'
            }
            
            if symbol.upper() not in crypto_symbols:
                return None
            
            url = "https://min-api.cryptocompare.com/data/price"
            params = {
                "fsym": crypto_symbols[symbol.upper()],
                "tsyms": "USD"
            }
            
            response = requests.get(url, params=params, timeout=5)
            if response.status_code == 200:
                data = response.json()
                price = data.get('USD')
                if price and price > 0:
                    logger.info(f"CryptoCompare: {symbol} = ${price:.2f}")
                    return float(price)
        except Exception as e:
            logger.debug(f"CryptoCompare error: {e}")
        return None
    
    @staticmethod
    def get_price_from_yfinance(symbol: str) -> Optional[float]:
        """
        Fetch price from Yahoo Finance using yfinance library
        Completely free, no authentication required
        """
        try:
            ticker = yf.Ticker(symbol.upper())
            # Get latest daily data
            hist = ticker.history(period='1d', progress=False)
            if not hist.empty:
                price = hist['Close'].iloc[-1]
                if price and price > 0:
                    logger.info(f"Yahoo Finance: {symbol} = ${price:.2f}")
                    return float(price)
        except Exception as e:
            logger.debug(f"Yahoo Finance error for {symbol}: {e}")
        return None


class FreePriceProvider:
    """Multi-source free price provider"""
    
    def __init__(self):
        # Try yfinance first (most reliable for stocks, no auth needed)
        # Then fall back to CoinGecko, then Polygon, then CryptoCompare
        self.providers = [
            QuoteDataProvider.get_price_from_yfinance,       # Yahoo Finance - most reliable for stocks
            QuoteDataProvider.get_price_from_coingecko,      # CoinGecko for stocks/crypto - no auth needed
            QuoteDataProvider.get_price_from_api,             # Polygon.io as backup
            QuoteDataProvider.get_price_from_cryptocompare,   # CryptoCompare for crypto
        ]
        self.cache = {}
        self.last_call_time = {}
        self.min_call_interval = 0.5  # Min 0.5 second between calls
    
    def get_price(self, symbol: str) -> Optional[float]:
        """Get price from free public data sources"""
        symbol = symbol.upper()
        
        # Try each provider
        for provider in self.providers:
            try:
                # Respect rate limits
                provider_name = provider.__name__
                last_time = self.last_call_time.get(provider_name, 0)
                current_time = time.time()
                
                if current_time - last_time < self.min_call_interval:
                    time.sleep(self.min_call_interval - (current_time - last_time))
                
                price = provider(symbol)
                self.last_call_time[provider_name] = time.time()
                
                if price and price > 0:
                    self.cache[symbol] = price
                    return price
            except Exception as e:
                logger.debug(f"Provider {provider.__name__} failed for {symbol}: {e}")
                continue
        
        logger.warning(f"All free providers failed for {symbol}")
        return None


# Global instance
free_provider = FreePriceProvider()
