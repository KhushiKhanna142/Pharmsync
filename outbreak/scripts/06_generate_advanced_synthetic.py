"""
Advanced Synthetic Data Generator
Generates auxiliary datasets for production-grade surveillance:
1. Hospital Admissions (Clinical Ground Truth)
2. Internet Search Trends (Digital Signals)
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).parent.parent
RAW_DIR = BASE_DIR / "datasets" / "raw"

def generate_advanced_data():
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    
    dates = pd.date_range(end=datetime.now(), periods=90)
    pincodes = ['400001', '400002', '400003']
    
    # --- 1. Hospital Admissions Data ---
    # Logic: Spikes generally lag behind pharmacy sales by 1-3 days
    logger.info("Generating Hospital Admissions Data...")
    hospital_data = []
    
    for date in dates:
        for pincode in pincodes:
            # Baseline admissions
            admissions = np.random.poisson(5) 
            
            # Simulate outbreak lag (correlating with the 'outbreak' in script 04)
            # Script 04 had outbreak in last 5 days in 400001
            is_outbreak_period = date in dates[-3:] # Lagged by 2 days from pharmacy spike
            if pincode == '400001' and is_outbreak_period:
                admissions += np.random.poisson(20) # Significant spike
            
            hospital_data.append({
                'date': date,
                'pincode': pincode,
                'symptom_category': 'Viral Fever',
                'admission_count': admissions,
                'hospital_id': f"HOSP_{np.random.randint(1, 10)}"
            })
            
    pd.DataFrame(hospital_data).to_csv(RAW_DIR / "hospital_admissions.csv", index=False)
    logger.info(f"Generated hospital_admissions.csv ({len(hospital_data)} rows)")

    # --- 2. Internet Search Trends ---
    # Logic: Search volume spikes BEFORE or WITH pharmacy sales
    logger.info("Generating Internet Search Trends...")
    trend_data = []
    keywords = ['flu symptoms', 'fever medicine', 'dengue symptoms', 'viral fever', 'cough treatment']
    
    for date in dates:
        for pincode in pincodes:
            base_volume = np.random.randint(10, 50)
            
            # Outbreak signal (Leading indicator)
            is_pre_outbreak = date in dates[-7:] # Starts before pharmacy spike
            if pincode == '400001' and is_pre_outbreak:
                base_volume += np.random.randint(50, 150)
                
            for kw in keywords:
                trend_data.append({
                    'date': date,
                    'pincode': pincode,
                    'keyword': kw,
                    'search_volume': base_volume + np.random.randint(-5, 5),
                    'platform': 'Google Trends'
                })

    pd.DataFrame(trend_data).to_csv(RAW_DIR / "internet_trends.csv", index=False)
    logger.info(f"Generated internet_trends.csv ({len(trend_data)} rows)")

if __name__ == "__main__":
    generate_advanced_data()
