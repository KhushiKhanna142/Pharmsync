from db_direct import engine
from sqlalchemy import text

def update_schema():
    print("Checking 'waste_logs' schema...")
    with engine.connect() as conn:
        with conn.begin(): # Transaction
            # Check if column exists
            check_query = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='waste_logs' AND column_name='batch_id';
            """)
            exists = conn.execute(check_query).scalar()
            
            if not exists:
                print("Adding 'batch_id' column to waste_logs...")
                # Add column
                conn.execute(text("ALTER TABLE waste_logs ADD COLUMN batch_id VARCHAR(50)"))
                # Add Index for performance
                conn.execute(text("CREATE INDEX IF NOT EXISTS idx_waste_batch ON waste_logs(batch_id)"))
                print("✅ Schema updated successfully.")
            else:
                print("ℹ️ Column 'batch_id' already exists.")

if __name__ == "__main__":
    update_schema()
