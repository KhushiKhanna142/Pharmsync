import pandas as pd
import numpy as np
import os
from datetime import timedelta, datetime
import warnings

# Suppress statsmodels warnings for cleaner output
warnings.filterwarnings("ignore")
from statsmodels.tsa.arima.model import ARIMA

def generate_forecasts():
    print("Starting Module 1.2 Forecasting (History + CI + Forecast)...")
    
    # Paths
    BASE_DIR = os.path.dirname(__file__)
    DATA_DIR = os.path.join(BASE_DIR, '../data')
    INPUT_PATH = os.path.join(DATA_DIR, 'processed_prescriptions.csv')
    OUTPUT_PATH = os.path.join(DATA_DIR, 'forecast_results.csv')
    DETAILED_OUTPUT_PATH = os.path.join(DATA_DIR, 'forecast_detailed.csv')
    
    if not os.path.exists(INPUT_PATH):
        raise FileNotFoundError(f"{INPUT_PATH} missing. Run ingestion_v2.py first.")
        
    df = pd.read_csv(INPUT_PATH)
    df['date'] = pd.to_datetime(df['date'])
    
    # Define forecast horizon
    horizon_days = 90
    request_start_date = df['date'].max() + timedelta(days=1)
    future_dates = [request_start_date + timedelta(days=i) for i in range(horizon_days)]
    
    # Result containers
    detailed_results = [] # Tidy format for API: [date, med, type, value, ci_low, ci_high]
    pivot_data = []       # Wide format for Overview: [date, med1, med2...]
    
    # Process each drug independently
    meds = df['med_name'].unique()
    print(f"Forecasting for {len(meds)} medicines: {meds}")
    
    for med in meds:
        # Get History (Daily)
        sub_df = df[df['med_name'] == med].set_index('date').resample('D')['qty'].sum().fillna(0)
        
        # ARIMA implementation (p=5, d=1, q=0 as a general starting point)
        # We use the daily history 'sub_df' to fit the model
        try:
            # Fit ARIMA model
            model = ARIMA(sub_df.values, order=(5, 1, 0))
            model_fit = model.fit()
            
            # Forecast future values
            forecast = model_fit.get_forecast(steps=horizon_days)
            forecast_mean = forecast.predicted_mean
            
            # Get confidence intervals (95% CI)
            forecast_ci = forecast.conf_int(alpha=0.05)
            
            # If any forecasted value is negative, clip to 0
            forecast_mean = np.maximum(0, forecast_mean)
            ci_lower_vals = np.maximum(0, forecast_ci[:, 0])
            ci_upper_vals = np.maximum(0, forecast_ci[:, 1])
            
        except Exception as e:
            print(f"ARIMA failed for {med}. Falling back to baseline. Error: {e}")
            # Fallback logic if ARIMA fails to converge
            last_30_mean = sub_df.tail(30).mean()
            all_time_mean = sub_df.mean()
            volatility = sub_df.tail(30).std()
            if pd.isna(volatility) or volatility == 0:
                volatility = all_time_mean * 0.2
            base_pred = (last_30_mean * 0.7) + (all_time_mean * 0.3)
            
            forecast_mean = np.full(horizon_days, base_pred)
            ci_lower_vals = np.maximum(0, forecast_mean - (1.96 * volatility))
            ci_upper_vals = forecast_mean + (1.96 * volatility)

        # Dow Multipliers (Still useful for short-term daily fluctuations even with ARIMA)
        sub_df_frame = sub_df.to_frame()
        sub_df_frame['dow'] = sub_df_frame.index.dayofweek
        dow_multipliers = sub_df_frame.groupby('dow')['qty'].mean() / (sub_df.mean() if sub_df.mean() > 0 else 1)
        dow_multipliers = dow_multipliers.fillna(1.0).to_dict()
        
        # --- A. Save History ---
        for date, qty in sub_df.items():
            detailed_results.append({
                "date": date.strftime('%Y-%m-%d'),
                "med_name": med,
                "type": "history",
                "value": round(qty),
                "ci_lower": None,
                "ci_upper": None
            })
            
        # --- B. Generate Forecast ---
        temp_pivot_entry = {} # To collect pivot rows later if needed (but pivot is by date...)
        # Actually easier to build pivot from detailed later or just build parallel
        
        for i, date in enumerate(future_dates):
            dow = date.dayofweek
            multiplier = dow_multipliers.get(dow, 1.0)
            
            # Forecast Value (ARIMA mean * DOW multiplier)
            pred_val = forecast_mean[i] * multiplier
            
            # Confidence Interval
            ci_lower = ci_lower_vals[i] * multiplier
            ci_upper = ci_upper_vals[i] * multiplier
            
            detailed_results.append({
                "date": date.strftime('%Y-%m-%d'),
                "med_name": med,
                "type": "forecast",
                "value": round(max(0, pred_val)),
                "ci_lower": round(max(0, ci_lower)),
                "ci_upper": round(ci_upper)
            })

    # Save Detailed Tidy CSV (For API Deep Dive)
    df_detailed = pd.DataFrame(detailed_results)
    df_detailed.to_csv(DETAILED_OUTPUT_PATH, index=False)
    print(f"Detailed Forecast (History+CI) saved to {DETAILED_OUTPUT_PATH}")
    
    # Save Overview Pivot CSV (For compatibility / main view)
    # We only want the 'forecast' part for the main multi-line chart usually, 
    # OR we can stitch history + forecast. 
    # Let's keep the existing `forecast_results.csv` behavior: Future Only (Pivot) 
    # so we don't break the existing overview chart immediately.
    
    df_future = df_detailed[df_detailed['type'] == 'forecast']
    df_pivot = df_future.pivot(index='date', columns='med_name', values='value').reset_index()
    df_pivot = df_pivot.fillna(0)
    # Add predicted_sales total
    df_pivot['predicted_sales'] = df_pivot.drop('date', axis=1).sum(axis=1)
    
    df_pivot.to_csv(OUTPUT_PATH, index=False)
    print(f"Overview Forecast saved to {OUTPUT_PATH}")

if __name__ == "__main__":
    generate_forecasts()
