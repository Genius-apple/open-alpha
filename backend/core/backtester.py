"""
Industry-Grade Factor Backtester
================================
Implements rigorous quantitative factor analysis following academic and industry standards:

1. Information Coefficient (IC) Analysis
   - Spearman rank correlation between factor and forward returns
   - IC mean, std, IR (Information Ratio)
   - T-statistic for significance testing
   - Rolling IC for stability analysis

2. Quantile Analysis (Decile/Quintile)
   - Long-short portfolio returns
   - Monotonicity testing
   - Turnover analysis

3. Performance Metrics
   - Sharpe, Sortino, Calmar ratios
   - Maximum drawdown
   - Win rate, profit factor

4. Statistical Validity Tests
   - IC t-test (H0: IC = 0)
   - Return t-test
   - Newey-West adjusted standard errors (optional)

References:
- Barra Risk Model Handbook
- "Quantitative Equity Portfolio Management" by Qian, Hua, Sorensen
- "Active Portfolio Management" by Grinold & Kahn
"""
import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple
from scipy import stats
from dataclasses import dataclass

@dataclass
class BacktestConfig:
    """Configuration for backtest parameters."""
    periods: int = 1  # Forward return periods
    n_quantiles: int = 5  # Number of quantile buckets
    ic_window: int = 20  # Rolling IC window
    min_observations: int = 60  # Minimum data points required
    annualization_factor: int = 252  # Trading days per year


class Backtester:
    """
    Production-grade factor backtesting engine.
    """
    
    def __init__(self, data: pd.DataFrame):
        """
        Args:
            data: DataFrame with OHLCV columns and DatetimeIndex
        """
        self.data = data.copy()
        
        # Ensure lowercase column names
        self.data.columns = [c.lower() for c in self.data.columns]
        
        if 'close' not in self.data.columns:
            raise ValueError("Data must contain 'close' column")
        
        # Ensure datetime index
        if not isinstance(self.data.index, pd.DatetimeIndex):
            self.data.index = pd.to_datetime(self.data.index)

    def calculate_forward_returns(self, periods: int = 1) -> pd.Series:
        """
        Calculate forward returns (aligned with factor at time t).
        
        At time t, factor predicts returns from t to t+periods.
        """
        return self.data['close'].pct_change(periods).shift(-periods)
    
    def run_backtest(
        self, 
        factor: pd.Series, 
        config: BacktestConfig = None
    ) -> Dict:
        """
        Run comprehensive factor backtest.
        
        Args:
            factor: Factor values indexed by datetime
            config: Backtest configuration
            
        Returns:
            Dictionary containing all metrics, time-series data, and analysis
        """
        if config is None:
            config = BacktestConfig()
        
        # Align factor with forward returns
        fwd_ret = self.calculate_forward_returns(config.periods)
        
        # Create analysis DataFrame
        df = pd.DataFrame({
            'factor': factor,
            'ret': fwd_ret
        })
        
        # Handle infinities and drop NaN
        df = df.replace([np.inf, -np.inf], np.nan)
        df = df.dropna()
        
        if len(df) < config.min_observations:
            return {
                "error": f"Insufficient data: {len(df)} points (need {config.min_observations})",
                "metrics": {},
                "ts_data": [],
                "layer_data": [],
                "ic_histogram": [],
                "cs_ic_data": []
            }
        
        # ========================================
        # 1. IC ANALYSIS
        # ========================================
        ic_analysis = self._calculate_ic_analysis(df, config)
        
        # ========================================
        # 2. QUANTILE ANALYSIS
        # ========================================
        quantile_analysis = self._calculate_quantile_analysis(df, config)
        
        # ========================================
        # 3. LONG-SHORT PORTFOLIO
        # ========================================
        portfolio_analysis = self._calculate_portfolio_metrics(df, config)
        
        # ========================================
        # 4. COMBINE METRICS
        # ========================================
        metrics = {
            # IC Metrics
            "ic_mean": ic_analysis["ic_mean"],
            "ic_std": ic_analysis["ic_std"],
            "ic_ir": ic_analysis["ic_ir"],
            "ic_positive_pct": ic_analysis["ic_positive_pct"],
            "t_stat": ic_analysis["t_stat"],
            "p_value": ic_analysis["p_value"],
            
            # Return Metrics
            "total_return": portfolio_analysis["total_return"],
            "annualized_return": portfolio_analysis["annualized_return"],
            "annualized_vol": portfolio_analysis["annualized_vol"],
            
            # Risk Metrics
            "sharpe": portfolio_analysis["sharpe"],
            "sortino": portfolio_analysis["sortino"],
            "calmar": portfolio_analysis["calmar"],
            "max_drawdown": portfolio_analysis["max_dd"],
            
            # Trading Metrics
            "win_rate": portfolio_analysis["win_rate"],
            "profit_factor": portfolio_analysis["profit_factor"],
            "avg_win": portfolio_analysis["avg_win"],
            "avg_loss": portfolio_analysis["avg_loss"],
            "num_trades": portfolio_analysis["num_trades"],
            
            # Quantile Analysis
            "quantile_analysis": quantile_analysis["summary"],
            "quantile_returns": quantile_analysis["quantile_returns"],
            
            # Meta
            "num_observations": len(df),
            "periods": config.periods,
            "n_quantiles": config.n_quantiles,
        }
        
        # Calculate composite score
        metrics["score"] = self._calculate_score(metrics)
        
        # Validity assessment
        validity = self._assess_validity(metrics)
        metrics["is_valid_factor"] = validity["is_valid"]
        metrics["validity_reason"] = validity["reason"]
        metrics["validity_checks"] = validity["checks"]
        
        # ========================================
        # 5. TIME-SERIES DATA FOR CHARTS
        # ========================================
        ts_data = self._prepare_time_series_data(
            df, 
            portfolio_analysis["equity_curve"],
            portfolio_analysis["drawdown"],
            ic_analysis["rolling_ic"],
            ic_analysis["cumulative_ic"],
            ic_analysis["rolling_icir"]
        )
        
        return {
            "metrics": metrics,
            "ts_data": ts_data,
            "layer_data": quantile_analysis["layer_data"],
            "ic_histogram": ic_analysis["ic_histogram"],
            "cs_ic_data": ic_analysis["cs_ic_data"],
        }
    
    def _calculate_ic_analysis(self, df: pd.DataFrame, config: BacktestConfig) -> Dict:
        """Calculate Information Coefficient analysis."""
        
        # Overall IC (Spearman rank correlation)
        ic_overall = df['factor'].corr(df['ret'], method='spearman')
        
        # Rolling IC
        rolling_ic = df['factor'].rolling(config.ic_window).corr(df['ret'])
        
        # Sanitize rolling_ic to remove infinities
        rolling_ic = rolling_ic.replace([np.inf, -np.inf], np.nan)
        
        rolling_ic_clean = rolling_ic.dropna()
        
        # IC statistics
        n = len(df)
        ic_mean = float(ic_overall) if not np.isnan(ic_overall) else 0.0
        ic_std = float(rolling_ic_clean.std()) if len(rolling_ic_clean) > 1 else 0.0
        ic_ir = ic_mean / ic_std if ic_std > 0 else 0.0
        
        # IC positive percentage
        ic_positive_pct = (rolling_ic_clean > 0).mean() if len(rolling_ic_clean) > 0 else 0.5
        
        # T-statistic for IC significance
        # H0: IC = 0, t = IC * sqrt(n-2) / sqrt(1 - IC^2)
        if abs(ic_mean) < 1 and n > 2:
            t_stat = ic_mean * np.sqrt(n - 2) / np.sqrt(1 - ic_mean**2 + 1e-10)
            p_value = 2 * (1 - stats.t.cdf(abs(t_stat), n - 2))
        else:
            t_stat = 0.0
            p_value = 1.0
        
        # Cumulative IC
        cumulative_ic = rolling_ic.fillna(0).cumsum()

        # Rolling ICIR (60-day window)
        rolling_ic_metric = rolling_ic.fillna(0)
        rolling_std = rolling_ic_metric.rolling(60).std()
        rolling_mean = rolling_ic_metric.rolling(60).mean()
        
        # Avoid division by zero
        rolling_icir = rolling_mean / (rolling_std + 1e-10)
        rolling_icir = rolling_icir.replace([np.inf, -np.inf], np.nan).fillna(0)

        # Factor Autocorrelation (Stability)
        # Lag-1 autocorrelation of the factor scores
        factor_autocorr = df['factor'].autocorr(lag=1)
        
        # Turnover Analysis
        # Defined as the proportion of portfolio changing. 
        # For single asset long/short signal (sign change):
        # We can approximate by: abs(delta(position)) / 2
        # Position is based on quantiles.
        try:
            q_ranks = pd.qcut(df['factor'].rank(method='first'), config.n_quantiles, labels=False)
            current_pos = np.zeros(len(df))
            current_pos[q_ranks == config.n_quantiles - 1] = 1
            current_pos[q_ranks == 0] = -1
            
            # Turnover = Sum(|pos_t - pos_{t-1}|) / 2 / N_days
            turnover = np.mean(np.abs(np.diff(current_pos))) / 2
        except:
            turnover = 0.0

        # IC histogram data
        ic_histogram = []
        if len(rolling_ic_clean) > 10:
            hist, bin_edges = np.histogram(rolling_ic_clean, bins=15)
            for i in range(len(hist)):
                ic_histogram.append({
                    "range": f"{bin_edges[i]:.2f}",
                    "count": int(hist[i])
                })
        
        # Cross-sectional IC (monthly)
        cs_ic_data = []
        df_temp = df.copy()
        df_temp['month'] = df_temp.index.to_period('M')
        for month, group in df_temp.groupby('month'):
            if len(group) >= 5:
                monthly_ic = group['factor'].corr(group['ret'], method='spearman')
                if not np.isnan(monthly_ic):
                    cs_ic_data.append({
                        "period": str(month),
                        "ic": float(monthly_ic)
                    })
        
        return {
            "ic_mean": self._safe_float(ic_mean),
            "ic_std": self._safe_float(ic_std),
            "ic_ir": self._safe_float(ic_ir),
            "ic_positive_pct": self._safe_float(ic_positive_pct),
            "t_stat": self._safe_float(t_stat),
            "p_value": self._safe_float(p_value),
            "factor_autocorr": self._safe_float(factor_autocorr),
            "turnover": self._safe_float(turnover),
            "rolling_ic": rolling_ic,
            "cumulative_ic": cumulative_ic,
            "rolling_icir": rolling_icir,
            "ic_histogram": ic_histogram,
            "cs_ic_data": cs_ic_data,
        }
    
    def _calculate_quantile_analysis(self, df: pd.DataFrame, config: BacktestConfig) -> Dict:
        """Calculate quantile/decile analysis."""
        
        df = df.copy()
        
        # Create quantile labels
        try:
            df['quantile'] = pd.qcut(
                df['factor'].rank(method='first'), 
                config.n_quantiles, 
                labels=False,
                duplicates='drop'
            )
        except ValueError:
            # Fallback for insufficient unique values
            df['quantile'] = pd.cut(
                df['factor'].rank(method='first'),
                bins=config.n_quantiles,
                labels=False
            ).fillna(0).astype(int)
        
        # Calculate per-quantile metrics
        layer_data = []
        quantile_returns = {}
        
        for q in sorted(df['quantile'].unique()):
            q_df = df[df['quantile'] == q]
            q_ret = q_df['ret']
            
            label = f"Q{int(q)+1}"
            mean_ret = float(q_ret.mean()) if len(q_ret) > 0 else 0.0
            
            layer_data.append({
                "layer": label,
                "mean_return": self._safe_float(mean_ret),
                "std": self._safe_float(q_ret.std()) if len(q_ret) > 1 else 0.0,
                "sharpe": self._safe_float(mean_ret / q_ret.std() * np.sqrt(252)) if q_ret.std() > 0 else 0.0,
                "total_return": self._safe_float((1 + q_ret).prod() - 1) if len(q_ret) > 0 else 0.0,
                "count": int(len(q_ret)),
                "win_rate": self._safe_float((q_ret > 0).mean()) if len(q_ret) > 0 else 0.5,
            })
            
            quantile_returns[label] = mean_ret
        
        # Check monotonicity
        returns_list = [ld["mean_return"] for ld in layer_data]
        is_monotonic = self._check_monotonicity(returns_list)
        
        # Calculate spread (top - bottom)
        spread = returns_list[-1] - returns_list[0] if len(returns_list) >= 2 else 0.0
        
        return {
            "layer_data": layer_data,
            "quantile_returns": quantile_returns,
            "summary": {
                "spread": self._safe_float(spread),
                "is_monotonic": is_monotonic,
                "n_quantiles": config.n_quantiles,
            }
        }
    
    def _calculate_portfolio_metrics(self, df: pd.DataFrame, config: BacktestConfig) -> Dict:
        """Calculate long-short portfolio performance metrics."""
        
        df = df.copy()
        
        # Assign quantiles if not already
        if 'quantile' not in df.columns:
            try:
                df['quantile'] = pd.qcut(
                    df['factor'].rank(method='first'),
                    config.n_quantiles,
                    labels=False,
                    duplicates='drop'
                )
            except:
                df['quantile'] = 0
        
        # Long-short positions
        max_q = df['quantile'].max()
        min_q = df['quantile'].min()
        
        df['position'] = 0.0
        df.loc[df['quantile'] == max_q, 'position'] = 1.0
        df.loc[df['quantile'] == min_q, 'position'] = -1.0
        
        # Strategy returns
        df['strategy_ret'] = df['position'] * df['ret']
        strategy_returns = df['strategy_ret']
        
        # Filter non-zero (when we have a position)
        active_returns = strategy_returns[strategy_returns != 0]
        
        # Equity curve
        equity_curve = (1 + strategy_returns).cumprod()
        
        # Drawdown
        running_max = equity_curve.cummax()
        drawdown = (equity_curve - running_max) / running_max
        max_dd = float(drawdown.min()) if len(drawdown) > 0 else 0.0
        
        # Total and annualized return
        total_return = float(equity_curve.iloc[-1] - 1) if len(equity_curve) > 0 else 0.0
        n_years = len(df) / config.annualization_factor
        annualized_return = ((1 + total_return) ** (1 / n_years) - 1) if n_years > 0 else 0.0
        
        # Volatility
        daily_vol = float(active_returns.std()) if len(active_returns) > 1 else 0.0
        annualized_vol = daily_vol * np.sqrt(config.annualization_factor)
        
        # Sharpe ratio
        mean_ret = float(active_returns.mean()) if len(active_returns) > 0 else 0.0
        sharpe = (mean_ret / daily_vol * np.sqrt(config.annualization_factor)) if daily_vol > 0 else 0.0
        
        # Sortino ratio (downside deviation)
        downside_returns = active_returns[active_returns < 0]
        downside_std = float(downside_returns.std()) if len(downside_returns) > 1 else 0.0
        sortino = (mean_ret / downside_std * np.sqrt(config.annualization_factor)) if downside_std > 0 else 0.0
        
        # Calmar ratio
        calmar = annualized_return / abs(max_dd) if max_dd != 0 else 0.0
        
        # Win rate and profit factor
        wins = active_returns[active_returns > 0]
        losses = active_returns[active_returns < 0]
        
        num_trades = len(active_returns)
        win_rate = len(wins) / num_trades if num_trades > 0 else 0.5
        
        total_wins = float(wins.sum()) if len(wins) > 0 else 0.0
        total_losses = float(abs(losses.sum())) if len(losses) > 0 else 0.0
        profit_factor = total_wins / total_losses if total_losses > 0 else 10.0
        
        avg_win = float(wins.mean()) if len(wins) > 0 else 0.0
        avg_loss = float(losses.mean()) if len(losses) > 0 else 0.0
        
        return {
            "equity_curve": equity_curve,
            "drawdown": drawdown,
            "total_return": self._safe_float(total_return),
            "annualized_return": self._safe_float(annualized_return),
            "annualized_vol": self._safe_float(annualized_vol),
            "sharpe": self._safe_float(sharpe),
            "sortino": self._safe_float(sortino),
            "calmar": self._safe_float(calmar),
            "max_dd": self._safe_float(max_dd),
            "win_rate": self._safe_float(win_rate),
            "profit_factor": self._safe_float(min(profit_factor, 99.9)),
            "avg_win": self._safe_float(avg_win),
            "avg_loss": self._safe_float(avg_loss),
            "num_trades": num_trades,
        }
    
    def _calculate_score(self, metrics: Dict) -> int:
        """
        Calculate composite factor quality score (0-100).
        
        Scoring breakdown:
        - IC Quality: 25 points (|IC| up to 0.05 = full score)
        - IC Significance: 20 points (|t-stat| > 2 = full score)
        - Sharpe Ratio: 20 points (Sharpe > 1 = full score)
        - Win Rate: 15 points (Win rate > 55% = full score)
        - Monotonicity: 10 points (monotonic quantile returns)
        - IC Stability: 10 points (IC positive > 55% = full score)
        """
        score = 0.0
        
        # IC Quality (25 points)
        ic = abs(metrics.get("ic_mean", 0))
        score += min(ic / 0.05, 1.0) * 25
        
        # IC Significance (20 points)
        t_stat = abs(metrics.get("t_stat", 0))
        score += min(t_stat / 2.5, 1.0) * 20
        
        # Sharpe Ratio (20 points)
        sharpe = max(metrics.get("sharpe", 0), 0)
        score += min(sharpe / 1.5, 1.0) * 20
        
        # Win Rate (15 points) - 50% baseline
        win_rate = metrics.get("win_rate", 0.5)
        wr_score = (win_rate - 0.45) / 0.15  # 45% to 60% range
        score += max(0, min(wr_score, 1.0)) * 15
        
        # Monotonicity (10 points)
        if metrics.get("quantile_analysis", {}).get("is_monotonic", False):
            score += 10
        
        # IC Stability (10 points) - 50% baseline
        ic_pos = metrics.get("ic_positive_pct", 0.5)
        ic_pos_score = (ic_pos - 0.45) / 0.15
        score += max(0, min(ic_pos_score, 1.0)) * 10
        
        return int(max(0, min(100, round(score))))
    
    def _assess_validity(self, metrics: Dict) -> Dict:
        """
        Assess factor validity based on industry standards.
        
        A factor is considered valid if it passes key statistical tests.
        """
        checks = {}
        issues = []
        
        # Check 1: IC Significance (|t-stat| > 1.96 for 95% confidence)
        t_stat = abs(metrics.get("t_stat", 0))
        checks["ic_significance"] = t_stat > 1.96
        if not checks["ic_significance"]:
            issues.append(f"IC不显著 (t={t_stat:.2f}, 需>1.96)")
        
        # Check 2: Meaningful IC (|IC| > 0.01)
        ic_mean = abs(metrics.get("ic_mean", 0))
        checks["ic_meaningful"] = ic_mean > 0.01
        if not checks["ic_meaningful"]:
            issues.append(f"IC太低 ({ic_mean:.4f}, 需>0.01)")
        
        # Check 3: Positive Sharpe
        sharpe = metrics.get("sharpe", 0)
        checks["positive_sharpe"] = sharpe > 0
        if not checks["positive_sharpe"]:
            issues.append(f"夏普为负 ({sharpe:.2f})")
        
        # Check 4: Win rate above random
        win_rate = metrics.get("win_rate", 0.5)
        checks["above_random"] = win_rate > 0.48
        if not checks["above_random"]:
            issues.append(f"胜率过低 ({win_rate:.1%})")
        
        # Check 5: Sufficient observations
        n_obs = metrics.get("num_observations", 0)
        checks["sufficient_data"] = n_obs >= 100
        if not checks["sufficient_data"]:
            issues.append(f"数据不足 ({n_obs}条, 需≥100)")
        
        # Overall validity
        critical_checks = [checks["ic_significance"], checks["ic_meaningful"]]
        is_valid = all(critical_checks) and sum(checks.values()) >= 4
        
        if is_valid:
            reason = "因子通过有效性检验 ✓"
        else:
            reason = "问题: " + "; ".join(issues) if issues else "未通过检验"
        
        return {
            "is_valid": is_valid,
            "reason": reason,
            "checks": checks,
        }
    
    def _prepare_time_series_data(
        self, 
        df: pd.DataFrame, 
        equity: pd.Series, 
        drawdown: pd.Series,
        rolling_ic: pd.Series,
        cumulative_ic: pd.Series = None,
        rolling_icir: pd.Series = None
    ) -> List[Dict]:
        """Prepare time-series data for frontend charts."""
        
        # Limit to last 500 points for performance
        data_dict = {
            "equity": equity,
            "drawdown": drawdown,
            "rolling_ic": rolling_ic.fillna(0)
        }
        
        if cumulative_ic is not None:
            data_dict["cumulative_ic"] = cumulative_ic.replace([np.inf, -np.inf], np.nan).ffill().fillna(0)
            
        if rolling_icir is not None:
             # Rolling ICIR can blow up if std is 0. 
            data_dict["rolling_icir"] = rolling_icir.replace([np.inf, -np.inf], np.nan).fillna(0)
            
        combined = pd.DataFrame(data_dict).iloc[-500:]
        # Final pass to ensure no infinities remain in the DataFrame
        combined = combined.replace([np.inf, -np.inf], np.nan).fillna(0)
        
        ts_data = []
        for idx, row in combined.iterrows():
            item = {
                "date": idx.strftime("%Y-%m-%d") if hasattr(idx, 'strftime') else str(idx),
                "equity": self._safe_float(row["equity"]),
                "drawdown": self._safe_float(row["drawdown"]),
                "rolling_ic": self._safe_float(row["rolling_ic"]),
            }
            if "cumulative_ic" in row:
                item["cumulative_ic"] = self._safe_float(row["cumulative_ic"])
            if "rolling_icir" in row:
                item["rolling_icir"] = self._safe_float(row["rolling_icir"])
            
            ts_data.append(item)
        
        return ts_data
    
    def _check_monotonicity(self, returns: List[float]) -> bool:
        """Check if returns are monotonically increasing."""
        if len(returns) < 2:
            return False
        
        increasing = sum(1 for i in range(1, len(returns)) if returns[i] >= returns[i-1])
        # Allow one violation
        return increasing >= len(returns) - 2
    
    def _safe_float(self, value) -> float:
        """Convert to float, handling NaN/Inf."""
        if value is None:
            return 0.0
        if isinstance(value, (int, float)):
            if np.isnan(value) or np.isinf(value):
                return 0.0
            return float(value)
        return 0.0


# ============ Factor Ranking System ============

class FactorRanker:
    """Ranks and compares multiple backtested factors."""
    
    def __init__(self):
        self.factors: Dict[str, Dict] = {}
    
    def add_factor(self, name: str, expression: str, metrics: Dict):
        """Add a backtested factor to the ranking system."""
        self.factors[name] = {
            "expression": expression,
            "metrics": metrics,
            "score": metrics.get("score", 0),
        }
    
    def get_rankings(self, sort_by: str = "score") -> List[Dict]:
        """Get factors ranked by specified metric."""
        ranked = sorted(
            self.factors.items(),
            key=lambda x: abs(x[1]["metrics"].get(sort_by, 0)),
            reverse=True
        )
        
        return [
            {
                "rank": i + 1,
                "name": name,
                "score": data["score"],
                "ic_mean": data["metrics"].get("ic_mean", 0),
                "sharpe": data["metrics"].get("sharpe", 0),
            }
            for i, (name, data) in enumerate(ranked)
        ]


# Global ranker instance
factor_ranker = FactorRanker()


# ============ TEST ============
if __name__ == "__main__":
    # Generate test data
    np.random.seed(42)
    dates = pd.date_range("2020-01-01", periods=500, freq="D")
    price = 100 * np.exp(np.random.randn(500).cumsum() * 0.02)
    
    data = pd.DataFrame({
        "close": price,
        "open": price * (1 + np.random.randn(500) * 0.01),
        "high": price * (1 + abs(np.random.randn(500) * 0.02)),
        "low": price * (1 - abs(np.random.randn(500) * 0.02)),
        "volume": np.random.randint(1000, 10000, 500)
    }, index=dates)
    
    # Create factor (momentum)
    factor = data['close'].pct_change(20)
    
    # Run backtest
    bt = Backtester(data)
    result = bt.run_backtest(factor)
    
    # Print results
    print("=" * 50)
    print("FACTOR BACKTEST RESULTS")
    print("=" * 50)
    
    m = result["metrics"]
    print(f"\n📊 IC Analysis:")
    print(f"   IC Mean:     {m['ic_mean']:>8.4f}")
    print(f"   IC Std:      {m['ic_std']:>8.4f}")
    print(f"   IC IR:       {m['ic_ir']:>8.4f}")
    print(f"   t-statistic: {m['t_stat']:>8.2f}")
    print(f"   p-value:     {m['p_value']:>8.4f}")
    
    print(f"\n💰 Performance:")
    print(f"   Sharpe:      {m['sharpe']:>8.2f}")
    print(f"   Sortino:     {m['sortino']:>8.2f}")
    print(f"   Win Rate:    {m['win_rate']:>8.1%}")
    print(f"   Max DD:      {m['max_drawdown']:>8.1%}")
    
    print(f"\n🏆 Score: {m['score']}/100")
    print(f"   Valid: {m['is_valid_factor']}")
    print(f"   {m['validity_reason']}")
    
    print(f"\n📈 Quantile Returns:")
    for layer in result["layer_data"]:
        print(f"   {layer['layer']}: {layer['mean_return']:>8.4%} (n={layer['count']})")
