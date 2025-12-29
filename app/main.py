# Defines FastAPI web service layer, exposes HTTP API endpoints

import os
import uuid
import traceback
import logging
from datetime import datetime
from typing import List, Dict, Any

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

from fastapi import FastAPI, HTTPException, Header, Depends, Query, Request
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exception_handlers import http_exception_handler
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
import pandas as pd

from pydantic import BaseModel, ValidationError

from .models import BacktestRequest, BacktestResponse, BacktestResult
from .backtest_engine import run_backtest
from .db import SessionLocal

# — load env & API key —
load_dotenv()
API_KEY = os.getenv("API_KEY", "CHANGE_THIS")

# CORS origins - comma-separated list in .env, defaults to localhost
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

# — FastAPI setup —
app = FastAPI(
    title="Quantly Backtest API",
    version="1.0",
    docs_url="/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# ─────────────────────────────
# ERROR HANDLERS
# ─────────────────────────────

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle Pydantic validation errors with detailed field-specific messages"""
    errors = []
    for error in exc.errors():
        field = " -> ".join(str(x) for x in error["loc"])
        message = error["msg"]
        errors.append(f"{field}: {message}")
    
    return HTTPException(
        status_code=422,
        detail=f"Validation failed: {'; '.join(errors)}"
    )

@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    """Handle value errors in business logic"""
    return HTTPException(
        status_code=400,
        detail=f"Invalid data: {str(exc)}"
    )

@app.exception_handler(SQLAlchemyError)
async def database_error_handler(request: Request, exc: SQLAlchemyError):
    """Handle database errors"""
    print(f"Database error: {exc}")
    return HTTPException(
        status_code=500,
        detail="Database error occurred. Please try again later."
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected errors"""
    print(f"Unexpected error: {exc}")
    print(f"Traceback: {traceback.format_exc()}")
    return HTTPException(
        status_code=500,
        detail="An unexpected error occurred. Please try again later."
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
def backtest(req: BacktestRequest, db: Session = Depends(get_db)):
    """Run a backtest with comprehensive error handling and validation"""
    try:
        # Additional validation
        if not req.ticker or not req.ticker.strip():
            raise HTTPException(status_code=400, detail="Ticker symbol is required and cannot be empty")

        # Normalize ticker
        req.ticker = req.ticker.strip().upper()

        if req.starting_value <= 0:
            raise HTTPException(status_code=400, detail="Starting value must be greater than 0. Please enter a positive dollar amount.")

        if len(req.buy_strategies) == 0 and len(req.sell_strategies) == 0:
            raise HTTPException(status_code=400, detail="At least one buy or sell strategy must be configured. Please add a strategy before running backtest.")

        # Validate ticker exists in database
        ticker_check_sql = """
            SELECT COUNT(*) as count FROM price_data WHERE ticker = :ticker
        """
        ticker_result = db.execute(text(ticker_check_sql), {"ticker": req.ticker}).mappings().first()

        if not ticker_result or ticker_result['count'] == 0:
            raise HTTPException(
                status_code=404,
                detail=f"No price data found for ticker '{req.ticker}'. Please check the ticker symbol or select from available tickers."
            )

        # Check if sufficient data exists
        if ticker_result['count'] < 30:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient data for ticker '{req.ticker}'. Found only {ticker_result['count']} data points. At least 30 days of data is recommended for reliable backtesting."
            )
        
        # Validate strategy configurations
        all_strategies = req.buy_strategies + req.sell_strategies
        for i, strategy in enumerate(all_strategies):
            strategy_type = "buy" if i < len(req.buy_strategies) else "sell"
            strategy_num = (i + 1) if i < len(req.buy_strategies) else (i - len(req.buy_strategies) + 1)
            
            if strategy.trade_percent <= 0 or strategy.trade_percent >= 1:
                raise HTTPException(
                    status_code=400, 
                    detail=f"{strategy_type.capitalize()} strategy {strategy_num}: Trade percent must be between 0 and 1 (exclusive)"
                )
            
            # Strategy-specific validations
            if "rsi" in strategy.name.lower():
                if strategy.threshold is None or strategy.threshold < 0 or strategy.threshold > 100:
                    raise HTTPException(
                        status_code=400,
                        detail=f"{strategy_type.capitalize()} strategy {strategy_num}: RSI threshold must be between 0 and 100"
                    )
            
            if "macd" in strategy.name.lower():
                if not strategy.fast_period or strategy.fast_period < 1:
                    raise HTTPException(
                        status_code=400,
                        detail=f"{strategy_type.capitalize()} strategy {strategy_num}: MACD fast period must be at least 1"
                    )
                if not strategy.slow_period or strategy.slow_period < 1:
                    raise HTTPException(
                        status_code=400,
                        detail=f"{strategy_type.capitalize()} strategy {strategy_num}: MACD slow period must be at least 1"
                    )
                if not strategy.signal_period or strategy.signal_period < 1:
                    raise HTTPException(
                        status_code=400,
                        detail=f"{strategy_type.capitalize()} strategy {strategy_num}: MACD signal period must be at least 1"
                    )
        
        # Generate backtest ID
        b_id = f"backtest{datetime.utcnow().strftime('%y%m%d%H%M%S')}-{uuid.uuid4().hex[:6]}"
        
        # Run the backtest
        result = run_backtest(
            ticker=req.ticker,
            starting_value=req.starting_value,
            buy_strats=[s.dict() for s in req.buy_strategies],
            sell_strats=[s.dict() for s in req.sell_strategies],
            start_date=req.start_date,
            end_date=req.end_date,
        )
        
        # Validate backtest results
        if not result:
            raise HTTPException(status_code=500, detail="Backtest engine returned no results")
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=f"Backtest failed: {result['error']}")
        
        # Check if any trades were generated
        if len(result.get("trades", [])) == 0:
            print(f"Warning: No trades were generated for backtest {b_id}")
        
        return BacktestResponse(
            status="completed",
            b_id=b_id,
            result=BacktestResult(**result),
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid input data: {str(e)}")
    except Exception as e:
        print(f"Unexpected error in backtest endpoint: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred during backtesting. Please try again.")

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

# Separate OPTIONS endpoint to avoid dependency issues
@app.options("/api/chart-data")
def chart_data_options():
    return Response(status_code=200)

@app.get(
    "/api/chart-data",
    response_model=ChartDataResponse,
    dependencies=[Depends(verify_api_key)],
)
def get_chart_data(
    ticker: str = Query("SPY", description="Ticker symbol"),
    db: Session = Depends(get_db),
):
    """Get chart data with comprehensive error handling"""
    try:
        # Validate ticker input
        if not ticker or not ticker.strip():
            raise HTTPException(status_code=400, detail="Ticker symbol is required and cannot be empty")
        
        ticker = ticker.strip().upper()  # Normalize ticker
        
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
            raise HTTPException(
                status_code=404, 
                detail=f"No price data found for ticker '{ticker}'. Please check the ticker symbol or contact support if this symbol should be available."
            )
        
        if len(rows) < 15:  # Need at least 15 days for RSI calculation
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient data for ticker '{ticker}'. Found {len(rows)} days, but need at least 15 days for technical indicators."
            )
        
        # Convert to DataFrame for technical indicator calculations
        try:
            df = pd.DataFrame([dict(row) for row in rows])
            df['trading_date'] = pd.to_datetime(df['trading_date'])
            df = df.sort_values('trading_date').reset_index(drop=True)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error processing price data: {str(e)}")
        
        # Calculate RSI (14-period) with error handling
        try:
            delta = df['price'].diff()
            gain = delta.where(delta > 0, 0.0)
            loss = -delta.where(delta < 0, 0.0)
            
            period = 14
            avg_gain = gain.ewm(alpha=1/period, min_periods=period, adjust=False).mean()
            avg_loss = loss.ewm(alpha=1/period, min_periods=period, adjust=False).mean()
            
            # Avoid division by zero
            avg_loss = avg_loss.replace(0, 1e-10)
            rs = avg_gain / avg_loss
            df['rsi'] = 100 - (100 / (1 + rs))
        except Exception as e:
            print(f"Error calculating RSI for {ticker}: {e}")
            # If RSI calculation fails, create dummy RSI data
            df['rsi'] = float('nan')
        
        # Format data for frontend with error handling
        try:
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
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error formatting chart data: {str(e)}")
        
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
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except SQLAlchemyError as e:
        print(f"Database error in chart data endpoint: {e}")
        raise HTTPException(status_code=500, detail="Database error occurred while fetching chart data")
    except Exception as e:
        print(f"Unexpected error in chart data endpoint: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred while fetching chart data")

# ─────────────────────────────
# TICKER VALIDATION ENDPOINTS
# ─────────────────────────────

class TickerInfo(BaseModel):
    ticker: str
    start_date: str
    end_date: str
    total_days: int

class AvailableTickersResponse(BaseModel):
    tickers: List[TickerInfo]
    total_count: int

@app.get(
    "/api/tickers",
    response_model=AvailableTickersResponse,
    dependencies=[Depends(verify_api_key)],
)
def get_available_tickers(db: Session = Depends(get_db)):
    """Get list of all available tickers with date ranges"""
    try:
        sql = """
            SELECT
                ticker,
                MIN(DATE(timestamp)) as start_date,
                MAX(DATE(timestamp)) as end_date,
                COUNT(DISTINCT DATE(timestamp)) as total_days
            FROM price_data
            GROUP BY ticker
            ORDER BY ticker
        """

        rows = db.execute(text(sql)).mappings().all()

        if not rows:
            return AvailableTickersResponse(tickers=[], total_count=0)

        tickers = [
            TickerInfo(
                ticker=row['ticker'],
                start_date=str(row['start_date']),
                end_date=str(row['end_date']),
                total_days=row['total_days']
            )
            for row in rows
        ]

        return AvailableTickersResponse(tickers=tickers, total_count=len(tickers))

    except SQLAlchemyError as e:
        print(f"Database error in tickers endpoint: {e}")
        raise HTTPException(status_code=500, detail="Database error occurred while fetching available tickers")
    except Exception as e:
        print(f"Unexpected error in tickers endpoint: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred while fetching tickers")

class TickerValidationResponse(BaseModel):
    exists: bool
    ticker: str
    start_date: str | None = None
    end_date: str | None = None
    total_days: int | None = None
    message: str

@app.get(
    "/api/validate-ticker/{ticker}",
    response_model=TickerValidationResponse,
    dependencies=[Depends(verify_api_key)],
)
def validate_ticker(ticker: str, db: Session = Depends(get_db)):
    """Validate if a ticker exists and return its data range"""
    try:
        ticker = ticker.strip().upper()

        if not ticker:
            raise HTTPException(status_code=400, detail="Ticker symbol cannot be empty")

        sql = """
            SELECT
                ticker,
                MIN(DATE(timestamp)) as start_date,
                MAX(DATE(timestamp)) as end_date,
                COUNT(DISTINCT DATE(timestamp)) as total_days
            FROM price_data
            WHERE ticker = :ticker
            GROUP BY ticker
        """

        result = db.execute(text(sql), {"ticker": ticker}).mappings().first()

        if not result:
            return TickerValidationResponse(
                exists=False,
                ticker=ticker,
                message=f"No data found for ticker '{ticker}'. Please check the ticker symbol or choose from available tickers."
            )

        if result['total_days'] < 30:
            return TickerValidationResponse(
                exists=True,
                ticker=ticker,
                start_date=str(result['start_date']),
                end_date=str(result['end_date']),
                total_days=result['total_days'],
                message=f"Warning: Only {result['total_days']} days of data available. Recommend at least 30 days for reliable backtesting."
            )

        return TickerValidationResponse(
            exists=True,
            ticker=ticker,
            start_date=str(result['start_date']),
            end_date=str(result['end_date']),
            total_days=result['total_days'],
            message=f"Ticker '{ticker}' is available with {result['total_days']} days of data from {result['start_date']} to {result['end_date']}."
        )

    except HTTPException:
        raise
    except SQLAlchemyError as e:
        print(f"Database error in validate ticker endpoint: {e}")
        raise HTTPException(status_code=500, detail="Database error occurred while validating ticker")
    except Exception as e:
        print(f"Unexpected error in validate ticker endpoint: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred while validating ticker")
