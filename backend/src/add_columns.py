from sqlalchemy import text
from db_direct import engine

def add_columns():
    if not engine:
        print("❌ Database engine not available.")
        return

    print("--- Adding Missing Columns to 'drugs' table ---")
    
    commands = [
        "ALTER TABLE drugs ADD COLUMN IF NOT EXISTS manufacturer TEXT;",
        "ALTER TABLE drugs ADD COLUMN IF NOT EXISTS dosage_form TEXT;",
        "ALTER TABLE drugs ADD COLUMN IF NOT EXISTS primary_ingredient TEXT;"
    ]

    try:
        with engine.connect() as conn:
            with conn.begin():
                for cmd in commands:
                    print(f"Executing: {cmd}")
                    conn.execute(text(cmd))
        print("✅ Columns added successfully.")
    except Exception as e:
        print(f"❌ Error adding columns: {e}")

if __name__ == "__main__":
    add_columns()
