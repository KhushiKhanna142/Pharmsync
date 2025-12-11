import pandas as pd
import numpy as np
import os
from datetime import timedelta, datetime

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
        
        # 1. Calc Baseline & Volatility (Standard Deviation of Residuals)
        # Simple Logic: Volatility = Std Dev of last 30 days
        volatility = sub_df.tail(30).std()
        if pd.isna(volatility) or volatility == 0:
            volatility = sub_df.mean() * 0.2 # Fallback 20% volatility
            
        last_30_mean = sub_df.tail(30).mean()
        all_time_mean = sub_df.mean()
        
        # Base Forecast
        base_pred = (last_30_mean * 0.7) + (all_time_mean * 0.3)
        
        # Dow Multipliers
        sub_df_frame = sub_df.to_frame()
        sub_df_frame['dow'] = sub_df_frame.index.dayofweek
        dow_multipliers = sub_df_frame.groupby('dow')['qty'].mean() / all_time_mean
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
            
            # Forecast Value
            # Trend: Slight growth (0.1% per day) just for demo visual
            trend_factor = 1.0 + (0.001 * i)
            pred_val = base_pred * multiplier * trend_factor
            
            # Confidence Interval (95% = 1.96 * std)
            # Uncertainty grows with time (square root of time rule approx)
            uncertainty_growth = 1.0 + (0.05 * i) # Grows 5% per day
            margin = 1.96 * volatility * uncertainty_growth
            
            ci_upper = pred_val + margin
            ci_lower = max(0, pred_val - margin)
            
            detailed_results.append({
                "date": date.strftime('%Y-%m-%d'),
                "med_name": med,
                "type": "forecast",
                "value": round(max(0, pred_val)),
                "ci_lower": round(ci_lower),
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
