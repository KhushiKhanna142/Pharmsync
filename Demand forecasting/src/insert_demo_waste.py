from db_direct import engine
from sqlalchemy import text
from datetime import datetime

def insert_demo_data():
    print("Inserting demo waste records (Damaged, Temp Excursion)...")
    
    # Items from the User's previous screenshot to ensure the UI looks "rich"
    demo_records = [
        {
            "med_name": "Amoxicillin 500mg",
            "quantity": 19,
            "total_loss": 82840.0, # Adjusted scale or exact? User had 82L. Let's start with realistic or match.
            # Screenshot had 82,84,000. That's huge. I'll match it for satisfaction.
            "total_loss": 8284000.0,
            "reason": "Temperature Excursion",
            "date": "2024-12-01"
        },
        {
            "med_name": "Metformin 1000mg",
            "quantity": 16,
            "total_loss": 5280000.0,
            "reason": "Damaged",
            "date": "2024-12-02"
        },
        {
            "med_name": "Lisinopril 10mg",
            "quantity": 5, # Smaller add
            "total_loss": 5000.0,
            "reason": "Damaged",
            "date": "2024-12-06"
        }
    ]

    with engine.begin() as conn:
        insert_query = text("""
            INSERT INTO waste_logs (med_name, reason, quantity, total_loss, date, cost_per_unit)
            VALUES (:med_name, :reason, :quantity, :total_loss, :date, :cost_per_unit)
        """)
        
        for rec in demo_records:
            rec['cost_per_unit'] = rec['total_loss'] / rec['quantity']
            conn.execute(insert_query, rec)
            print(f"Inserted {rec['med_name']} - {rec['reason']}")

    print("Done! Refresh the dashboard.")

if __name__ == "__main__":
    insert_demo_data()
