from db_direct import engine
from sqlalchemy import text
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

def reset_inventory():
    print("WARNING: This will WIPE the current inventory and replace it with 18,000 synthetic records.")
    
    print("Fetching valid Brand Names from Drugs table...")
    all_meds = []
    with engine.connect() as conn:
        # Fetch 300 random drugs to use
        result = conn.execute(text("SELECT brand_name FROM drugs ORDER BY RANDOM() LIMIT 300"))
        all_meds = [r[0] for r in result]
    
    print(f"Selected {len(all_meds)} medications from catalog.")
    
    # Target: 18,000 rows
    rows_per_med = 18000 // len(all_meds) # approx 70 batches per med
    
    new_data = []
    
    print(f"Generating data for {len(all_meds)} medications (~{rows_per_med} batches each)...")
    
    for med in all_meds:
        price = round(random.uniform(10, 500), 2)
        
        for i in range(rows_per_med):
            # Batch ID
            batch_id = f"B-{med[:3].upper()}-{random.randint(1000, 9999)}"
            
            # Expiry Logic
            # 5% Expired (Past)
            # 10% Expiring Soon (< 60 days)
            # 85% Good (> 60 days)
            r = random.random()
            if r < 0.05:
                # Expired 1-100 days ago
                expiry_date = datetime.now() - timedelta(days=random.randint(1, 100))
                status = "Expired"
                qty = random.randint(1, 10) # Small amount
            elif r < 0.15:
                # Expiring + Low Stock overlap
                expiry_date = datetime.now() + timedelta(days=random.randint(1, 60))
                qty = random.randint(2, 15) # Low stock
                status = "Low Stock"
            else:
                # Good
                expiry_date = datetime.now() + timedelta(days=random.randint(61, 730))
                qty = random.randint(10, 50) # Realistic shelf stock (e.g. 10-50 strips)
                status = "Good"
            
            # 10% chance of purely Low Stock even if date is good
            if status == "Good" and random.random() < 0.10:
                qty = random.randint(0, 10)
                status = "Low Stock"
                if qty == 0:
                    status = "Out of Stock"
                    
            new_data.append({
                "med_name": med,
                "batch_id": batch_id,
                "quantity": qty,
                "expiry_date": expiry_date,
                "cost_price": price,
                "status": status
            })
            
    print(f"Generated {len(new_data)} rows. Truncating DB (Immediate Commit)...")
    
    # 1. TRUNCATE separately
    with engine.begin() as conn:
        conn.execute(text("TRUNCATE TABLE inventory RESTART IDENTITY"))
        print("✅ Inventory Truncated.")
        
    # 2. INSERT in batches (Committing every chunk to avoid long transactions)
    stmt = text("""
        INSERT INTO inventory (med_name, batch_id, quantity, expiry_date, cost_price, status)
        VALUES (:med_name, :batch_id, :quantity, :expiry_date, :cost_price, :status)
    """)
    
    chunk_size = 100  # Optimized batch size
    print(f"Inserting {len(new_data)} rows in batches of {chunk_size}...")
    
    for i in range(0, len(new_data), chunk_size):
        chunk = new_data[i:i + chunk_size]
        try:
             with engine.begin() as conn:
                 conn.execute(stmt, chunk)
             if i % 100 == 0:
                 print(f"   ✅ Inserted {i} / {len(new_data)}")
        except Exception as e:
             print(f"   ❌ Failed chunk {i}: {e}")
            
    print("✅ Database reset successfully with ~18k records.")

if __name__ == "__main__":
    reset_inventory()
