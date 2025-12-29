# Calculates indicators for every timestamp in the df, and appends them to each row of the df

import pandas as pd
import numpy as np
import logging

logger = logging.getLogger(__name__)

# Calculate RSI
def calculate_rsi_full(data: pd.DataFrame, period: int = 14) -> pd.DataFrame:
    """Add a {period}-period RSI column."""
    logger.info(f'Calculating RSI | Period: {period}')
    delta = data['close'].diff()
    gain  = delta.where(delta > 0, 0.0)
    loss  = -delta.where(delta < 0, 0.0)

    avg_gain = gain.ewm(alpha=1/period, min_periods=period, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1/period, min_periods=period, adjust=False).mean()

    rs           = avg_gain / avg_loss
    data['rsi']  = 100 - (100 / (1 + rs))
    return data

# Calculate MACD
def calculate_macd_full(data: pd.DataFrame,
                   fast: int = 12, slow: int = 26, signal: int = 9) -> pd.DataFrame:
    """Add MACD line, Signal line, and Histogram columns."""
    logger.info(f'Calculating MACD | Fast: {fast}, Slow: {slow}, Signal: {signal}')
    ema_fast      = data['close'].ewm(span=fast, adjust=False).mean()
    ema_slow      = data['close'].ewm(span=slow, adjust=False).mean()
    macd_line     = ema_fast - ema_slow
    signal_line   = macd_line.ewm(span=signal, adjust=False).mean()

    data['macd']        = macd_line
    data['macd_signal'] = signal_line
    data['macd_hist']   = macd_line - signal_line
    return data

# Calculate simple moving average
def calculate_sma_full(data: pd.DataFrame, period: int = 20) -> pd.DataFrame:
    """Add a simple moving average of the 'close' price."""
    logger.info(f'Calculating SMA | Period: {period}')
    data[f'ma_{period}'] = data['close'].rolling(window=period).mean()
    return data

# Calculate exponential moving average
def calculate_ema_full(data: pd.DataFrame, period: int = 20,
                  column: str = 'close') -> pd.DataFrame:
    """Add an Exponential Moving Average column. Uses pandas' EWM with `span=period`."""
    logger.info(f'Calculating EMA | Period: {period}')
    data[f'ema_{period}'] = data[column].ewm(span=period, adjust=False).mean()
    return data

# Calculate weighted moving average
def calculate_wma_full(data: pd.DataFrame, period: int = 20,
                  column: str = 'close') -> pd.DataFrame:
    """Add a Weighted Moving Average column. More weight on recent prices: 1, 2, …, period."""
    logger.info(f'Calculating WMA | Period: {period}')
    weights = np.arange(1, period + 1)

    def _wma(values):
        return np.dot(values, weights) / weights.sum()

    data[f'wma_{period}'] = (
        data[column]
        .rolling(window=period, min_periods=period)
        .apply(_wma, raw=True)
    )
    return data

# Calculate Bollinger Bands
def calculate_bollinger_bands_full(data: pd.DataFrame, period: int = 20, num_std: float = 2.0) -> pd.DataFrame:
    """Add Bollinger Bands (upper, middle, lower) columns."""
    logger.info(f'Calculating Bollinger Bands | Period: {period}, Std Dev: {num_std}')
    sma = data['close'].rolling(window=period).mean()
    std = data['close'].rolling(window=period).std()
    data['bb_upper'] = sma + (num_std * std)
    data['bb_middle'] = sma
    data['bb_lower'] = sma - (num_std * std)
    return data

# Calculate ATR
def calculate_atr_full(data: pd.DataFrame, period: int = 14) -> pd.DataFrame:
    """Add Average True Range column."""
    logger.info(f'Calculating ATR | Period: {period}')
    high_low = data['high'] - data['low']
    high_close = np.abs(data['high'] - data['close'].shift())
    low_close = np.abs(data['low'] - data['close'].shift())

    true_range = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
    data['atr'] = true_range.rolling(window=period).mean()
    return data

# Calculate Stochastic Oscillator
def calculate_stochastic_full(data: pd.DataFrame, k_period: int = 14, d_period: int = 3) -> pd.DataFrame:
    """Add Stochastic Oscillator (%K and %D) columns."""
    logger.info(f'Calculating Stochastic | K Period: {k_period}, D Period: {d_period}')

    low_min = data['low'].rolling(window=k_period).min()
    high_max = data['high'].rolling(window=k_period).max()

    # Avoid division by zero - if range is 0, set %K to 50 (middle value)
    range_val = high_max - low_min
    data['stoch_k'] = 100 * ((data['close'] - low_min) / range_val.replace(0, np.nan))
    data['stoch_k'] = data['stoch_k'].fillna(50)  # Use 50 for flat periods
    data['stoch_d'] = data['stoch_k'].rolling(window=d_period).mean()
    return data

# Calculate ADX
def calculate_adx_full(data: pd.DataFrame, period: int = 14) -> pd.DataFrame:
    """Add Average Directional Index column."""
    logger.info(f'Calculating ADX | Period: {period}')

    high_diff = data['high'].diff()
    low_diff = -data['low'].diff()

    pos_dm = high_diff.where((high_diff > low_diff) & (high_diff > 0), 0.0)
    neg_dm = low_diff.where((low_diff > high_diff) & (low_diff > 0), 0.0)

    high_low = data['high'] - data['low']
    high_close = np.abs(data['high'] - data['close'].shift())
    low_close = np.abs(data['low'] - data['close'].shift())
    true_range = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)

    atr = true_range.rolling(window=period).mean()
    pos_di = 100 * (pos_dm.rolling(window=period).mean() / atr)
    neg_di = 100 * (neg_dm.rolling(window=period).mean() / atr)

    dx = 100 * np.abs(pos_di - neg_di) / (pos_di + neg_di)
    data['adx'] = dx.rolling(window=period).mean()
    return data

# Calculate VWAP
def calculate_vwap_full(data: pd.DataFrame) -> pd.DataFrame:
    """Add Volume Weighted Average Price column."""
    logger.info('Calculating VWAP')

    typical_price = (data['high'] + data['low'] + data['close']) / 3
    data['vwap'] = (typical_price * data['volume']).cumsum() / data['volume'].cumsum()
    return data

# Calculate OBV
def calculate_obv_full(data: pd.DataFrame) -> pd.DataFrame:
    """Add On-Balance Volume column."""
    logger.info('Calculating OBV')

    obv = [0]
    for i in range(1, len(data)):
        if data['close'].iloc[i] > data['close'].iloc[i-1]:
            obv.append(obv[-1] + data['volume'].iloc[i])
        elif data['close'].iloc[i] < data['close'].iloc[i-1]:
            obv.append(obv[-1] - data['volume'].iloc[i])
        else:
            obv.append(obv[-1])

    data['obv'] = obv
    return data

# Calculate Parabolic SAR
def calculate_psar_full(data: pd.DataFrame, af_start: float = 0.02, af_increment: float = 0.02, af_max: float = 0.2) -> pd.DataFrame:
    """Add Parabolic SAR columns - optimized with numpy arrays."""
    logger.info(f'Calculating Parabolic SAR | AF Start: {af_start}, Increment: {af_increment}, Max: {af_max}')

    # Convert to numpy arrays for speed
    high = data['high'].values
    low = data['low'].values
    close = data['close'].values

    length = len(data)
    psar = np.zeros(length)
    psarbull = np.full(length, np.nan)
    psarbear = np.full(length, np.nan)

    # Initialize
    psar[0] = close[0]
    bull = True
    af = af_start
    hp = high[0]
    lp = low[0]

    for i in range(2, length):
        # Calculate SAR
        if bull:
            psar[i] = psar[i-1] + af * (hp - psar[i-1])
        else:
            psar[i] = psar[i-1] + af * (lp - psar[i-1])

        reverse = False

        # Check for reversal
        if bull:
            if low[i] < psar[i]:
                bull = False
                reverse = True
                psar[i] = hp
                lp = low[i]
                af = af_start
        else:
            if high[i] > psar[i]:
                bull = True
                reverse = True
                psar[i] = lp
                hp = high[i]
                af = af_start

        # Update if no reversal
        if not reverse:
            if bull:
                if high[i] > hp:
                    hp = high[i]
                    af = min(af + af_increment, af_max)
                if low[i-1] < psar[i]:
                    psar[i] = low[i-1]
                if i >= 2 and low[i-2] < psar[i]:
                    psar[i] = low[i-2]
            else:
                if low[i] < lp:
                    lp = low[i]
                    af = min(af + af_increment, af_max)
                if high[i-1] > psar[i]:
                    psar[i] = high[i-1]
                if i >= 2 and high[i-2] > psar[i]:
                    psar[i] = high[i-2]

        # Store bull/bear values
        if bull:
            psarbull[i] = psar[i]
        else:
            psarbear[i] = psar[i]

    data['psar'] = psar
    data['psar_bull'] = psarbull
    data['psar_bear'] = psarbear
    return data

# Call each function from one master function
def calc_indicators_full(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    df['date'] = pd.to_datetime(df['date'], format='%Y%m%d  %H:%M:%S')
    df = df.set_index('date')
    df = calculate_rsi_full(df, period=14)
    df = calculate_macd_full(df, fast=12, slow=26, signal=9)
    df = calculate_sma_full(df, period=20)
    df = calculate_ema_full(df, period=20)
    df = calculate_wma_full(df, period=20)

    return df

# Logic for when this script is run directly
if __name__ == '__main__':
    df = calc_indicators_full('../data/data.csv')
    print('------------------------------')
    print(df.tail())
