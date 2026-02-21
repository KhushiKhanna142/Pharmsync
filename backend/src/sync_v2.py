from db_direct import engine
from sqlalchemy import text
from datetime import datetime

def sync_v2():
    print("🚀 Starting Sync V2 (Deadlock Avoidance)...")
    
    # 1. READ (Separate Connection)
    expired_batches = []
    print("Reading expired items...")
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT id, batch_id, med_name, quantity, cost_price 
            FROM inventory 
            WHERE expiry_date < NOW() AND quantity > 0
        """))
        expired_batches = [dict(r) for r in result.mappings()]
        
    if not expired_batches:
        print("✅ No items to sync.")
        return

    print(f"Found {len(expired_batches)} items.")
    
    # 2. WRITE WASTE (Separate Transaction)
    print("Writing to Waste Logs...")
    waste_values = []
    batch_ids = []
    for b in expired_batches:
        qty = b['quantity']
        cost = b['cost_price'] or 0
        loss = float(qty) * float(cost)
        waste_values.append({
            "med_name": b['med_name'],
            "reason": "Expired",
            "quantity": qty,
            "total_loss": loss,
            "date": datetime.now(),
            "cost_per_unit": cost,
            "batch_id": b['batch_id']
        })
        batch_ids.append(b['batch_id'])

    # Use chunks for Insert
    CHUNK_SIZE = 100
    with engine.begin() as conn:
        stmt = text("""
            INSERT INTO waste_logs (med_name, reason, quantity, total_loss, date, cost_per_unit, batch_id)
            VALUES (:med_name, :reason, :quantity, :total_loss, :date, :cost_per_unit, :batch_id)
        """)
        for i in range(0, len(waste_values), CHUNK_SIZE):
            chunk = waste_values[i:i+CHUNK_SIZE]
            conn.execute(stmt, chunk)
            print(f"   Inserted waste chunk {i}")
            
    print("✅ Waste Logs Updated.")

    # 3. UPDATE INVENTORY (Separate Transaction)
    print("Updating Inventory...")
    with engine.begin() as conn:
        stmt = text("UPDATE inventory SET quantity = 0, status = 'Expired' WHERE batch_id = :batch_id")
        # Chunked updates
        params = [{"batch_id": b} for b in batch_ids]
        for i in range(0, len(params), CHUNK_SIZE):
            chunk = params[i:i+CHUNK_SIZE]
            conn.execute(stmt, chunk)
            print(f"   Updated inventory chunk {i}")

    print("✅ Sync Complete!")

if __name__ == "__main__":
    sync_v2()
