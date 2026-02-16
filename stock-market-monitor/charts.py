"""
Stock chart data provider using Finnhub APIs
Provides historical OHLCV data and technical analysis
Falls back to simulated data if candles endpoint is not available
"""

import logging
import requests
from typing import Optional, Dict, List
from datetime import datetime, timedelta, timezone
import time
from api_keys import FINNHUB_API_KEY
import random

logger = logging.getLogger(__name__)


class ChartDataProvider:
    """Fetches candlestick (OHLCV) data from Finnhub"""
    
    BASE_URL = "https://finnhub.io/api/v1"
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or FINNHUB_API_KEY
        self.session = requests.Session()
        self.session.headers.update({
            'X-Finnhub-Token': self.api_key
        })
    
    def get_daily_candles(self, symbol: str, days: int = 30) -> Optional[Dict]:
        """Fetch daily candlestick data for the past N days
        
        Args:
            symbol: Stock symbol (e.g., 'AAPL')
            days: Number of days of historical data (default 30)
            
        Returns:
            {
                'symbol': 'AAPL',
                'candles': [
                    {'time': timestamp, 'open': o, 'high': h, 'low': l, 'close': c, 'volume': v},
                    ...
                ],
                'dates': ['2024-01-01', '2024-01-02', ...],
                'opens': [100, 101, ...],
                'highs': [102, 103, ...],
                'lows': [99, 100, ...],
                'closes': [101, 102, ...],
                'volumes': [1000000, 1100000, ...]
            }
        """
        try:
            # Calculate Unix timestamps for the date range
            now = datetime.now(timezone.utc)
            from_timestamp = int((now - timedelta(days=days)).timestamp())
            to_timestamp = int(now.timestamp())
            
            url = f"{self.BASE_URL}/stock/candle"
            params = {
                'symbol': symbol.upper(),
                'resolution': 'D',  # Daily
                'from': from_timestamp,
                'to': to_timestamp
            }
            
            response = self.session.get(url, params=params, timeout=10)
            
            # If candles endpoint is not available (403), fall back to simulated data
            if response.status_code == 403:
                logger.info(f"Candle endpoint not available, using simulated data for {symbol}")
                return self._generate_simulated_candles(symbol, days)
            
            if response.status_code != 200:
                logger.warning(f"Finnhub candle error for {symbol}: HTTP {response.status_code}")
                # Fallback to simulated data
                return self._generate_simulated_candles(symbol, days)
            
            data = response.json()
            
            if data.get('s') != 'ok' or not data.get('t'):
                logger.debug(f"Finnhub: No candle data for {symbol}, using simulated data")
                return self._generate_simulated_candles(symbol, days)
            
            # Parse the response
            timestamps = data.get('t', [])
            opens = data.get('o', [])
            highs = data.get('h', [])
            lows = data.get('l', [])
            closes = data.get('c', [])
            volumes = data.get('v', [])
            
            # Convert Unix timestamps to date strings
            dates = []
            candles = []
            
            for i, ts in enumerate(timestamps):
                dt = datetime.fromtimestamp(ts, tz=timezone.utc)
                date_str = dt.strftime('%Y-%m-%d')
                dates.append(date_str)
                
                candle = {
                    'time': ts,
                    'date': date_str,
                    'open': opens[i] if i < len(opens) else None,
                    'high': highs[i] if i < len(highs) else None,
                    'low': lows[i] if i < len(lows) else None,
                    'close': closes[i] if i < len(closes) else None,
                    'volume': volumes[i] if i < len(volumes) else None
                }
                candles.append(candle)
            
            result = {
                'symbol': symbol.upper(),
                'candles': candles,
                'dates': dates,
                'opens': opens,
                'highs': highs,
                'lows': lows,
                'closes': closes,
                'volumes': volumes,
                'count': len(candles)
            }
            
            logger.info(f"Fetched {len(candles)} candles for {symbol}")
            return result
            
        except Exception as e:
            logger.error(f"Error fetching candles for {symbol}: {e}")
            return self._generate_simulated_candles(symbol, days)
    
    def _generate_simulated_candles(self, symbol: str, days: int = 30) -> Dict:
        """Generate realistic simulated candlestick data for visualization
        
        This is used when the Finnhub candles endpoint is not available.
        Generates data based on the current stock price trend.
        """
        try:
            # Get current price from quote API
            url = f"{self.BASE_URL}/quote"
            params = {'symbol': symbol.upper()}
            response = self.session.get(url, params=params, timeout=10)
            
            if response.status_code != 200:
                logger.warning(f"Could not fetch current price for {symbol}")
                # Default fallback prices for major stocks
                default_prices = {
                    'AAPL': 255.78,
                    'GOOGL': 305.72,
                    'MSFT': 401.32,
                    'TSLA': 242.50,
                    'AMZN': 190.45,
                }
                current_price = default_prices.get(symbol.upper(), 100.0)
            else:
                data = response.json()
                current_price = data.get('c', 100.0)
            
            # Generate N days of realistic candlestick data
            now = datetime.now(timezone.utc)
            candles = []
            dates = []
            opens = []
            highs = []
            lows = []
            closes = []
            volumes = []
            
            price = current_price
            volatility = 0.02  # 2% daily volatility
            
            for i in range(days, 0, -1):
                date = now - timedelta(days=i)
                # Skip weekends (Saturday=5, Sunday=6)
                if date.weekday() in [5, 6]:
                    continue
                
                timestamp = int(date.timestamp())
                
                # Generate realistic OHLCV data
                daily_return = random.gauss(0.0002, volatility)  # Slight upward bias, volatility
                open_price = price
                close_price = price * (1 + daily_return)
                high_price = max(open_price, close_price) * (1 + abs(random.gauss(0, volatility/2)))
                low_price = min(open_price, close_price) * (1 - abs(random.gauss(0, volatility/2)))
                volume = int(random.gauss(50_000_000, 10_000_000))  # 50M shares avg
                
                # Ensure realistic values
                high_price = max(high_price, max(open_price, close_price))
                low_price = min(low_price, min(open_price, close_price))
                volume = max(volume, 1_000_000)
                
                date_str = date.strftime('%Y-%m-%d')
                
                candle = {
                    'time': timestamp,
                    'date': date_str,
                    'open': round(open_price, 2),
                    'high': round(high_price, 2),
                    'low': round(low_price, 2),
                    'close': round(close_price, 2),
                    'volume': volume
                }
                
                candles.append(candle)
                dates.append(date_str)
                opens.append(round(open_price, 2))
                highs.append(round(high_price, 2))
                lows.append(round(low_price, 2))
                closes.append(round(close_price, 2))
                volumes.append(volume)
                
                price = close_price  # Next day's opening is today's close
            
            result = {
                'symbol': symbol.upper(),
                'candles': candles,
                'dates': dates,
                'opens': opens,
                'highs': highs,
                'lows': lows,
                'closes': closes,
                'volumes': volumes,
                'count': len(candles),
                'simulated': True  # Mark as simulated data
            }
            
            logger.info(f"Generated {len(candles)} simulated candles for {symbol}")
            return result
            
        except Exception as e:
            logger.error(f"Error generating simulated candles for {symbol}: {e}")
            return None
    
    def get_intraday_candles(self, symbol: str, resolution: int = 60) -> Optional[Dict]:
        """Fetch intraday candlestick data (only 1 month of intraday available)
        
        Args:
            symbol: Stock symbol
            resolution: Timeframe in minutes (1, 5, 15, 30, 60)
            
        Returns:
            Chart data same format as daily candles
        """
        try:
            # Get last 30 days of intraday data
            now = datetime.now(timezone.utc)
            from_timestamp = int((now - timedelta(days=7)).timestamp())  # Last 7 days for intraday
            to_timestamp = int(now.timestamp())
            
            url = f"{self.BASE_URL}/stock/candle"
            params = {
                'symbol': symbol.upper(),
                'resolution': str(resolution),
                'from': from_timestamp,
                'to': to_timestamp
            }
            
            response = self.session.get(url, params=params, timeout=10)
            
            # If candles endpoint is not available (403), fall back to simulated data
            if response.status_code == 403:
                logger.info(f"Candle endpoint not available, using simulated intraday data for {symbol}")
                return self._generate_simulated_intraday(symbol, resolution)
            
            if response.status_code != 200:
                logger.debug(f"Finnhub intraday error for {symbol}")
                return self._generate_simulated_intraday(symbol, resolution)
            
            data = response.json()
            
            if data.get('s') != 'ok' or not data.get('t'):
                logger.debug(f"Finnhub: No intraday data for {symbol}")
                return self._generate_simulated_intraday(symbol, resolution)
            
            # Parse the response
            timestamps = data.get('t', [])
            opens = data.get('o', [])
            highs = data.get('h', [])
            lows = data.get('l', [])
            closes = data.get('c', [])
            volumes = data.get('v', [])
            
            # Convert Unix timestamps to datetime strings
            datetimes = []
            candles = []
            
            for i, ts in enumerate(timestamps):
                dt = datetime.fromtimestamp(ts, tz=timezone.utc)
                datetime_str = dt.strftime('%Y-%m-%d %H:%M')
                datetimes.append(datetime_str)
                
                candle = {
                    'time': ts,
                    'datetime': datetime_str,
                    'open': opens[i] if i < len(opens) else None,
                    'high': highs[i] if i < len(highs) else None,
                    'low': lows[i] if i < len(lows) else None,
                    'close': closes[i] if i < len(closes) else None,
                    'volume': volumes[i] if i < len(volumes) else None
                }
                candles.append(candle)
            
            result = {
                'symbol': symbol.upper(),
                'resolution': resolution,
                'candles': candles,
                'datetimes': datetimes,
                'opens': opens,
                'highs': highs,
                'lows': lows,
                'closes': closes,
                'volumes': volumes,
                'count': len(candles)
            }
            
            logger.info(f"Fetched {len(candles)} intraday candles for {symbol}")
            return result
            
        except Exception as e:
            logger.error(f"Error fetching intraday candles for {symbol}: {e}")
            return self._generate_simulated_intraday(symbol, resolution)
    
    def _generate_simulated_intraday(self, symbol: str, resolution: int = 60) -> Dict:
        """Generate realistic simulated intraday candlestick data
        
        This is used when the Finnhub candles endpoint is not available.
        """
        try:
            # Get current price
            url = f"{self.BASE_URL}/quote"
            params = {'symbol': symbol.upper()}
            response = self.session.get(url, params=params, timeout=10)
            
            if response.status_code != 200:
                default_prices = {'AAPL': 255.78, 'GOOGL': 305.72, 'MSFT': 401.32, 'TSLA': 242.50, 'AMZN': 190.45}
                current_price = default_prices.get(symbol.upper(), 100.0)
            else:
                current_price = response.json().get('c', 100.0)
            
            # Generate intraday bars for last 7 days
            now = datetime.now(timezone.utc)
            candles = []
            datetimes = []
            opens = []
            highs = []
            lows = []
            closes = []
            volumes = []
            
            bars_per_day = int(24 * 60 / resolution)  # Number of bars per day
            price = current_price
            intraday_volatility = 0.005  # 0.5% per bar
            
            for days_back in range(7, -1, -1):
                date = now - timedelta(days=days_back)
                
                # Skip weekends
                if date.weekday() in [5, 6]:
                    continue
                
                # Market hours: 9:30 AM to 4:00 PM (6.5 hours = 390 minutes)
                market_start = date.replace(hour=9, minute=30, second=0, microsecond=0)
                
                for bar in range(bars_per_day):
                    bar_time = market_start + timedelta(minutes=bar * resolution)
                    
                    # Skip if after market hours (4 PM)
                    if bar_time.hour >= 16:
                        break
                    
                    timestamp = int(bar_time.timestamp())
                    
                    # Generate realistic intraday move
                    bar_return = random.gauss(0.0001, intraday_volatility)
                    open_price = price
                    close_price = price * (1 + bar_return)
                    high_price = max(open_price, close_price) * (1 + abs(random.gauss(0, intraday_volatility/2)))
                    low_price = min(open_price, close_price) * (1 - abs(random.gauss(0, intraday_volatility/2)))
                    volume = int(random.gauss(500_000, 100_000))
                    
                    high_price = max(high_price, max(open_price, close_price))
                    low_price = min(low_price, min(open_price, close_price))
                    volume = max(volume, 10_000)
                    
                    datetime_str = bar_time.strftime('%Y-%m-%d %H:%M')
                    
                    candle = {
                        'time': timestamp,
                        'datetime': datetime_str,
                        'open': round(open_price, 2),
                        'high': round(high_price, 2),
                        'low': round(low_price, 2),
                        'close': round(close_price, 2),
                        'volume': volume
                    }
                    
                    candles.append(candle)
                    datetimes.append(datetime_str)
                    opens.append(round(open_price, 2))
                    highs.append(round(high_price, 2))
                    lows.append(round(low_price, 2))
                    closes.append(round(close_price, 2))
                    volumes.append(volume)
                    
                    price = close_price
            
            result = {
                'symbol': symbol.upper(),
                'resolution': resolution,
                'candles': candles,
                'datetimes': datetimes,
                'opens': opens,
                'highs': highs,
                'lows': lows,
                'closes': closes,
                'volumes': volumes,
                'count': len(candles),
                'simulated': True
            }
            
            logger.info(f"Generated {len(candles)} simulated intraday candles for {symbol}")
            return result
            
        except Exception as e:
            logger.error(f"Error generating simulated intraday candles for {symbol}: {e}")
            return None
    
    def calculate_sma(self, closes: List[float], period: int) -> List[Optional[float]]:
        """Calculate Simple Moving Average
        
        Args:
            closes: List of close prices
            period: Number of periods for SMA
            
        Returns:
            List of SMA values (None for insufficient data)
        """
        sma = []
        for i in range(len(closes)):
            if i < period - 1:
                sma.append(None)
            else:
                avg = sum(closes[i - period + 1:i + 1]) / period
                sma.append(round(avg, 2))
        return sma
    
    def calculate_ema(self, closes: List[float], period: int) -> List[Optional[float]]:
        """Calculate Exponential Moving Average
        
        Args:
            closes: List of close prices
            period: Number of periods for EMA
            
        Returns:
            List of EMA values (None for insufficient data)
        """
        if len(closes) < period:
            return [None] * len(closes)
        
        ema = []
        multiplier = 2 / (period + 1)
        
        # SMA for first value
        sma = sum(closes[:period]) / period
        ema.append(sma)
        
        # EMA for rest
        for i in range(period, len(closes)):
            prev_ema = ema[-1]
            new_ema = closes[i] * multiplier + prev_ema * (1 - multiplier)
            ema.append(round(new_ema, 2))
        
        # Fill the beginning with None
        result = [None] * (period - 1) + ema
        return result[:len(closes)]
    
    def calculate_rsi(self, closes: List[float], period: int = 14) -> List[Optional[float]]:
        """Calculate Relative Strength Index
        
        Args:
            closes: List of close prices
            period: RSI period (default 14)
            
        Returns:
            List of RSI values
        """
        if len(closes) < period + 1:
            return [None] * len(closes)
        
        rsi_values = []
        
        for i in range(len(closes)):
            if i < period:
                rsi_values.append(None)
                continue
            
            # Calculate gains and losses
            gains = 0
            losses = 0
            
            for j in range(i - period + 1, i + 1):
                change = closes[j] - closes[j - 1]
                if change > 0:
                    gains += change
                else:
                    losses -= change
            
            avg_gain = gains / period
            avg_loss = losses / period
            
            if avg_loss == 0:
                rs = 0
                rsi = 100 if avg_gain > 0 else 50
            else:
                rs = avg_gain / avg_loss
                rsi = 100 - (100 / (1 + rs))
            
            rsi_values.append(round(rsi, 2))
        
        return rsi_values
    
    def get_technical_analysis(self, symbol: str, days: int = 30) -> Optional[Dict]:
        """Get complete technical analysis with indicators
        
        Args:
            symbol: Stock symbol
            days: Number of days of data
            
        Returns:
            Chart data with technical indicators
        """
        candle_data = self.get_daily_candles(symbol, days)
        if not candle_data:
            return None
        
        closes = candle_data['closes']
        
        # Calculate technical indicators
        sma_20 = self.calculate_sma(closes, 20)
        sma_50 = self.calculate_sma(closes, 50)
        ema_12 = self.calculate_ema(closes, 12)
        ema_26 = self.calculate_ema(closes, 26)
        rsi_14 = self.calculate_rsi(closes, 14)
        
        # Add indicators to result
        candle_data['sma_20'] = sma_20
        candle_data['sma_50'] = sma_50
        candle_data['ema_12'] = ema_12
        candle_data['ema_26'] = ema_26
        candle_data['rsi_14'] = rsi_14
        
        # Add MACD (difference between EMA 12 and 26)
        macd = []
        for i in range(len(closes)):
            if ema_12[i] is not None and ema_26[i] is not None:
                macd.append(round(ema_12[i] - ema_26[i], 2))
            else:
                macd.append(None)
        candle_data['macd'] = macd
        
        logger.info(f"Calculated technical analysis for {symbol}")
        return candle_data


# Create a global instance
chart_provider = ChartDataProvider(FINNHUB_API_KEY)
