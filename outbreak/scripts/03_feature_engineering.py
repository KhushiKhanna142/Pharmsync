"""
Feature Engineering
Creates time-series features, baseline metrics, and anomaly indicators.
"""

import pandas as pd
import numpy as np
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).parent.parent
PROCESSED_DIR = BASE_DIR / "datasets" / "processed"
FINAL_DIR = BASE_DIR / "datasets" / "final"

def create_features():
    FINAL_DIR.mkdir(parents=True, exist_ok=True)
    
    # Load data
    try:
        sales = pd.read_csv(PROCESSED_DIR / "cleaned_sales.csv")
        meds = pd.read_csv(PROCESSED_DIR / "symptomatic_medicines.csv")
        weather = pd.read_csv(PROCESSED_DIR / "cleaned_weather.csv")
    except FileNotFoundError as e:
        logger.error(f"Missing processed data: {e}")
        return

    # Merge sales with meds to identify symptomatic transactions
    # Note: Assuming product_name in sales matches name in meds approx or needs mapping
    # For now, we'll assume exact match or just use sales as principal
    
    # 1. Time Features
    sales['date'] = pd.to_datetime(sales['date'])
    sales['day_of_week'] = sales['date'].dt.dayofweek
    sales['month'] = sales['date'].dt.month
    sales['is_weekend'] = sales['day_of_week'].isin([5, 6]).astype(int)
    
    # 2. Aggregations & Baselines
    # Daily sales per pincode (Simulating pincode if not in sales, assume single location for now or random assign)
    if 'pincode' not in sales.columns:
        sales['pincode'] = np.random.choice(['400001', '400002', '400003'], len(sales))
    
    daily_sales = sales.groupby(['date', 'pincode']).size().reset_index(name='transaction_count')
    
    # Rolling 30-day baseline
    daily_sales['baseline_30d'] = daily_sales.groupby('pincode')['transaction_count'].transform(
        lambda x: x.rolling(window=30, min_periods=1).mean()
    )
    
    # 3. Anomaly Indicators
    daily_sales['purchase_spike'] = (daily_sales['transaction_count'] > 2 * daily_sales['baseline_30d']).astype(int)
    
    # 4. Merge Weather
    weather['date'] = pd.to_datetime(weather['date'])
    # Ensure pincode type match
    weather['pincode'] = weather['pincode'].astype(str)
    daily_sales['pincode'] = daily_sales['pincode'].astype(str)
    
    final_df = pd.merge(daily_sales, weather, on=['date', 'pincode'], how='left')
    
    # Save
    final_df.to_csv(FINAL_DIR / "training_data.csv", index=False)
    logger.info(f"Feature engineering complete. Saved {len(final_df)} rows to training_data.csv")

if __name__ == "__main__":
    create_features()
