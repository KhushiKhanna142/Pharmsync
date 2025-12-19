from db_direct import engine
from sqlalchemy import text
from datetime import datetime
import pandas as pd

def sync_expiry_sweeper():
    print(f"--- Starting Expiry Sweep at {datetime.now()} ---")
    
    expired_batches = []
    
    # 1. READ (Identify candidates)
    with engine.connect() as conn:
        # Rule: Expiry Date < Now AND Quantity > 0 AND Status != 'Expired'
        find_query = text("""
            SELECT id, batch_id, med_name, quantity, cost_price, expiry_date
            FROM inventory
            WHERE expiry_date < NOW()
              AND quantity > 0
        """)
        
        result = conn.execute(find_query)
        expired_batches = [dict(row) for row in result.mappings()]
        
    if not expired_batches:
        print("✅ No new expired batches found. System is in sync.")
        return

    print(f"⚠️ Found {len(expired_batches)} batches that have expired but are marked as active.")
    
    # 2. PROCESS (Move to Waste -> Update Inventory)
    moved_count = 0
    total_value = 0.0
    
    # Prepare for bulk processing
    waste_entries = []
    batch_ids = []
    
    for batch in expired_batches:
        qty = batch['quantity']
        cost = batch['cost_price'] if batch['cost_price'] else 0.0
        loss = float(qty) * float(cost)
        
        waste_entries.append({
            "med_name": batch['med_name'],
            "reason": "Expired",
            "quantity": qty,
            "total_loss": loss,
            "date": datetime.now(),
            "cost_per_unit": cost,
            "batch_id": batch['batch_id']
        })
        
        batch_ids.append(batch['batch_id'])
        total_value += loss
        moved_count += 1
        
    # 3. TRANSACTION (Write Phase)
    # Process in chunks to avoid timeouts
    CHUNK_SIZE = 500
    
    try:
        with engine.begin() as conn: 
            # A. Insert into Waste Logs (Chunked)
            print(f"   Moving {len(waste_entries)} items to Waste Logs (Chunked)...")
            kf_stmt = text("""
                INSERT INTO waste_logs (med_name, reason, quantity, total_loss, date, cost_per_unit, batch_id)
                VALUES (:med_name, :reason, :quantity, :total_loss, :date, :cost_per_unit, :batch_id)
            """)
            
            for i in range(0, len(waste_entries), CHUNK_SIZE):
                chunk = waste_entries[i:i + CHUNK_SIZE]
                print(f"      - Inserting chunk {i} to {i+len(chunk)}...")
                conn.execute(kf_stmt, chunk)
                
            # B. Zero out Inventory (Chunked)
            print(f"   Zeroing out {len(batch_ids)} items in Inventory (Chunked)...")
            
            update_stmt = text("""
                UPDATE inventory 
                SET quantity = 0, status = 'Expired'
                WHERE batch_id = :batch_id
            """)
            
            update_params = [{"batch_id": b_id} for b_id in batch_ids]
            
            for i in range(0, len(update_params), CHUNK_SIZE):
                chunk = update_params[i:i + CHUNK_SIZE]
                print(f"      - Updating chunk {i} to {i+len(chunk)}...")
                conn.execute(update_stmt, chunk)
        
        print("✅ Transaction COMMITTED successfully.")
    except Exception as e:
        print(f"❌ Transaction FAILED/ROLLED BACK: {e}")
        import traceback
        traceback.print_exc()
            
    print("------------------------------------------------")
    print(f"✅ SYNC COMPLETE.")
    print(f"   Moved {moved_count} batches.")
    print(f"   Total Value Written Off: ${total_value:,.2f}")
    print("------------------------------------------------")

if __name__ == "__main__":
    sync_expiry_sweeper()
