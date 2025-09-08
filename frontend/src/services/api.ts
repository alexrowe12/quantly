// API service for fetching data from the backend

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'supersecret123';

interface ChartDataPoint {
  date: string;
  price: number;
}

interface RSIDataPoint {
  date: string;
  rsi: number;
}

interface ChartDataResponse {
  price_data: ChartDataPoint[];
  rsi_data: RSIDataPoint[];
  metadata: {
    ticker: string;
    start_date: string;
    end_date: string;
    total_days: number;
    rsi_days: number;
  };
}

export interface StockData {
  timestamp: string;
  price: number;
}

export interface RSIData {
  timestamp: string;
  rsi: number;
}

class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

// Backtest interfaces
interface StrategyConfig {
  name: string;
  trade_percent: number;
  threshold?: number;
  period?: number;
  fast_period?: number;
  slow_period?: number;
  signal_period?: number;
}

interface BacktestRequest {
  ticker: string;
  starting_value: number;
  buy_strategies: StrategyConfig[];
  sell_strategies: StrategyConfig[];
  start_date?: string;
  end_date?: string;
}

interface TradeRecord {
  action: string;
  price: number;
  timestamp: string;
}

interface BacktestResult {
  starting_value: number;
  final_value: number;
  trades: TradeRecord[];
}

interface BacktestResponse {
  status: string;
  b_id: string;
  result: BacktestResult;
}

export async function runBacktest(backtestData: BacktestRequest): Promise<BacktestResponse> {
  try {
    console.log('Sending backtest request:', backtestData);
    
    const response = await fetch(
      `${API_BASE_URL}/api/backtest`,
      {
        method: 'POST',
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backtestData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.detail || `Backtest request failed with status ${response.status}`,
        response.status
      );
    }

    const result: BacktestResponse = await response.json();
    console.log('Backtest response:', result);
    return result;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError(`Failed to run backtest: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function fetchChartData(ticker: string = 'SPY'): Promise<{
  stockData: StockData[];
  rsiData: RSIData[];
  metadata: ChartDataResponse['metadata'];
}> {
  try {
    console.log('Fetching chart data from:', `${API_BASE_URL}/api/chart-data?ticker=${encodeURIComponent(ticker)}`);
    console.log('Using API key:', API_KEY);
    
    const response = await fetch(
      `${API_BASE_URL}/api/chart-data?ticker=${encodeURIComponent(ticker)}`,
      {
        method: 'GET',
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.detail || `API request failed with status ${response.status}`,
        response.status
      );
    }

    const data: ChartDataResponse = await response.json();

    // Transform data to match the frontend interface
    const stockData: StockData[] = data.price_data.map(point => ({
      timestamp: point.date,
      price: point.price,
    }));

    const rsiData: RSIData[] = data.rsi_data.map(point => ({
      timestamp: point.date,
      rsi: point.rsi,
    }));

    return {
      stockData,
      rsiData,
      metadata: data.metadata,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Handle network errors or other issues
    throw new ApiError(`Failed to fetch chart data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}