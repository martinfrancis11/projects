"""
Stock Market Monitor - Main entry point
"""

import logging
import time
from stock_monitor import StockMonitor
import config

# Setup logging
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def main():
    """Main function to run the stock monitor"""
    monitor = StockMonitor(use_mock_data=True)

    # Add stocks from config
    for symbol in config.WATCHLIST:
        target = config.PRICE_TARGETS.get(symbol)
        monitor.add_stock(symbol, target_price=target)

    logger.info("Stock Market Monitor started")
    print("\n" + "="*60)
    print("STOCK MARKET MONITOR".center(60))
    print("="*60)
    print(f"Monitoring {len(monitor.watchlist)} stocks")
    print(f"Update interval: {config.UPDATE_INTERVAL} seconds")
    print("="*60 + "\n")

    try:
        iteration = 0
        while True:
            iteration += 1
            logger.info(f"Checking prices (iteration {iteration})")

            # Check all prices
            monitor.check_prices()

            # Display watchlist
            monitor.print_watchlist()

            # Display any triggered alerts
            monitor.alert_manager.print_alerts()

            # Wait for next update
            logger.debug(f"Sleeping for {config.UPDATE_INTERVAL} seconds")
            time.sleep(config.UPDATE_INTERVAL)

    except KeyboardInterrupt:
        logger.info("Stock Monitor stopped by user")
        print("\nMonitor stopped.")
    except Exception as e:
        logger.error(f"Error in main loop: {e}")
        raise


def demo_mode():
    """Run a single check without continuous monitoring"""
    monitor = StockMonitor(use_mock_data=True)

    # Add some stocks
    monitor.add_stock('AAPL', target_price=150.0)
    monitor.add_stock('GOOGL', target_price=130.0)
    monitor.add_stock('MSFT', target_price=350.0)

    print("\n" + "="*60)
    print("STOCK MARKET MONITOR - DEMO MODE".center(60))
    print("="*60 + "\n")

    # Check prices once
    monitor.check_prices()
    monitor.print_watchlist()
    monitor.alert_manager.print_alerts()


if __name__ == '__main__':
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == '--demo':
        demo_mode()
    else:
        main()
