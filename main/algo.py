import pandas as pd

indicators = ['rsi', 'macd', 'ma']

print('Reading CSV...')
df = pd.read_csv('../data/data.csv')

print('Prepping df...')
df = df.drop(columns=df.columns[0])
df['date'] = pd.to_datetime(df['date'], format='%Y%m%d  %H:%M:%S')
df = df.set_index('date')

def calculate_rsi(data: pd.DataFrame, period: int = 14) -> pd.DataFrame:
    """Add a 14-period RSI column."""
    delta = data['close'].diff()

    gain = delta.where(delta > 0, 0.0)
    loss = -delta.where(delta < 0, 0.0)

    avg_gain = gain.ewm(alpha = 1 / period, min_periods = period, adjust = False).mean()
    avg_loss = loss.ewm(alpha = 1 / period, min_periods = period, adjust = False).mean()

    rs = avg_gain / avg_loss
    data['rsi'] = 100 - (100 / (1 + rs))

    return data

def calculate_macd(data: pd.DataFrame,
                   fast: int = 12, slow: int = 26, signal: int = 9) -> pd.DataFrame:
    """Add MACD line, Signal line, and Histogram columns."""
    ema_fast = data['close'].ewm(span=fast, adjust=False).mean()
    ema_slow = data['close'].ewm(span=slow, adjust=False).mean()

    macd_line   = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    hist        = macd_line - signal_line

    data['macd']         = macd_line
    data['macd_signal']  = signal_line
    data['macd_hist']    = hist
    return data

def calculate_ma(data: pd.DataFrame, period: int = 20) -> pd.DataFrame:
    """Add a simple moving average of the 'close' price."""
    data[f'ma_{period}'] = data['close'].rolling(window=period).mean()
    return data

if 'rsi' in indicators:
    print('Calculating RSI...')
    df = calculate_rsi(df, period=14)
if 'macd' in indicators:
    print('Calculating MACD...')
    df = calculate_macd(df, fast=12, slow=26, signal=9)
if 'ma' in indicators:
    print('Calculating MA...')
    df = calculate_ma(df, period=20)

print('------------------------------')
print(df.tail())