"""
Database Upload Script
Uploads processed data to Supabase.
"""

import os
import pandas as pd
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv
import logging

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).parent.parent
PROCESSED_DIR = BASE_DIR / "datasets" / "processed"

# Placeholder credentials - User needs to fill .env
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://your-project.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "your-anon-key")

def upload_to_supabase():
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # Load data
        df = pd.read_csv(PROCESSED_DIR / "synthetic_transactions.csv")
        
        # Upload in batches
        batch_size = 1000
        total = len(df)
        
        logger.info(f"Uploading {total} rows to 'transactions' table...")
        
        # Note: Table must exist. Assuming 'transactions' table schema.
        # This is a demonstration. Real upload requires valid credentials.
        
        # for i in range(0, total, batch_size):
        #     batch = df.iloc[i:i+batch_size].to_dict('records')
        #     supabase.table('transactions').insert(batch).execute()
        #     logger.info(f"Uploaded batch {i//batch_size + 1}")
            
        logger.info("Upload logic ready. Uncomment execute lines with valid credentials.")
        
    except Exception as e:
        logger.error(f"Upload failed: {e}")

if __name__ == "__main__":
    upload_to_supabase()
