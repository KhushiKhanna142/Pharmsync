from db_direct import engine
from sqlalchemy import text
import random
from datetime import datetime, timedelta
import io
import csv
import time

def fast_reset():
    print("🚀 Starting FAST Reset (COPY Protocol)...")
    
    # 1. Fetch Drugs
    print("Fetching valid Brand Names...")
    all_meds = []
    with engine.connect() as conn:
        result = conn.execute(text("SELECT brand_name FROM drugs ORDER BY RANDOM() LIMIT 300"))
        all_meds = [r[0] for r in result]
    
    # 2. Generate Data in Memory
    print(f"Generating 18,000 rows for {len(all_meds)} meds...")
    
    rows_per_med = 18000 // len(all_meds)
    csv_buffer = io.StringIO()
    writer = csv.writer(csv_buffer)
    # Header must match table columns order if using FROM STDIN without columns specified, 
    # but safe to specify columns in COPY.
    # checking table schema again... id is serial? 
    # Columns: med_name, batch_id, quantity, expiry_date, cost_price, status
    # Note: id is usually serial and auto-filled.
    
    for med in all_meds:
        price = round(random.uniform(10, 500), 2)
        for i in range(rows_per_med):
            batch_id = f"B-{med[:3].upper()}-{random.randint(1000, 9999)}"
            
            r = random.random()
            if r < 0.05:
                expiry_date = datetime.now() - timedelta(days=random.randint(1, 100))
                status = "Expired"
                qty = random.randint(1, 10)
            elif r < 0.15:
                expiry_date = datetime.now() + timedelta(days=random.randint(1, 60))
                qty = random.randint(2, 15)
                status = "Low Stock"
            else:
                expiry_date = datetime.now() + timedelta(days=random.randint(61, 730))
                qty = random.randint(10, 50)
                status = "Good"
            
            if status == "Good" and random.random() < 0.10:
                qty = random.randint(0, 10)
                status = "Low Stock"
                if qty == 0: status = "Out of Stock"
            
            # Write to CSV buffer
            writer.writerow([med, batch_id, qty, expiry_date, price, status])
            
    csv_buffer.seek(0)
    
    # 3. Fast Upload
    print("Uploading to DB...")
    raw_conn = engine.raw_connection()
    try:
        cursor = raw_conn.cursor()
        
        # Truncate first
        cursor.execute("TRUNCATE TABLE inventory RESTART IDENTITY")
        raw_conn.commit()
        print("✅ Truncated.")
        
        # COPY
        cursor.copy_expert(
            "COPY inventory (med_name, batch_id, quantity, expiry_date, cost_price, status) FROM STDIN WITH CSV",
            csv_buffer
        )
        raw_conn.commit()
        print("✅ Bulk Upload Complete!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        raw_conn.rollback()
    finally:
        raw_conn.close()

if __name__ == "__main__":
    fast_reset()
