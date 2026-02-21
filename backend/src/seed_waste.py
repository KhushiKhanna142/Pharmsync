from db_direct import engine
from sqlalchemy import text
import random
from datetime import datetime, timedelta

def seed_waste():
    print("🌱 Seeding Waste Data...")
    
    # 1. Targets
    target_damaged = 200
    target_temp = 100
    
    with engine.connect() as conn:
        current_counts = conn.execute(text("SELECT reason, COUNT(*) FROM waste_logs GROUP BY reason")).fetchall()
        counts = {row[0]: row[1] for row in current_counts}
        
    cur_damaged = counts.get('Damaged', 0)
    cur_temp = counts.get('Temperature Excursion', 0)
    
    needed_damaged = max(0, target_damaged - cur_damaged)
    needed_temp = max(0, target_temp - cur_temp)
    
    print(f"Current: Damaged={cur_damaged}, Temp={cur_temp}")
    print(f"Needed:  Damaged={needed_damaged}, Temp={needed_temp}")
    
    if needed_damaged == 0 and needed_temp == 0:
        print("✅ Targets already met.")
        return

    # 2. Get Meds for Context
    with engine.connect() as conn:
        # Get random list of meds with prices
        meds = conn.execute(text("SELECT med_name, COALESCE(cost_price, 10.0) as cost FROM inventory ORDER BY RANDOM() LIMIT 200")).mappings().all()
        meds_list = [dict(m) for m in meds]
        
    if not meds_list:
        print("❌ No meds found in inventory to base waste on.")
        return

    new_rows = []
    
    # Generate Damaged
    for _ in range(needed_damaged):
        med = random.choice(meds_list)
        qty = random.randint(1, 5) # Small incidents
        loss = float(qty) * float(med['cost'])
        # Random date in last 60 days
        date = datetime.now() - timedelta(days=random.randint(0, 60))
        
        new_rows.append({
            "med_name": med['med_name'],
            "reason": "Damaged",
            "quantity": qty,
            "total_loss": loss,
            "date": date,
            "cost_per_unit": med['cost'],
            "batch_id": f"DMG-{random.randint(10000,99999)}"
        })
        
    # Generate Temp Excursion
    for _ in range(needed_temp):
        med = random.choice(meds_list)
        qty = random.randint(5, 20) # Bulk incident likely
        loss = float(qty) * float(med['cost'])
        date = datetime.now() - timedelta(days=random.randint(0, 60))
        
        new_rows.append({
            "med_name": med['med_name'],
            "reason": "Temperature Excursion",
            "quantity": qty,
            "total_loss": loss,
            "date": date,
            "cost_per_unit": med['cost'],
            "batch_id": f"TMP-{random.randint(10000,99999)}"
        })

    # 3. Insert
    print(f"Inserting {len(new_rows)} rows...")
    with engine.begin() as conn:
        stmt = text("""
            INSERT INTO waste_logs (med_name, reason, quantity, total_loss, date, cost_per_unit, batch_id)
            VALUES (:med_name, :reason, :quantity, :total_loss, :date, :cost_per_unit, :batch_id)
        """)
        # Chunk it
        chunk_size = 100
        for i in range(0, len(new_rows), chunk_size):
            chunk = new_rows[i:i+chunk_size]
            conn.execute(stmt, chunk)
            
    print("✅ Waste Seeding Complete.")

if __name__ == "__main__":
    seed_waste()
