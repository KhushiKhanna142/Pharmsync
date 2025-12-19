from db_direct import engine
from sqlalchemy import text

def check_meds():
    with engine.connect() as conn:
        print("\n--- Searching for 'Paracetamol' and 'Dolo' ---\n")
        query = text("""
            SELECT DISTINCT med_name, quantity, expiry_date 
            FROM inventory 
            WHERE med_name ILIKE '%Para%' OR med_name ILIKE '%Dolo%'
            ORDER BY med_name
        """)
        rows = conn.execute(query).mappings().all()
        
        if not rows:
            print("No matches found for 'Para' or 'Dolo'.")
        else:
            for r in rows:
                print(f"Found: {r['med_name']} | Qty: {r['quantity']} | Exp: {r['expiry_date']}")

if __name__ == "__main__":
    check_meds()
