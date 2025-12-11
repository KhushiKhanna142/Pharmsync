import pandas as pd
import numpy as np
import os
from datetime import timedelta

def train_and_predict():
    print("Starting Forecasting Model (Refined: Numpy Linear Regression)...")
    
    # Load data
    data_path = os.path.join(os.path.dirname(__file__), '../data/processed_sales.csv')
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"{data_path} not found. Run ingestion.py first.")
    
    df = pd.read_csv(data_path)
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date')
    
    # Validation Split
    max_date = df['date'].max()
    split_date = max_date - timedelta(days=30)
    
    train = df[df['date'] <= split_date].copy()
    valid = df[df['date'] > split_date].copy()
    
    print(f"Training on {len(train)} records. Validating on {len(valid)} records.")
    
    # Feature Preparation Function
    def make_features(input_df, start_date_ord):
        # 1. Trend: Date as ordinal (normalized by subtracting start)
        t = (input_df['date'].apply(lambda x: x.toordinal()) - start_date_ord).values
        
        # 2. Holiday
        h = input_df['is_holiday'].astype(int).values
        
        # 3. Day of Week (One-Hot Encoding)
        # Create 7 columns (0-6)
        dows = input_df['date'].dt.dayofweek.values
        dow_onehot = np.zeros((len(dows), 7))
        dow_onehot[np.arange(len(dows)), dows] = 1
        
        # 4. Bias (Column of 1s)
        bias = np.ones(len(input_df))
        
        # Combine: Bias, Trend, Holiday, DOW_0, ..., DOW_6
        # Note: Dropping one DOW is theoretically cleaner for non-regularized regression, 
        # but lstsq handles collinearity fine.
        X = np.column_stack([bias, t, h, dow_onehot])
        return X

    # Prepare Training Data
    start_time_ord = train['date'].min().toordinal()
    X_train = make_features(train, start_time_ord)
    y_train = train['sales'].values
    
    # Train Model (Linear Regression via Least Squares)
    # y = Xw
    weights, residuals, rank, s = np.linalg.lstsq(X_train, y_train, rcond=None)
    
    print("Model Trained.")
    print(f"Weights (Bias, Trend, Holiday, DOW:0-6):\n{weights.round(2)}")
    
    # Evaluation on Validation
    X_valid = make_features(valid, start_time_ord)
    valid_preds = X_valid.dot(weights)
    
    # Metrics
    mae = np.mean(np.abs(valid['sales'] - valid_preds))
    rmse = np.sqrt(np.mean((valid['sales'] - valid_preds)**2))
    
    print(f"Validation MAE: {mae:.2f}")
    print(f"Validation RMSE: {rmse:.2f}")
    
    # Future Prediction (Next 15 Days)
    print("\nGenerating 90-day forecast...")
    
    # Re-train on FULL data for best future prediction
    X_full = make_features(df, start_time_ord)
    y_full = df['sales'].values
    weights_full, _, _, _ = np.linalg.lstsq(X_full, y_full, rcond=None)
    
    future_dates = [max_date + timedelta(days=i) for i in range(1, 91)]
    future_df = pd.DataFrame({'date': future_dates})
    # Assume is_holiday=0 for future for now (unless we merge calendar again)
    future_df['is_holiday'] = False 
    
    X_future = make_features(future_df, start_time_ord)
    future_preds = X_future.dot(weights_full)
    
    future_df['predicted_sales'] = future_preds
    
    print(future_df.head(15))
    
    output_path = os.path.join(os.path.dirname(__file__), '../data/forecast_results.csv')
    future_df.to_csv(output_path, index=False)
    print(f"Forecast saved to {output_path}")

if __name__ == "__main__":
    train_and_predict()
