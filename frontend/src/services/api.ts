// API service for fetching data from the backend
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'supersecret123';

// Network timeout in milliseconds
const NETWORK_TIMEOUT = 30000;

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
  constructor(message: string, public status?: number, public details?: any) {
    super(message);
    this.name = 'ApiError';
    this.details = details;
  }
}

// Helper function to create fetch with timeout
function fetchWithTimeout(url: string, options: RequestInit, timeout = NETWORK_TIMEOUT): Promise<Response> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new ApiError('Request timed out. Please check your connection and try again.', 408));
    }, timeout);

    fetch(url, options)
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timeoutId));
  });
}

// Helper function to handle common API errors
function handleApiError(error: any, context: string): never {
  console.error(`${context} error:`, error);
  
  if (error instanceof ApiError) {
    throw error;
  }
  
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    throw new ApiError('Unable to connect to server. Please check your internet connection.', 0);
  }
  
  throw new ApiError(`${context} failed: ${error.message || 'Unknown error'}`, error.status);
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

// Validation functions
function validateBacktestRequest(data: BacktestRequest): string[] {
  const errors: string[] = [];
  
  if (!data.ticker || data.ticker.trim().length === 0) {
    errors.push('Ticker symbol is required');
  }
  
  if (data.starting_value <= 0) {
    errors.push('Starting value must be greater than 0');
  }
  
  if (data.buy_strategies.length === 0 && data.sell_strategies.length === 0) {
    errors.push('At least one buy or sell strategy is required');
  }
  
  // Validate each strategy
  [...data.buy_strategies, ...data.sell_strategies].forEach((strategy, index) => {
    if (strategy.trade_percent <= 0 || strategy.trade_percent >= 1) {
      errors.push(`Strategy ${index + 1}: Trade percent must be between 0 and 1`);
    }
    
    if (strategy.name.includes('rsi') && (strategy.threshold === undefined || strategy.threshold < 0 || strategy.threshold > 100)) {
      errors.push(`Strategy ${index + 1}: RSI threshold must be between 0 and 100`);
    }
    
    if (strategy.name.includes('macd')) {
      if (!strategy.fast_period || strategy.fast_period < 1) {
        errors.push(`Strategy ${index + 1}: MACD fast period must be at least 1`);
      }
      if (!strategy.slow_period || strategy.slow_period < 1) {
        errors.push(`Strategy ${index + 1}: MACD slow period must be at least 1`);
      }
      if (!strategy.signal_period || strategy.signal_period < 1) {
        errors.push(`Strategy ${index + 1}: MACD signal period must be at least 1`);
      }
    }
    
    if ((strategy.name.includes('sma') || strategy.name.includes('ema') || strategy.name.includes('wma')) 
        && (!strategy.period || strategy.period < 1 || strategy.period > 200)) {
      errors.push(`Strategy ${index + 1}: Period must be between 1 and 200`);
    }
  });
  
  return errors;
}

export async function runBacktest(backtestData: BacktestRequest): Promise<BacktestResponse> {
  try {
    // Validate input data
    const validationErrors = validateBacktestRequest(backtestData);
    if (validationErrors.length > 0) {
      const errorMessage = `Invalid backtest configuration:\n${validationErrors.join('\n')}`;
      toast.error(errorMessage);
      throw new ApiError(errorMessage, 400, { validationErrors });
    }

    console.log('Sending backtest request:', backtestData);
    toast.loading('Running backtest...', { id: 'backtest' });
    
    const response = await fetchWithTimeout(
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
      const errorMessage = errorData.detail || `Server error (${response.status})`;
      toast.error(errorMessage, { id: 'backtest' });
      throw new ApiError(errorMessage, response.status, errorData);
    }

    const result: BacktestResponse = await response.json();
    console.log('Backtest response:', result);
    
    // Success notification
    const profit = result.result.final_value - result.result.starting_value;
    const profitPercent = ((profit / result.result.starting_value) * 100).toFixed(2);
    const profitText = profit >= 0 ? `+${profitPercent}%` : `${profitPercent}%`;
    
    toast.success(`Backtest complete: ${profitText} return`, { id: 'backtest' });
    
    return result;
  } catch (error) {
    toast.dismiss('backtest');
    handleApiError(error, 'Backtest');
  }
}

export async function fetchChartData(ticker: string = 'SPY'): Promise<{
  stockData: StockData[];
  rsiData: RSIData[];
  metadata: ChartDataResponse['metadata'];
}> {
  try {
    if (!ticker || ticker.trim().length === 0) {
      throw new ApiError('Ticker symbol is required', 400);
    }

    console.log('Fetching chart data from:', `${API_BASE_URL}/api/chart-data?ticker=${encodeURIComponent(ticker)}`);
    console.log('Using API key:', API_KEY);
    
    toast.loading(`Loading ${ticker} chart data...`, { id: 'chart-data' });
    
    const response = await fetchWithTimeout(
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
      let errorMessage = errorData.detail || `Failed to load chart data (${response.status})`;
      
      if (response.status === 404) {
        errorMessage = `No data found for ticker ${ticker}. Please check the ticker symbol.`;
      }
      
      toast.error(errorMessage, { id: 'chart-data' });
      throw new ApiError(errorMessage, response.status, errorData);
    }

    const data: ChartDataResponse = await response.json();

    // Validate response data
    if (!data.price_data || data.price_data.length === 0) {
      const errorMessage = `No price data available for ${ticker}`;
      toast.error(errorMessage, { id: 'chart-data' });
      throw new ApiError(errorMessage, 404);
    }

    // Transform data to match the frontend interface
    const stockData: StockData[] = data.price_data.map(point => ({
      timestamp: point.date,
      price: point.price,
    }));

    const rsiData: RSIData[] = data.rsi_data.map(point => ({
      timestamp: point.date,
      rsi: point.rsi,
    }));

    toast.success(`Loaded ${data.metadata.total_days} days of data for ${ticker}`, { id: 'chart-data' });

    return {
      stockData,
      rsiData,
      metadata: data.metadata,
    };
  } catch (error) {
    toast.dismiss('chart-data');
    handleApiError(error, 'Chart data fetch');
  }
}