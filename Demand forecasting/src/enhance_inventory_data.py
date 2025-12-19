import pandas as pd
import numpy as np
import random
import string
from datetime import datetime, timedelta
import os

# Paths
INPUT_CSV = "../../indian_pharmaceutical_products_clean.csv"
OUTPUT_CSV = "../data/enhanced_inventory.csv"

# High volume keywords (Common meds)
HIGH_DEMAND_KEYWORDS = [
    'metformin', 'ibuprofen', 'paracetamol', 'amoxicillin', 'azithromycin', 
    'augmentin', 'dolo', 'crocin', 'pan', 'pantoprazole', 'omeprazole', 
    'cetirizine', 'montelukast', 'fexofenadine', 'atorvastatin', 'rosuvastatin',
    'telmisartan', 'amlodipine', 'metoprolol'
]

def generate_batch_id():
    # XXX-YYYYMMDD-Z
    prefix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=3))
    
    # Random date between 2024-01-01 and 2025-12-31
    start_date = datetime(2024, 1, 1)
    end_date = datetime(2025, 12, 31)
    random_days = random.randint(0, (end_date - start_date).days)
    mfg_date = start_date + timedelta(days=random_days)
    date_str = mfg_date.strftime("%Y%m%d")
    
    checksum = random.randint(0, 9)
    return f"{prefix}-{date_str}-{checksum}", mfg_date

def determine_quantity(med_name):
    name_lower = str(med_name).lower()
    
    # 1. High Demand
    if any(k in name_lower for k in HIGH_DEMAND_KEYWORDS):
        return random.randint(200, 500)
    
    # 2. Randomly assign Medium vs Low for others (80% Medium, 20% Low)
    if random.random() < 0.8:
        return random.randint(50, 199) # Medium
    else:
        return random.randint(1, 49) # Low (0 is handled separately)

def main():
    print(f"Reading input CSV: {INPUT_CSV}...")
    try:
        df = pd.read_csv(INPUT_CSV)
    except FileNotFoundError:
        print(f"❌ Error: Input file not found at {INPUT_CSV}")
        return

    print(f"Loaded {len(df)} records.")

    # Prepare lists for new columns
    quantities = []
    batch_ids = []
    mfg_dates = []
    statuses = []
    expiry_dates = []

    print("Generating synthetic data with Expiry Tiers...")
    
    generated_batch_ids = set()
    
    # Tier Configuration
    # (Probability, StartDate, EndDate)
    # Today is roughly assumed to be Dec 12, 2025 based on prompt context
    TIERS = [
        # 1. Expired (10%) - Jan 1, 2024 to Nov 30, 2025
        (0.10, datetime(2024, 1, 1), datetime(2025, 11, 30)),
        
        # 2. Critical (5%) - Dec 13, 2025 to Feb 28, 2026
        (0.05, datetime(2025, 12, 13), datetime(2026, 2, 28)),
        
        # 3. Near-Term (15%) - Mar 1, 2026 to Dec 31, 2026
        (0.15, datetime(2026, 3, 1), datetime(2026, 12, 31)),
        
        # 4. Fresh (70%) - Jan 1, 2027 to Dec 31, 2028
        (0.70, datetime(2027, 1, 1), datetime(2028, 12, 31))
    ]

    # Prepare detailed rows
    # We need to replicate the input row structure for each generated batch
    print("Generating synthetic data with Expiry Tiers (Optimized)...")
    
    generated_batch_ids = set()
    
    # Pre-calculate Tier Dates for speed
    # (Probability, StartDate, EndDate, DaysRange)
    TIERS_OPT = []
    for pct, start, end in TIERS:
        days = (end - start).days
        TIERS_OPT.append((pct, start, end, days))

    new_rows = []
    
    # Use itertuples for 100x speedup
    # Note: row.brand_name must be valid attribute.
    # We strip spaces from column names just in case before iterating?
    # Assuming standard CSV.
    
    total_records = len(df)
    print(f"Processing {total_records} source records...")

    import random
    import string
    
    # Pre-generate a batch of random IDs to reduce call overhead? 
    # Or just use the function. itertuples is main win.
    
    for row in df.itertuples(index=False):
        # Access by attribute name
        # If headers have spaces, pandas replaces with underscore.
        med_name = row.brand_name 
        
        # 1. Quantity
        qty = determine_quantity(med_name)
        
        # Calculate split
        q1 = int(qty * 0.10)
        q2 = int(qty * 0.05)
        q3 = int(qty * 0.15)
        q4 = qty - (q1 + q2 + q3)
        
        splits = [
            (q1, 0), # Index into TIERS_OPT
            (q2, 1),
            (q3, 2),
            (q4, 3)
        ]
        
        for sub_qty, tier_idx in splits:
            if sub_qty <= 0:
                continue
            
            # Tier info
            _, start_dt, _, days_range = TIERS_OPT[tier_idx]
            
            # Generate unique Batch ID
            # Inline generation for speed if possible
            prefix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=3))
            
            # Simple random date for batch string
            # We don't strictly need this to match mfg_date visually in the string,
            # but user might like it. Let's keep it simple.
            r_days = random.randint(0, 700)
            b_date = datetime(2024,1,1) + timedelta(days=r_days)
            b_str = b_date.strftime("%Y%m%d")
            chk = random.randint(0,9)
            bid = f"{prefix}-{b_str}-{chk}"
            
            # Collision check (rare with millions of combos, but safety first)
            while bid in generated_batch_ids:
                 prefix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=3))
                 bid = f"{prefix}-{b_str}-{random.randint(0,9)}"
            generated_batch_ids.add(bid)
            
            # Expiry Date
            rd = random.randint(0, days_range)
            expiry_date = start_dt + timedelta(days=rd)
            
            # Mfg Date
            shelf = random.randint(365, 730)
            mfg_date = expiry_date - timedelta(days=shelf)
            
            # Status
            status = "In Stock"
            if sub_qty == 0: status = "Out of Stock"
            elif sub_qty <= 10: status = "Low Stock"
            
            # Create dict for new row
            # Use _asdict() if available, or just construct dict manually from known cols
            # row is a NamedTuple.
            # Convert to dict is slow inside loop?
            # Better: construct dict of specific enhanced fields and merge later?
            # Or just build the full dict.
            
            r_dict = row._asdict()
            r_dict['Qty_On_Hand'] = sub_qty
            r_dict['Batch_ID'] = bid
            r_dict['Stock_Status'] = status
            r_dict['Mfg_Date'] = mfg_date.strftime("%Y-%m-%d")
            r_dict['Expiry_Date'] = expiry_date.strftime("%Y-%m-%d")
            
            new_rows.append(r_dict)

    print(f"Expanded to {len(new_rows)} batches.")
    output_df = pd.DataFrame(new_rows)
    
    # Save
    output_path = os.path.join(os.path.dirname(__file__), OUTPUT_CSV)
    print(f"Saving to {output_path}...")
    output_df.to_csv(output_path, index=False)
    print("✅ synthetic data generation complete.")

if __name__ == "__main__":
    main()
