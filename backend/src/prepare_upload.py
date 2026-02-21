import pandas as pd
import os

# Paths
BASE_DIR = os.path.dirname(__file__)
DATASET_DIR = os.path.join(BASE_DIR, '../../dataset/archive')
INVENTORY_CSV = os.path.join(BASE_DIR, '../data/current_inventory.csv')
OUTPUT_DIR = os.path.join(BASE_DIR, 'clean_csvs')

os.makedirs(OUTPUT_DIR, exist_ok=True)

def clean_drugs():
    drugs_path = os.path.join(DATASET_DIR, 'DRUGS.csv')
    if not os.path.exists(drugs_path):
        print("Drugs CSV not found.")
        return

    df = pd.read_csv(drugs_path)
    
    # Rename to match SQL schema
    df = df.rename(columns={
        'brandName': 'brand_name',
        'genericName': 'generic_name',
        'NDC': 'ndc',
        'dosage': 'dosage',
        'expDate': 'exp_date',
        'supID': 'sup_id',
        'purchasePrice': 'purchase_price',
        'sellPrice': 'sell_price'
    })
    
    # Select only matching columns
    cols = ['brand_name', 'generic_name', 'ndc', 'dosage', 'exp_date', 'sup_id', 'purchase_price', 'sell_price']
    df = df[cols]
    
    # Remove duplicates to avoid SQL Unique Violation
    df = df.drop_duplicates(subset=['brand_name'])
    
    # Sanitize types for Supabase
    # 1. Fill NaNs with empty string to prevent 'nan' text in CSV
    df = df.fillna('')
    
    # 2. Ensure numbers are numbers, but formatted nicely
    # sup_id: convert to nullable int logic (string representing int)
    # If it's 1.0, we want "1"
    def clean_int(x):
        if x == '': return ''
        try:
            return str(int(float(x)))
        except:
            return str(x)
            
    df['sup_id'] = df['sup_id'].apply(clean_int)
    
    # 3. purchase_price, sell_price: ensure 2 decimal text? 
    # Pandas default is usually fine, but let's be safe.
    
    out_path = os.path.join(OUTPUT_DIR, 'drugs_upload.csv')
    df.to_csv(out_path, index=False) # standard quoting
    print(f"Created {out_path} (Sanitized Snake Case)")
    
    # Generate CamelCase Version (in case Table uses CamelCase)
    df_camel = df.rename(columns={
        'brand_name': 'brandName',
        'generic_name': 'genericName',
        'ndc': 'NDC',
        'dosage': 'dosage',
        'exp_date': 'expDate',
        'sup_id': 'supID',
        'purchase_price': 'purchasePrice',
        'sell_price': 'sellPrice'
    })
    out_path_camel = os.path.join(OUTPUT_DIR, 'drugs_upload_original.csv')
    df_camel.to_csv(out_path_camel, index=False)
    print(f"Created {out_path_camel} (Original Headers)")

def clean_inventory():
    # Instead of reading potentially mismatched inventory, let's valid inventory
    # based on the drugs we just processed to ensure Foreign Key integrity.
    
    drugs_path = os.path.join(OUTPUT_DIR, 'drugs_upload.csv')
    if not os.path.exists(drugs_path):
        print("Drugs upload file missing. Run this script again.")
        return
        
    df_drugs = pd.read_csv(drugs_path)
    drug_names = df_drugs['brand_name'].unique()
    
    import random
    import datetime
    
    print(f"Generating inventory for {len(drug_names)} drugs...")
    
    inventory_rows = []
    
    # Seed for reproducibility check?
    # random.seed(42)
    
    for i, drug in enumerate(drug_names):
        # Create 2-5 batches per drug
        num_batches = random.randint(2, 5)
        for b in range(num_batches):
             qty = random.randint(20, 150)
             # Random expiry: some soon (waste risk), some far
             days = random.randint(20, 400)
             expiry = (datetime.date.today() + datetime.timedelta(days=days)).isoformat()
             
             status = "OK"
             if days < 30: status = "Critical"
             elif days < 90: status = "Expiring Soon"
             
             inventory_rows.append({
                 "med_name": drug,
                 "batch_id": f"BATCH-{i}-{b}",
                 "quantity": int(qty),
                 "expiry_date": expiry,
                 "status": status
             })
             
    df = pd.DataFrame(inventory_rows)
    
    # Sanitize
    df = df.fillna('')
    
    out_path = os.path.join(OUTPUT_DIR, 'inventory_upload.csv')
    df.to_csv(out_path, index=False)
    print(f"Created {out_path} with {len(df)} rows matching Foreign Keys.")

if __name__ == "__main__":
    clean_drugs()
    clean_inventory()
