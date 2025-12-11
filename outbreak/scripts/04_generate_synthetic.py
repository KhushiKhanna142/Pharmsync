"""
Synthetic Data Generator
Generates realistic pharmacy transaction data with outbreak patterns for demos.
"""

import pandas as pd
import numpy as np
from faker import Faker
from datetime import datetime, timedelta
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).parent.parent
PROCESSED_DIR = BASE_DIR / "datasets" / "processed"
fake = Faker('en_IN')

def generate_synthetic_data():
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    
    logger.info("Generating normal transactions...")
    # 1. Normal Transactions
    dates = pd.date_range(end=datetime.now(), periods=90)
    pincodes = ['400001', '400002', '400003']
    symptoms = ['fever', 'cough', 'cold', 'pain', 'vitamin']
    
    data = []
    
    # Generate 10k normal
    for _ in range(10000):
        date = np.random.choice(dates)
        data.append({
            'transaction_id': fake.uuid4(),
            'timestamp': pd.Timestamp(date) + timedelta(hours=np.random.randint(8, 22)),
            'pincode': np.random.choice(pincodes),
            'medicine_name': f"Med_{np.random.randint(1, 100)}",
            'category': np.random.choice(symptoms, p=[0.1, 0.1, 0.1, 0.2, 0.5]), # Low symptomatic
            'quantity': np.random.randint(1, 4),
            'customer_age': np.random.randint(18, 80),
            'weather_temp': np.random.uniform(25, 35),
            'weather_humidity': np.random.uniform(50, 80)
        })
        
    # 2. Outbreak Transactions
    logger.info("Injecting outbreak patterns...")
    outbreak_pincode = '400001'
    outbreak_days = dates[-5:] # Last 5 days
    
    for day in outbreak_days:
        # Spike of 100 transactions per day
        for _ in range(100):
            data.append({
                'transaction_id': fake.uuid4(),
                'timestamp': pd.Timestamp(day) + timedelta(hours=np.random.randint(8, 22)),
                'pincode': outbreak_pincode,
                'medicine_name': "Paracetamol 650",
                'category': "fever",
                'quantity': np.random.randint(2, 5), # Higher qty
                'customer_age': np.random.randint(20, 50),
                'weather_temp': np.random.uniform(20, 25), # Cooler
                'weather_humidity': np.random.uniform(70, 90) # Humid
            })
            
    df = pd.DataFrame(data)
    df.to_csv(PROCESSED_DIR / "synthetic_transactions.csv", index=False)
    logger.info(f"Generated {len(df)} transactions. Outbreak injected in {outbreak_pincode}")

if __name__ == "__main__":
    generate_synthetic_data()
