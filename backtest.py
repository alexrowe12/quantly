import pandas as pd

from data_proc.proc_df               import proc_df
from data_proc.calc_indicators_full import (
    calculate_rsi_full,
    calculate_macd_full,
    calculate_sma_full,
    calculate_ema_full,
    calculate_wma_full,
)

df = proc_df('./data/data.csv')

df = calculate_rsi_full(df, period=14)
df = calculate_macd_full(df, fast=12, slow=26, signal=9)
df = calculate_sma_full(df, period=20)
df = calculate_ema_full(df, period=20)
df = calculate_wma_full(df, period=20)

with pd.option_context('display.max_rows', 300):
    print(df.head(300))


for ts, row in df.iterrows():
    # Strategy logic
    pass
