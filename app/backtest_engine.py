# API engine to run trading strategies on historical price data

import pandas as pd
from datetime import datetime
import uuid

from data_proc.proc_df import proc_df
from data_proc.calc_indicators_full import calc_indicators_full
from strategy.main import (
    rsi_oversold, rsi_overbought,
    macd_buy, macd_sell,
    sma_buy, sma_sell,
    ema_buy, ema_sell,
    wma_buy, wma_sell,
    bb_lower_buy, bb_upper_sell,
    stoch_oversold, stoch_overbought,
    adx_strong_trend_buy, adx_strong_trend_sell,
    vwap_buy, vwap_sell,
    obv_rising_buy, obv_falling_sell,
    psar_buy, psar_sell,
)

# Map strategy names to functions
STRATEGY_MAP = {
    "rsi_oversold": rsi_oversold,
    "rsi_overbought": rsi_overbought,
    "macd_buy": macd_buy,
    "macd_sell": macd_sell,
    "sma_buy": sma_buy,
    "sma_sell": sma_sell,
    "ema_buy": ema_buy,
    "ema_sell": ema_sell,
    "wma_buy": wma_buy,
    "wma_sell": wma_sell,
    "bb_lower_buy": bb_lower_buy,
    "bb_upper_sell": bb_upper_sell,
    "stoch_oversold": stoch_oversold,
    "stoch_overbought": stoch_overbought,
    "adx_strong_trend_buy": adx_strong_trend_buy,
    "adx_strong_trend_sell": adx_strong_trend_sell,
    "vwap_buy": vwap_buy,
    "vwap_sell": vwap_sell,
    "obv_rising_buy": obv_rising_buy,
    "obv_falling_sell": obv_falling_sell,
    "psar_buy": psar_buy,
    "psar_sell": psar_sell,
}

def _calculate_required_indicators(df: pd.DataFrame, strategies: list) -> pd.DataFrame:
    """Calculate only the indicators required by the strategies with their specific periods."""
    from data_proc.calc_indicators_full import (
        calculate_rsi_full,
        calculate_macd_full,
        calculate_sma_full,
        calculate_ema_full,
        calculate_wma_full,
        calculate_bollinger_bands_full,
        calculate_atr_full,
        calculate_stochastic_full,
        calculate_adx_full,
        calculate_vwap_full,
        calculate_obv_full,
        calculate_psar_full,
    )

    # Collect required indicators and their periods
    rsi_periods = set()
    sma_periods = set()
    ema_periods = set()
    wma_periods = set()
    macd_configs = set()
    bb_configs = set()
    atr_periods = set()
    stoch_configs = set()
    adx_periods = set()
    psar_configs = set()
    needs_vwap = False
    needs_obv = False

    for strategy in strategies:
        strategy_name = strategy["name"]

        # Get periods with defaults if not specified
        period = strategy.get("period")
        fast_period = strategy.get("fast_period")
        slow_period = strategy.get("slow_period")
        signal_period = strategy.get("signal_period")
        std_dev = strategy.get("std_dev")
        k_period = strategy.get("k_period")
        d_period = strategy.get("d_period")
        af_start = strategy.get("af_start")
        af_increment = strategy.get("af_increment")
        af_max = strategy.get("af_max")

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
        elif "bb_" in strategy_name:
            bb_configs.add((period or 20, std_dev or 2.0))
        elif "atr" in strategy_name:
            atr_periods.add(period or 14)
        elif "stoch" in strategy_name:
            stoch_configs.add((k_period or 14, d_period or 3))
        elif "adx" in strategy_name:
            adx_periods.add(period or 14)
        elif "vwap" in strategy_name:
            needs_vwap = True
        elif "obv" in strategy_name:
            needs_obv = True
        elif "psar" in strategy_name:
            psar_configs.add((af_start or 0.02, af_increment or 0.02, af_max or 0.2))

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

    for period, std_dev in bb_configs:
        df = calculate_bollinger_bands_full(df, period=period, num_std=std_dev)

    for period in atr_periods:
        df = calculate_atr_full(df, period=period)

    for k_period, d_period in stoch_configs:
        df = calculate_stochastic_full(df, k_period=k_period, d_period=d_period)

    for period in adx_periods:
        df = calculate_adx_full(df, period=period)

    if needs_vwap:
        df = calculate_vwap_full(df)

    if needs_obv:
        df = calculate_obv_full(df)

    for af_start, af_increment, af_max in psar_configs:
        df = calculate_psar_full(df, af_start=af_start, af_increment=af_increment, af_max=af_max)

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

    elif strategy_name == "bb_lower_buy":
        def strategy_func(window):
            if 'bb_lower' not in window or len(window) < 1:
                return False, {}
            price = window['close'].iloc[-1]
            bb_lower = window['bb_lower'].iloc[-1]
            sig = price <= bb_lower
            return sig, {'strategy': strategy_name, 'value': price, 'threshold': bb_lower}
        return strategy_func

    elif strategy_name == "bb_upper_sell":
        def strategy_func(window):
            if 'bb_upper' not in window or len(window) < 1:
                return False, {}
            price = window['close'].iloc[-1]
            bb_upper = window['bb_upper'].iloc[-1]
            sig = price >= bb_upper
            return sig, {'strategy': strategy_name, 'value': price, 'threshold': bb_upper}
        return strategy_func

    elif strategy_name == "atr_buy" or strategy_name == "atr_sell":
        def strategy_func(window):
            if 'atr' not in window or len(window) < 1:
                return False, {}
            atr_val = window['atr'].iloc[-1]
            thresh = threshold or 1.5
            if strategy_name == "atr_buy":
                sig = atr_val > thresh  # High volatility
            else:
                sig = atr_val < thresh  # Low volatility
            return sig, {'strategy': strategy_name, 'value': atr_val, 'threshold': thresh}
        return strategy_func

    elif strategy_name == "stoch_oversold":
        def strategy_func(window):
            if 'stoch_k' not in window or len(window) < 1:
                return False, {}
            stoch_k = window['stoch_k'].iloc[-1]
            thresh = threshold or 20
            sig = stoch_k < thresh
            return sig, {'strategy': strategy_name, 'value': stoch_k, 'threshold': thresh}
        return strategy_func

    elif strategy_name == "stoch_overbought":
        def strategy_func(window):
            if 'stoch_k' not in window or len(window) < 1:
                return False, {}
            stoch_k = window['stoch_k'].iloc[-1]
            thresh = threshold or 80
            sig = stoch_k > thresh
            return sig, {'strategy': strategy_name, 'value': stoch_k, 'threshold': thresh}
        return strategy_func

    elif strategy_name == "adx_strong_trend_buy" or strategy_name == "adx_strong_trend_sell":
        def strategy_func(window):
            if 'adx' not in window or len(window) < 1:
                return False, {}
            adx_val = window['adx'].iloc[-1]
            thresh = threshold or 25
            sig = adx_val > thresh  # Strong trend
            return sig, {'strategy': strategy_name, 'value': adx_val, 'threshold': thresh}
        return strategy_func

    elif strategy_name == "vwap_buy":
        def strategy_func(window):
            if 'vwap' not in window or len(window) < 1:
                return False, {}
            price = window['close'].iloc[-1]
            vwap_val = window['vwap'].iloc[-1]
            sig = price < vwap_val  # Price below VWAP - potential buy
            return sig, {'strategy': strategy_name, 'value': price, 'threshold': vwap_val}
        return strategy_func

    elif strategy_name == "vwap_sell":
        def strategy_func(window):
            if 'vwap' not in window or len(window) < 1:
                return False, {}
            price = window['close'].iloc[-1]
            vwap_val = window['vwap'].iloc[-1]
            sig = price > vwap_val  # Price above VWAP - potential sell
            return sig, {'strategy': strategy_name, 'value': price, 'threshold': vwap_val}
        return strategy_func

    elif strategy_name == "obv_rising_buy":
        def strategy_func(window):
            if 'obv' not in window or len(window) < 2:
                return False, {}
            obv_prev = window['obv'].iloc[-2]
            obv_curr = window['obv'].iloc[-1]
            sig = obv_curr > obv_prev  # OBV rising
            return sig, {'strategy': strategy_name, 'value': obv_curr}
        return strategy_func

    elif strategy_name == "obv_falling_sell":
        def strategy_func(window):
            if 'obv' not in window or len(window) < 2:
                return False, {}
            obv_prev = window['obv'].iloc[-2]
            obv_curr = window['obv'].iloc[-1]
            sig = obv_curr < obv_prev  # OBV falling
            return sig, {'strategy': strategy_name, 'value': obv_curr}
        return strategy_func

    elif strategy_name == "psar_buy":
        def strategy_func(window):
            if 'psar_bull' not in window or len(window) < 1:
                return False, {}
            psar_bull = window['psar_bull'].iloc[-1]
            sig = psar_bull is not None and not pd.isna(psar_bull)  # Bullish SAR
            return sig, {'strategy': strategy_name, 'value': psar_bull if sig else 0}
        return strategy_func

    elif strategy_name == "psar_sell":
        def strategy_func(window):
            if 'psar_bear' not in window or len(window) < 1:
                return False, {}
            psar_bear = window['psar_bear'].iloc[-1]
            sig = psar_bear is not None and not pd.isna(psar_bear)  # Bearish SAR
            return sig, {'strategy': strategy_name, 'value': psar_bear if sig else 0}
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

    # Add all indicator columns being used to required_cols
    indicator_cols = ['rsi', 'macd', 'macd_hist', 'macd_signal',
                      'bb_upper', 'bb_middle', 'bb_lower',
                      'atr', 'stoch_k', 'stoch_d', 'adx', 'vwap', 'obv', 'psar']

    for col in indicator_cols:
        if col in df.columns:
            required_cols.append(col)

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
