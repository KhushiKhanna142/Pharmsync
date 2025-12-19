from db_direct import engine
from sqlalchemy import text

def audit():
    print("Auditing DB State...")
    with engine.connect() as conn:
        # A. Inventory State
        print("1. Inventory Expired vs Qty:")
        r1 = conn.execute(text("SELECT COUNT(*) FROM inventory WHERE expiry_date < NOW() AND quantity > 0")).scalar()
        print(f"   - Expired but Active (Qty > 0): {r1} (Should be 0)")
        
        r2 = conn.execute(text("SELECT COUNT(*) FROM inventory WHERE expiry_date < NOW() AND quantity = 0")).scalar()
        print(f"   - Expired and Processed (Qty = 0): {r2} (Potential missing waste logs)")
        
        r3 = conn.execute(text("SELECT COUNT(*) FROM inventory WHERE status = 'Expired'")).scalar()
        print(f"   - Status='Expired': {r3}")
        
        # B. Waste Logs
        w1 = conn.execute(text("SELECT COUNT(*) FROM waste_logs")).scalar()
        print(f"2. Waste Logs Count: {w1}")
        
        # C. Mismatch Check
        # Check how many batch_ids in Inventory (Expired) are NOT in Waste Logs
        mismatch = conn.execute(text("""
            SELECT COUNT(*) 
            FROM inventory i
            LEFT JOIN waste_logs w ON i.batch_id = w.batch_id
            WHERE i.expiry_date < NOW()
              AND i.quantity = 0
              AND w.batch_id IS NULL
        """)).scalar()
        print(f"3. ORPHANED EXPIRED ITEMS (In Inventory but not in Waste): {mismatch}")

if __name__ == "__main__":
    audit()
