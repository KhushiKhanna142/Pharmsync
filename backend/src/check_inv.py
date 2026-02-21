from db_direct import engine
from sqlalchemy import text

def check_inventory():
    with engine.connect() as conn:
        print("Checking Inventory...")
        # Count expired but active
        sql = """
            SELECT COUNT(*) 
            FROM inventory 
            WHERE expiry_date < NOW() AND quantity > 0 AND status != 'Expired'
        """
        count = conn.execute(text(sql)).scalar()
        print(f"Expired but Active Items: {count}")

        # Count total rows
        total = conn.execute(text("SELECT COUNT(*) FROM inventory")).scalar()
        print(f"Total Inventory Rows: {total}")

if __name__ == "__main__":
    check_inventory()
