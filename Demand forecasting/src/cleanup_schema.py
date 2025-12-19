from sqlalchemy import text
from db_direct import engine

def cleanup_schema():
    if not engine:
        print("❌ Database engine not available.")
        return

    print("--- Cleaning up Database Schema ---")
    
    # 1. Drugs Table - Drop 'created_at' and empty columns
    drugs_cols_to_drop = [
        'created_at', 
        'sup_id', 
        'purchase_price', 
        'sell_price', 
        'exp_date', 
        'ndc'
    ]
    
    # 2. Inventory Table - Drop 'created_at'
    inventory_cols_to_drop = [
        'created_at'
    ]

    try:
        with engine.connect() as conn:
            with conn.begin():
                # Drop from Drugs
                for col in drugs_cols_to_drop:
                    cmd = f"ALTER TABLE drugs DROP COLUMN IF EXISTS {col};"
                    print(f"Executing: {cmd}")
                    conn.execute(text(cmd))
                    
                # Drop from Inventory
                for col in inventory_cols_to_drop:
                    cmd = f"ALTER TABLE inventory DROP COLUMN IF EXISTS {col};"
                    print(f"Executing: {cmd}")
                    conn.execute(text(cmd))
                    
        print("✅ Schema cleanup completed successfully.")
        
    except Exception as e:
        print(f"❌ Error during cleanup: {e}")

if __name__ == "__main__":
    cleanup_schema()
