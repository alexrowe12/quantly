# Defines FastAPI web service layer, exposes HTTP API endpoints

import os
import uuid
from datetime import datetime
from typing import List

from fastapi import FastAPI, HTTPException, Header, Depends, Query, Request
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from sqlalchemy import text
import pandas as pd

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

def verify_api_key(request: Request, x_api_key: str = Header(None)):
    # Skip API key verification for OPTIONS requests (CORS preflight)
    if request.method == "OPTIONS":
        return
    
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
        start_date=req.start_date,
        end_date=req.end_date,
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

# ─────────────────────────────
# CHART DATA ENDPOINT
# ─────────────────────────────

class ChartDataPoint(BaseModel):
    date: str  # YYYY-MM-DD format
    price: float

class RSIDataPoint(BaseModel):
    date: str  # YYYY-MM-DD format
    rsi: float

class ChartDataResponse(BaseModel):
    price_data: List[ChartDataPoint]
    rsi_data: List[RSIDataPoint]
    metadata: dict

@app.api_route(
    "/api/chart-data",
    methods=["GET", "OPTIONS"],
    dependencies=[Depends(verify_api_key)],
)
def get_chart_data(
    request: Request,
    ticker: str = Query("SPY", description="Ticker symbol"),
    db: Session = Depends(get_db),
):
    # Handle OPTIONS request for CORS preflight
    if request.method == "OPTIONS":
        return Response(status_code=200)
    # Get daily closing prices (last timestamp of each trading day)
    sql = """
        WITH daily_closes AS (
            SELECT 
                DATE(timestamp) as trading_date,
                ticker,
                close,
                ROW_NUMBER() OVER (PARTITION BY DATE(timestamp) ORDER BY timestamp DESC) as rn
            FROM price_data 
            WHERE ticker = :ticker
        )
        SELECT 
            trading_date,
            close as price
        FROM daily_closes 
        WHERE rn = 1
        ORDER BY trading_date ASC
    """
    
    rows = db.execute(
        text(sql),
        {"ticker": ticker}
    ).mappings().all()
    
    if not rows:
        raise HTTPException(status_code=404, detail=f"No data found for ticker {ticker}")
    
    # Convert to DataFrame for technical indicator calculations
    df = pd.DataFrame([dict(row) for row in rows])
    df['trading_date'] = pd.to_datetime(df['trading_date'])
    df = df.sort_values('trading_date').reset_index(drop=True)
    
    # Calculate RSI (14-period)
    delta = df['price'].diff()
    gain = delta.where(delta > 0, 0.0)
    loss = -delta.where(delta < 0, 0.0)
    
    period = 14
    avg_gain = gain.ewm(alpha=1/period, min_periods=period, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1/period, min_periods=period, adjust=False).mean()
    
    rs = avg_gain / avg_loss
    df['rsi'] = 100 - (100 / (1 + rs))
    
    # Format data for frontend
    price_data = [
        ChartDataPoint(
            date=row['trading_date'].strftime("%Y-%m-%d"),
            price=float(row['price'])
        )
        for _, row in df.iterrows()
    ]
    
    # RSI data (skip NaN values from the first 14 days)
    rsi_data = [
        RSIDataPoint(
            date=row['trading_date'].strftime("%Y-%m-%d"),
            rsi=float(row['rsi'])
        )
        for _, row in df.iterrows()
        if pd.notna(row['rsi'])
    ]
    
    metadata = {
        "ticker": ticker,
        "start_date": price_data[0].date if price_data else None,
        "end_date": price_data[-1].date if price_data else None,
        "total_days": len(price_data),
        "rsi_days": len(rsi_data)
    }
    
    return ChartDataResponse(
        price_data=price_data,
        rsi_data=rsi_data,
        metadata=metadata
    )
