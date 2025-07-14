import os
from datetime import datetime
import uuid

from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from .models import (
    BacktestRequest,
    BacktestResponse,
    BacktestResult,
)
from .backtest_engine import run_backtest

load_dotenv()

API_KEY = os.getenv("API_KEY", "CHANGE_THIS")

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

def verify_api_key(x_api_key: str = Header(...)):
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")

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
