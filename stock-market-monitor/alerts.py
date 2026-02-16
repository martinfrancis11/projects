"""
Alert management module
"""

import logging
from typing import Dict, List
from datetime import datetime

logger = logging.getLogger(__name__)


class AlertManager:
    """Manages price alerts and notifications"""

    def __init__(self):
        """Initialize alert manager"""
        self.alerts: List[Dict] = []
        self.triggered_alerts: List[Dict] = []

    def set_alert(self, symbol: str, alert_type: str, threshold: float) -> None:
        """
        Set an alert for a stock

        Args:
            symbol: Stock ticker symbol
            alert_type: Type of alert ('price_target', 'price_change', 'volume')
            threshold: Threshold value for the alert
        """
        alert = {
            'symbol': symbol,
            'type': alert_type,
            'threshold': threshold,
            'created_at': datetime.now(),
            'triggered': False
        }
        self.alerts.append(alert)
        logger.info(f"Alert set for {symbol}: {alert_type} = {threshold}")

    def trigger_alert(self, symbol: str, message: str, value: float) -> None:
        """
        Trigger an alert

        Args:
            symbol: Stock ticker symbol
            message: Alert message
            value: Current value that triggered the alert
        """
        alert_record = {
            'symbol': symbol,
            'message': message,
            'value': value,
            'triggered_at': datetime.now()
        }
        self.triggered_alerts.append(alert_record)
        logger.warning(f"ALERT TRIGGERED: {message}")

    def get_active_alerts(self, symbol: str) -> List[Dict]:
        """Get all active alerts for a symbol"""
        return [a for a in self.alerts if a['symbol'] == symbol and not a['triggered']]

    def get_triggered_alerts(self) -> List[Dict]:
        """Get all triggered alerts"""
        return self.triggered_alerts

    def clear_alerts(self, symbol: str) -> None:
        """Clear all alerts for a symbol"""
        self.alerts = [a for a in self.alerts if a['symbol'] != symbol]
        logger.info(f"Cleared alerts for {symbol}")

    def print_alerts(self) -> None:
        """Print summary of triggered alerts"""
        if not self.triggered_alerts:
            print("No triggered alerts")
            return

        print("\n" + "="*70)
        print("TRIGGERED ALERTS".center(70))
        print("="*70)
        for alert in self.triggered_alerts:
            print(f"\n[{alert['triggered_at'].strftime('%Y-%m-%d %H:%M:%S')}]")
            print(f"Symbol: {alert['symbol']}")
            print(f"Message: {alert['message']}")
            print(f"Value: ${alert['value']:.2f}")
        print("="*70 + "\n")
