# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-12-15

### Added
- **Data Explorer**
  - Interactive candlestick charts with zoom/pan (TradingView Lightweight Charts)
  - Multi-symbol and multi-timeframe support
  - Date range filtering
  - Symbol search functionality

- **Factor Laboratory**
  - Monaco-based expression editor with syntax highlighting
  - 50+ built-in time-series functions
  - Interactive help panel with function documentation
  - One-click factor backtesting
  - Example factors library

- **Advanced IC Analysis**
  - Time-Series IC (rolling correlation)
  - Cross-Sectional IC (period-by-period)
  - IC distribution histogram
  - Statistical significance testing (t-stat, p-value)
  - IC positive rate tracking

- **Quantile Layer Testing**
  - Configurable 3/5/10 quantile stratification
  - Per-layer metrics (return, Sharpe, win rate)
  - Monotonicity detection
  - Visual layer comparison

- **Factor Ranking System**
  - Comprehensive 0-100 quality scoring
  - Multi-metric sorting (Score, IC, Sharpe, Win Rate)
  - Validity assessment with detailed reasons
  - Dual view modes (table/grid)
  - Rank badges (🥇🥈🥉)

- **Report Management**
  - Save backtest reports
  - Delete reports
  - Report detail modal with full metrics and charts
  - Factor comparison leaderboard

- **Enterprise Infrastructure**
  - Pydantic-based configuration management
  - Structured logging system
  - Error boundaries for graceful error handling
  - Centralized API service layer
  - Environment variable support

### Technical
- FastAPI backend with automatic API documentation
- React 19 + Vite frontend
- Tailwind CSS styling
- Recharts and Lightweight Charts for visualization
- Feather file format for data storage

---

## [Unreleased]

### Planned
- Multi-asset factor analysis (panel data)
- Real-time data streaming
- User authentication
- Factor expression autocomplete
- Export to CSV/Excel
- Docker deployment
- CI/CD pipeline
