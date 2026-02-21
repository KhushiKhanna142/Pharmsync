import pandas as pd
import numpy as np
import os
import random
from datetime import datetime, timedelta

def ingest_data():
    print("Starting Module 1.1 Ingestion...")
    
    # Paths
    BASE_DIR = os.path.dirname(__file__)
    DATA_DIR = os.path.join(BASE_DIR, '../data')
    ARCHIVE_DIR = os.path.join(BASE_DIR, '../../dataset/archive')
    RAW_DIR = os.path.join(DATA_DIR, 'raw')
    
    PRESCRIPTIONS_PATH = os.path.join(ARCHIVE_DIR, 'PRESCRIPTIONS.csv')
    DRUGS_PATH = os.path.join(ARCHIVE_DIR, 'DRUGS.csv')
    HOLIDAYS_PATH = os.path.join(RAW_DIR, 'holidays_events.csv')
    
    OUTPUT_PATH = os.path.join(DATA_DIR, 'processed_prescriptions.csv')
    
    # 1. Load Data
    print("Loading raw files...")
    df_presc = pd.read_csv(PRESCRIPTIONS_PATH)
    df_drugs = pd.read_csv(DRUGS_PATH)
    
    # 2. Map NDC to Brand Name
    # Create map: NDC -> BrandName
    ndc_map = dict(zip(df_drugs['NDC'], df_drugs['brandName']))
    
    df_presc['med_name'] = df_presc['NDC'].map(ndc_map)
    # Drop unmapped
    df_presc = df_presc.dropna(subset=['med_name'])
    
    print(f"Mapped {len(df_presc)} prescriptions to drug names.")
    
    # Boost Data Volume (Upsample) for Demo
    # The sample dataset is tiny, we need more volume to show a graph
    df_presc = pd.concat([df_presc]*50, ignore_index=True)
    
    # 3. Synthesize Dates (Since source lacks them)
    # Distribute over Jan 1 2024 to Today
    start_date = datetime(2024, 1, 1)
    days_range = 365
    
    random.seed(42) # Replicable
    
    def random_date():
        return start_date + timedelta(days=random.randint(0, days_range))
    
    df_presc['date'] = [random_date() for _ in range(len(df_presc))]
    df_presc['date'] = pd.to_datetime(df_presc['date'])
    
    # 4. Aggregate Daily Demand per Med
    # Group by Date + Med Name -> Sum Qty
    daily_demand = df_presc.groupby(['date', 'med_name'])['qty'].sum().reset_index()
    
    # 5. Merge Holidays (Feature Enrichment)
    if os.path.exists(HOLIDAYS_PATH):
        df_holidays = pd.read_csv(HOLIDAYS_PATH)
        df_holidays['date'] = pd.to_datetime(df_holidays['date'])
        
        # Merge
        daily_demand = pd.merge(daily_demand, df_holidays[['date', 'type']], on='date', how='left')
        daily_demand['is_holiday'] = daily_demand['type'].notna()
        daily_demand = daily_demand.drop(columns=['type'])
        daily_demand['is_holiday'] = daily_demand['is_holiday'].fillna(False)
    else:
        daily_demand['is_holiday'] = False
        
    daily_demand = daily_demand.sort_values('date')
    
    # 6. Save
    daily_demand.to_csv(OUTPUT_PATH, index=False)
    print(f"Saved processed time-series to {OUTPUT_PATH}")
    print(daily_demand.head())

if __name__ == "__main__":
    ingest_data()
