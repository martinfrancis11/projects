# Stock Market Monitoring Project

A Python-based application for real-time stock market monitoring with data analysis and price alerts.

## Features

- **Real-time Stock Data**: Fetch current stock prices with retry logic
- **Multiple Data Modes**: Live API data or mock data for testing
- **Smart Caching**: Reduces API calls and avoids rate limiting
- **Price Alerts**: Set custom alerts for price targets
- **Portfolio Tracking**: Monitor multiple stocks simultaneously
- **Data Analysis**: Technical indicators and trend analysis
- **CSV Export**: Save data for further analysis
- **Web Dashboard**: Beautiful browser-based interface
- **REST API**: Full API for integrations

## Project Structure

```
.
├── main.py                 # CLI entry point
├── web_app.py             # Web dashboard (Flask)
├── config.py              # Configuration settings
├── stock_monitor.py       # Core monitoring logic
├── alerts.py              # Alert management
├── data_handler.py        # Data retrieval and storage
├── analysis.py            # Technical analysis functions
├── requirements.txt       # Python dependencies
├── templates/             # HTML templates
│   └── index.html        # Dashboard UI
├── static/                # Static assets
│   ├── css/
│   │   └── style.css     # Dashboard styles
│   └── js/
│       └── app.js        # Dashboard JavaScript
├── data/                  # Data storage directory
│   └── .gitkeep
└── README.md             # This file
```

## Installation

1. **Clone/navigate to the project directory**:
   ```bash
   cd /Users/martinfrancis/code
   ```

2. **Create a virtual environment**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

## Data Modes

The application supports two data modes:

### Mock Data Mode (Default)
- **Enabled by default** for reliable testing
- Simulates realistic stock price movements
- No API rate limiting issues
- Perfect for development and demos

### Live Data Mode
- Fetches real prices from Yahoo Finance API
- Automatic retry with exponential backoff
- Smart caching to reduce API calls
- Fallback to mock data if API fails

**To switch between modes:**

Edit `web_app.py` or `main.py`:
```python
# Mock mode (default)
monitor = StockMonitor(use_mock_data=True)

# Live mode (when API available)
monitor = StockMonitor(use_mock_data=False)
```

## Usage

### Command-Line Interface

Run the stock monitor in continuous mode:

```bash
python main.py
```

Run in demo mode (single check):

```bash
python main.py --demo
```

### Web Dashboard

Launch the web-based dashboard:

```bash
python web_app.py
```

Then open your browser to **http://localhost:5000**

The dashboard provides:
- **Real-time Watchlist**: View all monitored stocks with current prices
- **Price Alerts**: Receive notifications when price targets are reached
- **Technical Analysis**: View moving averages, RSI, volatility, and trend analysis
- **Add/Remove Stocks**: Dynamically manage your watchlist
- **Manual Refresh**: Check prices on-demand

### Configuration

Edit `config.py` to customize:
- Watchlist of stocks
- Alert thresholds
- Update intervals
- Data storage paths
- Price targets

## Dependencies

- **yfinance**: Yahoo Finance API wrapper for stock data
- **pandas**: Data manipulation and analysis
- **numpy**: Numerical computations
- **requests**: HTTP library
- **python-dotenv**: Environment variable management
- **flask**: Web framework for dashboard
- **jinja2**: Template engine

## Example Usage

```python
from stock_monitor import StockMonitor

monitor = StockMonitor()
monitor.add_stock('AAPL', target_price=150)
monitor.add_stock('GOOGL', target_price=130)
monitor.check_prices()
```

## Features Roadmap

- [ ] Real-time WebSocket connections for live data
- [ ] Database integration (SQLite/PostgreSQL)
- [ ] Email notifications
- [ ] Advanced charting capabilities
- [ ] Machine learning price predictions
- [ ] Alternative data providers (IEX Cloud, Alpha Vantage)
