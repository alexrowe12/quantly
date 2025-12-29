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

# Calculate Bollinger Bands
def calculate_bollinger_bands(data: pd.DataFrame, idx, period: int = 20, num_std: float = 2.0) -> tuple:
    try:
        pos = data.index.get_loc(idx)
    except KeyError:
        raise KeyError(f"Index {idx} not found in DataFrame")

    if pos + 1 < period:
        return -1.0, -1.0, -1.0

    window = data['close'].iloc[pos+1-period:pos+1]
    sma = window.mean()
    std = window.std()
    upper_band = sma + (num_std * std)
    lower_band = sma - (num_std * std)
    return upper_band, sma, lower_band

# Calculate Average True Range (ATR)
def calculate_atr(data: pd.DataFrame, idx, period: int = 14) -> float:
    try:
        pos = data.index.get_loc(idx)
    except KeyError:
        raise KeyError(f"Index {idx} not found in DataFrame")

    if pos + 1 < period + 1:
        return -1.0

    high = data['high'].iloc[:pos+1]
    low = data['low'].iloc[:pos+1]
    close = data['close'].iloc[:pos+1]

    # True Range calculation
    tr1 = high - low
    tr2 = abs(high - close.shift(1))
    tr3 = abs(low - close.shift(1))
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)

    # ATR is the EMA of True Range
    atr = tr.ewm(alpha=1/period, min_periods=period, adjust=False).mean()
    return atr.iloc[-1]

# Calculate Stochastic Oscillator
def calculate_stochastic(data: pd.DataFrame, idx, k_period: int = 14, d_period: int = 3) -> tuple:
    try:
        pos = data.index.get_loc(idx)
    except KeyError:
        raise KeyError(f"Index {idx} not found in DataFrame")

    if pos + 1 < k_period:
        return -1.0, -1.0

    # %K calculation
    window_high = data['high'].iloc[pos+1-k_period:pos+1]
    window_low = data['low'].iloc[pos+1-k_period:pos+1]
    current_close = data['close'].iloc[pos]

    lowest_low = window_low.min()
    highest_high = window_high.max()

    if highest_high - lowest_low == 0:
        k_value = 50.0
    else:
        k_value = 100 * ((current_close - lowest_low) / (highest_high - lowest_low))

    # %D calculation (SMA of %K) - need to calculate multiple %K values
    if pos + 1 < k_period + d_period - 1:
        return k_value, -1.0

    k_values = []
    for i in range(pos - d_period + 2, pos + 2):
        w_high = data['high'].iloc[i-k_period:i]
        w_low = data['low'].iloc[i-k_period:i]
        c_close = data['close'].iloc[i-1]
        l_low = w_low.min()
        h_high = w_high.max()
        if h_high - l_low == 0:
            k_values.append(50.0)
        else:
            k_values.append(100 * ((c_close - l_low) / (h_high - l_low)))

    d_value = np.mean(k_values)
    return k_value, d_value

# Calculate Average Directional Index (ADX)
def calculate_adx(data: pd.DataFrame, idx, period: int = 14) -> float:
    try:
        pos = data.index.get_loc(idx)
    except KeyError:
        raise KeyError(f"Index {idx} not found in DataFrame")

    if pos + 1 < period * 2:
        return -1.0

    high = data['high'].iloc[:pos+1]
    low = data['low'].iloc[:pos+1]
    close = data['close'].iloc[:pos+1]

    # Calculate +DM and -DM
    high_diff = high.diff()
    low_diff = -low.diff()

    plus_dm = high_diff.where((high_diff > low_diff) & (high_diff > 0), 0.0)
    minus_dm = low_diff.where((low_diff > high_diff) & (low_diff > 0), 0.0)

    # Calculate True Range
    tr1 = high - low
    tr2 = abs(high - close.shift(1))
    tr3 = abs(low - close.shift(1))
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)

    # Smooth using EMA
    atr = tr.ewm(alpha=1/period, min_periods=period, adjust=False).mean()
    plus_di = 100 * (plus_dm.ewm(alpha=1/period, min_periods=period, adjust=False).mean() / atr)
    minus_di = 100 * (minus_dm.ewm(alpha=1/period, min_periods=period, adjust=False).mean() / atr)

    # Calculate DX
    dx = 100 * abs(plus_di - minus_di) / (plus_di + minus_di)
    dx = dx.replace([np.inf, -np.inf], 0)

    # ADX is smoothed DX
    adx = dx.ewm(alpha=1/period, min_periods=period, adjust=False).mean()
    return adx.iloc[-1]

# Calculate Volume Weighted Average Price (VWAP)
def calculate_vwap(data: pd.DataFrame, idx) -> float:
    try:
        pos = data.index.get_loc(idx)
    except KeyError:
        raise KeyError(f"Index {idx} not found in DataFrame")

    if pos < 1:
        return -1.0

    # VWAP uses typical price: (high + low + close) / 3
    prices = data[['high', 'low', 'close']].iloc[:pos+1]
    typical_price = prices.mean(axis=1)
    volume = data['volume'].iloc[:pos+1]

    # VWAP = sum(typical_price * volume) / sum(volume)
    cumulative_tp_volume = (typical_price * volume).sum()
    cumulative_volume = volume.sum()

    if cumulative_volume == 0:
        return -1.0

    vwap = cumulative_tp_volume / cumulative_volume
    return vwap

# Calculate On-Balance Volume (OBV)
def calculate_obv(data: pd.DataFrame, idx) -> float:
    try:
        pos = data.index.get_loc(idx)
    except KeyError:
        raise KeyError(f"Index {idx} not found in DataFrame")

    if pos < 1:
        return 0.0

    close = data['close'].iloc[:pos+1]
    volume = data['volume'].iloc[:pos+1]

    # OBV: add volume on up days, subtract on down days
    price_change = close.diff()
    obv_changes = volume.where(price_change > 0, -volume.where(price_change < 0, 0))
    obv = obv_changes.cumsum()

    return obv.iloc[-1]

# Calculate Parabolic SAR
def calculate_psar(data: pd.DataFrame, idx, af_start: float = 0.02, af_increment: float = 0.02, af_max: float = 0.2) -> tuple:
    try:
        pos = data.index.get_loc(idx)
    except KeyError:
        raise KeyError(f"Index {idx} not found in DataFrame")

    if pos < 5:
        return -1.0, None

    high = data['high'].iloc[:pos+1].values
    low = data['low'].iloc[:pos+1].values
    close = data['close'].iloc[:pos+1].values

    # Initialize
    is_uptrend = close[1] > close[0]
    sar = low[0] if is_uptrend else high[0]
    ep = high[0] if is_uptrend else low[0]
    af = af_start

    # Calculate SAR for each period
    for i in range(1, len(close)):
        # Update SAR
        sar = sar + af * (ep - sar)

        # Check for reversal
        if is_uptrend:
            if low[i] < sar:
                # Reversal to downtrend
                is_uptrend = False
                sar = ep
                ep = low[i]
                af = af_start
            else:
                # Continue uptrend
                if high[i] > ep:
                    ep = high[i]
                    af = min(af + af_increment, af_max)
                # SAR cannot be above prior two lows
                sar = min(sar, low[i-1] if i > 0 else sar)
                if i > 1:
                    sar = min(sar, low[i-2])
        else:
            if high[i] > sar:
                # Reversal to uptrend
                is_uptrend = True
                sar = ep
                ep = high[i]
                af = af_start
            else:
                # Continue downtrend
                if low[i] < ep:
                    ep = low[i]
                    af = min(af + af_increment, af_max)
                # SAR cannot be below prior two highs
                sar = max(sar, high[i-1] if i > 0 else sar)
                if i > 1:
                    sar = max(sar, high[i-2])

    trend = 'up' if is_uptrend else 'down'
    return sar, trend

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
    wma_period: int = 20,
    bb_period: int = 20,
    bb_std: float = 2.0,
    atr_period: int = 14,
    stoch_k_period: int = 14,
    stoch_d_period: int = 3,
    adx_period: int = 14,
    psar_af_start: float = 0.02,
    psar_af_increment: float = 0.02,
    psar_af_max: float = 0.2
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
    # Bollinger Bands
    bb_upper, bb_middle, bb_lower = calculate_bollinger_bands(data, idx, bb_period, bb_std)
    # ATR
    atr_val = calculate_atr(data, idx, atr_period)
    # Stochastic
    stoch_k, stoch_d = calculate_stochastic(data, idx, stoch_k_period, stoch_d_period)
    # ADX
    adx_val = calculate_adx(data, idx, adx_period)
    # VWAP
    vwap_val = calculate_vwap(data, idx)
    # OBV
    obv_val = calculate_obv(data, idx)
    # Parabolic SAR
    psar_val, psar_trend = calculate_psar(data, idx, psar_af_start, psar_af_increment, psar_af_max)

    return {
        'rsi': rsi_val,
        'macd': macd_val,
        'macd_signal': macd_sig,
        'macd_hist': macd_hist,
        f'ma_{sma_period}': sma_val,
        f'ema_{ema_period}': ema_val,
        f'wma_{wma_period}': wma_val,
        'bb_upper': bb_upper,
        'bb_middle': bb_middle,
        'bb_lower': bb_lower,
        'atr': atr_val,
        'stoch_k': stoch_k,
        'stoch_d': stoch_d,
        'adx': adx_val,
        'vwap': vwap_val,
        'obv': obv_val,
        'psar': psar_val,
        'psar_trend': psar_trend
    }