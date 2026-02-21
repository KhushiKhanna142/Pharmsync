import pandas as pd
import os

def load_and_process_data():
    raw_data_path = os.path.join(os.path.dirname(__file__), '../data/raw')
    train_path = os.path.join(raw_data_path, 'train.csv')
    holidays_path = os.path.join(raw_data_path, 'holidays_events.csv')

    print(f"Loading data from {train_path}...")
    if not os.path.exists(train_path):
        raise FileNotFoundError(f"{train_path} not found. Please ensure data is present.")
    
    df_train = pd.read_csv(train_path)
    
    # Filter for Drug/Health
    print("Filtering for Drug/Health category...")
    df_sales = df_train[df_train['family'] == 'Drug/Health'].copy()
    
    # Convert date to datetime
    df_sales['date'] = pd.to_datetime(df_sales['date'])
    
    # Load holidays
    if os.path.exists(holidays_path):
        print("Loading and merging holidays...")
        df_holidays = pd.read_csv(holidays_path)
        df_holidays['date'] = pd.to_datetime(df_holidays['date'])
        
        # Deduplicate holidays: Any holiday on a date makes it a holiday (unless transferred)
        # We only care if it IS a holiday.
        # Filter potential holidays first
        real_holidays = df_holidays[(df_holidays['transferred'] == False) & (df_holidays['type'] != 'Work Day')]
        
        # Get unique dates of actual holidays
        holiday_dates = real_holidays['date'].unique()
        
        # Create a boolean series for merging or just map it
        df_sales['is_holiday'] = df_sales['date'].isin(holiday_dates)

    # Feature Engineering
    print("Engineering features...")
    df_sales['day_of_week'] = df_sales['date'].dt.dayofweek
    
    # Lag 7 days
    # Need to sort by store and date to ensure shift is correct logic wise
    df_sales = df_sales.sort_values(['store_nbr', 'date'])
    df_sales['lag_7_days'] = df_sales.groupby('store_nbr')['sales'].shift(7)
    
    print("Data processing complete.")
    print(df_sales.head())
    return df_sales

if __name__ == "__main__":
    df = load_and_process_data()
    output_path = os.path.join(os.path.dirname(__file__), '../data/processed_sales.csv')
    df.to_csv(output_path, index=False)
    print(f"Saved processed data to {output_path}")
