from db_direct import engine
from sqlalchemy import text

def check_sum():
    print("Checking Waste Totals...")
    with engine.connect() as conn:
        # 1. Total Rows (Incidents)
        rows = conn.execute(text("SELECT COUNT(*) FROM waste_logs")).scalar()
        
        # 2. Total Quantity (Units)
        units = conn.execute(text("SELECT SUM(quantity) FROM waste_logs")).scalar()
        
        # 3. Breakdown by Reason (Rows vs Units)
        print("\nBreakdown:")
        breakdown = conn.execute(text("SELECT reason, COUNT(*) as rows, SUM(quantity) as units FROM waste_logs GROUP BY reason")).fetchall()
        for r in breakdown:
            print(f"   - {r[0]}: {r[1]} Batches, {r[2]} Units (Avg {round(r[2]/r[1], 1)}/batch)")
            
        print(f"\nFinal Totals: {rows} Batches vs {units} Units")

if __name__ == "__main__":
    check_sum()
