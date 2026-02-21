from db_direct import engine
from sqlalchemy import text

def check_drugs():
    with engine.connect() as conn:
        count = conn.execute(text("SELECT COUNT(*) FROM drugs")).scalar()
        print(f"Total Drugs in Catalog: {count}")
        
        # result = conn.execute(text("SELECT med_name FROM drugs LIMIT 10")).mappings().all()
        
        cols = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='drugs'")).fetchall()
        print(f"Drugs Table Columns: {[c[0] for c in cols]}")
        
        # Then count
        count = conn.execute(text("SELECT COUNT(*) FROM drugs")).scalar()
        print(f"Total Drugs in Catalog: {count}")

if __name__ == "__main__":
    check_drugs()
