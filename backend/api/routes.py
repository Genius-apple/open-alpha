from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from backend.core.data_loader import DataLoader
from backend.core.factor_engine import FactorEngine
from backend.core.backtester import Backtester, BacktestConfig
import pandas as pd
import numpy as np

router = APIRouter()

# Global instances (naive caching)
# In production, use dependency injection or proper singleton pattern
DATA_DIR = r"c:/Users/25919/Desktop/google量化/data"
loader = DataLoader(DATA_DIR)

class FactorRequest(BaseModel):
    expression: str
    symbol: str = "BTC"
    interval: str = "1d"
    periods: int = 1
    quantile: int = 5

@router.get("/structure")
def get_structure():
    """
    Returns nested structure of available data: {symbol: [intervals]}
    """
    try:
        return loader.get_structure()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/data")
def get_kline_data(symbol: str, interval: str, start: Optional[str] = None, end: Optional[str] = None):
    try:
        df = loader.load_data(symbol, interval, start_date=start, end_date=end)
        
        # Resample to avoid sending too much data if range is huge?
        # For MVP, just limit to last N points if too large, or send all.
        # Let's limit to 1000 candles for performance unless we implement tiling.
        if len(df) > 2000:
             df = df.iloc[-2000:]
             
        data = []
        for idx, row in df.iterrows():
            data.append({
                "time": idx.timestamp(), # UNIX timestamp for charts
                "date": idx.strftime("%Y-%m-%d %H:%M"),
                "open": row["open"],
                "high": row["high"],
                "low": row["low"],
                "close": row["close"],
                "volume": row["volume"]
            })
        return {"symbol": symbol, "interval": interval, "data": data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/evaluate")
def evaluate_factor(req: FactorRequest):
    try:
        # Load Data
        df = loader.load_data(req.symbol, req.interval)
        
        # Calculate Factor
        engine = FactorEngine(df)
        factor = engine.evaluate(req.expression)
        
        # Handle Inf/NaN in factor
        factor = factor.replace([np.inf, -np.inf], np.nan).fillna(0)
        
        # Run Enhanced Backtest
        bt = Backtester(df)
        config = BacktestConfig(periods=req.periods, n_quantiles=req.quantile)
        backtest_result = bt.run_backtest(factor, config=config)
        
        if "error" in backtest_result:
             raise HTTPException(status_code=400, detail=backtest_result["error"])

        # Prepare Price vs Factor chart (Overlay)
        df_merged = pd.DataFrame({"close": df['close'], "factor": factor})
        df_merged = df_merged.iloc[-200:]
        
        price_data = []
        for idx, row in df_merged.iterrows():
            price_data.append({
                "date": idx.strftime("%Y-%m-%d %H:%M"),
                "close": float(row["close"]) if not np.isnan(row["close"]) else 0,
                "factor": float(row["factor"]) if not np.isnan(row["factor"]) else 0
            })

        return {
            "metrics": backtest_result["metrics"],
            "equity_curve": backtest_result["ts_data"],
            "price_data": price_data,
            "ic_histogram": backtest_result.get("ic_histogram", []),
            "cs_ic_data": backtest_result.get("cs_ic_data", []),
            "layer_data": backtest_result.get("layer_data", []),
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))

class WeightConfig(BaseModel):
    expression: str
    weight: float

class StrategyRequest(BaseModel):
    factors: List[WeightConfig]
    symbol: str = "BTC"
    interval: str = "1d"
    periods: int = 1
    quantile: int = 5

@router.post("/combine")
def combine_factors(req: StrategyRequest):
    try:
        df = loader.load_data(req.symbol, req.interval)
        engine = FactorEngine(df)
        
        # Calculate weighted sum of standardized factors
        # F_combo = Sum(w_i * Z(F_i))
        combo_factor = pd.Series(0, index=df.index, dtype=float)
        
        factor_details = []
        
        for item in req.factors:
            try:
                raw_factor = engine.evaluate(item.expression)
                raw_factor = raw_factor.replace([np.inf, -np.inf], np.nan).fillna(0)
                
                # Z-Score Normalization
                mean = raw_factor.mean()
                std = raw_factor.std()
                if std == 0: std = 1
                z_factor = (raw_factor - mean) / std
                
                combo_factor += z_factor * item.weight
                
                # Calculate individual IC for reference
                fwd_ret = df['close'].pct_change().shift(-1)
                ic = raw_factor.corr(fwd_ret)
                
                factor_details.append({
                    "expression": item.expression,
                    "weight": item.weight,
                    "ic": float(ic) if not np.isnan(ic) else 0
                })
                
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Error in factor '{item.expression}': {str(e)}")
        
        # Run Backtest on Composite Factor
        bt = Backtester(df)
        config = BacktestConfig(periods=req.periods, n_quantiles=req.quantile)
        backtest_result = bt.run_backtest(combo_factor, config=config)
        
        if "error" in backtest_result:
             raise HTTPException(status_code=400, detail=backtest_result["error"])

        return {
            "metrics": backtest_result["metrics"],
            "equity_curve": backtest_result["ts_data"],
            "layer_data": backtest_result.get("layer_data", []),
            "factor_details": factor_details,
            "ic_histogram": backtest_result.get("ic_histogram", []),
            "cs_ic_data": backtest_result.get("cs_ic_data", []),
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Report System ---
import json
import uuid
import os
from datetime import datetime

REPORT_DIR = r"c:/Users/25919/Desktop/google量化/backend/reports"
if not os.path.exists(REPORT_DIR):
    os.makedirs(REPORT_DIR)

class SaveReportRequest(BaseModel):
    name: str
    description: Optional[str] = ""
    expression: Optional[str] = None # Added expression support
    result: Dict[str, Any] # The full result object from evaluate

@router.post("/reports")
def save_report(req: SaveReportRequest):
    try:
        report_id = str(uuid.uuid4())
        filename = f"{report_id}.json"
        
        # Custom encoder for Numpy types
        class NpEncoder(json.JSONEncoder):
            def default(self, obj):
                if isinstance(obj, np.integer):
                    return int(obj)
                if isinstance(obj, np.floating):
                    return float(obj)
                if isinstance(obj, np.ndarray):
                    return obj.tolist()
                return super(NpEncoder, self).default(obj)
        
        report_data = {
            "id": report_id,
            "name": req.name,
            "name": req.name,
            "description": req.description,
            "expression": req.expression, # Store expression
            "timestamp": datetime.now().isoformat(),
            "data": req.result
        }
        
        with open(os.path.join(REPORT_DIR, filename), "w") as f:
            json.dump(report_data, f, cls=NpEncoder)
            
        return {"id": report_id, "message": "Report saved"}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/reports")
def list_reports(sort_by: str = "score"):
    """List all reports with ranking support."""
    try:
        reports = []
        if not os.path.exists(REPORT_DIR):
            return {"reports": []}
            
        for f in os.listdir(REPORT_DIR):
            if f.endswith(".json"):
                 with open(os.path.join(REPORT_DIR, f), "r") as r:
                     data = json.load(r)
                     metrics = data["data"].get("metrics", {})
                     reports.append({
                         "id": data["id"],
                         "name": data["name"],
                         "name": data["name"],
                         "description": data["description"],
                         "expression": data.get("expression", ""), # Retrieve expression
                         "timestamp": data["timestamp"],
                         "score": metrics.get("score", 0),
                         "ic_mean": metrics.get("ic_mean", 0),
                         "ic_ir": metrics.get("ic_ir", 0),
                         "sharpe": metrics.get("sharpe", 0),
                         "win_rate": metrics.get("win_rate", 0),
                         "is_valid": metrics.get("is_valid_factor", False),
                     })
        
        # Sort by specified metric
        valid_sort = ["score", "ic_mean", "sharpe", "win_rate", "timestamp"]
        if sort_by not in valid_sort:
            sort_by = "score"
        
        if sort_by == "timestamp":
            reports.sort(key=lambda x: x["timestamp"], reverse=True)
        else:
            reports.sort(key=lambda x: abs(x.get(sort_by, 0)), reverse=True)
        
        # Add rank
        for i, r in enumerate(reports):
            r["rank"] = i + 1
            
        return {"reports": reports}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/reports/{report_id}")
def get_report(report_id: str):
    try:
        filepath = os.path.join(REPORT_DIR, f"{report_id}.json")
        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail="Report not found")
            
        with open(filepath, "r") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/reports/{report_id}")
def delete_report(report_id: str):
    try:
        filepath = os.path.join(REPORT_DIR, f"{report_id}.json")
        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail="Report not found")
        
        os.remove(filepath)
        return {"message": "Report deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/rankings")
def get_factor_rankings(sort_by: str = "score", limit: int = 20):
    """Get factor rankings across all saved reports."""
    try:
        reports = []
        if not os.path.exists(REPORT_DIR):
            return {"rankings": []}
            
        for f in os.listdir(REPORT_DIR):
            if f.endswith(".json"):
                with open(os.path.join(REPORT_DIR, f), "r") as r:
                    data = json.load(r)
                    metrics = data["data"].get("metrics", {})
                    reports.append({
                        "id": data["id"],
                        "name": data["name"],
                        "score": metrics.get("score", 0),
                        "ic_mean": metrics.get("ic_mean", 0),
                        "ic_ir": metrics.get("ic_ir", 0),
                        "sharpe": metrics.get("sharpe", 0),
                        "sortino": metrics.get("sortino", 0),
                        "win_rate": metrics.get("win_rate", 0),
                        "max_drawdown": metrics.get("max_drawdown", 0),
                        "is_valid": metrics.get("is_valid_factor", False),
                        "timestamp": data["timestamp"],
                    })
        
        # Sort
        valid_sort = ["score", "ic_mean", "sharpe", "win_rate", "sortino"]
        if sort_by not in valid_sort:
            sort_by = "score"
        
        reports.sort(key=lambda x: abs(x.get(sort_by, 0)), reverse=True)
        
        # Add ranks and limit
        rankings = []
        for i, r in enumerate(reports[:limit]):
            r["rank"] = i + 1
            rankings.append(r)
            
        return {"rankings": rankings, "total": len(reports)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))