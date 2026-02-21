from db_direct import engine
from sqlalchemy import text

def check_count():
    with engine.connect() as conn:
        count = conn.execute(text("SELECT COUNT(*) FROM inventory")).scalar()
        print(f"REAL DB COUNT: {count}")

if __name__ == "__main__":
    check_count()
