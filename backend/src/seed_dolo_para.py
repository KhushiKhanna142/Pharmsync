from db_direct import engine
from sqlalchemy import text
from datetime import datetime, timedelta
import random

def seed_missing_meds():
    # Drug Catalog Data (Brand Name, Generic, Manuf, Amount, Strength, Form, Ingredient)
    new_drugs = [
        {
            "brand": "Dolo 650",
            "generic": "Paracetamol",
            "manuf": "Micro Labs Ltd",
            "dosage": "650mg",
            "form": "Tablet",
            "ingredient": "Paracetamol"
        },
        {
            "brand": "Paracetamol 500mg",
            "generic": "Paracetamol",
            "manuf": "GSK",
            "dosage": "500mg",
            "form": "Tablet",
            "ingredient": "Paracetamol"
        }
    ]

    meds_to_add = [
        # Name, Expiry Days Offset, Qty, Cost
        ("Dolo 650", 120, 500, 2.50),  # Matches user request exactly
    ]

    with engine.connect() as conn:
        print("Seeding Drugs Catalog first...")
        
        for drug in new_drugs:
            # Upsert into drugs table
            try:
                # Assuming brand_name is PK or Unique. 
                # Postgres "ON CONFLICT" requires knowing the constraint name or column.
                # Simplest way: Try insert, ignore error.
                query_drug = text("""
                    INSERT INTO drugs (brand_name, generic_name, manufacturer, dosage, dosage_form, primary_ingredient)
                    VALUES (:brand, :generic, :manuf, :dosage, :form, :ingredient)
                    ON CONFLICT (brand_name) DO NOTHING;
                """)
                conn.execute(query_drug, drug)
            except Exception as e:
                print(f"Skipping {drug['brand']} catalog insert (might exist): {e}")

        print("Seeding Inventory...")
        
        for name, days, qty, cost in meds_to_add:
            # Delete existing "test" batches first to avoid clogging? No, just add.
            expiry = (datetime.now() + timedelta(days=days)).strftime('%Y-%m-%d')
            batch_id = f"BATCH-{random.randint(1000, 9999)}"
            
            query = text("""
                INSERT INTO inventory (med_name, batch_id, quantity, expiry_date, cost_price, status)
                VALUES (:name, :batch, :qty, :expiry, :cost, 'Stock')
            """)
            
            conn.execute(query, {
                "name": name, 
                "batch": batch_id, 
                "qty": qty, 
                "expiry": expiry,
                "cost": cost
            })
            
        conn.commit()
        print("Done. Successfully added Dolo and Paracetamol.")

if __name__ == "__main__":
    seed_missing_meds()
