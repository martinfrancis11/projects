"""
Technical analysis module for stock data
"""

import logging
from typing import List, Dict, Optional
import numpy as np

logger = logging.getLogger(__name__)


class TechnicalAnalysis:
    """Provides technical analysis functions"""

    @staticmethod
    def calculate_sma(prices: List[float], period: int = 20) -> List[Optional[float]]:
        """
        Calculate Simple Moving Average

        Args:
            prices: List of price values
            period: Number of periods for moving average

        Returns:
            List of SMA values
        """
        if len(prices) < period:
            return [None] * len(prices)

        sma = []
        for i in range(len(prices)):
            if i < period - 1:
                sma.append(None)
            else:
                window = prices[i - period + 1:i + 1]
                sma.append(np.mean(window))

        return sma

    @staticmethod
    def calculate_ema(prices: List[float], period: int = 20) -> List[Optional[float]]:
        """
        Calculate Exponential Moving Average

        Args:
            prices: List of price values
            period: Number of periods for moving average

        Returns:
            List of EMA values
        """
        if len(prices) < period:
            return [None] * len(prices)

        ema = []
        multiplier = 2 / (period + 1)

        for i in range(len(prices)):
            if i < period - 1:
                ema.append(None)
            elif i == period - 1:
                ema.append(np.mean(prices[:period]))
            else:
                ema.append(prices[i] * multiplier + ema[i - 1] * (1 - multiplier))

        return ema

    @staticmethod
    def calculate_rsi(prices: List[float], period: int = 14) -> List[Optional[float]]:
        """
        Calculate Relative Strength Index

        Args:
            prices: List of price values
            period: Number of periods for RSI

        Returns:
            List of RSI values (0-100)
        """
        if len(prices) < period + 1:
            return [None] * len(prices)

        deltas = np.diff(prices)
        gains = np.where(deltas > 0, deltas, 0)
        losses = np.where(deltas < 0, -deltas, 0)

        rsi = []
        for i in range(len(prices)):
            if i < period:
                rsi.append(None)
            else:
                avg_gain = np.mean(gains[i - period:i])
                avg_loss = np.mean(losses[i - period:i])

                if avg_loss == 0:
                    rsi.append(100.0 if avg_gain > 0 else 0.0)
                else:
                    rs = avg_gain / avg_loss
                    rsi.append(100 - (100 / (1 + rs)))

        return rsi

    @staticmethod
    def calculate_volatility(prices: List[float], period: int = 20) -> Optional[float]:
        """
        Calculate price volatility (standard deviation)

        Args:
            prices: List of price values
            period: Number of periods to calculate

        Returns:
            Volatility as standard deviation percentage
        """
        if len(prices) < period:
            return None

        recent_prices = prices[-period:]
        returns = np.diff(recent_prices) / recent_prices[:-1]
        volatility = np.std(returns) * 100

        return volatility

    @staticmethod
    def calculate_price_change(current_price: float, previous_price: float) -> float:
        """
        Calculate percentage price change

        Args:
            current_price: Current stock price
            previous_price: Previous stock price

        Returns:
            Percentage change
        """
        if previous_price == 0:
            return 0.0

        return ((current_price - previous_price) / previous_price) * 100

    @staticmethod
    def analyze_trend(prices: List[float], period: int = 20) -> str:
        """
        Simple trend analysis based on moving averages

        Args:
            prices: List of price values
            period: Number of periods for moving average

        Returns:
            'UPTREND', 'DOWNTREND', or 'SIDEWAYS'
        """
        if len(prices) < period + 1:
            return 'UNKNOWN'

        sma = TechnicalAnalysis.calculate_sma(prices, period)
        current_price = prices[-1]
        sma_value = sma[-1]

        if sma_value is None:
            return 'UNKNOWN'

        if current_price > sma_value * 1.02:
            return 'UPTREND'
        elif current_price < sma_value * 0.98:
            return 'DOWNTREND'
        else:
            return 'SIDEWAYS'
