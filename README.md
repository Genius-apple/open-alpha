<div align="center">
  <br />
  <h1 style="font-size: 3rem; font-weight: 900;">🚀 Open Alpha</h1>
  <p style="font-size: 1.2rem;"><strong>The Enterprise-Grade Quantitative Research Platform</strong></p>
  <p><i>From Hypothesis to Alpha — Build, Backtest, and Deploy Institutional-Quality Strategies.</i></p>

  <p>
    <a href="#features">Features</a> •
    <a href="#quick-start">Quick Start</a> •
    <a href="#documentation">Documentation</a> •
    <a href="#contributing">Contributing</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Status-Production%20Ready-success?style=flat-square" alt="Status">
    <img src="https://img.shields.io/badge/Python-3.9+-blue?style=flat-square" alt="Python">
    <img src="https://img.shields.io/badge/React-18+-61DAFB?style=flat-square" alt="React">
    <img src="https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square" alt="FastAPI">
    <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License">
  </p>
</div>

---

**Open Alpha** is a high-performance, open-source quantitative research platform designed for serious algorithmic traders and researchers. Built on a robust **FastAPI** backend and a modern **React** frontend, it bridges the gap between ad-hoc analysis scripts and institutional-grade factor libraries. Whether you are mining new alpha signals, analyzing factor decay, or constructing multi-factor portfolios, Open Alpha provides the rigorously tested tools you need.

## ✨ Why Open Alpha?

*   **⚡ Velocity**: Go from *idea* to *statistically valid factor* in seconds, not hours.
*   **🛡️ Robustness**: Industry-standard metrics (IC, ICIR, Turnover) prevent overfitting and false discoveries.
*   **🧠 Intelligence**: Advanced expression engine supports complex time-series logic (`ts_rank`, `ts_corr`, `winsorize`).
*   **🔌 Extensibility**: Clean architecture allows easy integration of custom data sources and execution engines.

---

## 💎 Features

### 🧠 **Strategy Builder (New!)**
*   **Multi-Factor Combination**: Combine alpha signals with adjustable weights.
*   **Smart Normalization**: Automatic **Z-score standardization** ensures apples-to-apples factor combination.
*   **Strategy Persistence**: Save and load your winning strategies; build a library of proven alphas.

### 🧪 **Factor Laboratory**
*   **Expression Engine**: Powerful Python-like syntax for factor construction (e.g., `rank(close) / ts_delay(open, 5)`).
*   **Institutional Metrics**:
    *   **Alpha Quality**: IC Mean, **ICIR** (Information Ratio), t-statistic.
    *   **Stability**: **Factor Autocorrelation**, turnover analysis.
    *   **Risk**: Sharpe, Sortino, Max Drawdown.
*   **Deep Visualization**: Interactive charts for **Cumulative IC**, Equity Curves, and Layered Quantile Returns.

### 📊 **Data Explorer**
*   **Professional Charting**: TradingView-style interactive charts (Lightweight Charts) with multi-timeframe support.
*   **Instant Analysis**: Browse terabytes of market data with zero latency.

### 🏆 **Factor Ranking**
*   **Leaderboard**: Automatically score and rank factors based on a proprietary quality model (0-100).
*   **Validity Checks**: Automatic detection of "fake alpha" via monotonicity and statistical significance tests.

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
