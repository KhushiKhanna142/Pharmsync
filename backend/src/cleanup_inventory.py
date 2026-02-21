from db_direct import engine
from sqlalchemy import text
import sys

def cleanup():
    print("Connecting to DB...")
    try:
        with engine.connect() as conn:
            print("Cleaning Inventory...")
            print("Sync Logic: Deleting expired items from Inventory that are NOT present in Waste Logs.")
            
            # Delete from inventory where:
            # 1. It is expired (expiry_date < NOW())
            # 2. The drug name is NOT found in waste_logs (meaning it wasn't officially logged as waste yet, or is 'extra' junk)
            
            sql = text("""
                DELETE FROM inventory 
                WHERE expiry_date < NOW() 
                AND med_name NOT IN (
                    SELECT DISTINCT med_name FROM waste_logs
                )
            """)
            
            result = conn.execute(sql)
            conn.commit()
            print(f"SUCCESS: Deleted {result.rowcount} rows from Inventory.")
            
    except Exception as e:
        print(f"ERROR: Database operation failed: {e}")
        print("Please check your internet connection and try again.")
        sys.exit(1)
        
if __name__ == "__main__":
    cleanup()
