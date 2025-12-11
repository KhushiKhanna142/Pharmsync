from sqlalchemy import text
from db_direct import engine

print("Adding missing columns to inventory...")
try:
    with engine.connect() as conn:
        with conn.begin():
            # Add cost_price
            print("Adding cost_price...")
            try:
                conn.execute(text("ALTER TABLE inventory ADD COLUMN cost_price DOUBLE PRECISION DEFAULT 0.0"))
            except Exception as e:
                print(f"Error adding cost_price (maybe exists?): {e}")

            # Add mfg_date
            print("Adding mfg_date...")
            try:
                 conn.execute(text("ALTER TABLE inventory ADD COLUMN mfg_date TIMESTAMP"))
            except Exception as e:
                print(f"Error adding mfg_date (maybe exists?): {e}")
                
    print("Done.")
    
    # Verify Schema
    with engine.connect() as conn:
        res = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'inventory'"))
        print(f"Current Columns: {[c['column_name'] for c in res.mappings()]}")

except Exception as e:
    print(f"Fatal Error: {e}")
