# Factor Expression Guide

## Overview

Open Alpha uses a Python-like expression syntax for defining quantitative factors. All expressions operate on time-series data and return a factor value for each timestamp.

---

## Basic Price Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `close` | Closing price | `close` |
| `open` | Opening price | `open` |
| `high` | High price | `high` |
| `low` | Low price | `low` |
| `volume` | Trading volume | `volume` |

---

## Time-Series Functions

### Delay / Lag
```python
ts_delay(x, n)  # Value of x, n periods ago
```
**Example:** `ts_delay(close, 5)` - Close price 5 periods ago

### Moving Average
```python
ts_mean(x, n)   # n-period simple moving average
```
**Example:** `ts_mean(close, 20)` - 20-period MA

### Standard Deviation
```python
ts_std(x, n)    # n-period rolling standard deviation
```
**Example:** `ts_std(close, 20)` - 20-period volatility

### Rolling Max/Min
```python
ts_max(x, n)    # n-period rolling maximum
ts_min(x, n)    # n-period rolling minimum
```
**Example:** `ts_max(high, 14) - ts_min(low, 14)` - ATR-like range

### Percentile Rank
```python
ts_rank(x, n)   # Percentile rank over n periods (0-1)
```
**Example:** `ts_rank(close, 20)` - Where is current close vs last 20?

### Rolling Correlation
```python
ts_corr(x, y, n)  # n-period rolling correlation
```
**Example:** `ts_corr(close, volume, 20)` - Price-volume correlation

### Rolling Covariance
```python
ts_cov(x, y, n)   # n-period rolling covariance
```

---

## Preprocessing Functions

### Winsorization
```python
winsorize(x)    # Clip extreme values at 1st/99th percentile
```
**Use when:** Factor has outliers that distort analysis

### Standardization
```python
standardize(x)  # Z-score normalization: (x - mean) / std
```
**Use when:** Factor values need to be scale-normalized

---

## Mathematical Operators

| Operator | Description |
|----------|-------------|
| `+` | Addition |
| `-` | Subtraction |
| `*` | Multiplication |
| `/` | Division |
| `**` | Power |

---

## Example Factors

### Momentum Factors

```python
# Simple Price Momentum (20-day return)
close / ts_delay(close, 20) - 1

# Momentum with winsorization
winsorize(close / ts_delay(close, 20) - 1)

# Short-term momentum (5-day)
close / ts_delay(close, 5) - 1
```

### Mean Reversion Factors

```python
# Deviation from 20-day MA
(close - ts_mean(close, 20)) / ts_mean(close, 20)

# Bollinger Band position (-2 to +2 range)
(close - ts_mean(close, 20)) / ts_std(close, 20)
```

### Volatility Factors

```python
# Historical volatility (20-day)
ts_std(close / ts_delay(close, 1) - 1, 20)

# ATR-like range indicator
(ts_max(high, 14) - ts_min(low, 14)) / close

# Normalized volatility
standardize(ts_std(close / ts_delay(close, 1) - 1, 20))
```

### Volume Factors

```python
# Volume momentum
volume / ts_mean(volume, 20)

# Price-volume correlation
ts_corr(close, volume, 20)

# Volume-weighted price change
(close - ts_delay(close, 1)) * volume
```

### Composite Factors

```python
# Momentum + Volatility combo
(close / ts_delay(close, 20) - 1) / ts_std(close / ts_delay(close, 1) - 1, 20)

# Risk-adjusted momentum
winsorize((close / ts_delay(close, 10) - 1) / ts_std(close, 10))
```

---

## Best Practices

1. **Always winsorize** raw momentum factors to reduce outlier impact
2. **Check for division by zero** when using ratios
3. **Use shorter periods (5-20)** for higher frequency signals
4. **Use longer periods (20-60)** for more stable signals
5. **Combine factors** for improved Sharpe ratios

---

## Factor Quality Criteria

A good factor typically has:
- **IC > 0.02** (predictive power)
- **t-statistic > 2** (statistical significance)  
- **Sharpe > 0.5** (risk-adjusted return)
- **Win Rate > 50%** (profitable signals)
- **Monotonic quantile returns** (consistent relationship)
