import pandas as pd
import os

def calculate_reorder():
    print("Calculating Reorder Recommendations...")

    # Paths
    DATA_DIR = os.path.join(os.path.dirname(__file__), '../data')
    FORECAST_PATH = os.path.join(DATA_DIR, 'forecast_results.csv')
    INVENTORY_PATH = os.path.join(DATA_DIR, 'current_inventory.csv')
    WASTE_PATH = os.path.join(DATA_DIR, 'waste_report.csv')
    REORDER_PATH = os.path.join(DATA_DIR, 'reorder_recommendations.csv')
    DRUGS_CSV_PATH = os.path.join(os.path.dirname(__file__), '../../dataset/archive/DRUGS.csv')

    if not os.path.exists(FORECAST_PATH) or not os.path.exists(INVENTORY_PATH):
        print("Error: transform/forecast data missing.")
        return

    # 1. Get Forecast Demand (Avg Daily Sales over next 15 days)
    df_forecast = pd.read_csv(FORECAST_PATH)
    avg_daily_demand = df_forecast['predicted_sales'].mean()
    print(f"Average Daily Demand (Global): {avg_daily_demand:.2f}")
    
    # Note: In a real system, we'd have demand PER MED. 
    # Here, we only have global category demand. We will allocate this demand 
    # pro-rata or just assume this is a single 'Drug/Health' category bucket for now.
    # To make it realistic for the meds we generated (Dolo, Augmentin, etc.), 
    # let's assume they contribute equally to the total sales for this demo, 
    # OR simpler: Treat the forecast as a "Category Target" and check simple stock rules.
    
    # Load Drug Names from Dataset
    if os.path.exists(DRUGS_CSV_PATH):
        df_drugs = pd.read_csv(DRUGS_CSV_PATH)
        meds = df_drugs['brandName'].unique().tolist()
        print(f"Loaded {len(meds)} drugs from dataset.")
    else:
        print("Warning: DRUGS.csv not found. Using dummy list.")
        meds = ['Dolo 650', 'Augmentin', 'Pan 40', 'Azithral']

    # Distribute Demand Pro-Rata (Simple Heuristic for Demo)
    # real engine would forecast per SKU.
    if not meds:
         meds = ['Generic Drug A']
    
    share_per_med = 1.0 / len(meds)
    med_demand = {m: avg_daily_demand * share_per_med for m in meds}

    # 2. Get Current Stock (Net of Expiry)
    df_inv = pd.read_csv(INVENTORY_PATH)
    
    # Identify batches expiring soon to exclude from "Valid Stock"
    # We can load waste report or re-calc. specific logic.
    # Let's trust waste_report if exists, otherwise assume 0 waste for safety
    expiring_batches = set()
    if os.path.exists(WASTE_PATH):
        df_waste = pd.read_csv(WASTE_PATH)
        # Assuming waste report aggregates; we need raw batch ids if we want to be precise,
        # but here we can just subtract the "Potential Waste Units" count from total.
        # However, generate_batches made specific batch IDs.
    # Simpler: Re-calc valid stock from inventory dataframe directly
    # 'Low Risk' stock = expiry > 45 days roughly.
    # We really want: Quantity that is usable for the next coverage period (e.g. 7 days).
    # If something expires in 10 days, it's valid for now but maybe not for next week.
    # 2. Get Current Stock (Net of Expiry) from PostgreSQL using SQLAlchemy
    print("Fetching inventory from DB...")
    from sqlalchemy import text
    from db_direct import engine
    
    stock_levels = {}
    current_stock_names = []
    
    try:
        if engine:
            with engine.connect() as conn:
                # Group by med_name
                query = text("SELECT med_name, SUM(quantity) as total_qty FROM inventory GROUP BY med_name")
                result = conn.execute(query).mappings().all()
                
                stock_levels = {r['med_name']: r['total_qty'] for r in result}
                current_stock_names = list(stock_levels.keys())
        else:
             print("DB Engine unavailable. Skipping DB fetch.")
    except Exception as e:
        print(f"Error fetching from DB: {e}")

    # Check overlap
    overlap = len(set(meds).intersection(set(current_stock_names)))
    
    if overlap < len(meds) / 2:
        print("Inventory mismatch or empty. Generating synthetic stock for demo logic...")
        import random
        for m in meds:
             if m not in stock_levels:
                stock_levels[m] = random.randint(int(med_demand.get(m, 10)*0), int(med_demand.get(m, 10)*20))

    recommendations = []
    
    for med in meds:
        daily_sales = med_demand.get(med, 0)
        current_stock = stock_levels.get(med, 0)
        
        # Policy:
        # Cover 7 days of sales (Weekly Cycle)
        # Buffer: +3 days (Safety Stock)
        target_days = 7 + 3
        target_stock = daily_sales * target_days
        
        # Net Stock (Subtracting simplistic waste factor if we wanted, 
        # but let's stick to total on hand for now to keep it clear)
        net_stock = current_stock
        
        reorder_qty = 0
        status = "OK"
        
        if net_stock < target_stock:
            reorder_qty = target_stock - net_stock
            status = "Reorder Needed"
            
        recommendations.append({
            'med_name': med,
            'avg_daily_demand': round(daily_sales, 1),
            'current_stock': net_stock,
            'target_stock': round(target_stock, 1),
            'reorder_qty': round(reorder_qty, 0),
            'status': status
        })
        
    df_reorder = pd.DataFrame(recommendations)
    print("\nReorder Analysis:")
    print(df_reorder)
    
    df_reorder.to_csv(REORDER_PATH, index=False)
    print(f"Saved recommendations to {REORDER_PATH}")

if __name__ == "__main__":
    calculate_reorder()
