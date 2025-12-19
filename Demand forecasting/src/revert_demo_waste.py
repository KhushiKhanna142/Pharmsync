from db_direct import engine
from sqlalchemy import text

def revert_demo_data():
    print("Reverting demo waste records...")
    
    # Delete based on the unique huge values and reasons we just added
    
    with engine.begin() as conn:
        # 1. Amoxicillin Temp Excursion
        conn.execute(text("DELETE FROM waste_logs WHERE med_name = 'Amoxicillin 500mg' AND reason = 'Temperature Excursion'"))
        
        # 2. Metformin Damaged
        conn.execute(text("DELETE FROM waste_logs WHERE med_name = 'Metformin 1000mg' AND reason = 'Damaged'"))
        
        # 3. Lisinopril Damaged
        conn.execute(text("DELETE FROM waste_logs WHERE med_name = 'Lisinopril 10mg' AND reason = 'Damaged'"))

    print("Reverted! Demo records removed.")

if __name__ == "__main__":
    revert_demo_data()
