from db_direct import engine
from sqlalchemy import text
import pandas as pd

def consolidate_db():
    print("Connecting to database...")
    # Use engine.begin() for atomic transaction
    with engine.begin() as conn:
        # 1. Fetch Aggregated Data
        print("Fetching aggregated data...")
        query = text("""
            SELECT 
                med_name, 
                reason, 
                SUM(quantity) as quantity, 
                SUM(total_loss) as total_loss,
                MAX(date) as date,
                MAX(cost_per_unit) as cost_per_unit
            FROM waste_logs 
            GROUP BY med_name, reason
        """)
        rows = conn.execute(query).mappings().all()
        aggregated_data = [dict(r) for r in rows]
        
        print(f"Found {len(aggregated_data)} unique med/reason groups.")
        
        if not aggregated_data:
            print("No data to consolidate.")
            return

        # 2. Wipe and Re-insert (Inside same transaction)
        print("Consolidating database table...")
        
        # Clear table
        conn.execute(text("DELETE FROM waste_logs"))
        
        # Insert aggregated
        insert_query = text("""
            INSERT INTO waste_logs (med_name, reason, quantity, total_loss, date, cost_per_unit)
            VALUES (:med_name, :reason, :quantity, :total_loss, :date, :cost_per_unit)
        """)
        
        for row in aggregated_data:
            # Recalculate cost_per_unit to be safe
            if row['quantity'] > 0:
                row['cost_per_unit'] = float(row['total_loss']) / float(row['quantity'])
            
            conn.execute(insert_query, row)
            
    print("Success! Waste logs consolidated.")

if __name__ == "__main__":
    consolidate_db()
