from db_direct import engine
from sqlalchemy import text
import random
from datetime import datetime, timedelta
import io
import csv

def fast_seed_waste():
    print("🚀 Seeding Waste Data (COPY Protocol)...")
    
    # 1. Targets
    target_damaged = 200
    target_temp = 100
    
    with engine.connect() as conn:
        current_counts = conn.execute(text("SELECT reason, COUNT(*) FROM waste_logs GROUP BY reason")).fetchall()
        counts = {row[0]: row[1] for row in current_counts}
        meds = conn.execute(text("SELECT med_name, COALESCE(cost_price, 10.0) as cost FROM inventory ORDER BY RANDOM() LIMIT 200")).mappings().all()
        meds_list = [dict(m) for m in meds]
        
    cur_damaged = counts.get('Damaged', 0)
    cur_temp = counts.get('Temperature Excursion', 0)
    
    needed_damaged = max(0, target_damaged - cur_damaged)
    needed_temp = max(0, target_temp - cur_temp)
    
    # Correction: If sync_expiry put thousands of Expired, that's fine. We only care about Damaged/Temp.
    
    print(f"Current: Damaged={cur_damaged}, Temp={cur_temp}")
    print(f"Needed:  Damaged={needed_damaged}, Temp={needed_temp}")
    
    if needed_damaged == 0 and needed_temp == 0:
        print("✅ Targets already met.")
        return

    csv_buffer = io.StringIO()
    writer = csv.writer(csv_buffer)
    # Columns matches table order or we specify them in COPY statement
    # Let's specify: med_name, reason, quantity, total_loss, date, cost_per_unit, batch_id
    
    count = 0
    # Damaged
    for _ in range(needed_damaged):
        med = random.choice(meds_list)
        qty = random.randint(1, 5)
        loss = round(float(qty) * float(med['cost']), 2)
        date = datetime.now() - timedelta(days=random.randint(0, 60))
        writer.writerow([med['med_name'], "Damaged", qty, loss, date, med['cost'], f"DMG-{random.randint(10000,99999)}"])
        count += 1
        
    # Temp
    for _ in range(needed_temp):
        med = random.choice(meds_list)
        qty = random.randint(5, 20)
        loss = round(float(qty) * float(med['cost']), 2)
        date = datetime.now() - timedelta(days=random.randint(0, 60))
        writer.writerow([med['med_name'], "Temperature Excursion", qty, loss, date, med['cost'], f"TMP-{random.randint(10000,99999)}"])
        count += 1
        
    csv_buffer.seek(0)
    
    # COPY
    raw_conn = engine.raw_connection()
    try:
        cursor = raw_conn.cursor()
        cursor.copy_expert(
            "COPY waste_logs (med_name, reason, quantity, total_loss, date, cost_per_unit, batch_id) FROM STDIN WITH CSV",
            csv_buffer
        )
        raw_conn.commit()
        print(f"✅ Bulk Uploaded {count} rows!")
    except Exception as e:
        print(f"❌ Error: {e}")
        raw_conn.rollback()
    finally:
        raw_conn.close()

if __name__ == "__main__":
    fast_seed_waste()
