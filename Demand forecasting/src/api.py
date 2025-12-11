from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import os
import uvicorn
from sqlalchemy import text
from db_direct import get_db, engine

app = FastAPI(title="Inventory Engine API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:8080", "http://localhost:8081", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths
DATA_DIR = os.path.join(os.path.dirname(__file__), '../data')
FORECAST_PATH = os.path.join(DATA_DIR, 'forecast_results.csv')
DETAILED_FORECAST_PATH = os.path.join(DATA_DIR, 'forecast_detailed.csv')
WASTE_PATH = os.path.join(DATA_DIR, 'waste_report.csv')
REORDER_PATH = os.path.join(DATA_DIR, 'reorder_recommendations.csv')
INVENTORY_PATH = os.path.join(DATA_DIR, 'current_inventory.csv')
WASTE_LOG_PATH = os.path.join(DATA_DIR, 'waste_log.csv')

# ... (Health and Forecast endpoints are fine)

@app.get("/inventory")
def get_inventory():
    """Returns full inventory data (PostgreSQL)"""
    try:
        # Use simple SQL query via engine for speed (or use session if preferred)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT * FROM inventory ORDER BY quantity ASC"))
            rows = result.mappings().all()
            
            # Convert to list of dicts
            return [dict(row) for row in rows]
            
    except Exception as e:
        print(f"DB Fetch failed: {e}. Falling back to CSV.")
        # Fallback to CSV
        if os.path.exists(INVENTORY_PATH): 
             df = pd.read_csv(INVENTORY_PATH)
             def clean_record(record):
                return {k: ( None if pd.isna(v) else v ) for k, v in record.items()}
             return [clean_record(r) for r in df.to_dict(orient='records')]
        
        raise HTTPException(status_code=500, detail="Inventory unavailable")

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "Inventory Forecasting Engine"}

@app.get("/forecast")
def get_forecast():
    """Returns sales forecast broken down by Top 5 Medicines"""
    if not os.path.exists(FORECAST_PATH):
        raise HTTPException(status_code=404, detail="Forecast data not found. Run forecasting.py first.")
    
    # 1. Load Total Forecast (Time Series)
    df_total = pd.read_csv(FORECAST_PATH)
    
    # NEW: Check if CSV already has granular columns (from forecasting_v2.py)
    # If it has columns other than 'date' and 'predicted_sales' + 'is_holiday', treat as Real Data
    existing_cols = [c for c in df_total.columns if c not in ['date', 'predicted_sales', 'is_holiday']]
    
    if len(existing_cols) > 0:
        # We have the real deal from Module 1.1
        # Just return it! (Numpy types need conversion to native for JSON)
        return df_total.to_dict(orient='records')

    # FALLBACK: Synthesis Logic (Old Module 1.0)
    # 2. Load Drug List (to get names)
    med_names = ['Dolo 650', 'Augmentin', 'Pan 40', 'Azithral', 'Cipcal 500'] # Default
    if os.path.exists(REORDER_PATH):
        try:
             df_reorder = pd.read_csv(REORDER_PATH)
             if 'med_name' in df_reorder.columns and not df_reorder.empty:
                 med_names = df_reorder['med_name'].head(5).tolist()
        except:
             pass

    # 3. Synthesize "Market Share" for Demo purpose
    shares = [0.35, 0.25, 0.15, 0.15, 0.10]
    shares = shares[:len(med_names)]
    total_share = sum(shares)
    shares = [s/total_share for s in shares]
    
    output_data = []
    
    for _, row in df_total.iterrows():
        date_str = row['date']
        total_val = row['predicted_sales']
        
        entry = {"date": date_str}
        
        for i, med in enumerate(med_names):
            noise_factor = 1.0 + ( (hash(med + date_str) % 20) - 10 ) / 100.0
            val = total_val * shares[i] * noise_factor
            entry[med] = round(max(0, val)) 
            
        output_data.append(entry)
        
    return output_data

import numpy as np # Add this import

# ...

@app.get("/forecast/detail")
def get_forecast_detail(med_name: str = "all"):
    """Returns detailed history + forecast + CI for a specific drug"""
    if not os.path.exists(DETAILED_FORECAST_PATH):
        raise HTTPException(status_code=404, detail="Detailed forecast data not found.")
        
    df = pd.read_csv(DETAILED_FORECAST_PATH)
    
    if med_name != "all":
        df = df[df['med_name'] == med_name]
        
    # Robust sanitization for JSON (NaN, Inf, -Inf -> None)
    df = df.replace([np.inf, -np.inf, np.nan], None)
    
    return df.to_dict(orient='records')

@app.get("/waste")
def get_waste_alerts():
    """Returns waste/expiry alerts aggregated from DB"""
    try:
        # DB Query for Aggregation
        # Risk levels: Critical < 15, High < 30, Moderate < 45
        query = text("""
        SELECT 
            med_name,
            COUNT(*) as batches_at_risk,
            SUM(quantity) as total_quantity,
            MIN(expiry_date - NOW()) as time_left_interval
        FROM inventory
        WHERE expiry_date <= NOW() + INTERVAL '45 days'
        GROUP BY med_name
        """)
        
        with engine.connect() as conn:
            # Get Outbreak Meds for Risk Mitigation
            outbreak_meds, _ = get_active_outbreaks(conn)

            result = conn.execute(query)
            rows = result.mappings().all()
            
            alerts = []
            for r in rows:
                days = r['time_left_interval'].days if r['time_left_interval'] else 0
                med_name = r['med_name']
                
                # OUTBREAK LOGIC 2: Expiry Risk Mitigation
                mitigated = False
                original_level = ""
                
                if days < 15: level = "Critical"
                elif days < 30: level = "High"
                else: level = "Moderate"
                
                original_level = level
                
                if med_name in outbreak_meds and level in ["Critical", "High"]:
                    level = "Mitigated (Outbreak Reserve)"
                    mitigated = True
                
                alerts.append({
                    "med_name": med_name,
                    "batches_at_risk": r['batches_at_risk'],
                    "total_quantity": r['total_quantity'],
                    "earliest_expiry_days": max(0, days),
                    "risk_level": level,
                    "mitigated": mitigated # New Field
                })
            return alerts

    except Exception as e:
         print(f"Error in /waste: {e}")
         # Fallback to CSV logic if DB fails
         if os.path.exists(INVENTORY_PATH):
             # ... (previous CSV logic could be kept here, simplified for brevity)
             pass
         return []

# --- HELPER: Outbreak Intelligence ---
def get_active_outbreaks(conn):
    """
    Fetches active outbreaks and returns a set of affected medicines and metadata.
    """
    try:
        query = text("""
            SELECT * FROM outbreak_forecasts 
            WHERE end_date >= NOW() AND start_date <= NOW()
        """)
        rows = conn.execute(query).mappings().all()
        
        affected_meds = set()
        outbreak_info = []
        
        import json
        for r in rows:
            meds = json.loads(r['affected_meds']) if r['affected_meds'] else []
            for m in meds:
                affected_meds.add(m)
            outbreak_info.append({
                "name": r['outbreak_name'],
                "risk": r['risk_level'],
                "meds": meds
            })
            
        return affected_meds, outbreak_info
    except Exception as e:
        print(f"Outbreak Fetch Error: {e}")
        return set(), []

# --- ENDPOINTS ---

@app.get("/reorder")
def get_reorder_recommendations():
    """Returns reorder recommendations using DB Inventory + Forecast CSV + Outbreak Intel"""
    try:
        recommendations = []
        
        with engine.connect() as conn:
            # 0. Get Outbreak Data
            outbreak_meds, outbreak_info = get_active_outbreaks(conn)
            
            # 1. Get Inventory (Live from DB)
            inventory_map = {}
            # Group by med_name to get total Qty across all batches
            query = text("SELECT med_name, SUM(quantity) as total_qty FROM inventory GROUP BY med_name")
            rows = conn.execute(query).mappings().all()
            inventory_map = {r['med_name']: r['total_qty'] for r in rows}

            # 2. Get Forecast Demand 
            med_demand = {}
            if os.path.exists(FORECAST_PATH):
                df_forecast = pd.read_csv(FORECAST_PATH)
                if 'med_name' in df_forecast.columns:
                     demand_series = df_forecast.groupby('med_name')['predicted_sales'].mean()
                     med_demand = demand_series.to_dict()
                else:
                     global_avg = df_forecast['predicted_sales'].mean()
                     for m in inventory_map.keys():
                         med_demand[m] = global_avg * 0.2
        
            # 3. Calculate Logic
            all_meds = set(inventory_map.keys()).union(set(med_demand.keys()))
            
            for med in all_meds:
                daily_sales = med_demand.get(med, 5) # Default 5 units/day
                current_stock = inventory_map.get(med, 0)
                
                # OUTBREAK LOGIC 1: Demand Multiplier
                is_outbreak_drug = med in outbreak_meds
                multiplier = 1.0
                reason_tag = None
                
                if is_outbreak_drug:
                    multiplier = 1.5 # Boost demand by 50%
                    reason_tag = "Demand Boosted by Outbreak Intel"
                    daily_sales *= multiplier
                
                target_days = 10
                target_stock = daily_sales * target_days
                
                if current_stock < target_stock:
                    status = "Reorder Needed"
                    reorder_qty = int(target_stock - current_stock)
                else:
                    status = "OK"
                    reorder_qty = 0
                    
                recommendations.append({
                    "med_name": med,
                    "current_stock": int(current_stock),
                    "avg_daily_demand": round(daily_sales, 1),
                    "target_stock": int(target_stock),
                    "status": status,
                    "reorder_qty": reorder_qty,
                    "outbreak_tag": reason_tag # New Field
                })
            
        return sorted(recommendations, key=lambda x: x['reorder_qty'], reverse=True)

    except Exception as e:
        print(f"Error in /reorder: {e}")
        if os.path.exists(REORDER_PATH):
            df = pd.read_csv(REORDER_PATH)
            return df.to_dict(orient='records')
        raise HTTPException(status_code=500, detail=str(e))



# --- MODULE 6: Waste & Revenue Recovery ---

@app.get("/waste/analytics")
def get_waste_analytics():
    """Returns data for Expiry Monitor and Waste Analytics charts (SQL ver)"""
    try:
        analytics = {
            "batch_health": [],
            "projected_loss": 0,
            "waste_reasons": []
        }
        
        with engine.connect() as conn:
            # 1. Batch Health (Top 50 expiring)
            # Projected Loss (< 90 days)
            
            # Fetch Batch Health
            health_query = text("""
                SELECT 
                    batch_id as id, 
                    med_name, 
                    quantity as "Qty_On_Hand", 
                    cost_price as "Cost_Price",
                    expiry_date
                FROM inventory
                WHERE expiry_date IS NOT NULL
                ORDER BY expiry_date ASC
                LIMIT 50
            """)
            health_rows = conn.execute(health_query).mappings().all()
            
            processed_health = []
            today = pd.Timestamp.now() # Use Pandas timestamp for easy diff
            
            for r in health_rows:
                # Calculate days left python side or SQL side
                # SQL side: EXTRACT(DAY FROM expiry_date - NOW())
                
                # Let's do simple python calc for now to reuse object
                exp = pd.to_datetime(r['expiry_date'])
                days = (exp - today).days
                
                item = dict(r)
                item['days_left'] = days
                # Handle types for JSON
                item['expiry_date'] = str(r['expiry_date'])
                processed_health.append(item)
                
            analytics['batch_health'] = processed_health
            
            # Projected Loss (< 90 days)
            loss_query = text("""
                SELECT SUM(quantity * cost_price) 
                FROM inventory 
                WHERE expiry_date < NOW() + INTERVAL '90 days'
            """)
            loss_val = conn.execute(loss_query).scalar()
            analytics['projected_loss'] = int(loss_val) if loss_val else 0

            # 2. Waste Reasons (From waste_logs table)
            waste_query = text("""
                SELECT reason as waste_reason, SUM(total_loss) as total_loss
                FROM waste_logs
                GROUP BY reason
            """)
            waste_rows = conn.execute(waste_query).mappings().all()
            analytics['waste_reasons'] = [dict(r) for r in waste_rows]
            
        return analytics

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error in /waste/analytics: {e}")
        return { "batch_health": [], "projected_loss": 0, "waste_reasons": [] }

@app.get("/revenue/recovery")
def get_revenue_recovery(med_name: str, current_price: float, days_left: int):
    """
    Dynamic Pricing Engine: Suggests discounts for near-expiry items.
    """
    try:
        # OUTBREAK LOGIC 3: Suppress Clearance for Critical Outbreak Drugs
        with engine.connect() as conn:
             outbreak_meds, _ = get_active_outbreaks(conn)
             
        if med_name in outbreak_meds:
            # Return strategy to HOLD STOCK
            return [{
                "discount_pct": 0,
                "price": current_price,
                "est_qty": 0,
                "est_revenue": 0,
                "note": "OUTBREAK ALERT: Do not discount. Stock required for active health emergency."
            }]

        # Load Model (In real app, load once at startup)
        # We rely on 'pricing_model.py' being in the same directory
        from pricing_model import train_pricing_model, recommend_discount
        # For performance, we should ideally reuse the model, but training is instant for Numpy
        model = train_pricing_model()
        
        # Calculate Logic
        strategies = []
        discounts = [0, 15, 30, 50]
        
        for d in discounts:
            discounted_price = current_price * (1 - d/100)
            
            # Predict Sales using our Elasticity Model
            input_df = pd.DataFrame([{
               'unit_price': discounted_price,
               'product_score': 4.5, # Assume high quality
               'freight_price': 5.0,
               'month': pd.Timestamp.now().month 
            }])
            
            est_qty = float(model.predict(input_df)[0])
            est_qty = max(0, est_qty)
            
            revenue = discounted_price * est_qty
            
            # "Saved vs Wasted": If we don't sell, we lose Cost. 
            # But here we just show distinct Revenue scenarios.
            
            strategies.append({
                "discount_pct": d,
                "price": round(discounted_price, 2),
                "est_qty": round(est_qty, 1),
                "est_revenue": round(revenue, 2)
            })
            
        return strategies
            
    except Exception as e:
        print(f"Error in /revenue/recovery: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
