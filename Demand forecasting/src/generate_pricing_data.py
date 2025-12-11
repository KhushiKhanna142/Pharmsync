import pandas as pd
import numpy as np
import os
import random

def generate_pricing_data():
    print("Generating mock Retail Price Optimization data...")
    # Target Features: qty, total_price, freight_price, product_score, month, category
    
    # We want to simulate Price Elasticity: Higher Price -> Lower Qty
    
    n_rows = 2000
    data = []
    
    categories = ['Health_Beauty', 'Pharma_OTC', 'Personal_Care']
    
    for _ in range(n_rows):
        cat = random.choice(categories)
        
        # Base Price
        unit_price = round(random.uniform(10, 200), 2)
        
        # Freight
        freight = round(random.uniform(2, 20), 2)
        
        # Product Score (1-5 stars)
        score = round(random.uniform(3.0, 5.0), 1)
        
        # Month
        month = random.randint(1, 12)
        
        # Demand Simulation (Elasticity Logic)
        # Demand = Base - (Sensitivity * Price) + (Score * Bonus) + Random
        base_demand = 50
        sensitivity = 0.15
        
        expected_qty = base_demand - (unit_price * sensitivity) + (score * 5)
        # Add holiday bump for some months
        if month in [11, 12]:
            expected_qty *= 1.2
            
        qty = int(max(0, np.random.normal(expected_qty, 5)))
        
        total_price = unit_price * qty + freight
        
        data.append({
            'qty': qty,
            'unit_price': unit_price, # Derived feature
            'total_price': total_price, # Original Kaggle feature
            'freight_price': freight,
            'product_score': score,
            'month': month,
            'product_category_name': cat
        })
        
    df = pd.DataFrame(data)
    
    output_path = os.path.join(os.path.dirname(__file__), '../data/price_optimization.csv')
    df.to_csv(output_path, index=False)
    print(f"Generated {len(df)} rows of pricing data at {output_path}")

if __name__ == "__main__":
    generate_pricing_data()
