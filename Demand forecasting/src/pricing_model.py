import pandas as pd
import numpy as np
import os

# Load Data
DATA_PATH = os.path.join(os.path.dirname(__file__), '../data/price_optimization.csv')

class SimpleElasticityModel:
    """
    A pure Numpy implementation of Linear Regression to model Price Elasticity.
    Used as a robust fallback since Scikit-Learn/XGBoost have environment issues.
    Equation: Qty = w0 + w1*Price + w2*Score + w3*Freight + w4*Month
    """
    def __init__(self):
        self.weights = None
        self.features = ['unit_price', 'product_score', 'freight_price', 'month']
        
    def fit(self, df):
        # Prepare Matrix X (add intercept column)
        X = df[self.features].values
        # Add column of 1s for intercept
        X = np.c_[np.ones(X.shape[0]), X]
        
        y = df['qty'].values
        
        # Closed-form Linear Regression: w = (X^T X)^-1 X^T y
        # precise and fast for this dataset size
        try:
            self.weights = np.linalg.lstsq(X, y, rcond=None)[0]
            print("Model Trained using Pure Numpy (Least Squares).")
            print(f"Weights: Intercept={self.weights[0]:.2f}, PriceCoef={self.weights[1]:.2f}")
            if self.weights[1] >= 0:
                print("Warning: Positive Price Coefficient (Inelastic). Check data generation.")
        except Exception as e:
            print(f"Training Failed: {e}")
            
    def predict(self, input_df):
        X = input_df[self.features].values
        X = np.c_[np.ones(X.shape[0]), X]
        return X.dot(self.weights)

def train_pricing_model():
    print("Training Dynamic Pricing Model (Numpy Engine)...")
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"Data not found at {DATA_PATH}")
        
    df = pd.read_csv(DATA_PATH)
    model = SimpleElasticityModel()
    model.fit(df)
    return model

def recommend_discount(model, current_price, product_score=4.5, freight=5.0, month=12):
    """
    Predicts sales uplift for a 15% discount.
    User Question: "If I discount this near-expiry item by 15%, how much will sales increase?"
    """
    
    # Scenario A: Current Price
    input_current = pd.DataFrame([{
        'unit_price': current_price,
        'product_score': product_score,
        'freight_price': freight,
        'month': month
    }])
    
    # Scenario B: Discounted Price (15% off)
    discounted_price = current_price * 0.85
    input_discount = pd.DataFrame([{
        'unit_price': discounted_price,
        'product_score': product_score,
        'freight_price': freight,
        'month': month
    }])
    
    pred_current = float(model.predict(input_current)[0])
    pred_discount = float(model.predict(input_discount)[0])
    
    # Ensure non-negative predictions for sales
    pred_current = max(0, pred_current)
    pred_discount = max(0, pred_discount)
    
    uplift_pct = ((pred_discount - pred_current) / pred_current) * 100 if pred_current > 0 else 0
    
    print(f"\n--- Pricing Inference (Numpy) ---")
    print(f"Item Score: {product_score}, Month: {month}")
    print(f"Current Price: ${current_price:.2f} -> Est. Sales: {pred_current:.1f} units")
    print(f"Discounted (15%): ${discounted_price:.2f} -> Est. Sales: {pred_discount:.1f} units")
    print(f"Result: Sales increase by {uplift_pct:.1f}%")
    
    return {
        "current_sales": pred_current,
        "discounted_sales": pred_discount,
        "uplift_pct": uplift_pct
    }

if __name__ == "__main__":
    try:
        model = train_pricing_model()
        
        # Test Scenarios
        print("\nTesting Scenario 1: Expensive Item ($150)")
        recommend_discount(model, current_price=150.0)
        
        print("\nTesting Scenario 2: Cheap Item ($20)")
        recommend_discount(model, current_price=20.0)
    except Exception as e:
        print(f"Error: {e}")
