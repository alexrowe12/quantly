# backtest.py

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

# ───────────────────────────────────────────────────────────────────────────────
# USER‐CONFIGURABLE FREQUENCY:
#   '1T'   = 1 minute
#   '5T'   = 5 minutes
#   '30T'  = 30 minutes
#   '1h'   = 1 hour    ← lowercase 'h' to avoid FutureWarning
#   '4h'   = 4 hours
#   '1D'   = 1 day
#   '1W'   = 1 week
FREQUENCY = '1h'
# ───────────────────────────────────────────────────────────────────────────────

def main():
    # 1) load, dedupe & sort
    df = proc_df('./data/data.csv')

    # 2) compute indicators
    df = calculate_rsi_full(df, period=14)
    df = calculate_macd_full(df, fast=12, slow=26, signal=9)
    df = calculate_sma_full(df, period=20)
    df = calculate_ema_full(df, period=20)
    df = calculate_wma_full(df, period=20)

    # 3) (redundant if proc_df already sorted) ensure monotonic index
    df.sort_index(inplace=True)

    # 4) pick resampled points
    tick_points = (
        df
        .resample(FREQUENCY)
        .last()
        .dropna(subset=['close', 'rsi'])
    )

    # 5) backtest: only at those times
    for ts in tick_points.index:
        tick(df, ts)

if __name__ == '__main__':
    main()
