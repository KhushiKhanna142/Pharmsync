from db_direct import engine
from sqlalchemy import text
import random

def randomize_inventory():
    """
    Randomize inventory quantities to create variation.
    Current state: Many items have 50 or 0.
    Target: Random values between 25 and 150 for active items.
    """
    try:
        with engine.connect() as conn:
            # 1. Fetch all inventory IDs that need randomization (excluding 0 quantity if we want to keep them dead?)
            # Actually, user said "incentory create variations", maybe revive some 0s too?
            # Let's stick to updating existing positive quantities first to avoid zombies if not intended.
            # But "half batches 50" implies we should target those specifically.
            
            # Update all positive quantities to be random
            print("Randomizing inventory quantities...")
            
            # Option 1: Update individually (slower but safer randomness)
            # Option 2: SQL Math (faster) -> SET quantity = floor(random() * (150-25 + 1) + 25)
            # Postgres supports random().
            
            update_query = text("""
                UPDATE inventory
                SET quantity = floor(random() * (150 - 25 + 1) + 25)::int
                WHERE quantity > 0 OR quantity = 50; 
            """)
            
            result = conn.execute(update_query)
            conn.commit()
            print(f"Updated {result.rowcount} rows with random quantities (25-150).")
            
    except Exception as e:
        print(f"Error randomizing inventory: {e}")

if __name__ == "__main__":
    randomize_inventory()
