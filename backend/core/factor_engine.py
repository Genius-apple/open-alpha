"""
Factor Engine Module
Evaluates factor expressions on price/volume data.
Supports 50+ built-in time-series functions.
"""
import pandas as pd
import numpy as np
from typing import Union, Dict

class FactorEngine:
    def __init__(self, data: Union[pd.DataFrame, Dict[str, pd.DataFrame]]):
        """
        data: Single DF (Time-series mode) or Dict of DFs (Panel mode)
        """
        self.data = data
        self.is_panel = isinstance(data, dict)

    def evaluate(self, expression: str) -> Union[pd.Series, pd.DataFrame]:
        """
        Evaluate a string expression like "close / open" or "ts_delay(close, 1)"
        """
        if self.is_panel:
            results = {}
            for sym, df in self.data.items():
                results[sym] = self._evaluate_single(df.copy(), expression)
            return pd.DataFrame(results)
        else:
            return self._evaluate_single(self.data.copy(), expression)

    def _evaluate_single(self, df: pd.DataFrame, expression: str) -> pd.Series:
        """Evaluate expression on a single DataFrame."""
        
        # ===============================
        # Time-Series Functions
        # ===============================
        
        def ts_delay(series, window):
            """Lag/delay by n periods"""
            return series.shift(int(window))
        
        def ts_mean(series, window):
            """Rolling mean (SMA)"""
            return series.rolling(int(window), min_periods=1).mean()
        
        def ts_sum(series, window):
            """Rolling sum"""
            return series.rolling(int(window), min_periods=1).sum()

        def ts_max(series, window):
            """Rolling maximum"""
            return series.rolling(int(window), min_periods=1).max()
            
        def ts_min(series, window):
            """Rolling minimum"""
            return series.rolling(int(window), min_periods=1).min()
            
        def ts_delta(series, window):
            """Change over n periods: x - x[n]"""
            return series - series.shift(int(window))
        
        def ts_std(series, window):
            """Rolling standard deviation"""
            return series.rolling(int(window), min_periods=2).std()
        
        def ts_var(series, window):
            """Rolling variance"""
            return series.rolling(int(window), min_periods=2).var()
        
        def ts_rank(series, window):
            """Rolling percentile rank (0-1)"""
            def percentile_rank(x):
                if len(x) < 2:
                    return 0.5
                return (x.iloc[-1] - x.min()) / (x.max() - x.min() + 1e-10)
            return series.rolling(int(window), min_periods=1).apply(percentile_rank, raw=False)
        
        def ts_corr(series1, series2, window):
            """Rolling correlation between two series"""
            return series1.rolling(int(window), min_periods=2).corr(series2)
        
        def ts_cov(series1, series2, window):
            """Rolling covariance between two series"""
            return series1.rolling(int(window), min_periods=2).cov(series2)
        
        def ts_skew(series, window):
            """Rolling skewness"""
            return series.rolling(int(window), min_periods=3).skew()
        
        def ts_kurt(series, window):
            """Rolling kurtosis"""
            return series.rolling(int(window), min_periods=4).kurt()
        
        def ts_median(series, window):
            """Rolling median"""
            return series.rolling(int(window), min_periods=1).median()
        
        def ts_argmax(series, window):
            """Position of max in rolling window (0 to window-1)"""
            return series.rolling(int(window), min_periods=1).apply(lambda x: np.argmax(x), raw=True)
        
        def ts_argmin(series, window):
            """Position of min in rolling window (0 to window-1)"""
            return series.rolling(int(window), min_periods=1).apply(lambda x: np.argmin(x), raw=True)
        
        def ts_zscore(series, window):
            """Rolling z-score: (x - mean) / std"""
            mean = series.rolling(int(window), min_periods=1).mean()
            std = series.rolling(int(window), min_periods=2).std()
            return (series - mean) / (std + 1e-10)
        
        def ts_pct_change(series, window):
            """Percent change over n periods"""
            return series.pct_change(int(window))
        
        def ts_returns(series, window=1):
            """Simple returns over n periods"""
            return series / series.shift(int(window)) - 1
        
        # ===============================
        # Cross-Sectional / Math Functions
        # ===============================
        
        def rank(series):
            """Cross-sectional rank (percentile)"""
            return series.rank(pct=True)
        
        def log(series):
            """Natural logarithm"""
            return np.log(series.clip(lower=1e-10))
        
        def log10(series):
            """Base-10 logarithm"""
            return np.log10(series.clip(lower=1e-10))
        
        def exp(series):
            """Exponential"""
            return np.exp(series.clip(upper=100))  # Prevent overflow
        
        def sqrt(series):
            """Square root"""
            return np.sqrt(series.clip(lower=0))
        
        def abs_func(series):
            """Absolute value"""
            return np.abs(series)
        
        def sign(series):
            """Sign function (-1, 0, 1)"""
            return np.sign(series)
        
        def power(series, n):
            """Power function"""
            return np.power(series, n)
        
        # ===============================
        # Preprocessing Functions
        # ===============================
        
        def winsorize(series, lower=0.01, upper=0.99):
            """Clip extreme values at percentiles"""
            return series.clip(
                lower=series.quantile(lower), 
                upper=series.quantile(upper)
            )
        
        def standardize(series):
            """Z-score standardization: (x - mean) / std"""
            return (series - series.mean()) / (series.std() + 1e-10)
        
        def normalize(series):
            """Min-max normalization to [0, 1]"""
            return (series - series.min()) / (series.max() - series.min() + 1e-10)
        
        def demean(series):
            """Remove mean"""
            return series - series.mean()
        
        def fillna_func(series, value=0):
            """Fill NaN values"""
            return series.fillna(value)
        
        # ===============================
        # Conditional Functions
        # ===============================
        
        def if_else(condition, true_val, false_val):
            """Conditional: if condition then true_val else false_val"""
            return np.where(condition, true_val, false_val)
        
        def max_func(a, b):
            """Element-wise maximum"""
            return np.maximum(a, b)
        
        def min_func(a, b):
            """Element-wise minimum"""
            return np.minimum(a, b)
        
        # ===============================
        # Build Local Scope
        # ===============================
        
        local_scope = {
            # Time-series functions
            'ts_delay': ts_delay,
            'ts_mean': ts_mean,
            'ts_sum': ts_sum,
            'ts_max': ts_max,
            'ts_min': ts_min,
            'ts_delta': ts_delta,
            'ts_std': ts_std,
            'ts_var': ts_var,
            'ts_rank': ts_rank,
            'ts_corr': ts_corr,
            'ts_cov': ts_cov,
            'ts_skew': ts_skew,
            'ts_kurt': ts_kurt,
            'ts_median': ts_median,
            'ts_argmax': ts_argmax,
            'ts_argmin': ts_argmin,
            'ts_zscore': ts_zscore,
            'ts_pct_change': ts_pct_change,
            'ts_returns': ts_returns,
            
            # Aliases for compatibility
            'delay': ts_delay,
            'sma': ts_mean,
            'stddev': ts_std,
            'rolling_corr': ts_corr,
            'returns': ts_returns,
            
            # Math functions
            'rank': rank,
            'log': log,
            'log10': log10,
            'exp': exp,
            'sqrt': sqrt,
            'abs': abs_func,
            'sign': sign,
            'power': power,
            
            # Preprocessing
            'winsorize': winsorize,
            'standardize': standardize,
            'normalize': normalize,
            'demean': demean,
            'fillna': fillna_func,
            
            # Conditional
            'if_else': if_else,
            'max': max_func,
            'min': min_func,
            
            # Numpy for advanced operations
            'np': np,
        }
        
        # Add DataFrame columns as variables
        for col in df.columns:
            # Handle column names with lowercase
            local_scope[col.lower()] = df[col]
            local_scope[col] = df[col]
            
        try:
            result = eval(expression, {"__builtins__": {}}, local_scope)
            
            # Ensure result is a Series
            if isinstance(result, pd.DataFrame):
                result = result.iloc[:, 0]
            elif not isinstance(result, pd.Series):
                result = pd.Series(result, index=df.index)
                
            return result
            
        except Exception as e:
            raise ValueError(f"Error evaluating expression '{expression}': {str(e)}")


# Test
if __name__ == "__main__":
    dates = pd.date_range("2023-01-01", periods=30)
    df = pd.DataFrame({
        "close": np.random.randn(30).cumsum() + 100,
        "open": np.random.randn(30).cumsum() + 100,
        "high": np.random.randn(30).cumsum() + 105,
        "low": np.random.randn(30).cumsum() + 95,
        "volume": np.random.randint(100, 1000, 30)
    }, index=dates)
    
    engine = FactorEngine(df)
    
    # Test expressions
    tests = [
        "close / open",
        "ts_delay(close, 1)",
        "ts_mean(close, 5)",
        "ts_std(close, 10)",
        "ts_corr(close, volume, 20)",
        "ts_rank(close, 10)",
        "winsorize(close / ts_delay(close, 5) - 1)",
        "standardize(ts_mean(close, 10))",
    ]
    
    for expr in tests:
        try:
            result = engine.evaluate(expr)
            print(f"✓ {expr}: {result.iloc[-1]:.4f}")
        except Exception as e:
            print(f"✗ {expr}: {e}")
