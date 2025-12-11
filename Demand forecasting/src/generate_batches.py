import pandas as pd
import random
from datetime import datetime, timedelta

def generate_inventory():
    print("Generating comprehensive pharmacy batch inventory (1,000 rows)...")
    meds = [
         # Expanded list for 1000 rows diversity
        'Dolo 650', 'Augmentin', 'Pan 40', 'Azithral', 'Cipcal 500', 
        'Metformin', 'Atorvastatin', 'Telmisartan', 'Amoxicillin', 'Ibuprofen',
        'Paracetamol', 'Cetirizine', 'Pantoprazole', 'Domperidone', 'Aspirin'
    ]
    
    batches = []
    target_count = 1000
    
    today = datetime.now()
    
    for i in range(target_count):
        med = random.choice(meds)
        batch_id = f"B-{random.randint(2023, 2024)}-{str(i).zfill(4)}"
        
        # 5% Critical Risk (< 30 days)
        if random.random() < 0.05:
            days_to_expiry = random.randint(1, 29)
        else:
            days_to_expiry = random.randint(30, 365*2)
            
        expiry_date = today + timedelta(days=days_to_expiry)
        mfg_date = expiry_date - timedelta(days=730) # Approx 2 year shelf life
        
        qty = random.randint(10, 100)
        cost = round(random.uniform(5.0, 500.0), 2)
        
        batches.append({
            'Batch_ID': batch_id,
            'SKU_ID': med,
            'Mfg_Date': mfg_date.strftime('%Y-%m-%d'),
            'Expiry_Date': expiry_date.strftime('%Y-%m-%d'),
            'Qty_On_Hand': qty,
            'Cost_Price': cost
        })
    
    df = pd.DataFrame(batches)
    
    # Save to pharmacy_batches.csv as requested
    output_path = os.path.join(os.path.dirname(__file__), '../data/pharmacy_batches.csv')
    df.to_csv(output_path, index=False)
    
    # Also overwrite current_inventory.csv for backward compatibility with API
    # API expects: med_name, batch_id, quantity, expiry_date
    df_compat = df.rename(columns={
        'SKU_ID': 'med_name', 
        'Batch_ID': 'batch_id', 
        'Qty_On_Hand': 'quantity', 
        'Expiry_Date': 'expiry_date'
    })
    compat_path = os.path.join(os.path.dirname(__file__), '../data/current_inventory.csv')
    df_compat.to_csv(compat_path, index=False)
    
    print(f"Generated {len(df)} batches.")
    print(f"Saved to {output_path} and {compat_path}")
    
    # Stats
    critical = df[pd.to_datetime(df['Expiry_Date']) < (today + timedelta(days=30))]
    print(f"Critical Waste Risk (<30 days): {len(critical)} batches")
    
    # --- Generate Historical Waste Log for Charts ---
    print("\nGenerating Historical Waste Log (waste_log.csv)...")
    waste_reasons = ['Expired', 'Damaged', 'Temperature Excursion']
    waste_entries = []
    
    # Simulate waste events over last 6 months
    for _ in range(200):
        med = random.choice(meds)
        qty = random.randint(1, 20)
        cost = round(random.uniform(5.0, 500.0), 2)
        reason = random.choices(waste_reasons, weights=[0.6, 0.3, 0.1])[0]
        
        # Random date in last 180 days
        days_ago = random.randint(1, 180)
        event_date = today - timedelta(days=days_ago)
        
        waste_entries.append({
            'med_name': med,
            'waste_qty': qty,
            'cost_per_unit': cost,
            'total_loss': round(qty * cost, 2),
            'waste_reason': reason,
            'event_date': event_date.strftime('%Y-%m-%d')
        })
        
    df_waste = pd.DataFrame(waste_entries)
    waste_path = os.path.join(os.path.dirname(__file__), '../data/waste_log.csv')
    df_waste.to_csv(waste_path, index=False)
    print(f"Generated {len(df_waste)} waste log entries at {waste_path}")

if __name__ == "__main__":
    import os
    generate_inventory()
