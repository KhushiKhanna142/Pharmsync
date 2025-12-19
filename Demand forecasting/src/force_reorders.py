from db_direct import engine
from sqlalchemy import text
import random

def force_reorders():
    print("📉 Forcing Low Stock for 50 Meds...")
    
    with engine.connect() as conn:
        # Get 50 rand meds
        meds = conn.execute(text("SELECT med_name FROM inventory GROUP BY med_name ORDER BY RANDOM() LIMIT 50")).scalars().all()
        
    print(f"Selected {len(meds)} meds to deplete.")
    
    with engine.begin() as conn:
        for med in meds:
            # 1. Delete all batches
            conn.execute(text("DELETE FROM inventory WHERE med_name = :med"), {"med": med})
            
            # 2. Add single critical batch
            conn.execute(text("""
                INSERT INTO inventory (med_name, batch_id, quantity, expiry_date, cost_price, status)
                VALUES (:med, :bid, 5, NOW() + INTERVAL '1 year', 10.0, 'Low Stock')
            """), {
                "med": med,
                "bid": f"CRIT-{random.randint(1000,9999)}",
            })
            print(f"   - Depleted {med} to 5 units.")
            
    print("✅ Done. You should now see 50 Reorders.")

if __name__ == "__main__":
    force_reorders()
