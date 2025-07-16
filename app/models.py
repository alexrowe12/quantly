# defines data models for db schema (SQLAlchemy ORM) and API request/response schemas (Pydantic).

from pydantic import BaseModel, Field
from typing import List, Optional
from sqlalchemy import Column, Text, TIMESTAMP, Numeric, BigInteger
from .db import Base

class PriceData(Base):
    __tablename__ = "price_data"

    ticker    = Column(Text,       primary_key=True)
    timestamp = Column(TIMESTAMP,  primary_key=True)
    open      = Column(Numeric,    nullable=False)
    high      = Column(Numeric,    nullable=False)
    low       = Column(Numeric,    nullable=False)
    close     = Column(Numeric,    nullable=False)
    volume    = Column(BigInteger, nullable=False)
    
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