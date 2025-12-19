from db_direct import engine
from sqlalchemy import text
from datetime import datetime

def debug_waste_api():
    print("--- Debugging /waste/analytics Queries ---")
    
    with engine.connect() as conn:
        # 1. KPI Query
        try:
            print("[1/5] Testing KPI Query...")
            kpi_query = text("""
                SELECT 
                    COALESCE(SUM(quantity), 0) as total_units,
                    COALESCE(SUM(total_loss), 0) as total_value,
                    COUNT(*) as log_count
                FROM waste_logs
            """)
            conn.execute(kpi_query).mappings().one()
            print("   ✅ OK")
        except Exception as e:
            print(f"   ❌ FAILED: {e}")

        # 2. Top Waste Query
        try:
            print("[2/5] Testing Top Waste Query...")
            top_waste_query = text("""
                SELECT 
                    med_name as medication,
                    reason as primary_reason,
                    SUM(quantity) as quantity_wasted,
                    SUM(total_loss) as value,
                    MAX(date) as expiry_date
                FROM waste_logs
                GROUP BY med_name, reason
                ORDER BY value DESC
                LIMIT 100
            """)
            conn.execute(top_waste_query).mappings().all()
            print("   ✅ OK")
        except Exception as e:
            print(f"   ❌ FAILED: {e}")

        # 3. Category Query
        try:
            print("[3/5] Testing Category Query...")
            cat_query = text("""
                SELECT reason, SUM(total_loss) as value
                FROM waste_logs
                GROUP BY reason
            """)
            conn.execute(cat_query).mappings().all()
            print("   ✅ OK")
        except Exception as e:
            print(f"   ❌ FAILED: {e}")

        # 4. Overstock Query (Inventory Table)
        try:
            print("[4/5] Testing Overstock Query...")
            overstock_query = text("""
                SELECT med_name, quantity, quantity * COALESCE(cost_price, 0) as value 
                FROM inventory 
                WHERE quantity > 500
                ORDER BY quantity DESC
                LIMIT 5
            """)
            conn.execute(overstock_query).mappings().all()
            print("   ✅ OK")
        except Exception as e:
            print(f"   ❌ FAILED: {e}")

        # 5. Batch Health Query (The one I fixed)
        try:
            print("[5/5] Testing Batch Query (fixed version)...")
            batch_query = text("""
                SELECT batch_id as id, med_name, quantity, date 
                FROM waste_logs 
                ORDER BY date DESC 
                LIMIT 50
            """)
            conn.execute(batch_query).mappings().all()
            print("   ✅ OK")
        except Exception as e:
            print(f"   ❌ FAILED: {e}")

if __name__ == "__main__":
    debug_waste_api()
