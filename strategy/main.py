# Defines trading strategy logic

import pandas as pd

positions = {}
position_open = False

# Record a buy
def buy(timestamp, price, info):
    global position_open
    if position_open:
        return
    positions[timestamp] = {
        'action': 'buy',
        'price': price,
        'strategy': info['strategy'],
        'value': info.get('value'),
        'threshold': info.get('threshold')
    }
    position_open = True

# Record a sell
def sell(timestamp, price, info):
    global position_open
    if not position_open:
        return
    positions[timestamp] = {
        'action': 'sell',
        'price': price,
        'strategy': info['strategy'],
        'value': info.get('value'),
        'threshold': info.get('threshold')
    }
    position_open = False

# Below this are buy and sell strategies corresponding to each calculated indicator
def rsi_oversold(window: pd.DataFrame, threshold: float = 20):
    val = window['rsi'].iloc[-1]
    return val < threshold, {'strategy': 'rsi_oversold', 'value': val, 'threshold': threshold}

def rsi_overbought(window: pd.DataFrame, threshold: float = 80):
    val = window['rsi'].iloc[-1]
    return val > threshold, {'strategy': 'rsi_overbought', 'value': val, 'threshold': threshold}

def macd_buy(window: pd.DataFrame):
    if len(window) < 2:
        return False, {}
    prev, curr = window['macd_hist'].iloc[-2], window['macd_hist'].iloc[-1]
    sig = prev < 0 and curr > 0
    return sig, {'strategy': 'macd_crossover', 'value': curr}

def macd_sell(window: pd.DataFrame):
    if len(window) < 2:
        return False, {}
    prev, curr = window['macd_hist'].iloc[-2], window['macd_hist'].iloc[-1]
    sig = prev > 0 and curr < 0
    return sig, {'strategy': 'macd_crossover', 'value': curr}

def sma_buy(window: pd.DataFrame, period: int = 20):
    col = f'ma_{period}'
    if len(window) < 2 or col not in window:
        return False, {}
    p0, p1 = window['close'].iloc[-2], window['close'].iloc[-1]
    m0, m1 = window[col].iloc[-2], window[col].iloc[-1]
    sig = p0 < m0 and p1 > m1
    return sig, {'strategy': f'sma_{period}_cross', 'value': p1}

def sma_sell(window: pd.DataFrame, period: int = 20):
    col = f'ma_{period}'
    if len(window) < 2 or col not in window:
        return False, {}
    p0, p1 = window['close'].iloc[-2], window['close'].iloc[-1]
    m0, m1 = window[col].iloc[-2], window[col].iloc[-1]
    sig = p0 > m0 and p1 < m1
    return sig, {'strategy': f'sma_{period}_cross', 'value': p1}

def ema_buy(window: pd.DataFrame, period: int = 20):
    col = f'ema_{period}'
    if len(window) < 2 or col not in window:
        return False, {}
    p0, p1 = window['close'].iloc[-2], window['close'].iloc[-1]
    e0, e1 = window[col].iloc[-2], window[col].iloc[-1]
    sig = p0 < e0 and p1 > e1
    return sig, {'strategy': f'ema_{period}_cross', 'value': p1}

def ema_sell(window: pd.DataFrame, period: int = 20):
    col = f'ema_{period}'
    if len(window) < 2 or col not in window:
        return False, {}
    p0, p1 = window['close'].iloc[-2], window['close'].iloc[-1]
    e0, e1 = window[col].iloc[-2], window[col].iloc[-1]
    sig = p0 > e0 and p1 < e1
    return sig, {'strategy': f'ema_{period}_cross', 'value': p1}

def wma_buy(window: pd.DataFrame, period: int = 20):
    col = f'wma_{period}'
    if len(window) < 2 or col not in window:
        return False, {}
    p0, p1 = window['close'].iloc[-2], window['close'].iloc[-1]
    w0, w1 = window[col].iloc[-2], window[col].iloc[-1]
    sig = p0 < w0 and p1 > w1
    return sig, {'strategy': f'wma_{period}_cross', 'value': p1}

def wma_sell(window: pd.DataFrame, period: int = 20):
    col = f'wma_{period}'
    if len(window) < 2 or col not in window:
        return False, {}
    p0, p1 = window['close'].iloc[-2], window['close'].iloc[-1]
    w0, w1 = window[col].iloc[-2], window[col].iloc[-1]
    sig = p0 > w0 and p1 < w1
    return sig, {'strategy': f'wma_{period}_cross', 'value': p1}

buy_strategies = [
    rsi_oversold,
    macd_buy
    # sma_buy,
    # ema_buy,
    # wma_buy
]

sell_strategies = [
    rsi_overbought,
    macd_sell
    # sma_sell,
    # ema_sell,
    # wma_sell
]

# Iterates through the dataframe and makes trades when a strategy is triggered, docstring shows schema
def tick(full_df: pd.DataFrame, ts):
    """
    Returns (signal, info):
      signal =  1 => buy
               -1 => sell
                0 => hold
      info   = the strategy dict, with 'strategy', 'value', and optional 'threshold'
    """
    real_ts = full_df.index.asof(ts)
    if pd.isna(real_ts):
        return 0, {}

    window = full_df.loc[:real_ts]
    price  = window['close'].iloc[-1]

    if not position_open:
        for strat in buy_strategies:
            signal, info = strat(window)
            if signal:
                buy(real_ts, price, info)
                return 1, info
    else:
        for strat in sell_strategies:
            signal, info = strat(window)
            if signal:
                sell(real_ts, price, info)
                return -1, info

    return 0, {}
