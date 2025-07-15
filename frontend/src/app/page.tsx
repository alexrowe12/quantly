// app/backtest/page.tsx
"use client";

import { useState } from "react";

interface StrategyConfig {
  name: string;
  trade_percent: number;
  threshold?: number;
}

interface BacktestResponse {
  status: string;
  b_id: string;
  result: {
    starting_value: number;
    final_value: number;
    trades: Array<{
      action: "buy" | "sell";
      price: number;
      timestamp: string;
    }>;
  };
}

interface PricePoint {
  ticker: string;
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export default function BacktestPage() {
  // --- Backtest state ---
  const [ticker, setTicker] = useState<string>("SPY");
  const [startingValue, setStartingValue] = useState<number>(1_000_000);
  const [buyStrategies] = useState<StrategyConfig[]>([
    { name: "rsi_oversold", trade_percent: 0.3, threshold: 25 },
  ]);
  const [sellStrategies] = useState<StrategyConfig[]>([
    { name: "rsi_overbought", trade_percent: 0.3, threshold: 75 },
  ]);
  const [backtestResult, setBacktestResult] = useState<BacktestResponse | null>(null);
  const [backtestError, setBacktestError] = useState<string | null>(null);

  // --- Price-range state ---
  // default dates to today
  const today = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState<string>(today);
  const [endDate, setEndDate] = useState<string>(today);
  const [limit, setLimit] = useState<number>(1000);
  const [priceData, setPriceData] = useState<PricePoint[] | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);

  const handleRunBacktest = async () => {
    setBacktestError(null);
    setBacktestResult(null);

    try {
      const res = await fetch("http://localhost:8000/api/backtest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": "supersecret123",
        },
        body: JSON.stringify({
          ticker,
          starting_value: startingValue,
          buy_strategies: buyStrategies,
          sell_strategies: sellStrategies,
        }),
      });

      if (!res.ok) {
        const errBody = await res.json();
        setBacktestError(JSON.stringify(errBody, null, 2));
        return;
      }

      const json: BacktestResponse = await res.json();
      setBacktestResult(json);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setBacktestError(e.message);
      } else {
        setBacktestError(String(e));
      }
    }
  };

  const handleFetchPrices = async () => {
    setPriceError(null);
    setPriceData(null);

    // convert YYYY-MM-DD to ISO strings (start at midnight UTC)
    const startIso = new Date(startDate).toISOString();
    // end at end of the day UTC
    const endDt = new Date(endDate);
    endDt.setHours(23, 59, 59, 999);
    const endIso = endDt.toISOString();

    const params = new URLSearchParams({
      ticker,
      start: startIso,
      end: endIso,
      limit: limit.toString(),
    });

    try {
      const res = await fetch(`http://localhost:8000/api/prices?${params}`, {
        headers: {
          "X-API-KEY": "supersecret123",
        },
      });

      if (!res.ok) {
        const errBody = await res.json();
        setPriceError(JSON.stringify(errBody, null, 2));
        return;
      }

      const json: PricePoint[] = await res.json();
      setPriceData(json);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setPriceError(e.message);
      } else {
        setPriceError(String(e));
      }
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      {/* --- Backtest Section --- */}
      <section>
        <h1 className="text-2xl font-bold mb-4">Run Backtest</h1>

        <div className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Ticker</label>
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              className="w-full border px-3 py-2 rounded"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Starting Value</label>
            <input
              type="number"
              value={startingValue}
              onChange={(e) => setStartingValue(Number(e.target.value))}
              className="w-full border px-3 py-2 rounded"
            />
          </div>

          <button
            onClick={handleRunBacktest}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Run Backtest
          </button>

          {backtestError && (
            <pre className="mt-4 p-3 bg-red-100 text-red-800 rounded">
              <strong>Error:</strong> {backtestError}
            </pre>
          )}

          {backtestResult && (
            <div className="mt-4">
              <h2 className="text-xl font-semibold">Backtest Result</h2>
              <pre className="mt-2 p-3 bg-gray-100 rounded">
                {JSON.stringify(backtestResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </section>

      {/* --- Price Range Section --- */}
      <section>
        <h1 className="text-2xl font-bold mb-4">Fetch Price Data</h1>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-medium">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border px-3 py-2 rounded"
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border px-3 py-2 rounded"
              />
            </div>
          </div>

          <div>
            <label className="block mb-1 font-medium">Limit</label>
            <input
              type="number"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="w-full border px-3 py-2 rounded"
            />
          </div>

          <button
            onClick={handleFetchPrices}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Fetch Prices
          </button>

          {priceError && (
            <pre className="mt-4 p-3 bg-red-100 text-red-800 rounded">
              <strong>Error:</strong> {priceError}
            </pre>
          )}

          {priceData && (
            <div className="mt-4">
              <h2 className="text-xl font-semibold">Price Data</h2>
              <pre className="mt-2 p-3 bg-gray-100 rounded overflow-auto max-h-64">
                {JSON.stringify(priceData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
