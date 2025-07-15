import os
import uuid
from datetime import datetime
from typing import List

from fastapi import FastAPI, HTTPException, Header, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from sqlalchemy import text

from pydantic import BaseModel

from .models import BacktestRequest, BacktestResponse, BacktestResult
from .backtest_engine import run_backtest
from .db import SessionLocal

# — load env & API key —
load_dotenv()
API_KEY = os.getenv("API_KEY", "CHANGE_THIS")

# — FastAPI setup —
app = FastAPI(
    title="Quantly Backtest API",
    version="1.0",
    docs_url="/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# — Dependencies —

def verify_api_key(x_api_key: str = Header(...)):
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# — Inline Pydantic model for price rows —

class PriceData(BaseModel):
    ticker: str
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: int

# ─────────────────────────────
# BACKTEST ENDPOINT
# ─────────────────────────────

@app.post(
    "/api/backtest",
    response_model=BacktestResponse,
    status_code=200,
    dependencies=[Depends(verify_api_key)],
)
def backtest(req: BacktestRequest):
    b_id = f"backtest{datetime.utcnow().strftime('%y%m%d%H%M%S')}-{uuid.uuid4().hex[:6]}"
    result = run_backtest(
        ticker=req.ticker,
        starting_value=req.starting_value,
        buy_strats=[s.dict() for s in req.buy_strategies],
        sell_strats=[s.dict() for s in req.sell_strategies],
    )
    return BacktestResponse(
        status="completed",
        b_id=b_id,
        result=BacktestResult(**result),
    )

# ─────────────────────────────
# PRICE RANGE ENDPOINT
# ─────────────────────────────

@app.get(
    "/api/prices",
    response_model=List[PriceData],
    dependencies=[Depends(verify_api_key)],
)
def get_prices(
    ticker: str = Query(..., description="Ticker symbol (e.g. SPY)"),
    start: datetime = Query(..., description="Start of date range (ISO8601)"),
    end: datetime = Query(..., description="End of date range (ISO8601)"),
    limit: int = Query(1000, description="Max number of records to return"),
    db: Session = Depends(get_db),
):
    sql = """
        SELECT ticker, timestamp, open, high, low, close, volume
          FROM price_data
         WHERE ticker   = :ticker
           AND timestamp >= :start
           AND timestamp <= :end
         ORDER BY timestamp
         LIMIT :limit
    """
    rows = db.execute(
        text(sql),
        {"ticker": ticker, "start": start, "end": end, "limit": limit}
    ).mappings().all()

    if not rows:
        raise HTTPException(status_code=404, detail="No data found for that range")

    return rows
