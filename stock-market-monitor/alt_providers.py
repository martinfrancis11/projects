"""
Multiple data providers with fallback system
Supports: IEX Cloud, Finnhub, MarketStack, and fallback to mock data
"""

import logging
import requests
import json
from typing import Optional, Dict
from datetime import datetime, timedelta
import time

logger = logging.getLogger(__name__)


class IEXCloudProvider:
    """IEX Cloud free tier provider (50 requests/month free)"""
    
    BASE_URL = "https://cloud.iexapis.com/stable"
    
    def __init__(self, api_key: str = "pk_test"):
        self.api_key = api_key
        self.session = requests.Session()
    
    def get_price(self, symbol: str) -> Optional[float]:
        """Fetch price from IEX Cloud"""
        try:
            url = f"{self.BASE_URL}/stock/{symbol}/quote"
            params = {"token": self.api_key}
            
            response = self.session.get(url, params=params, timeout=5)
            if response.status_code == 200:
                data = response.json()
                price = data.get('latestPrice')
                if price:
                    logger.info(f"IEX Cloud: {symbol} = ${price:.2f}")
                    return float(price)
        except Exception as e:
            logger.debug(f"IEX Cloud error: {e}")
        return None


class FinnhubProvider:
    """Finnhub free tier (60 requests/min free)
    
    Requires API key in either:
    - URL parameter: token=apiKey
    - Header: X-Finnhub-Token: apiKey
    """
    
    BASE_URL = "https://finnhub.io/api/v1"
    
    def __init__(self, api_key: str = "sandbox"):
        self.api_key = api_key
        self.session = requests.Session()
        # Set up default headers with API key
        self.session.headers.update({
            'X-Finnhub-Token': self.api_key
        })
    
    def get_price(self, symbol: str) -> Optional[float]:
        """Fetch price from Finnhub
        
        Uses header authentication: X-Finnhub-Token: apiKey
        Fallback to URL parameter if needed
        """
        try:
            url = f"{self.BASE_URL}/quote"
            params = {
                "symbol": symbol.upper()
            }
            
            # Try with header first (cleaner)
            response = self.session.get(url, params=params, timeout=5)
            
            if response.status_code == 401 or response.status_code == 403:
                # If header auth fails, try with URL parameter
                params['token'] = self.api_key
                response = self.session.get(url, params=params, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for errors in response
                if 'error' in data:
                    logger.debug(f"Finnhub error for {symbol}: {data['error']}")
                    return None
                
                price = data.get('c')  # current price is in 'c' field
                if price and price > 0:
                    logger.info(f"Finnhub: {symbol} = ${price:.2f}")
                    return float(price)
                else:
                    logger.debug(f"Finnhub: Invalid price for {symbol}: {price}")
            else:
                logger.debug(f"Finnhub HTTP {response.status_code} for {symbol}")
                if response.status_code == 401:
                    logger.warning(f"Finnhub: Invalid API key")
                elif response.status_code == 429:
                    logger.warning(f"Finnhub: Rate limit exceeded")
                    
        except Exception as e:
            logger.debug(f"Finnhub error: {e}")
        return None


class CoinGeckoProvider:
    """CoinGecko free API (no auth required)"""
    
    BASE_URL = "https://api.coingecko.com/api/v3"
    
    def __init__(self):
        self.session = requests.Session()
    
    def get_price(self, symbol: str) -> Optional[float]:
        """Fetch crypto price from CoinGecko"""
        try:
            # Map stock symbols to crypto IDs
            crypto_map = {
                'BTC': 'bitcoin',
                'ETH': 'ethereum',
                'XRP': 'ripple',
                'LTC': 'litecoin',
                'BNB': 'binancecoin',
            }
            
            crypto_id = crypto_map.get(symbol.upper())
            if not crypto_id:
                return None
            
            url = f"{self.BASE_URL}/simple/price"
            params = {
                "ids": crypto_id,
                "vs_currencies": "usd"
            }
            
            response = self.session.get(url, params=params, timeout=5)
            if response.status_code == 200:
                data = response.json()
                price = data.get(crypto_id, {}).get('usd')
                if price:
                    logger.info(f"CoinGecko: {symbol} = ${price:.2f}")
                    return float(price)
        except Exception as e:
            logger.debug(f"CoinGecko error: {e}")
        return None


class AlternativePriceProvider:
    """
    Multi-source price provider with fallback chain
    Tries multiple free APIs before falling back to mock data
    """
    
    def __init__(self):
        self.providers = [
            FinnhubProvider(),
            IEXCloudProvider(),
            CoinGeckoProvider(),
        ]
        self.cache: Dict[str, Dict] = {}
        self.cache_duration = 300  # 5 minutes
    
    def get_price(self, symbol: str, use_cache: bool = True) -> Optional[float]:
        """
        Get price from available sources with fallback
        
        Args:
            symbol: Stock/crypto ticker
            use_cache: Use cached price if available
            
        Returns:
            Price or None if all sources fail
        """
        symbol = symbol.upper()
        
        # Check cache
        if use_cache and symbol in self.cache:
            cached = self.cache[symbol]
            if datetime.now() - cached['timestamp'] < timedelta(seconds=self.cache_duration):
                logger.debug(f"{symbol}: Using cached price ${cached['price']:.2f}")
                return cached['price']
        
        # Try each provider in order
        for provider in self.providers:
            try:
                price = provider.get_price(symbol)
                if price and price > 0:
                    self.cache[symbol] = {
                        'price': price,
                        'timestamp': datetime.now(),
                        'source': provider.__class__.__name__
                    }
                    logger.info(f"Got {symbol} price from {provider.__class__.__name__}: ${price:.2f}")
                    return price
            except Exception as e:
                logger.debug(f"{provider.__class__.__name__} failed for {symbol}: {e}")
                continue
        
        logger.warning(f"All providers failed for {symbol}")
        return None
    
    def get_cached_source(self, symbol: str) -> Optional[str]:
        """Get the source of cached price"""
        if symbol in self.cache:
            return self.cache[symbol].get('source')
        return None


# Global instance
alternative_provider = AlternativePriceProvider()
