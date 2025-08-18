# API engine to run trading strategies on historical price data

import pandas as pd
from datetime import datetime
import uuid

from data_proc.proc_df import proc_df
from data_proc.calc_indicators_full import calc_indicators_full
from strategy.main import (
    rsi_oversold, rsi_overbought,
    macd_buy,    macd_sell,
    sma_buy,     sma_sell,
    ema_buy,     ema_sell,
    wma_buy,     wma_sell,
)

# Map strategy names to functions
STRATEGY_MAP = {
    "rsi_oversold":  rsi_oversold,
    "rsi_overbought":rsi_overbought,
    "macd_buy":      macd_buy,
    "macd_sell":     macd_sell,
    "sma_buy":       sma_buy,
    "sma_sell":      sma_sell,
    "ema_buy":       ema_buy,
    "ema_sell":      ema_sell,
    "wma_buy":       wma_buy,
    "wma_sell":      wma_sell,
}

def _calculate_required_indicators(df: pd.DataFrame, strategies: list) -> pd.DataFrame:
    """Calculate only the indicators required by the strategies with their specific periods."""
    from data_proc.calc_indicators_full import (
        calculate_rsi_full,
        calculate_macd_full,
        calculate_sma_full,
        calculate_ema_full,
        calculate_wma_full,
    )
    
    # Collect required indicators and their periods
    rsi_periods = set()
    sma_periods = set()
    ema_periods = set()
    wma_periods = set()
    macd_configs = set()
    
    for strategy in strategies:
        strategy_name = strategy["name"]
        
        # Get periods with defaults if not specified
        period = strategy.get("period")
        fast_period = strategy.get("fast_period")
        slow_period = strategy.get("slow_period")
        signal_period = strategy.get("signal_period")
        
        if "rsi" in strategy_name:
            rsi_periods.add(period or 14)
        elif "macd" in strategy_name:
            fast = fast_period or 12
            slow = slow_period or 26
            signal = signal_period or 9
            macd_configs.add((fast, slow, signal))
        elif "sma" in strategy_name:
            sma_periods.add(period or 20)
        elif "ema" in strategy_name:
            ema_periods.add(period or 20)
        elif "wma" in strategy_name:
            wma_periods.add(period or 20)
    
    # Calculate indicators for all required periods
    for period in rsi_periods:
        temp_df = calculate_rsi_full(df.copy(), period=period)
        if period != 14:  # Create named columns for non-default periods
            df[f'rsi_{period}'] = temp_df['rsi']
        else:
            df['rsi'] = temp_df['rsi']
    
    for fast, slow, signal in macd_configs:
        temp_df = calculate_macd_full(df.copy(), fast=fast, slow=slow, signal=signal)
        if (fast, slow, signal) != (12, 26, 9):  # Create named columns for non-default configs
            df[f'macd_{fast}_{slow}'] = temp_df['macd']
            df[f'macd_signal_{fast}_{slow}_{signal}'] = temp_df['macd_signal']
            df[f'macd_hist_{fast}_{slow}_{signal}'] = temp_df['macd_hist']
        else:
            df['macd'] = temp_df['macd']
            df['macd_signal'] = temp_df['macd_signal']
            df['macd_hist'] = temp_df['macd_hist']
    
    
    for period in sma_periods:
        df = calculate_sma_full(df, period=period)
    
    for period in ema_periods:
        df = calculate_ema_full(df, period=period)
    
    for period in wma_periods:
        df = calculate_wma_full(df, period=period)
    
    return df

def _create_strategy_function(strategy_config: dict):
    """Create a strategy function with the correct period parameters."""
    strategy_name = strategy_config["name"]
    period = strategy_config.get("period")
    threshold = strategy_config.get("threshold")
    fast_period = strategy_config.get("fast_period")
    slow_period = strategy_config.get("slow_period")
    signal_period = strategy_config.get("signal_period")
    
    if strategy_name == "rsi_oversold":
        def strategy_func(window):
            rsi_col = 'rsi' if period is None or period == 14 else f'rsi_{period}'
            if rsi_col not in window.columns:
                rsi_col = 'rsi'  # Fallback to default
            val = window[rsi_col].iloc[-1]
            thresh = threshold or 20
            return val < thresh, {'strategy': strategy_name, 'value': val, 'threshold': thresh}
        return strategy_func
    
    elif strategy_name == "rsi_overbought":
        def strategy_func(window):
            rsi_col = 'rsi' if period is None or period == 14 else f'rsi_{period}'
            if rsi_col not in window.columns:
                rsi_col = 'rsi'  # Fallback to default
            val = window[rsi_col].iloc[-1]
            thresh = threshold or 80
            return val > thresh, {'strategy': strategy_name, 'value': val, 'threshold': thresh}
        return strategy_func
    
    elif strategy_name == "macd_buy":
        def strategy_func(window):
            if len(window) < 2:
                return False, {}
            fast = fast_period or 12
            slow = slow_period or 26
            hist_col = 'macd_hist' if (fast, slow) == (12, 26) else f'macd_hist_{fast}_{slow}_{signal_period or 9}'
            if hist_col not in window.columns:
                hist_col = 'macd_hist'  # Fallback to default
            prev, curr = window[hist_col].iloc[-2], window[hist_col].iloc[-1]
            sig = prev < 0 and curr > 0
            return sig, {'strategy': strategy_name, 'value': curr}
        return strategy_func
    
    elif strategy_name == "macd_sell":
        def strategy_func(window):
            if len(window) < 2:
                return False, {}
            fast = fast_period or 12
            slow = slow_period or 26
            hist_col = 'macd_hist' if (fast, slow) == (12, 26) else f'macd_hist_{fast}_{slow}_{signal_period or 9}'
            if hist_col not in window.columns:
                hist_col = 'macd_hist'  # Fallback to default
            prev, curr = window[hist_col].iloc[-2], window[hist_col].iloc[-1]
            sig = prev > 0 and curr < 0
            return sig, {'strategy': strategy_name, 'value': curr}
        return strategy_func
    
    elif strategy_name == "sma_buy":
        def strategy_func(window):
            p = period or 20
            col = f'ma_{p}'
            if len(window) < 2 or col not in window:
                return False, {}
            p0, p1 = window['close'].iloc[-2], window['close'].iloc[-1]
            m0, m1 = window[col].iloc[-2], window[col].iloc[-1]
            sig = p0 < m0 and p1 > m1
            return sig, {'strategy': strategy_name, 'value': p1}
        return strategy_func
    
    elif strategy_name == "sma_sell":
        def strategy_func(window):
            p = period or 20
            col = f'ma_{p}'
            if len(window) < 2 or col not in window:
                return False, {}
            p0, p1 = window['close'].iloc[-2], window['close'].iloc[-1]
            m0, m1 = window[col].iloc[-2], window[col].iloc[-1]
            sig = p0 > m0 and p1 < m1
            return sig, {'strategy': strategy_name, 'value': p1}
        return strategy_func
    
    elif strategy_name == "ema_buy":
        def strategy_func(window):
            p = period or 20
            col = f'ema_{p}'
            if len(window) < 2 or col not in window:
                return False, {}
            p0, p1 = window['close'].iloc[-2], window['close'].iloc[-1]
            e0, e1 = window[col].iloc[-2], window[col].iloc[-1]
            sig = p0 < e0 and p1 > e1
            return sig, {'strategy': strategy_name, 'value': p1}
        return strategy_func
    
    elif strategy_name == "ema_sell":
        def strategy_func(window):
            p = period or 20
            col = f'ema_{p}'
            if len(window) < 2 or col not in window:
                return False, {}
            p0, p1 = window['close'].iloc[-2], window['close'].iloc[-1]
            e0, e1 = window[col].iloc[-2], window[col].iloc[-1]
            sig = p0 > e0 and p1 < e1
            return sig, {'strategy': strategy_name, 'value': p1}
        return strategy_func
    
    elif strategy_name == "wma_buy":
        def strategy_func(window):
            p = period or 20
            col = f'wma_{p}'
            if len(window) < 2 or col not in window:
                return False, {}
            p0, p1 = window['close'].iloc[-2], window['close'].iloc[-1]
            w0, w1 = window[col].iloc[-2], window[col].iloc[-1]
            sig = p0 < w0 and p1 > w1
            return sig, {'strategy': strategy_name, 'value': p1}
        return strategy_func
    
    elif strategy_name == "wma_sell":
        def strategy_func(window):
            p = period or 20
            col = f'wma_{p}'
            if len(window) < 2 or col not in window:
                return False, {}
            p0, p1 = window['close'].iloc[-2], window['close'].iloc[-1]
            w0, w1 = window[col].iloc[-2], window[col].iloc[-1]
            sig = p0 > w0 and p1 < w1
            return sig, {'strategy': strategy_name, 'value': p1}
        return strategy_func
    
    else:
        # Fallback to original strategy map
        return STRATEGY_MAP.get(strategy_name, lambda window: (False, {}))

# Main backtest simulation engine
def run_backtest(
    ticker: str,
    starting_value: float,
    buy_strats: list,
    sell_strats: list,
    freq: str = "1D",
    data_path_template: str = "./data/data.csv",
    start_date: datetime = None,
    end_date: datetime = None
) -> dict:
    # Load and prepare data
    df = proc_df(data_path_template.format(ticker=ticker))
    from data_proc.calc_indicators_full import (
        calculate_rsi_full,
        calculate_macd_full,
        calculate_sma_full,
        calculate_ema_full,
        calculate_wma_full,
    )

    # Calculate technical indicators dynamically based on strategy requirements
    df = _calculate_required_indicators(df, buy_strats + sell_strats)
    df.sort_index(inplace=True)
    
    # Filter data by date range if provided
    if start_date is not None:
        df = df[df.index >= start_date]
    if end_date is not None:
        df = df[df.index <= end_date]
    
    # Ensure we have enough data after filtering
    if len(df) < 50:  # Need minimum data for indicators to stabilize
        raise ValueError(f"Insufficient data after date filtering. Only {len(df)} records available.")

    from strategy.main import buy_strategies, sell_strategies
    buy_strategies[:]  = [_create_strategy_function(s) for s in buy_strats]
    sell_strategies[:] = [_create_strategy_function(s) for s in sell_strats]

    portfolio_value   = starting_value
    committed_capital = 0.0
    entry_price       = None
    trades: list      = []

    # Create time ticks - only drop NaN for columns that exist
    required_cols = ["close"]
    if 'rsi' in df.columns:
        required_cols.append('rsi')
    if 'macd_hist' in df.columns:
        required_cols.append('macd_hist')
    
    ticks = (
        df
        .resample(freq)
        .last()
        .dropna(subset=required_cols)
    )

    # Iterate through ticks and place trades
    for ts in ticks.index:
        real_ts = df.index.asof(ts)
        if pd.isna(real_ts):
            continue
        price   = df.at[real_ts, "close"]

        signal, info = __import__("strategy.main", fromlist=["tick"]).tick(df, ts)

        # BUY
        if signal == 1:
            cfg = next(filter(lambda c: c["name"] == info["strategy"], buy_strats))
            amount = portfolio_value * cfg["trade_percent"]
            if amount <= (portfolio_value - committed_capital):
                committed_capital += amount
                entry_price = price
                trades.append({
                    "action":    "buy",
                    "price":     price,
                    "timestamp": real_ts.isoformat()
                })

        # SELL
        elif signal == -1 and entry_price is not None:
            profit = committed_capital * (price - entry_price) / entry_price
            portfolio_value += profit
            committed_capital -= committed_capital
            trades.append({
                "action":    "sell",
                "price":     price,
                "timestamp": real_ts.isoformat()
            })
            entry_price = None

    # Close out final trade if still open when backtest reaches end of data
    if entry_price is not None:
        last_price = df["close"].iloc[-1]
        profit = committed_capital * (last_price - entry_price) / entry_price
        portfolio_value += profit
        trades.append({
            "action":    "sell",
            "price":     last_price,
            "timestamp": df.index[-1].isoformat()
        })

    # Round to the nearest cent and return as json
    final_value = round(portfolio_value, 2)
    return {
        "starting_value": starting_value,
        "final_value":     portfolio_value,
        "trades":          trades,
    }
