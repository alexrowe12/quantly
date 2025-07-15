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

export default function BacktestPage() {
  const [ticker, setTicker] = useState<string>("SPY");
  const [startingValue, setStartingValue] = useState<number>(1000000);
  const [buyStrategies] = useState<StrategyConfig[]>([
    { name: "rsi_oversold", trade_percent: 0.3, threshold: 25 },
  ]);
  const [sellStrategies] = useState<StrategyConfig[]>([
    { name: "rsi_overbought", trade_percent: 0.3, threshold: 75 },
  ]);
  const [result, setResult] = useState<BacktestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setResult(null);

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
        setError(JSON.stringify(errBody, null, 2));
        return;
      }

      const json: BacktestResponse = await res.json();
      setResult(json);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError(String(e));
      }
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Run Backtest</h1>

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
        onClick={handleSubmit}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Run Backtest
      </button>

      {error && (
        <pre className="mt-4 p-3 bg-red-100 text-red-800 rounded">
          <strong>Error:</strong> {error}
        </pre>
      )}

      {result && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold">Result</h2>
          <pre className="mt-2 p-3 bg-gray-100 rounded">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
