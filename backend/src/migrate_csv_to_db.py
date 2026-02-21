import pandas as pd
import os
from sqlalchemy import text
from db_direct import engine

def migrate_data():
    if not engine:
        print("❌ Database engine not available. Check .env configuration.")
        return

    print("--- Starting Data Migration to PostgreSQL ---")
    
    # 0. Migrate Drugs (Required for Foreign Key)
    try:
        inventory_path = os.path.join(os.path.dirname(__file__), '../data/pharmacy_batches.csv')
        if os.path.exists(inventory_path):
            df = pd.read_csv(inventory_path)
            # Normalize names
            unique_meds = df['SKU_ID'].unique().tolist()
            print(f"Found {len(unique_meds)} unique medicines to register in 'drugs' table.")
            
            # Create DF for drugs table: med_name, category (default), etc.
            # Create DF for drugs table: med_name -> brand_name
            # supply dummy values for potential non-nulls
            df_drugs = pd.DataFrame()
            df_drugs['brand_name'] = unique_meds
            df_drugs['generic_name'] = unique_meds # Fallback
            df_drugs['dosage'] = 'Unknown'
            # sup_id ? If it fails, we might need a dummy supplier.
            
            
            # Insert/Ignore logic is hard with pandas, so we use naive 'append' but 
            # we must clear old 'drugs' if we want clean slate, OR handle conflicts.
            # Best: Insert only missing.
            # Lazy: TRUNCATE drugs CASCADE (clears inventory too!)
            
            print("Resetting 'drugs' and 'inventory' tables...")
            with engine.connect() as conn:
                with conn.begin():
                     conn.execute(text("TRUNCATE TABLE drugs CASCADE"))
            
            print("Uploading drugs...")
            df_drugs.to_sql('drugs', engine, if_exists='append', index=False)
            print("✅ Drugs table populated.")
            
    except Exception as e:
        print(f"❌ Error migrating drugs: {e}")
        return

    # 1. Migrate Inventory
    try:
        # DB schema: id, batch_id, med_name, mfg_date, expiry_date, quantity, cost_price
        
        if os.path.exists(inventory_path): # Path defined above but might need re-define or use same var name
             pass # Logic below
        
        inventory_csv_path = os.path.join(os.path.dirname(__file__), '../data/pharmacy_batches.csv')
        if os.path.exists(inventory_csv_path):
             print(f"Reading {inventory_csv_path}...")
             df = pd.read_csv(inventory_csv_path)

             df_db = pd.DataFrame()
             df_db['batch_id'] = df['Batch_ID']
             df_db['med_name'] = df['SKU_ID']
             df_db['mfg_date'] = pd.to_datetime(df['Mfg_Date'])
             df_db['expiry_date'] = pd.to_datetime(df['Expiry_Date'])
             df_db['quantity'] = df['Qty_On_Hand']
             df_db['cost_price'] = df.get('Cost_Price', 0.0)
             df_db['status'] = 'In Stock'

             print(f"Uploading {len(df_db)} inventory records...")

             # 1. TRUNCATE (Wrapped in try)
             import sqlalchemy.exc
             try:
                 with engine.connect() as conn:
                     with conn.begin():
                         conn.execute(text("TRUNCATE TABLE inventory CASCADE"))
                 print("   Table 'inventory' truncated.")
             except sqlalchemy.exc.ProgrammingError as e:
                 if 'does not exist' in str(e):
                     print("   Table 'inventory' does not exist. It will be created.")
                 else:
                     print(f"   Warning during Truncate: {e}")
             except Exception as e:
                 print(f"   Warning during Truncate: {e}")

             # Insert Data Iteratively to debug failures
             print(f"   Inserting {len(df_db)} rows iteratively...")
             success_count = 0
            
             with engine.connect() as conn:
                # Prepare statement
                stmt = text("INSERT INTO inventory (batch_id, med_name, mfg_date, expiry_date, quantity, cost_price, status) VALUES (:batch_id, :med_name, :mfg_date, :expiry_date, :quantity, :cost_price, :status)")
                
                rows = df_db.to_dict(orient='records')
                for i, row in enumerate(rows):
                    try:
                        # Handle NaN/NaT
                        params = {}
                        for k, v in row.items():
                            if pd.isna(v):
                                params[k] = None
                            else:
                                params[k] = v
                                
                        with conn.begin(): # Commit each row or batch (here row for debug)
                             conn.execute(stmt, params)
                        success_count += 1
                    except Exception as e:
                        print(f"   ❌ Failed row {i}: {e}")
                        # Optional: break or continue? Continue to load partial.
                        continue
                        
             print(f"   Processed {len(df_db)} rows. Success: {success_count}")

             # 3. VERIFY
             with engine.connect() as conn:
                  cnt = conn.execute(text("SELECT count(*) FROM inventory")).scalar()
                  print(f"   ✅ Post-Migration Count: {cnt}")
             
             print("✅ Inventory table migrated successfully.")
        else:
             print("⚠️ Inventory file not found.")

    except Exception as e:
        print(f"❌ Error migrating inventory: {e}")

    # 2. Migrate Waste Logs
    try:
        waste_path = os.path.join(os.path.dirname(__file__), '../data/waste_log.csv')
        if os.path.exists(waste_path):
            print(f"Reading {waste_path}...")
            df_waste = pd.read_csv(waste_path)
            
            # CSV: med_name, waste_qty, cost_per_unit, total_loss, waste_reason, event_date
            # DB (target): med_name, quantity, cost_per_unit, total_loss, reason, date
            
            df_db_waste = df_waste.rename(columns={
                'waste_qty': 'quantity',
                'waste_reason': 'reason',
                'event_date': 'date'
            })
            
            # Ensure dates are proper
            df_db_waste['date'] = pd.to_datetime(df_db_waste['date'])
            
            print(f"Uploading {len(df_db_waste)} waste log records...")
            df_db_waste.to_sql('waste_logs', engine, if_exists='replace', index=False)
            print("✅ Waste Logs table migrated successfully.")
            
        else:
            print(f"⚠️ Waste log file not found at {waste_path}")

    except Exception as e:
        print(f"❌ Error migrating waste logs: {e}")

if __name__ == "__main__":
    migrate_data()
