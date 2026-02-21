from db_direct import engine
from sqlalchemy import text

def count_waste():
    with engine.connect() as conn:
        result = conn.execute(text("SELECT COUNT(*) FROM waste_logs")).scalar()
        print(f"Total Rows in waste_logs: {result}")
        
        result2 = conn.execute(text("SELECT COUNT(DISTINCT med_name) FROM waste_logs")).scalar()
        print(f"Distinct Meds: {result2}")
        
        # Check if they are just the 42 mock items?
        # Mock items usually have nice round numbers or specific names.

if __name__ == "__main__":
    count_waste()
