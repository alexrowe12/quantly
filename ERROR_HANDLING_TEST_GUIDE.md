# Error Handling Testing Guide

This guide explains how to test all the error handling improvements added to your Quantly app.

## 🧪 **Testing Overview**

The app now has comprehensive error handling across:
- Frontend validation and user feedback
- Backend API error responses
- Network connectivity issues
- Database errors
- Chart loading and rendering
- Strategy configuration validation

---

## 🔧 **Test Setup**

Before running tests, ensure:
1. **Backend running**: `http://localhost:8000`
2. **Frontend running**: `http://localhost:3000`
3. **Database accessible**: PostgreSQL with price data

---

## 📋 **Test Cases**

### **1. Strategy Configuration Validation**

#### Test Invalid Trade Percentages
1. **Steps**:
   - Create a new strategy (buy or sell)
   - Set trade percent to `0` or `1.5`
   - Click "Run Backtest"

2. **Expected Result**:
   - ❌ Red toast notification: "Strategy X: Trade percent must be between 0 and 1"
   - No API call made (validated client-side first)

#### Test Invalid RSI Values  
1. **Steps**:
   - Add RSI strategy (oversold/overbought)
   - Set threshold to `-10` or `150`
   - Click "Run Backtest"

2. **Expected Result**:
   - ❌ Red toast notification: "Strategy X: RSI threshold must be between 0 and 100"

#### Test Missing Strategy Parameters
1. **Steps**:
   - Add MACD strategy
   - Leave fast_period, slow_period, or signal_period empty/zero
   - Click "Run Backtest"

2. **Expected Result**:
   - ❌ Red toast notification with specific field mentioned

#### Test No Strategies
1. **Steps**:
   - Remove all buy and sell strategies 
   - Click "Run Backtest"

2. **Expected Result**:
   - ❌ Red toast notification: "At least one buy or sell strategy is required"

---

### **2. Network and Connectivity Errors**

#### Test Backend Down
1. **Steps**:
   - Stop the backend server (`Ctrl+C` in backend terminal)
   - Try to run a backtest or load charts

2. **Expected Result**:
   - ❌ Red toast: "Unable to connect to server. Please check your internet connection."
   - No infinite loading states

#### Test Invalid API Key
1. **Steps**:
   - Edit `frontend/.env.local`: Change `NEXT_PUBLIC_API_KEY` to wrong value
   - Restart frontend: `npm run dev`
   - Try any API operation

2. **Expected Result**:
   - ❌ Red toast: "Invalid API key"
   - HTTP 401 error handled gracefully

#### Test Network Timeout
1. **Steps**:
   - Add artificial delay to backend (add `time.sleep(35)` in backtest endpoint)
   - Run a backtest

2. **Expected Result**:
   - ⏱️ Loading notification shows for 30 seconds
   - ❌ Red toast: "Request timed out. Please check your connection and try again."

---

### **3. Chart Data Error Handling**

#### Test Invalid Ticker Symbol
1. **Steps**:
   - In browser console: `fetchChartData('INVALID_TICKER')`
   - Or modify the hardcoded 'SPY' to 'INVALID' temporarily

2. **Expected Result**:
   - ❌ Red toast: "No data found for ticker INVALID_TICKER. Please check the ticker symbol."
   - Chart shows retry button

#### Test Database Connection Loss
1. **Steps**:
   - Stop PostgreSQL: `brew services stop postgresql@14`
   - Refresh the page or try to load charts

2. **Expected Result**:
   - ❌ Red toast: "Database error occurred while fetching chart data"
   - Chart component shows error state with retry button

#### Test Chart Rendering Errors
1. **Steps**:
   - Temporarily break chart component (add invalid JSX)
   - Refresh page

2. **Expected Result**:
   - Error boundary catches the error
   - Shows friendly error message with "Refresh Page" button
   - ❌ Red toast: "Something went wrong. Please refresh the page and try again."

---

### **4. Backtest Error Scenarios**

#### Test Invalid Input Values
1. **Steps**:
   - Set starting value to `0` or negative number
   - Add valid strategies and run backtest

2. **Expected Result**:
   - ❌ Red toast: "Starting value must be greater than 0"

#### Test Empty Ticker
1. **Steps**:
   - Clear ticker field (if accessible) or send empty ticker via API
   - Run backtest

2. **Expected Result**:
   - ❌ Red toast: "Ticker symbol is required and cannot be empty"

#### Test Successful Backtest
1. **Steps**:
   - Configure valid strategies (e.g., RSI oversold at 30, trade_percent 0.1)
   - Run backtest with starting value $10,000

2. **Expected Result**:
   - ⏳ Blue loading toast: "Running backtest..."
   - ✅ Green success toast: "Backtest complete: +X.XX% return" (or negative)

---

### **5. Loading States and UX**

#### Test Chart Loading
1. **Steps**:
   - Refresh the page
   - Observe chart area during load

2. **Expected Result**:
   - Spinning loader with "Loading chart data..."
   - ⏳ Blue toast: "Loading SPY chart data..."
   - ✅ Green success toast: "Loaded X days of data for SPY"

#### Test Backtest Loading
1. **Steps**:
   - Run a valid backtest
   - Observe the loading state

2. **Expected Result**:
   - ⏳ Blue toast: "Running backtest..." (persistent until complete)
   - Button or form shows disabled/loading state (if implemented)

---

### **6. Error Recovery and Retry**

#### Test Retry Functionality
1. **Steps**:
   - Cause a chart error (stop database)
   - Click "Retry" button in error state
   - Restart database
   - Click "Retry" again

2. **Expected Result**:
   - First retry: Still shows error
   - Second retry: Successfully loads charts

#### Test Auto-recovery
1. **Steps**:
   - Stop backend during chart load
   - Start backend again
   - Refresh page

2. **Expected Result**:
   - Page loads successfully without user intervention

---

### **7. User Experience Validation**

#### Test Toast Notification Styling
1. **Steps**:
   - Trigger various error types
   - Check toast appearance

2. **Expected Result**:
   - Toasts appear top-right
   - Dark theme (matches app)
   - Red for errors, green for success, blue for loading
   - Auto-dismiss after 4 seconds (except loading)

#### Test Error Message Clarity
1. **Steps**:
   - Trigger each error type
   - Read error messages as end user

2. **Expected Result**:
   - Messages are specific and actionable
   - No technical jargon or stack traces visible to user
   - Clear next steps provided

---

## 🚨 **Advanced Error Testing**

### Test Malformed API Responses
```bash
# In backend, temporarily return invalid JSON
curl -H "X-API-Key: supersecret123" \
     -H "Content-Type: application/json" \
     -X POST http://localhost:8000/api/backtest \
     -d '{"ticker":"SPY","starting_value":10000}'  # Missing required fields
```

### Test SQL Injection Protection
```bash
# Try SQL injection in ticker parameter
curl -H "X-API-Key: supersecret123" \
     "http://localhost:8000/api/chart-data?ticker=SPY'; DROP TABLE price_data; --"
```

### Test Memory/Performance Under Load
```bash
# Make multiple concurrent requests
for i in {1..10}; do
  curl -H "X-API-Key: supersecret123" \
       "http://localhost:8000/api/chart-data?ticker=SPY" &
done
wait
```

---

## ✅ **Success Criteria**

All tests pass if:
- ✅ No unhandled JavaScript errors in browser console
- ✅ No infinite loading states
- ✅ All errors show user-friendly messages
- ✅ Retry functionality works
- ✅ App remains usable after errors
- ✅ No sensitive information leaked in error messages
- ✅ Toast notifications appear and disappear correctly

---

## 🐛 **Troubleshooting**

If tests fail:

1. **Check browser console** for unhandled errors
2. **Verify API endpoints** are accessible at `localhost:8000/docs`
3. **Check network tab** for failed requests
4. **Restart services** (frontend, backend, database)
5. **Clear browser cache** if seeing stale data

---

## 📝 **Additional Manual Tests**

- Try the app with **slow internet** (Chrome DevTools → Network → Slow 3G)
- Test on **mobile devices** (responsive error states)
- Test **browser back/forward** buttons during errors
- Test **refreshing** during loading states
- Test **multiple tabs** of the app simultaneously

The error handling system is now robust and should provide excellent user experience even when things go wrong!