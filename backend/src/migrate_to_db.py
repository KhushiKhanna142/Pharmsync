import pandas as pd
import os
import sys
import requests
import json

# Load env directly here to avoid db.py dependency issues
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env'))

SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("VITE_SUPABASE_PUBLISHABLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Supabase credentials missing")
    sys.exit(1)

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates"
}

# Paths
BASE_DIR = os.path.dirname(__file__)
DATASET_DIR = os.path.join(BASE_DIR, '../../dataset/archive')
INVENTORY_CSV = os.path.join(BASE_DIR, '../data/current_inventory.csv')

def migrate_drugs():
    drugs_path = os.path.join(DATASET_DIR, 'DRUGS.csv')
    if not os.path.exists(drugs_path):
        print(f"Error: {drugs_path} not found.")
        return

    print(f"Reading {drugs_path}...")
    df = pd.read_csv(drugs_path)
    
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

    # Fill NaNs with None for JSON compatibility
    df = df.where(pd.notnull(df), None)
    
    records = df.to_dict(orient='records')
    
    print(f"Uploading {len(records)} drugs to Supabase...")
    
    url = f"{SUPABASE_URL}/rest/v1/drugs"
    response = requests.post(url, headers=HEADERS, json=records)
    
    if response.status_code in [200, 201]:
        print("Drugs migration successful!")
    else:
        print(f"Error uploading drugs: {response.text}")

def migrate_inventory():
    if not os.path.exists(INVENTORY_CSV):
        print(f"Error: {INVENTORY_CSV} not found.")
        return

    print(f"Reading {INVENTORY_CSV}...")
    df = pd.read_csv(INVENTORY_CSV)
    
    # Fill NaNs
    df = df.where(pd.notnull(df), None)
    
    records = df.to_dict(orient='records')
    
    print(f"Uploading {len(records)} inventory items to Supabase...")
    
    url = f"{SUPABASE_URL}/rest/v1/inventory"
    response = requests.post(url, headers=HEADERS, json=records)
    
    if response.status_code in [200, 201]:
        print("Inventory migration successful!")
    else:
        print(f"Error uploading inventory: {response.text}")

if __name__ == "__main__":
    migrate_drugs()
    migrate_inventory()
