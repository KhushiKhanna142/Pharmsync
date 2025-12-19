from sqlalchemy import text
from db_direct import engine
import pandas as pd

def verify_expiry_logic():
    if not engine:
        print("❌ Database engine not available.")
        return

    print("--- Verifying Expiry Distribution ---")
    
    # Pick a popular medicine
    med_name = "Augmentin 625 Duo Tablet"
    
    query = text("""
        SELECT batch_id, quantity, status, mfg_date, expiry_date 
        FROM inventory 
        WHERE med_name = :med_name
        ORDER BY expiry_date ASC
    """)
    
    try:
        with engine.connect() as conn:
            result = conn.execute(query, {"med_name": med_name})
            rows = result.fetchall()
            
        print(f"Indices for {med_name}: {len(rows)}")
        if len(rows) == 0:
            print("⚠️ No records found. Migration might be incomplete.")
            return

        print(f"{'Batch ID':<20} | {'Qty':<5} | {'Status':<12} | {'Expiry':<12}")
        print("-" * 60)
        
        total_qty = sum(r[1] for r in rows)
        
        for r in rows:
            print(f"{r[0]:<20} | {r[1]:<5} | {r[2]:<12} | {r[4]}")
            
        print("-" * 60)
        print(f"Total Quantity: {total_qty}")
        
    except Exception as e:
        print(f"❌ Error verifying: {e}")

if __name__ == "__main__":
    verify_expiry_logic()
