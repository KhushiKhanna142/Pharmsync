from sqlalchemy import text
from db_direct import engine

def setup_outbreak_table():
    with engine.connect() as conn:
        conn.begin()
        # Create Table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS outbreak_forecasts (
                id SERIAL PRIMARY KEY,
                outbreak_name TEXT NOT NULL,
                region TEXT NOT NULL,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                peak_date DATE,
                risk_level TEXT NOT NULL,
                affected_meds JSONB, -- List of medication names
                crated_at TIMESTAMP DEFAULT NOW()
            );
        """))
        
        # Check if empty
        res = conn.execute(text("SELECT count(*) FROM outbreak_forecasts"))
        if res.scalar() == 0:
            print("Seeding Outbreak Data...")
            # Insert Dummy Data for Demo
            conn.execute(text("""
                INSERT INTO outbreak_forecasts (outbreak_name, region, start_date, end_date, peak_date, risk_level, affected_meds)
                VALUES 
                ('Seasonal Flu', 'Mumbai', NOW() - INTERVAL '5 days', NOW() + INTERVAL '10 days', NOW() + INTERVAL '4 days', 'High', '["Amoxicillin", "Dolo 650", "Azithral", "Cheston Cold"]'),
                ('Dengue', 'Delhi', NOW() + INTERVAL '10 days', NOW() + INTERVAL '30 days', NULL, 'Moderate', '["Paracetamol", "Platelet Rich Plasma"]')
            """))
            print("Seeded.")
        else:
            print("Outbreak table already has data.")
            
        conn.commit()

if __name__ == "__main__":
    setup_outbreak_table()
