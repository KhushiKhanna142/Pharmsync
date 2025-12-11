import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, scoped_session

# Load environment variables from project root
dotenv_path = os.path.join(os.path.dirname(__file__), '../../.env')
load_dotenv(dotenv_path)

DATABASE_URL = os.getenv("DB_CONNECTION_STRING")

if not DATABASE_URL or "[YOUR_PASSWORD]" in DATABASE_URL:
    print("WARNING: DB_CONNECTION_STRING not configured properly in .env")
    engine = None
    SessionLocal = None
else:
    # Create the SQLAlchemy engine
    # pool_pre_ping=True handles disconnects gracefully
    try:
        engine = create_engine(DATABASE_URL, pool_pre_ping=True)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        print("Database Engine created successfully.")
    except Exception as e:
        print(f"Failed to create Database Engine: {e}")
        engine = None
        SessionLocal = None

def get_db():
    """Dependency for FastAPI to get a DB session"""
    if SessionLocal is None:
        raise Exception("Database not configured")
        
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def test_connection():
    """Simple connection test"""
    if engine is None:
        return False, "Engine not initialized"
        
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            return True, "Connection successful"
    except Exception as e:
        return False, str(e)
