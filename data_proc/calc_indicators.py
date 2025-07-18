# Calculate indicators at a single given index, useful for trading while iterating through

import pandas as pd
import numpy as np

# Calculate RSI at a given index
def calculate_rsi(data: pd.DataFrame, idx, period: int = 14) -> float:
    try:
        pos = data.index.get_loc(idx)
    except KeyError:
        raise KeyError(f"Index {idx} not found in DataFrame")

    if pos + 1 < period + 1:
        return -1.0

    prices = data['close'].iloc[:pos+1]
    delta = prices.diff()
    gain = delta.where(delta > 0, 0.0)
    loss = -delta.where(delta < 0, 0.0)

    avg_gain = gain.ewm(alpha=1/period, min_periods=period, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1/period, min_periods=period, adjust=False).mean()

    rs = avg_gain.iloc[-1] / avg_loss.iloc[-1]
    rsi = 100 - (100 / (1 + rs))
    return rsi

# Calculate MACD
def calculate_macd(data: pd.DataFrame, idx, fast: int = 12, slow: int = 26, signal: int = 9) -> tuple:
    try:
        pos = data.index.get_loc(idx)
    except KeyError:
        raise KeyError(f"Index {idx} not found in DataFrame")

    if pos + 1 < slow:
        return -1.0, -1.0, -1.0

    prices = data['close'].iloc[:pos+1]
    ema_fast = prices.ewm(span=fast, adjust=False).mean().iloc[-1]
    ema_slow = prices.ewm(span=slow, adjust=False).mean().iloc[-1]
    macd = ema_fast - ema_slow

    macd_series = prices.ewm(span=fast, adjust=False).mean() - prices.ewm(span=slow, adjust=False).mean()
    signal_line = macd_series.ewm(span=signal, adjust=False).mean().iloc[-1]
    hist = macd - signal_line
    return macd, signal_line, hist

# Calculate simple moving average
def calculate_sma(data: pd.DataFrame, idx, period: int = 20) -> float:
    try:
        pos = data.index.get_loc(idx)
    except KeyError:
        raise KeyError(f"Index {idx} not found in DataFrame")

    if pos + 1 < period:
        return -1.0

    window = data['close'].iloc[pos+1-period:pos+1]
    return window.mean()

# Calculate exponential moving average
def calculate_ema(data: pd.DataFrame, idx, period: int = 20, column: str = 'close') -> float:
    try:
        pos = data.index.get_loc(idx)
    except KeyError:
        raise KeyError(f"Index {idx} not found in DataFrame")

    if pos + 1 < period:
        return -1.0

    series = data[column].iloc[:pos+1]
    return series.ewm(span=period, adjust=False).mean().iloc[-1]

# Calculate weighted moving average
def calculate_wma(data: pd.DataFrame, idx, period: int = 20, column: str = 'close') -> float:
    try:
        pos = data.index.get_loc(idx)
    except KeyError:
        raise KeyError(f"Index {idx} not found in DataFrame")

    if pos + 1 < period:
        return -1.0

    window = data[column].iloc[pos+1-period:pos+1]
    weights = np.arange(1, period + 1)
    return np.dot(window.values, weights) / weights.sum()

# Call each function from one master function
def calculate_all_indicators(
    data: pd.DataFrame,
    idx,
    rsi_period: int = 14,
    macd_fast: int = 12,
    macd_slow: int = 26,
    macd_signal: int = 9,
    sma_period: int = 20,
    ema_period: int = 20,
    wma_period: int = 20
) -> dict:
    # RSI
    rsi_val = calculate_rsi(data, idx, rsi_period)
    # MACD
    macd_val, macd_sig, macd_hist = calculate_macd(data, idx, macd_fast, macd_slow, macd_signal)
    # SMA
    sma_val = calculate_sma(data, idx, sma_period)
    # EMA
    ema_val = calculate_ema(data, idx, ema_period)
    # WMA
    wma_val = calculate_wma(data, idx, wma_period)

    return {
        'rsi': rsi_val,
        'macd': macd_val,
        'macd_signal': macd_sig,
        'macd_hist': macd_hist,
        f'ma_{sma_period}': sma_val,
        f'ema_{ema_period}': ema_val,
        f'wma_{wma_period}': wma_val
    }