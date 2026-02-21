# Walkthrough - Inventory Forecasting & Waste Analytics Engine

I have successfully initialized the data layer, implemented the waste analysis, and developed a baseline forecasting model.

## Changes
### 1. Data Ingestion & Feature Engineering
- **File**: `src/ingestion.py`
- **Action**: Modified to deduplicate holiday entries.
- **Output**: `data/processed_sales.csv` (Merged & Feature Engineered).

### 2. Synthetic Batch Generation
- **File**: `src/generate_batches.py`
- **Output**: `data/current_inventory.csv` (200 batches, ~10% expiring < 45 days).

### 3. Waste Analysis
- **File**: `src/waste_analysis.py`
- **Action**: Identified expiring batches.
- **Output**: `data/waste_report.csv` (Summary of expiring meds).

### 4. Forecasting Model
- **File**: `src/forecasting.py`
- **Action**: Implemented a **Moving Average with Trend** model (Pandas-based) to bypass environment limitations with `scikit-learn` on this machine.
- **Logic**: 
    - Projects future sales based on day-of-week averages from historical data.
    - Adjusts for recent trend (last 14 days vs global average).
- **Output**: `data/forecast_results.csv` (15-day forecast).

## Verification Results

### Data Logic
- **Sales Data**: Correctly merged with holidays.
- **Inventory**: Generated 200 batches, 21 expiring soon.

### Forecasting Performance (Baseline)
- **Validation MAE**: 11.01
- **Validation RMSE**: 13.28
- **Forecast Sample**:
| Date | Predicted Sales |
|---|---|
| 2024-04-10 | 119.50 |
| 2024-04-11 | 124.14 |
| 2024-04-12 | 139.43 |
| ... | ... |

## Final Artifacts
All source code and data have been synced to `/Users/khushikhanna/Desktop/Demand forecasting/`.
