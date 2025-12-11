"""
Automated Dataset Downloader & Generator
Ensures all required raw datasets exist before processing.
"""

import os
import pandas as pd
import numpy as np
from pathlib import Path
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).parent.parent
RAW_DIR = BASE_DIR / "datasets" / "raw"

def check_and_generate_data():
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    
    # 1. Check Pharmacy Sales
    if not (RAW_DIR / "pharmacy_sales.csv").exists():
        logger.warning("pharmacy_sales.csv not found! Please download it manually as per instructions.")
    else:
        logger.info("Found pharmacy_sales.csv")

    # 2. Check/Generate Indian Medicines
    if not (RAW_DIR / "indian_medicines.csv").exists():
        logger.warning("indian_medicines.csv not found. Generating detailed synthetic version for development...")
        
        # Generate varied medicines with composition for symptom tagging
        medicines = []
        
        # Symptomatic categories
        symptom_map = {
            'fever': ['Paracetamol', 'Ibuprofen', 'Dolo 650', 'Crocin', 'Sumo'],
            'cough': ['Dextromethorphan', 'Ambroxol', 'Benadryl', 'Ascoril', 'Cough Syrup'],
            'cold': ['Cetirizine', 'Levocetirizine', 'Sinarest', 'Maxtra', 'Otrivin'],
            'pain': ['Diclofenac', 'Tramadol', 'Aceclofenac', 'Combiflam', 'Volini'],
            'antibiotic': ['Azithromycin', 'Amoxicillin', 'Cefixime', 'Augmentin', 'Ofloxacin']
        }
        
        # Generate 5000 medicines
        for _ in range(5000):
            category = np.random.choice(list(symptom_map.keys()) + ['other'], p=[0.15, 0.15, 0.15, 0.15, 0.1, 0.3])
            
            if category == 'other':
                name = f"Medicine_{np.random.randint(1000, 9999)}"
                comp = "Unknown Composition"
            else:
                base_name = np.random.choice(symptom_map[category])
                name = f"{base_name} {np.random.choice(['500mg', '650mg', 'Syrup', 'Tablet'])}"
                comp = f"{base_name} + Excipients"
            
            medicines.append({
                'name': name,
                'composition': comp,
                'manufacturer': f"Pharma_{np.random.randint(1, 100)}",
                'pack_size': np.random.randint(1, 30),
                'mrp': np.round(np.random.uniform(10, 500), 2)
            })
            
        df_meds = pd.DataFrame(medicines)
        df_meds.to_csv(RAW_DIR / "indian_medicines.csv", index=False)
        logger.info(f"Generated synthetic indian_medicines.csv ({len(df_meds)} rows)")
    else:
        logger.info("Found indian_medicines.csv")

    # 3. Generate Weather Data
    if not (RAW_DIR / "weather_data.csv").exists():
        logger.info("Generating weather_data.csv...")
        dates = pd.date_range(start='2022-01-01', end='2024-12-31', freq='D')
        pincodes = ['400001', '400002', '400003', '400004', '400005'] # Sample Mumbai pincodes
        
        weather_data = []
        for pincode in pincodes:
            for date in dates:
                # Seasonal logic
                month = date.month
                if month in [6, 7, 8, 9]: # Monsoon
                    temp = np.random.uniform(24, 30)
                    humidity = np.random.uniform(70, 95)
                    rainfall = np.random.exponential(15)
                elif month in [10, 11, 12, 1, 2]: # Winter
                    temp = np.random.uniform(18, 28)
                    humidity = np.random.uniform(40, 60)
                    rainfall = 0
                else: # Summer
                    temp = np.random.uniform(28, 38)
                    humidity = np.random.uniform(50, 70)
                    rainfall = 0
                    
                weather_data.append({
                    'date': date,
                    'pincode': pincode,
                    'temperature': round(temp, 1),
                    'humidity': round(humidity, 1),
                    'rainfall': round(rainfall, 1)
                })
                
        pd.DataFrame(weather_data).to_csv(RAW_DIR / "weather_data.csv", index=False)
        logger.info("Generated weather_data.csv")
    else:
        logger.info("Found weather_data.csv")

    # 4. Generate Census Data
    if not (RAW_DIR / "census_data.csv").exists():
        logger.info("Generating census_data.csv...")
        census_data = [
            {'district': 'Mumbai City', 'population': 3085411, 'urban_rural_ratio': 1.0, 'literacy_rate': 89.2},
            {'district': 'Mumbai Suburban', 'population': 9356962, 'urban_rural_ratio': 1.0, 'literacy_rate': 89.9},
            {'district': 'Thane', 'population': 11060148, 'urban_rural_ratio': 0.77, 'literacy_rate': 84.5}
        ]
        pd.DataFrame(census_data).to_csv(RAW_DIR / "census_data.csv", index=False)
        logger.info("Generated census_data.csv")
    else:
        logger.info("Found census_data.csv")

if __name__ == "__main__":
    check_and_generate_data()
