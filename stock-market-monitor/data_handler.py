"""
Data handling module for storing and retrieving stock data
"""

import logging
import os
import csv
from datetime import datetime
from typing import List, Dict
import config

logger = logging.getLogger(__name__)


class DataHandler:
    """Handles data storage and retrieval"""

    def __init__(self):
        """Initialize data handler"""
        self.data_dir = config.DATA_DIR
        self._ensure_data_directory()
        logger.info(f"Data handler initialized with directory: {self.data_dir}")

    def _ensure_data_directory(self) -> None:
        """Ensure data directory exists"""
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir)
            logger.info(f"Created data directory: {self.data_dir}")

    def save_price(self, symbol: str, price: float) -> None:
        """
        Save stock price to CSV file

        Args:
            symbol: Stock ticker symbol
            price: Current stock price
        """
        csv_file = os.path.join(self.data_dir, f"{symbol}_prices.csv")
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        try:
            file_exists = os.path.exists(csv_file)

            with open(csv_file, 'a', newline='') as f:
                writer = csv.writer(f)
                if not file_exists:
                    writer.writerow(['timestamp', 'symbol', 'price'])
                writer.writerow([timestamp, symbol, price])

            logger.debug(f"Saved price for {symbol}: ${price:.2f}")
        except Exception as e:
            logger.error(f"Error saving price for {symbol}: {e}")

    def get_price_history(self, symbol: str, limit: int = None) -> List[Dict]:
        """
        Retrieve price history for a stock

        Args:
            symbol: Stock ticker symbol
            limit: Maximum number of records to return

        Returns:
            List of price records
        """
        csv_file = os.path.join(self.data_dir, f"{symbol}_prices.csv")
        history = []

        if not os.path.exists(csv_file):
            logger.warning(f"No price history found for {symbol}")
            return history

        try:
            with open(csv_file, 'r') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    history.append({
                        'timestamp': row['timestamp'],
                        'symbol': row['symbol'],
                        'price': float(row['price'])
                    })

            if limit:
                history = history[-limit:]

            return history
        except Exception as e:
            logger.error(f"Error reading price history for {symbol}: {e}")
            return []

    def export_data(self, symbol: str, output_file: str = None) -> str:
        """
        Export price data to a new CSV file

        Args:
            symbol: Stock ticker symbol
            output_file: Optional output file path

        Returns:
            Path to exported file
        """
        if output_file is None:
            output_file = os.path.join(
                self.data_dir,
                f"{symbol}_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            )

        history = self.get_price_history(symbol)

        try:
            with open(output_file, 'w', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=['timestamp', 'symbol', 'price'])
                writer.writeheader()
                writer.writerows(history)

            logger.info(f"Exported data for {symbol} to {output_file}")
            return output_file
        except Exception as e:
            logger.error(f"Error exporting data for {symbol}: {e}")
            return ""

    def get_latest_price(self, symbol: str) -> float:
        """Get the latest saved price for a stock"""
        history = self.get_price_history(symbol, limit=1)
        return history[0]['price'] if history else 0.0
