# strategy/main.py

import pandas as pd

positions = {}
position_open = False

def buy(timestamp, price, rsi):
    """
    Record a buy at timestamp/price/rsi, flip position_open on.
    """
    global position_open
    if position_open:
        return
    positions[timestamp] = {
        'action': 'buy',
        'price': price,
        'rsi': rsi
    }
    position_open = True
    print(f"BUY  at {price} on {timestamp} (RSI: {rsi:.2f})")

def sell(timestamp, price, rsi):
    """
    Record a sell at timestamp/price/rsi, flip position_open off.
    """
    global position_open
    if not position_open:
        return
    positions[timestamp] = {
        'action': 'sell',
        'price': price,
        'rsi': rsi
    }
    position_open = False
    print(f"SELL at {price} on {timestamp} (RSI: {rsi:.2f})")

def rsi_oversold(df: pd.DataFrame, threshold: float = 20) -> bool:
    return df['rsi'].iloc[-1] < threshold

def rsi_overbought(df: pd.DataFrame, threshold: float = 80) -> bool:
    return df['rsi'].iloc[-1] > threshold

def tick(full_df: pd.DataFrame, ts) -> int:
    """
    At resampled timestamp ts, find the last actual index <= ts,
    slice up to that point, then buy/sell if signaled.
    """
    # find last real timestamp ≤ ts
    real_ts = full_df.index.asof(ts)
    if pd.isna(real_ts):
        return 0

    window   = full_df.loc[:real_ts]
    price    = window['close'].iloc[-1]
    rsi_val  = window['rsi'].iloc[-1]

    # buy if oversold and flat
    if (not position_open) and rsi_oversold(window):
        buy(real_ts, price, rsi_val)
        return 1

    # sell if overbought and long
    if position_open and rsi_overbought(window):
        sell(real_ts, price, rsi_val)
        return -1

    return 0