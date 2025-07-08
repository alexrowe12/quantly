import pandas as pd

from strategy.main import tick
from data_proc.proc_df import proc_df
from data_proc.calc_indicators_full import (
    calculate_rsi_full,
    calculate_macd_full,
    calculate_sma_full,
    calculate_ema_full,
    calculate_wma_full,
)

FREQUENCY = '1h'

def main():
    df = proc_df('./data/data.csv')

    df = calculate_rsi_full(df, period=14)
    df = calculate_macd_full(df, fast=12, slow=26, signal=9)
    df = calculate_sma_full(df, period=20)
    df = calculate_ema_full(df, period=20)
    df = calculate_wma_full(df, period=20)

    df.sort_index(inplace=True)

    portfolio_value = 1_000_000.0
    entry_price = None
    trade_capital = 0.0

    tick_points = (
        df
        .resample(FREQUENCY)
        .last()
        .dropna(subset=['close', 'rsi'])
    )

    for ts in tick_points.index:
        real_ts = df.index.asof(ts)
        signal = tick(df, ts)
        if signal == 1:
            entry_price = df.at[real_ts, 'close']
            trade_capital = portfolio_value * 0.5
        elif signal == -1 and entry_price is not None:
            exit_price = df.at[real_ts, 'close']
            profit = trade_capital * (exit_price - entry_price) / entry_price
            portfolio_value += profit
            print(f"Trade P/L: {profit:,.2f}   New portfolio value: {portfolio_value:,.2f}")
            entry_price = None
            trade_capital = 0.0

    print(f"\nFinal portfolio value: {portfolio_value:,.2f}")

if __name__ == '__main__':
    main()