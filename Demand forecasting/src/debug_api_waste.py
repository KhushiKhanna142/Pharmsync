from db_direct import engine
from sqlalchemy import text

def debug_waste_endpoint():
    print("debugging /waste/analytics endpoint...")
    try:
        with engine.connect() as conn:
            # 1. KPI
            print("Checking KPI...")
            kpi_query = text("""
                SELECT 
                    COALESCE(SUM(quantity), 0) as total_units,
                    COALESCE(SUM(total_loss), 0) as total_value,
                    COUNT(*) as log_count
                FROM waste_logs
            """)
            kpi = conn.execute(kpi_query).mappings().one()
            print(f"KPI Success: {dict(kpi)}")
            
            # 2. Top Waste
            print("Checking Top Waste...")
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
            top_waste = [dict(r) for r in conn.execute(top_waste_query).mappings().all()]
            print(f"Top Waste Success: Found {len(top_waste)} items")

            # 3. Categories
            print("Checking Categories...")
            cat_query = text("""
                SELECT reason, SUM(total_loss) as value
                FROM waste_logs
                GROUP BY reason
            """)
            cat_rows = conn.execute(cat_query).mappings().all()
            print(f"Categories Success: Found {len(cat_rows)} items")
            
            # 4. Overstock
            print("Checking Overstock...")
            overstock_query = text("""
                SELECT med_name, quantity, quantity * COALESCE(cost_price, 0) as value 
                FROM inventory 
                WHERE quantity > 500
                ORDER BY quantity DESC
                LIMIT 5
            """)
            overstock_rows = [dict(r) for r in conn.execute(overstock_query).mappings().all()]
            print(f"Overstock Success: Found {len(overstock_rows)} items")
            
            # 5. General Inventory Check
            print("Checking Total Inventory...")
            inv_query = text("SELECT COUNT(*) FROM inventory")
            inv_count = conn.execute(inv_query).scalar()
            print(f"Inventory Count: {inv_count}")

            print("ALL CHECKS PASSED")

    except Exception as e:
        print(f"\n!!! CRASH DETECTED !!!")
        print(e)

if __name__ == "__main__":
    debug_waste_endpoint()
