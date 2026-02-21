from sqlalchemy import text
from db_direct import engine

with engine.connect() as conn:
    # Check Drugs Table Schema
    print("Checking 'drugs' schema...")
    res = conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'drugs'"))
    cols = res.mappings().all()
    print(f"Columns: {[c['column_name'] for c in cols]}")

    # Check Drugs Count
    res = conn.execute(text("SELECT count(*) FROM drugs"))
    count = res.scalar()
    print(f"Drugs Row Count: {count}")

    # Check Inventory Schema
    print("Checking 'inventory' schema...")
    res = conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'inventory'"))
    cols = res.mappings().all()
    print(f"Inventory Columns: {[c['column_name'] for c in cols]}")
    
    if count > 0:
        # Check for specific simulated meds
        meds = ['Dolo 650', 'Augmentin', 'Pan 40', 'Azithral', 'Cipcal 500']
        print(f"Checking for {meds}...")
        res = conn.execute(text(f"SELECT brand_name FROM drugs WHERE brand_name IN {tuple(meds)}"))
        found = [r['brand_name'] for r in res.mappings()]
        print(f"Found: {found}")
    else:
        print("Drugs table is empty!")

    # Check Inventory Count
    res = conn.execute(text("SELECT count(*) FROM inventory"))
    cnt = res.scalar()
    print(f"Inventory Row Count: {cnt}")
    
    # Check Waste Logs
    print("Checking 'waste_logs'...")
    res = conn.execute(text("SELECT count(*) FROM waste_logs"))
    w_cnt = res.scalar()
    print(f"Waste Logs Count: {w_cnt}")
    
    if w_cnt > 0:
         res = conn.execute(text("SELECT * FROM waste_logs LIMIT 3"))
         print(f"Waste Samples: {res.mappings().all()}")
         
    # Check Expiry Dates
    print("Checking Expiry Dates in Inventory...")
    res = conn.execute(text("SELECT expiry_date FROM inventory WHERE expiry_date IS NOT NULL LIMIT 5"))
    dates = [str(r['expiry_date']) for r in res.mappings().all()]
    print(f"Sample Expiry Dates: {dates}")
