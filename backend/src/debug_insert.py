from sqlalchemy import text
from db_direct import engine

print("--- Debug Insert ---")
try:
    with engine.connect() as conn:
        with conn.begin():
            # Check table existence (inside transaction)
            res = conn.execute(text("SELECT table_schema, table_name FROM information_schema.tables WHERE table_name = 'inventory'"))
            print(f"Table Found: {res.mappings().all()}")
            
            # Insert 1 Row with VALID med_name
            print("Inserting VALID test row (Dolo 650)...")
            conn.execute(text("INSERT INTO inventory (med_name, quantity, batch_id) VALUES ('Dolo 650', 50, 'BATCH_DEBUG_01')"))
            
        print("Insert executed and committed.")
        
        # Check Count (new transaction)
        cnt = conn.execute(text("SELECT count(*) FROM inventory")).scalar()
        print(f"Row count: {cnt}")
        
except Exception as e:
    print(f"Error: {e}")
