"""
Data Cleaning Pipeline
Loads raw datasets, handles missing values, standardizes formats, and filters data.
"""

import pandas as pd
import numpy as np
from pathlib import Path
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("data_cleaning.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).parent.parent
RAW_DIR = BASE_DIR / "datasets" / "raw"
PROCESSED_DIR = BASE_DIR / "datasets" / "processed"

def clean_pharmacy_sales():
    logger.info("Cleaning pharmacy_sales.csv...")
    try:
        df = pd.read_csv(RAW_DIR / "pharmacy_sales.csv")
        logger.info(f"Loaded {len(df)} rows")

        # Standardize columns
        df.columns = [c.lower().replace(' ', '_') for c in df.columns]
        
        # Date parsing
        date_col = 'date' if 'date' in df.columns else 'date_time' # Adjust based on actual col
        if date_col in df.columns:
            df['date'] = pd.to_datetime(df[date_col], errors='coerce')
        
        # Filter 2022-2024
        df = df[df['date'].dt.year.isin([2022, 2023, 2024])]
        
        # Remove duplicates
        df.drop_duplicates(inplace=True)
        
        # Handle invalid quantities
        if 'quantity' in df.columns:
            df = df[df['quantity'] > 0]
            
        output_path = PROCESSED_DIR / "cleaned_sales.csv"
        df.to_csv(output_path, index=False)
        logger.info(f"Saved {len(df)} rows to {output_path}")
        return df
    except Exception as e:
        logger.error(f"Error cleaning pharmacy sales: {e}")
        return None

def clean_medicines():
    logger.info("Cleaning indian_medicines.csv...")
    try:
        df = pd.read_csv(RAW_DIR / "indian_medicines.csv")
        df.columns = [c.lower().strip().replace(' ', '_') for c in df.columns]
        
        # Tag symptomatic
        keywords = ['fever', 'cough', 'cold', 'pain', 'paracetamol', 'azithromycin', 'cetirizine', 'dolo']
        pattern = '|'.join(keywords)
        
        # Search in name and composition
        df['is_symptomatic'] = df['name'].str.lower().str.contains(pattern, na=False) | \
                               df['composition'].str.lower().str.contains(pattern, na=False)
        
        output_path = PROCESSED_DIR / "symptomatic_medicines.csv"
        df.to_csv(output_path, index=False)
        logger.info(f"Tagged {df['is_symptomatic'].sum()} symptomatic medicines")
        return df
    except Exception as e:
        logger.error(f"Error cleaning medicines: {e}")
        return None

def clean_weather():
    logger.info("Cleaning weather_data.csv...")
    try:
        df = pd.read_csv(RAW_DIR / "weather_data.csv")
        df['date'] = pd.to_datetime(df['date'])
        
        # Temp validation
        df = df[(df['temperature'] >= 15) & (df['temperature'] <= 45)]
        
        PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
        df.to_csv(PROCESSED_DIR / "cleaned_weather.csv", index=False)
        logger.info("Saved cleaned weather data")
    except Exception as e:
        logger.error(f"Error cleaning weather: {e}")

def main():
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    clean_pharmacy_sales()
    clean_medicines()
    clean_weather()
    logger.info("Data cleaning complete.")

if __name__ == "__main__":
    main()
