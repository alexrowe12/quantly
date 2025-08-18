# defines data models for db schema (SQLAlchemy ORM) and API request/response schemas (Pydantic).

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
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
    period: Optional[int] = Field(None, ge=1, le=200, description="Indicator period (e.g., RSI period, SMA period)")
    fast_period: Optional[int] = Field(None, ge=1, le=200, description="MACD fast period")
    slow_period: Optional[int] = Field(None, ge=1, le=200, description="MACD slow period")
    signal_period: Optional[int] = Field(None, ge=1, le=200, description="MACD signal period")

class BacktestRequest(BaseModel):
    ticker: str
    starting_value: float = Field(..., gt=0)
    buy_strategies: List[StrategyConfig]
    sell_strategies: List[StrategyConfig]
    start_date: Optional[datetime] = Field(None, description="Start date for backtest (ISO8601)")
    end_date: Optional[datetime] = Field(None, description="End date for backtest (ISO8601)")

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