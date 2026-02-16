"""
Core stock market monitoring module
"""

import logging
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import time
import yfinance as yf
from data_handler import DataHandler
from alerts import AlertManager
from analysis import TechnicalAnalysis
import config
from mock_data import MockDataProvider
from free_scrapers import free_provider
from alt_providers import FinnhubProvider
from api_keys import FINNHUB_API_KEY

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class PriceCache:
    """Simple price cache to avoid excessive API calls"""
    
    def __init__(self, duration_seconds: int = 300):
        self.cache: Dict[str, Dict] = {}
        self.duration = duration_seconds
    
    def get(self, symbol: str) -> Optional[float]:
        """Get cached price if available and not expired"""
        if symbol not in self.cache:
            return None
        
        cached = self.cache[symbol]
        if datetime.now() - cached['timestamp'] > timedelta(seconds=self.duration):
            del self.cache[symbol]
            return None
        
        return cached['price']
    
    def set(self, symbol: str, price: float) -> None:
        """Cache a price"""
        self.cache[symbol] = {
            'price': price,
            'timestamp': datetime.now()
        }
    
    def clear(self) -> None:
        """Clear all cached prices"""
        self.cache.clear()


class StockMonitor:
    """Main class for monitoring stock prices"""

    def __init__(self, use_mock_data: bool = None):
        """Initialize the stock monitor
        
        Args:
            use_mock_data: If True, use mock data instead of live API. If None, uses config setting.
        """
        self.watchlist: Dict[str, Dict] = {}
        self.data_handler = DataHandler()
        self.alert_manager = AlertManager()
        self.analysis = TechnicalAnalysis()
        self.price_cache = PriceCache(
            duration_seconds=config.CACHE_DURATION if config.ENABLE_CACHE else 0
        )
        
        # Use provided value or fall back to config
        if use_mock_data is None:
            self.use_mock_data = config.USE_MOCK_DATA
        else:
            self.use_mock_data = use_mock_data
        
        if self.use_mock_data:
            logger.info("Stock Monitor initialized (MOCK DATA MODE)")
        else:
            logger.info(f"Stock Monitor initialized (Using {config.DEFAULT_PROVIDER.upper()} API)")

    def add_stock(self, symbol: str, target_price: Optional[float] = None) -> None:
        """
        Add a stock to the watchlist

        Args:
            symbol: Stock ticker symbol (e.g., 'AAPL')
            target_price: Optional price target for alerts
        """
        self.watchlist[symbol] = {
            'target_price': target_price,
            'last_price': None,
            'last_check': None,
            'alerts_triggered': []
        }
        logger.info(f"Added {symbol} to watchlist (target: {target_price})")

    def remove_stock(self, symbol: str) -> None:
        """Remove a stock from the watchlist"""
        if symbol in self.watchlist:
            del self.watchlist[symbol]
            logger.info(f"Removed {symbol} from watchlist")

    def get_stock_price(self, symbol: str, retries: int = 3) -> Optional[float]:
        """
        Fetch current price for a stock

        Args:
            symbol: Stock ticker symbol
            retries: Number of retry attempts

        Returns:
            Current stock price or None if fetch fails
        """
        # Use mock data if enabled
        if self.use_mock_data:
            return MockDataProvider.get_price(symbol)
        
        # Check cache first
        if config.ENABLE_CACHE:
            cached_price = self.price_cache.get(symbol)
            if cached_price is not None:
                logger.debug(f"{symbol}: ${cached_price:.2f} (cached)")
                return cached_price
        
        # Try Finnhub API first (main provider)
        logger.debug(f"Trying Finnhub API for {symbol}...")
        if FINNHUB_API_KEY:
            finnhub = FinnhubProvider(FINNHUB_API_KEY)
            price = finnhub.get_price(symbol)
            if price is not None:
                if config.ENABLE_CACHE:
                    self.price_cache.set(symbol, price)
                return price
        else:
            logger.warning("Finnhub API key not found. Set FINNHUB_API_KEY environment variable.")
        
        # Try free web scrapers as fallback (no API keys needed)
        logger.debug(f"Trying free scrapers for {symbol}...")
        price = free_provider.get_price(symbol)
        if price is not None:
            if config.ENABLE_CACHE:
                self.price_cache.set(symbol, price)
            return price
        
        # Fallback to yfinance with retry logic
        api_failed = False
        for attempt in range(retries):
            try:
                ticker = yf.Ticker(symbol)
                data = ticker.history(period='1d')
                if not data.empty:
                    price = data['Close'].iloc[-1]
                    logger.debug(f"{symbol}: ${price:.2f} (yfinance)")
                    
                    # Cache the price
                    if config.ENABLE_CACHE:
                        self.price_cache.set(symbol, float(price))
                    
                    return float(price)
            except Exception as e:
                api_failed = True
                if attempt < retries - 1:
                    wait_time = 2 ** attempt  # Exponential backoff
                    logger.warning(f"Retry {attempt + 1}/{retries} for {symbol} in {wait_time}s: {e}")
                    time.sleep(wait_time)
                else:
                    logger.error(f"Error fetching price for {symbol} after {retries} attempts: {e}")
        
        # Fallback to mock data if all APIs fail
        if api_failed or price is None:
            logger.warning(f"Using mock data for {symbol} due to API failure")
            return MockDataProvider.get_price(symbol)
        
        return None

    def check_prices(self) -> None:
        """Check current prices for all stocks in watchlist"""
        logger.info("Checking prices for watchlist...")
        for symbol in self.watchlist:
            price = self.get_stock_price(symbol)
            if price is not None:
                self._update_stock_data(symbol, price)
                self._check_alerts(symbol, price)
                self.data_handler.save_price(symbol, price)

    def _update_stock_data(self, symbol: str, price: float) -> None:
        """Update stock data in watchlist"""
        stock = self.watchlist[symbol]
        stock['last_price'] = price
        stock['last_check'] = datetime.now()

    def _check_alerts(self, symbol: str, price: float) -> None:
        """Check if any alerts should be triggered"""
        stock = self.watchlist[symbol]
        target = stock.get('target_price')

        if target is None:
            return

        # Check if target price is reached
        if price >= target:
            message = f"{symbol} reached target price: ${price:.2f} (target: ${target:.2f})"
            self.alert_manager.trigger_alert(symbol, message, price)
            logger.warning(message)

    def get_watchlist_summary(self) -> List[Dict]:
        """Get summary of all stocks in watchlist"""
        summary = []
        for symbol, data in self.watchlist.items():
            summary.append({
                'symbol': symbol,
                'last_price': data['last_price'],
                'target_price': data['target_price'],
                'last_check': data['last_check']
            })
        return summary

    def print_watchlist(self) -> None:
        """Print formatted watchlist"""
        print("\n" + "="*60)
        print("STOCK WATCHLIST".center(60))
        print("="*60)
        print(f"{'Symbol':<10} {'Price':<12} {'Target':<12} {'Last Check':<20}")
        print("-"*60)

        for stock in self.get_watchlist_summary():
            price = f"${stock['last_price']:.2f}" if stock['last_price'] else "N/A"
            target = f"${stock['target_price']:.2f}" if stock['target_price'] else "N/A"
            last_check = stock['last_check'].strftime("%Y-%m-%d %H:%M:%S") if stock['last_check'] else "N/A"

            print(f"{stock['symbol']:<10} {price:<12} {target:<12} {last_check:<20}")

        print("="*60 + "\n")
