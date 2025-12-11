import pandas as pd
import os
from datetime import datetime, timedelta

def analyze_waste():
    print("Starting Waste Analysis...")
    
    # Load inventory
    inventory_path = os.path.join(os.path.dirname(__file__), '../data/current_inventory.csv')
    if not os.path.exists(inventory_path):
        raise FileNotFoundError(f"{inventory_path} not found. Run generate_batches.py first.")
    
    df = pd.read_csv(inventory_path)
    
    # Convert expiry to datetime
    df['expiry_date'] = pd.to_datetime(df['expiry_date'])
    
    # Define thresholds
    today = datetime.now()
    threshold_days = 45
    alert_date = today + timedelta(days=threshold_days)
    
    # Filter expiring
    expiring_df = df[df['expiry_date'] <= alert_date].copy()
    expiring_df['days_to_expiry'] = (expiring_df['expiry_date'] - today).dt.days
    
    print(f"\n--- Expiry Risk Report (Next {threshold_days} Days) ---")
    
    if expiring_df.empty:
        print("No stock expiring soon.")
    else:
        # Aggregate by Med
        summary = expiring_df.groupby('med_name').agg({
            'batch_id': 'count',
            'quantity': 'sum',
            'days_to_expiry': 'min'
        }).rename(columns={
            'batch_id': 'Batches at Risk',
            'quantity': 'Potential Waste Units',
            'days_to_expiry': 'Earliest Expiry (Days)'
        })
        
        print(summary)
        
        # Save Report
        report_path = os.path.join(os.path.dirname(__file__), '../data/waste_report.csv')
        summary.to_csv(report_path)
        print(f"\nSummary report saved to {report_path}")

        # Return list for API
        # Convert to list of dicts for JSON response
        return expiring_df[['med_name', 'batch_id', 'expiry_date', 'quantity', 'days_to_expiry']].to_dict(orient='records')


if __name__ == "__main__":
    analyze_waste()
