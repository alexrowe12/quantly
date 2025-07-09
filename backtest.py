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

# ——— USER CONFIGURABLE ———
TRADE_PERCENT = 0.5  # fraction of portfolio per trade (e.g. 0.5 = 50%)
FREQUENCY     = '1D' # '1T', '5T', '30T', '1h', '4h', '1D', '1W'

GREEN = "\033[92m"
RED   = "\033[91m"
RESET = "\033[0m"

def main():
    df = proc_df('./data/data.csv')

    df = calculate_rsi_full(df, period=14)
    df = calculate_macd_full(df, fast=12, slow=26, signal=9)
    df = calculate_sma_full(df, period=20)
    df = calculate_ema_full(df, period=20)
    df = calculate_wma_full(df, period=20)
    df.sort_index(inplace=True)

    portfolio_value   = 1_000_000.0
    entry_price       = None
    trade_capital     = 0.0
    committed_capital = 0.0

    tick_points = (
        df
        .resample(FREQUENCY)
        .last()
        .dropna(subset=['close', 'rsi'])
    )

    for ts in tick_points.index:
        real_ts, info = df.index.asof(ts), None
        signal, info = tick(df, ts)

        # BUY signal
        if signal == 1:
            amount    = portfolio_value * TRADE_PERCENT
            available = portfolio_value - committed_capital
            if amount <= available:
                entry_price     = df.at[real_ts, 'close']
                trade_capital   = amount
                committed_capital += trade_capital

                pct = TRADE_PERCENT * 100
                val = info.get('value', entry_price)
                print(
                    f"BUY  ({info['strategy']}) at {entry_price:.2f} "
                    f"on {real_ts} (val: {val:.2f}) with {pct:.0f}% of portfolio"
                )
            else:
                print("Trade failed to complete, not enough available capital")

        # SELL signal
        elif signal == -1 and entry_price is not None:
            exit_price = df.at[real_ts, 'close']
            profit     = trade_capital * (exit_price - entry_price) / entry_price
            portfolio_value   += profit
            committed_capital -= trade_capital

            val = info.get('value', exit_price)
            print(
                f"SELL ({info['strategy']}) at {exit_price:.2f} "
                f"on {real_ts} (val: {val:.2f})"
            )

            color = GREEN if profit >= 0 else RED
            print(
                color +
                f"Trade details: entry={entry_price:.2f}, exit={exit_price:.2f}, "
                f"capital=${trade_capital:,.2f} P/L: {profit:,.2f} "
                f"New portfolio value: {portfolio_value:,.2f}" +
                RESET
            )
            print("-----------------------------------------------------------------")

            entry_price   = None
            trade_capital = 0.0

    if entry_price is not None:
        last_ts    = df.index[-1]
        last_price = df['close'].iloc[-1]
        profit     = trade_capital * (last_price - entry_price) / entry_price
        portfolio_value   += profit
        committed_capital -= trade_capital

        print(
            f"SELL (final_close) at {last_price:.2f} "
            f"on {last_ts} (val: {last_price:.2f})"
        )
        color = GREEN if profit >= 0 else RED
        print(
            color +
            f"Trade details: entry={entry_price:.2f}, exit={last_price:.2f}, "
            f"capital=${trade_capital:,.2f} P/L: {profit:,.2f} "
            f"New portfolio value: {portfolio_value:,.2f}" +
            RESET
        )
        print("-----------------------------------------------------------------")

    print(f"\nFinal portfolio value: {portfolio_value:,.2f}")

if __name__ == '__main__':
    main()