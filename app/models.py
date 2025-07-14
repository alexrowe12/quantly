from pydantic import BaseModel, Field
from typing import List, Optional

class StrategyConfig(BaseModel):
    name: str
    trade_percent: float = Field(..., gt=0, lt=1, description="Fraction of portfolio to trade")
    threshold: Optional[float] = None

class BacktestRequest(BaseModel):
    ticker: str
    starting_value: float = Field(..., gt=0)
    buy_strategies: List[StrategyConfig]
    sell_strategies: List[StrategyConfig]

class TradeRecord(BaseModel):
    action: str       # "buy" or "sell"
    price: float
    timestamp: str    # ISO8601

class BacktestResult(BaseModel):
    starting_value: float
    final_value: float
    trades: List[TradeRecord]

class BacktestResponse(BaseModel):
    status: str
    b_id: str
    result: BacktestResult