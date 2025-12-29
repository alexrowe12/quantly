# Quantly

A web-based quantitative finance backtesting platform for testing trading strategies with technical indicators against historical market data.

## Features

- **10 Technical Indicators**: RSI, MACD, Moving Averages (SMA/EMA/WMA), Bollinger Bands, Stochastic Oscillator, ATR, ADX, VWAP, OBV, and Parabolic SAR
- **Interactive Strategy Builder**: Drag-and-drop interface to create and combine multiple strategies
- **Real-time Backtesting**: Test strategies against historical price data with detailed trade history
- **Visual Analytics**: Interactive charts showing price action, indicators, and trade execution points
- **Performance Metrics**: Track returns, win rate, Sharpe ratio, max drawdown, and more
- **Flexible Configuration**: Customize indicator parameters and position sizing for each strategy

## Quick Start

### Prerequisites

- Python 3.13+
- Node.js 18+
- PostgreSQL 14+

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd Quantly
```

2. **Set up the backend**
```bash
# Create and activate virtual environment
python -m venv qenv
source qenv/bin/activate  # On Windows: qenv\Scripts\activate

# Install dependencies
pip install fastapi uvicorn sqlalchemy psycopg2-binary pandas numpy python-dotenv

# Create .env file with your settings
echo "API_KEY=your_secure_api_key" > .env
```

3. **Set up PostgreSQL**
```bash
# Start PostgreSQL
brew services start postgresql@14  # macOS with Homebrew
# or your system's equivalent

# Create database and load data (see db/ directory for schema)
```

4. **Set up the frontend**
```bash
cd frontend
npm install
```

### Running the Application

**Terminal 1 - Backend:**
```bash
cd /path/to/Quantly
source qenv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd /path/to/Quantly/frontend
npm run dev
```

**Access the app:** Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage Guide

### Building a Strategy

1. **Add Strategies**: Click "Add Strategy" to create a new strategy rule
2. **Configure Indicators**: Select an indicator type and configure its parameters
3. **Set Action**: Choose Buy or Sell for each strategy
4. **Adjust Position Size**: Set the trade percentage (0.01 = 1% of portfolio)
5. **Reorder Strategies**: Drag strategies to change their priority order
6. **Run Backtest**: Click "Run Backtest" to execute your strategy

### Available Indicators

#### Momentum Indicators

**RSI (Relative Strength Index)**
- Measures overbought/oversold conditions (0-100)
- Common thresholds: Buy < 30 (oversold), Sell > 70 (overbought)
- Parameters: Period (default: 14), Threshold

**Stochastic Oscillator**
- Compares closing price to price range over time
- Parameters: K Period (14), D Period (3), Threshold (20/80)
- Use: Similar to RSI for overbought/oversold signals

**MACD (Moving Average Convergence Divergence)**
- Trend-following momentum indicator
- Parameters: Fast Period (12), Slow Period (26), Signal Period (9)
- Signals: Buy on histogram crossing above 0, sell below 0

**ADX (Average Directional Index)**
- Measures trend strength (0-100)
- Values > 25 indicate strong trend
- Parameters: Period (14), Threshold (25)

#### Trend Indicators

**Moving Averages (SMA/EMA/WMA)**
- SMA: Simple Moving Average
- EMA: Exponential (more weight on recent prices)
- WMA: Weighted (linear weighting)
- Parameters: Period (20)
- Strategy: Buy when price crosses above, sell when crosses below

**Bollinger Bands**
- Volatility bands around moving average
- Parameters: Period (20), Std Dev (2.0)
- Strategy: Buy at lower band, sell at upper band (mean reversion)

**Parabolic SAR**
- Stop and Reverse indicator for trend following
- Parameters: AF Start (0.02), AF Increment (0.02), AF Max (0.2)
- Strategy: Buy/sell on trend reversals

#### Volume Indicators

**VWAP (Volume Weighted Average Price)**
- Average price weighted by volume
- No configurable parameters (calculated from session start)
- Strategy: Institutional support/resistance level

**OBV (On-Balance Volume)**
- Cumulative volume indicator
- No configurable parameters
- Strategy: Rising OBV = accumulation, falling = distribution

#### Volatility Indicators

**ATR (Average True Range)**
- Measures market volatility
- Parameters: Period (14)
- Use: Position sizing and stop-loss placement

## Performance Metrics Explained

- **Total Return**: Profit/loss in dollars
- **Return %**: Percentage gain/loss on initial capital
- **Total Trades**: Number of buy and sell orders executed
- **Win Rate**: Percentage of profitable trades
- **Sharpe Ratio**: Risk-adjusted return (higher is better)
- **Max Drawdown**: Largest peak-to-trough decline

## API Endpoints

### POST `/api/backtest`
Run a backtest with configured strategies

**Request Body:**
```json
{
  "ticker": "SPY",
  "starting_value": 10000,
  "buy_strategies": [...],
  "sell_strategies": [...],
  "start_date": "2020-01-01",
  "end_date": "2023-12-31"
}
```

### GET `/api/chart-data`
Fetch price and indicator data for charting

**Query Parameters:**
- `ticker`: Stock symbol (e.g., "SPY")

## Directory Structure

- **app/**: Backend API (FastAPI, database models, backtest engine)
- **data_proc/**: CSV processing and indicator calculations
- **db/**: PostgreSQL database management and schema
- **frontend/**: Next.js + React + TypeScript UI
- **strategy/**: Trading strategy logic and signal generation
- **utils/**: Development utilities and helper scripts
- **backtest.py**: Standalone CLI backtest script

## Technical Stack

**Backend:**
- FastAPI (Python web framework)
- PostgreSQL (price data storage)
- Pandas/NumPy (technical analysis calculations)
- SQLAlchemy (database ORM)

**Frontend:**
- Next.js 15 (React framework)
- TypeScript (type safety)
- Tailwind CSS 4 (styling)
- Recharts (data visualization)
- @dnd-kit (drag-and-drop)

## Known Limitations

- Currently backtests on SPY (hardcoded) - ticker selection coming soon
- No commission or slippage modeling yet
- Daily data only (no intraday)
- No portfolio optimization or multi-ticker support
- Results are for educational purposes only

## Roadmap

- [ ] Ticker selection and search
- [ ] Commission and slippage settings
- [ ] Export backtest results to CSV
- [ ] Save/load strategy configurations
- [ ] User authentication and saved strategies
- [ ] Multi-ticker portfolio backtesting
- [ ] Walk-forward analysis
- [ ] Strategy optimization

## Contributing

This is an alpha release. Bug reports and feature requests are welcome!

## Disclaimer

This software is for educational and research purposes only. Past performance does not guarantee future results. Do not use this as financial advice or for actual trading decisions without proper due diligence.

## License

MIT License

Copyright (c) 2025 Quantly

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.