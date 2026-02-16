"""
Mock data provider for testing when API is unavailable
"""

import logging
import random
from typing import Optional, Dict
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class MockDataProvider:
    """Provides mock stock data for testing"""
    
    # Base prices for stocks
    BASE_PRICES = {
        'AAPL': 150.00,
        'GOOGL': 130.00,
        'MSFT': 350.00,
        'TSLA': 220.00,
        'AMZN': 160.00,
    }
    
    # Store simulated prices to maintain consistency
    _prices: Dict[str, float] = {}
    
    @classmethod
    def get_price(cls, symbol: str) -> Optional[float]:
        """
        Get a mock price for testing
        
        Args:
            symbol: Stock ticker symbol
            
        Returns:
            Mock price with small random variation
        """
        symbol = symbol.upper()
        
        if symbol not in cls._prices:
            base = cls.BASE_PRICES.get(symbol, random.uniform(50, 500))
            cls._prices[symbol] = base
        
        # Add small random variation (±2%)
        current = cls._prices[symbol]
        variation = random.uniform(-0.02, 0.02)
        new_price = current * (1 + variation)
        cls._prices[symbol] = new_price
        
        logger.info(f"Mock data: {symbol} = ${new_price:.2f}")
        return new_price
    
    @classmethod
    def get_history(cls, symbol: str, days: int = 30) -> list:
        """Generate mock historical data"""
        symbol = symbol.upper()
        base = cls.BASE_PRICES.get(symbol, 150.00)
        
        history = []
        current_price = base
        
        for i in range(days):
            date = datetime.now() - timedelta(days=days-i-1)
            variation = random.uniform(-0.03, 0.03)
            current_price = current_price * (1 + variation)
            
            history.append({
                'timestamp': date.isoformat(),
                'symbol': symbol,
                'price': round(current_price, 2)
            })
        
        return history
    
    @classmethod
    def reset(cls):
        """Reset mock data"""
        cls._prices.clear()
