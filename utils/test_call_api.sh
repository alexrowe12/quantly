# Test script to see if api is working locally

curl -X POST http://localhost:8000/api/backtest \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: supersecret123" \
  -d '{
    "ticker": "SPY",
    "starting_value": 1000000,
    "buy_strategies":[
      {"name":"rsi_oversold","trade_percent":0.3,"threshold":25}
    ],
    "sell_strategies":[
      {"name":"rsi_overbought","trade_percent":0.3,"threshold":75}
    ]
  }'
