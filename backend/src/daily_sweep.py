from db_direct import engine
from sqlalchemy import text
from datetime import datetime
import random

def run_daily_sweep():
    print(f"--- Starting Daily Lifecycle & Waste Sweep at {datetime.now()} ---")
    
    # ==========================================
    # PART 1: Strict Expiry Sync (Lifecycle)
    # ==========================================
    print("\n[1/2] Syncing Expired Inventory...")
    
    expired_batches = []
    
    # 1. READ (Identify candidates)
    with engine.connect() as conn:
        find_expired_query = text("""
            SELECT id, batch_id, med_name, quantity, cost_price, expiry_date
            FROM inventory
            WHERE expiry_date < NOW()
              AND quantity > 0
              AND status != 'Expired'
        """)
        result = conn.execute(find_expired_query)
        # Convert to list of dicts immediately to close result set
        expired_batches = [dict(row) for row in result.mappings()]

    # 2. WRITE (Process Expiry)
    if expired_batches:
        print(f"   found {len(expired_batches)} expired batches to process.")
        
        with engine.begin() as conn: # Atomic Transaction Block
            insert_waste = text("""
                INSERT INTO waste_logs (med_name, reason, quantity, total_loss, date, cost_per_unit, batch_id)
                VALUES (:med_name, :reason, :quantity, :total_loss, :date, :cost_per_unit, :batch_id)
            """)
            
            update_inventory = text("""
                UPDATE inventory 
                SET quantity = 0, status = 'Expired'
                WHERE batch_id = :batch_id
            """)
            
            expired_count = 0
            expired_value = 0.0
            
            for batch in expired_batches:
                qty = batch['quantity']
                cost = batch['cost_price'] if batch['cost_price'] else 0.0
                loss = float(qty) * float(cost)
                
                # 1. Log to Waste
                conn.execute(insert_waste, {
                    "med_name": batch['med_name'],
                    "reason": "Expired",
                    "quantity": qty,
                    "total_loss": loss,
                    "date": datetime.now(),
                    "cost_per_unit": cost,
                    "batch_id": batch['batch_id']
                })
                
                # 2. Zero out Inventory
                conn.execute(update_inventory, {"batch_id": batch['batch_id']})
                
                expired_value += loss
                expired_count += 1
        
        print(f"   ✅ Processed {expired_count} expired batches (Value: ${expired_value:,.2f})")
    else:
        print("   ✅ No new expired batches found.")

    # ==========================================
    # PART 2: Ratio Management (Simulated Incidents)
    # ==========================================
    print("\n[2/2] Managing Waste Ratios (Simulating Incidents)...")
    
    active_batches = []
    
    # 1. READ Active Inventory
    with engine.connect() as conn:
        active_query = text("""
            SELECT id, batch_id, med_name, quantity, cost_price, expiry_date
            FROM inventory
            WHERE expiry_date > NOW() 
              AND quantity > 10
              AND status = 'In Stock'
        """)
        result = conn.execute(active_query)
        active_batches = [dict(row) for row in result.mappings()]

    if not active_batches:
        print("   ⚠️ No active inventory suitable for incident simulation.")
    else:
        # logic: Process a small % of active inventory
        num_events = random.randint(3, 7) 
        candidates = random.sample(active_batches, min(num_events, len(active_batches)))
        
        if candidates:
            with engine.begin() as conn: # Atomic Transaction Block
                insert_waste = text("""
                    INSERT INTO waste_logs (med_name, reason, quantity, total_loss, date, cost_per_unit, batch_id)
                    VALUES (:med_name, :reason, :quantity, :total_loss, :date, :cost_per_unit, :batch_id)
                """)
                
                update_inventory_qty = text("""
                    UPDATE inventory 
                    SET quantity = quantity - :loss_qty
                    WHERE batch_id = :batch_id
                """)
                
                incidents_count = 0
                incidents_value = 0.0
                
                for batch in candidates:
                    reason = random.choice(["Damaged", "Temperature Excursion"])
                    max_loss = min(5, batch['quantity'])
                    loss_qty = random.randint(1, max_loss)
                    
                    cost = batch['cost_price'] if batch['cost_price'] else 0.0
                    total_loss = float(loss_qty) * float(cost)
                    
                    conn.execute(insert_waste, {
                        "med_name": batch['med_name'],
                        "reason": reason,
                        "quantity": loss_qty,
                        "total_loss": total_loss,
                        "date": datetime.now(),
                        "cost_per_unit": cost,
                        "batch_id": batch['batch_id']
                    })
                    
                    conn.execute(update_inventory_qty, {
                        "loss_qty": loss_qty,
                        "batch_id": batch['batch_id']
                    })
                    
                    incidents_count += 1
                    incidents_value += total_loss
                    print(f"      -> {batch['med_name']} ({batch['batch_id']}): {loss_qty} units {reason}")
            
            print(f"   ✅ Simulated {incidents_count} incidents (Value: ${incidents_value:,.2f})")
        else:
             print("   ⚠️ No candidates selected.")

    print("\n------------------------------------------------")
    print("✅ DAILY SWEEP COMPLETE")
    print("------------------------------------------------")

if __name__ == "__main__":
    run_daily_sweep()
