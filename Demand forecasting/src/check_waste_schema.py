from db_direct import engine
from sqlalchemy import text

def check_schema():
    with engine.connect() as conn:
        print("Columns in waste_logs:")
        result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='waste_logs'"))
        for row in result:
            print(f"- {row[0]}")

        print("\nAttempting problematic query:")
        try:
            conn.execute(text("SELECT id FROM waste_logs LIMIT 1"))
            print("✅ 'id' column exists and is queryable.")
        except Exception as e:
            print(f"❌ 'id' query failed: {e}")

if __name__ == "__main__":
    check_schema()
