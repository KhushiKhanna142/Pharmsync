from fastapi import FastAPI, HTTPException
from contextlib import asynccontextmanager
import sys
import os

# Add src to path to import modules
sys.path.append(os.path.dirname(__file__))

from forecasting import train_forecasting_model
from waste_analysis import analyze_waste

app = FastAPI(title="Inventory Forecasting & Waste Engine")

@app.get("/health")
def health_check():
    return {"status": "active", "version": "1.0"}

@app.get("/forecast")
def get_forecast(days: int = 7):
    """
    Get sales forecast. 
    Note: Currently returns the validation forecast on mock data as a proxy for future forecast.
    In a real system, this would predict t+1 to t+days.
    """
    try:
        results = train_forecasting_model()
        if not results:
            raise HTTPException(status_code=500, detail="Forecasting failed or no data")
        
        # In a real scenario, we'd filter/extend based on 'days' param
        return {
            "metric_mae": results['mae'],
            "forecast_data": results['forecast'][:days]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/waste")
def get_waste_alerts():
    """
    Get expiring inventory batches.
    """
    try:
        waste_data = analyze_waste()
        if waste_data is None:
            return {"waste_alerts": []}
            
        return {
            "total_batches_at_risk": len(waste_data),
            "alerts": waste_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
