# Open Alpha API Reference

## Base URL
```
http://localhost:8000/api
```

## Authentication
Currently no authentication required (local development).

---

## Endpoints

### Data

#### GET /structure
Get available data structure (symbols and intervals).

**Response:**
```json
{
  "BTC": ["1h", "4h", "1d"],
  "ETH": ["1h", "4h", "1d"],
  ...
}
```

#### GET /data
Get OHLCV data for a symbol.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| symbol | string | Yes | Symbol name (e.g., "BTC") |
| interval | string | Yes | Time interval (e.g., "1d") |
| start | string | No | Start date (YYYY-MM-DD) |
| end | string | No | End date (YYYY-MM-DD) |

**Response:**
```json
{
  "symbol": "BTC",
  "interval": "1d",
  "data": [
    {"time": 1703980800, "open": 43000, "high": 44000, "low": 42500, "close": 43800, "volume": 1234567}
  ]
}
```

---

### Factor Evaluation

#### POST /evaluate
Evaluate a factor expression and run backtest.

**Request Body:**
```json
{
  "expression": "close / ts_delay(close, 20) - 1",
  "symbol": "BTC",
  "interval": "1d",
  "periods": 1,
  "quantile": 5
}
```

**Response:**
```json
{
  "metrics": {
    "ic_mean": 0.0345,
    "ic_ir": 1.23,
    "sharpe": 1.45,
    "win_rate": 0.56,
    "score": 72,
    "is_valid_factor": true,
    "validity_reason": "因子通过所有有效性检验 ✓"
  },
  "equity_curve": [...],
  "price_data": [...],
  "ic_histogram": [...],
  "cs_ic_data": [...],
  "layer_data": [...]
}
```

---

### Reports

#### GET /reports
List all saved reports.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| sort_by | string | "score" | Sort field: score, ic_mean, sharpe, win_rate, timestamp |

**Response:**
```json
{
  "reports": [
    {
      "id": "abc123",
      "name": "Momentum Factor",
      "rank": 1,
      "score": 85,
      "ic_mean": 0.045,
      "sharpe": 1.8,
      "is_valid": true
    }
  ]
}
```

#### POST /reports
Save a new report.

**Request Body:**
```json
{
  "name": "My Factor",
  "description": "BTC 1D momentum",
  "result": { ... }
}
```

#### GET /reports/{report_id}
Get a specific report by ID.

#### DELETE /reports/{report_id}
Delete a report.

---

### Rankings

#### GET /rankings
Get factor rankings across all saved reports.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| sort_by | string | "score" | Sort field |
| limit | int | 20 | Maximum results |

**Response:**
```json
{
  "rankings": [
    {"rank": 1, "name": "Factor A", "score": 92, ...}
  ],
  "total": 15
}
```

---

## Interactive Documentation

Visit `http://localhost:8000/docs` for Swagger UI with interactive API testing.
