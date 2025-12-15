<div align="center">
  <h1>🚀 Open Alpha</h1>
  <p><strong>Enterprise-Grade Quantitative Factor Analysis Platform</strong></p>
  
  <p>
    <a href="#features">Features</a> •
    <a href="#quick-start">Quick Start</a> •
    <a href="#documentation">Documentation</a> •
    <a href="#screenshots">Screenshots</a> •
    <a href="#contributing">Contributing</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/python-3.9+-blue.svg" alt="Python">
    <img src="https://img.shields.io/badge/react-19.x-61DAFB.svg" alt="React">
    <img src="https://img.shields.io/badge/fastapi-0.100+-009688.svg" alt="FastAPI">
    <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License">
  </p>
</div>

---

## ✨ Features

### 📊 Data Explorer
- **Interactive Candlestick Charts** - Professional-grade TradingView-style charts with zoom/pan
- **Multi-Timeframe Support** - 1H, 4H, 1D and more
- **Real-time Data Browsing** - Browse your local market data efficiently

### 🧪 Factor Laboratory
- **Expression Editor** - Monaco-based code editor with syntax highlighting
- **50+ Built-in Functions** - `ts_delay`, `ts_mean`, `ts_std`, `ts_rank`, `ts_corr`, etc.
- **One-Click Backtesting** - Instant factor evaluation and performance analysis
- **Interactive Help** - Built-in function documentation and examples

### 📈 Advanced IC Analysis
- **Time-Series IC** - Rolling IC correlation over time
- **Cross-Sectional IC** - Period-by-period IC analysis
- **IC Distribution** - Histogram visualization
- **Statistical Significance** - t-statistic and p-value

### 📊 Quantile Testing
- **Stratified Layer Analysis** - 3/5/10 quantile stratification
- **Layer Metrics** - Return, Sharpe, Win Rate per layer
- **Monotonicity Check** - Automatic detection of factor quality

### 🏆 Factor Ranking
- **Comprehensive Scoring** - 0-100 factor quality score
- **Multi-Metric Sorting** - Sort by IC, Sharpe, Win Rate
- **Validity Assessment** - Automatic factor validation
- **Leaderboard View** - Compare all backtested factors

---

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/open-alpha.git
cd open-alpha

# Setup backend
pip install -r backend/requirements.txt

# Setup frontend
cd frontend
npm install
cd ..

# Copy environment template
cp .env.example .env
```

### Running

**Option 1: Separate terminals**
```bash
# Terminal 1 - Backend
python -m backend.main

# Terminal 2 - Frontend
cd frontend && npm run dev
```

**Option 2: Windows batch script**
```bash
start_platform.bat
```

### Access
- 🌐 **Frontend**: http://localhost:5173
- 🔌 **API**: http://localhost:8000
- 📚 **API Docs**: http://localhost:8000/docs

---

## 📖 Documentation

### Factor Expression Syntax

```python
# Basic price data
close, open, high, low, volume

# Time-series functions
ts_delay(x, n)      # Lag n periods
ts_mean(x, n)       # Rolling mean
ts_std(x, n)        # Rolling std
ts_max(x, n)        # Rolling max
ts_min(x, n)        # Rolling min
ts_rank(x, n)       # Rolling percentile rank
ts_corr(x, y, n)    # Rolling correlation

# Preprocessing
winsorize(x)        # Remove outliers
standardize(x)      # Z-score normalization
```

### Example Factors

| Factor | Expression | Description |
|--------|------------|-------------|
| Momentum | `close / ts_delay(close, 20) - 1` | 20-day price momentum |
| Volatility | `ts_std(close / ts_delay(close, 1) - 1, 20)` | 20-day return volatility |
| Mean Reversion | `(close - ts_mean(close, 20)) / ts_mean(close, 20)` | Deviation from MA |
| Volume-Price | `ts_corr(close, volume, 20)` | Price-volume correlation |

---

## 📊 Backtest Metrics

| Metric | Description |
|--------|-------------|
| **IC Mean** | Average Information Coefficient |
| **ICIR** | IC Information Ratio (IC/IC_std) |
| **t-statistic** | Statistical significance of IC |
| **Sharpe Ratio** | Risk-adjusted return |
| **Sortino Ratio** | Downside risk-adjusted return |
| **Win Rate** | Percentage of positive returns |
| **Max Drawdown** | Maximum peak-to-trough decline |

---

## 🏗️ Project Structure

```
open-alpha/
├── backend/
│   ├── main.py           # FastAPI application
│   ├── api/routes.py     # API endpoints
│   ├── core/
│   │   ├── backtester.py     # Backtest engine
│   │   ├── factor_engine.py  # Factor evaluation
│   │   ├── data_loader.py    # Data loading
│   │   └── config.py         # Configuration
│   └── reports/          # Saved reports
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── DataExplorer.jsx    # Data visualization
│   │   │   ├── FactorLab.jsx       # Factor research
│   │   │   └── BacktestReport.jsx  # Report ranking
│   │   ├── components/     # Reusable components
│   │   └── services/       # API service layer
│   └── ...
│
└── data/                 # Market data (feather format)
```

---

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATA_DIR` | Path to market data | `./data` |
| `REPORTS_DIR` | Path to saved reports | `./backend/reports` |
| `LOG_LEVEL` | Logging level | `INFO` |
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:8000/api` |

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [React](https://reactjs.org/) - Frontend library
- [TradingView Lightweight Charts](https://tradingview.github.io/lightweight-charts/) - Professional charting
- [Recharts](https://recharts.org/) - React charting library
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - Code editor

---

<div align="center">
  <p>Made with ❤️ for Quantitative Research</p>
  <p>⭐ Star this repo if you find it helpful!</p>
</div>
