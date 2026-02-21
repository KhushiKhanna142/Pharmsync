import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os

def generate_mock_train_data():
    print("Generating larger mock train.csv...")
    start_date = datetime(2024, 1, 1)
    dates = [start_date + timedelta(days=i) for i in range(100)]
    
    records = []
    id_counter = 1
    
    for d in dates:
        # Base sales
        base_sales = 100 + (d.weekday() * 10)  # Weekly pattern
        noise = np.random.randint(-20, 20)
        sales = base_sales + noise
        
        records.append({
            'id': id_counter,
            'date': d.strftime('%Y-%m-%d'),
            'store_nbr': 1,
            'family': 'Drug/Health',
            'sales': max(0, sales),
            'onpromotion': 0
        })
        id_counter += 1
        
    df = pd.DataFrame(records)
    output_path = os.path.join(os.path.dirname(__file__), '../data/raw/train.csv')
    df.to_csv(output_path, index=False)
    print(f"Generated {len(df)} rows of mock data at {output_path}")

if __name__ == "__main__":
    generate_mock_train_data()
