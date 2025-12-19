from db_direct import engine
from sqlalchemy import text
from datetime import datetime

def test_sync_one():
    print("Testing syncing ONE expired item...")
    try:
        with engine.begin() as conn:
            # 1. Find ONE expired item
            row = conn.execute(text("SELECT * FROM inventory WHERE expiry_date < NOW() AND quantity > 0 LIMIT 1")).mappings().fetchone()
            if not row:
                print("No expired items found!")
                return

            print(f"Found item: {row['med_name']} (Batch: {row['batch_id']})")
            
            # 2. Insert to Waste
            print("Inserting to Waste...")
            conn.execute(text("""
                INSERT INTO waste_logs (med_name, reason, quantity, total_loss, date, cost_per_unit, batch_id)
                VALUES (:med_name, 'Expired', :quantity, :total_loss, NOW(), :cost, :batch_id)
            """), {
                "med_name": row['med_name'],
                "quantity": row['quantity'],
                "total_loss": float(row['quantity'] * (row['cost_price'] or 0)),
                "cost": row['cost_price'],
                "batch_id": row['batch_id']
            })
            
            # 3. Update Inventory
            print("Updating Inventory...")
            conn.execute(text("UPDATE inventory SET quantity=0, status='Expired' WHERE batch_id=:batch_id"), {"batch_id": row['batch_id']})
    
        print("✅ Success! Transaction Committed.")
    except Exception as e:
        print(f"❌ Failed: {e}")

if __name__ == "__main__":
    test_sync_one()
