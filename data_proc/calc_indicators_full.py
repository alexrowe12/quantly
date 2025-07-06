import pandas as pd
import numpy as np

def calculate_rsi_full(data: pd.DataFrame, period: int = 14) -> pd.DataFrame:
    """Add a {period}-period RSI column."""
    print('Calculating RSI | Period: ' + str(period))
    delta = data['close'].diff()
    gain  = delta.where(delta > 0, 0.0)
    loss  = -delta.where(delta < 0, 0.0)

    avg_gain = gain.ewm(alpha=1/period, min_periods=period, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1/period, min_periods=period, adjust=False).mean()

    rs           = avg_gain / avg_loss
    data['rsi']  = 100 - (100 / (1 + rs))
    return data

def calculate_macd_full(data: pd.DataFrame,
                   fast: int = 12, slow: int = 26, signal: int = 9) -> pd.DataFrame:
    """Add MACD line, Signal line, and Histogram columns."""
    print('Calculating MACD | Fast: ' + str(fast) + ' Slow: ' + str(slow) + ' Signal: ' + str(signal))
    ema_fast      = data['close'].ewm(span=fast, adjust=False).mean()
    ema_slow      = data['close'].ewm(span=slow, adjust=False).mean()
    macd_line     = ema_fast - ema_slow
    signal_line   = macd_line.ewm(span=signal, adjust=False).mean()

    data['macd']        = macd_line
    data['macd_signal'] = signal_line
    data['macd_hist']   = macd_line - signal_line
    return data

def calculate_sma_full(data: pd.DataFrame, period: int = 20) -> pd.DataFrame:
    """Add a simple moving average of the 'close' price."""
    print('Calculating SMA | Period: ' + str(period))
    data[f'ma_{period}'] = data['close'].rolling(window=period).mean()
    return data

def calculate_ema_full(data: pd.DataFrame, period: int = 20,
                  column: str = 'close') -> pd.DataFrame:
    """Add an Exponential Moving Average column. Uses pandas' EWM with `span=period`."""
    print('Calculating EMA | Period: ' + str(period))
    data[f'ema_{period}'] = data[column].ewm(span=period, adjust=False).mean()
    return data

def calculate_wma_full(data: pd.DataFrame, period: int = 20,
                  column: str = 'close') -> pd.DataFrame:
    """Add a Weighted Moving Average column. More weight on recent prices: 1, 2, …, period."""
    print('Calculating WMA | Period: ' + str(period))
    weights = np.arange(1, period + 1)

    def _wma(values):
        return np.dot(values, weights) / weights.sum()

    data[f'wma_{period}'] = (
        data[column]
        .rolling(window=period, min_periods=period)
        .apply(_wma, raw=True)
    )
    return data

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

if __name__ == '__main__':
    df = calc_indicators_full('../data/data.csv')
    print('------------------------------')
    print(df.tail())
