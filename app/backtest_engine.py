import pandas as pd
from datetime import datetime
import uuid

from data_proc.proc_df import proc_df
from data_proc.calc_indicators_full import calc_indicators_full
from strategy.main import (
    rsi_oversold, rsi_overbought,
    macd_buy,    macd_sell,
    sma_buy,     sma_sell,
    ema_buy,     ema_sell,
    wma_buy,     wma_sell,
)

# map strategy names → functions
STRATEGY_MAP = {
    "rsi_oversold":  rsi_oversold,
    "rsi_overbought":rsi_overbought,
    "macd_buy":      macd_buy,
    "macd_sell":     macd_sell,
    "sma_buy":       sma_buy,
    "sma_sell":      sma_sell,
    "ema_buy":       ema_buy,
    "ema_sell":      ema_sell,
    "wma_buy":       wma_buy,
    "wma_sell":      wma_sell,
}

def run_backtest(
    ticker: str,
    starting_value: float,
    buy_strats: list,
    sell_strats: list,
    freq: str = "1D",
    data_path_template: str = "./data/data.csv"
) -> dict:
    df = proc_df(data_path_template.format(ticker=ticker))
    from data_proc.calc_indicators_full import (
        calculate_rsi_full,
        calculate_macd_full,
        calculate_sma_full,
        calculate_ema_full,
        calculate_wma_full,
    )
    df = calculate_rsi_full(df, period=14)
    df = calculate_macd_full(df, fast=12, slow=26, signal=9)
    df = calculate_sma_full(df, period=20)
    df = calculate_ema_full(df, period=20)
    df = calculate_wma_full(df, period=20)
    df.sort_index(inplace=True)

    from strategy.main import buy_strategies, sell_strategies
    buy_strategies[:]  = [STRATEGY_MAP[s["name"]] for s in buy_strats]
    sell_strategies[:] = [STRATEGY_MAP[s["name"]] for s in sell_strats]

    portfolio_value   = starting_value
    committed_capital = 0.0
    entry_price       = None
    trades: list      = []

    ticks = (
        df
        .resample(freq)
        .last()
        .dropna(subset=["close", "rsi"])
    )

    for ts in ticks.index:
        real_ts = df.index.asof(ts)
        if pd.isna(real_ts):
            continue
        price   = df.at[real_ts, "close"]

        signal, info = __import__("strategy.main", fromlist=["tick"]).tick(df, ts)

        # BUY
        if signal == 1:
            cfg = next(filter(lambda c: c["name"] == info["strategy"], buy_strats))
            amount = portfolio_value * cfg["trade_percent"]
            if amount <= (portfolio_value - committed_capital):
                committed_capital += amount
                entry_price = price
                trades.append({
                    "action":    "buy",
                    "price":     price,
                    "timestamp": real_ts.isoformat()
                })

        # SELL
        elif signal == -1 and entry_price is not None:
            profit = committed_capital * (price - entry_price) / entry_price
            portfolio_value += profit
            committed_capital -= committed_capital
            trades.append({
                "action":    "sell",
                "price":     price,
                "timestamp": real_ts.isoformat()
            })
            entry_price = None

    if entry_price is not None:
        last_price = df["close"].iloc[-1]
        profit = committed_capital * (last_price - entry_price) / entry_price
        portfolio_value += profit
        trades.append({
            "action":    "sell",
            "price":     last_price,
            "timestamp": df.index[-1].isoformat()
        })

    return {
        "starting_value": starting_value,
        "final_value":     portfolio_value,
        "trades":          trades,
    }
