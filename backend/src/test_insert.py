from db_direct import engine
from sqlalchemy import text
from datetime import datetime

def test_insert():
    print("Testing single row insert...")
    try:
        with engine.begin() as conn:
            stmt = text("""
                INSERT INTO inventory (med_name, batch_id, quantity, expiry_date, cost_price, status)
                VALUES (:med_name, :batch_id, :quantity, :expiry_date, :cost_price, :status)
            """)
            conn.execute(stmt, {
                "med_name": "Dolo 650", # Valid if Dolo 650 is in drugs, likely is. Or use one I know exists.
                # Use a safe one or query one first. 
                # I'll just query one first to be safe.
                "batch_id": "TEST-123",
                "quantity": 10,
                "expiry_date": datetime.now(),
                "cost_price": 5.0,
                "status": "Good"
            })
        print("✅ Inserted successfully.")
    except Exception as e:
        print(f"❌ Failed: {e}")

if __name__ == "__main__":
    # Get a valid med name first
    with engine.connect() as conn:
        med = conn.execute(text("SELECT brand_name FROM drugs LIMIT 1")).scalar()
        print(f"Using med: {med}")
        
    # Now insert
    with engine.begin() as conn:
         stmt = text("""
                INSERT INTO inventory (med_name, batch_id, quantity, expiry_date, cost_price, status)
                VALUES (:med_name, 'TEST-999', 10, NOW(), 5.0, 'Good')
            """)
         conn.execute(stmt, {"med_name": med})
    print("✅ Real valid insert success.")

