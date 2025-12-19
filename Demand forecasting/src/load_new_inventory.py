import pandas as pd
import os
from sqlalchemy import text
from db_direct import engine
import math

def migrate_new_inventory():
    if not engine:
        print("❌ Database engine not available. Check .env configuration.")
        return

    print("--- Starting New Inventory Migration ---")
    
    csv_path = os.path.join(os.path.dirname(__file__), '../data/enhanced_inventory.csv')
    if not os.path.exists(csv_path):
        print(f"❌ Enhanced inventory file not found at {csv_path}")
        return

    try:
        print(f"Reading {csv_path}...")
        df = pd.read_csv(csv_path)
        print(f"Loaded {len(df)} records.")
        
        # 1. Prepare Tables
        print("Resetting 'drugs' and 'inventory' tables (TRUNCATE CASCADE)...")
        with engine.connect() as conn:
            with conn.begin():
                conn.execute(text("TRUNCATE TABLE drugs CASCADE"))
                
        # 2. Populate Drugs Table
        # We need unique 'brand_name' for the FK
        unique_meds = df['brand_name'].unique()
        print(f"Found {len(unique_meds)} unique drugs.")
        
        df_drugs = pd.DataFrame({
            'brand_name': unique_meds,
            'generic_name': unique_meds, # Fallback
            'dosage': 'Unknown',
            'manufacturer': 'Unknown',
            'dosage_form': 'Unknown',
            'primary_ingredient': 'Unknown'
        })
        
        # Map fields from source DF
        # Create lookup dicts for efficiency
        unique_df = df.drop_duplicates('brand_name').set_index('brand_name')
        
        if 'manufacturer' in df.columns:
            df_drugs['manufacturer'] = df_drugs['brand_name'].map(unique_df['manufacturer'].to_dict())
            
        if 'dosage_form' in df.columns:
            df_drugs['dosage_form'] = df_drugs['brand_name'].map(unique_df['dosage_form'].to_dict())
            # Also map dosage to primary_strength if available, else keep as dosage_form or Unknown
            if 'primary_strength' in df.columns:
                 df_drugs['dosage'] = df_drugs['brand_name'].map(unique_df['primary_strength'].to_dict())
            else:
                 df_drugs['dosage'] = df_drugs['brand_name'].map(unique_df['dosage_form'].to_dict())

        if 'primary_ingredient' in df.columns:
            df_drugs['primary_ingredient'] = df_drugs['brand_name'].map(unique_df['primary_ingredient'].to_dict())

        print("Uploading drugs catalog...")
        # Chunking drugs upload just in case
        chunksize = 10000
        df_drugs.to_sql('drugs', engine, if_exists='append', index=False, chunksize=chunksize)
        print("✅ Drugs table populated.")
        
        # 3. Populate Inventory Table
        print("Preparing inventory data...")
        # DB schema: id, batch_id, med_name, mfg_date, expiry_date, quantity, cost_price, status
        
        df_inv = pd.DataFrame()
        df_inv['batch_id'] = df['Batch_ID']
        df_inv['med_name'] = df['brand_name']
        
        # Handle Date Parsing carefully
        df_inv['mfg_date'] = pd.to_datetime(df['Mfg_Date']).dt.date
        df_inv['expiry_date'] = pd.to_datetime(df['Expiry_Date']).dt.date
        
        df_inv['quantity'] = df['Qty_On_Hand']
        df_inv['status'] = df['Stock_Status']
        
        # Price
        if 'price_inr' in df.columns:
            df_inv['cost_price'] = df['price_inr']
        else:
            df_inv['cost_price'] = 0.0
            
        print(f"Uploading {len(df_inv)} inventory records...")
        
        # Using to_sql with chunksize is much faster than iterative insert
        df_inv.to_sql('inventory', engine, if_exists='append', index=False, method='multi', chunksize=5000)
        
        print("✅ Inventory table populated successfully.")
        
        # Final Verification
        with engine.connect() as conn:
            cnt = conn.execute(text("SELECT count(*) FROM inventory")).scalar()
            print(f"📊 Final Inventory Count: {cnt}")

    except Exception as e:
        print(f"❌ Error during migration: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    migrate_new_inventory()
