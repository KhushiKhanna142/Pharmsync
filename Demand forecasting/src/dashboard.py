import streamlit as st
import pandas as pd
import os

try:
    import plotly.express as px
    HAS_PLOTLY = True
except ImportError:
    HAS_PLOTLY = False

# Config
st.set_page_config(page_title="Pharmacy Analytics Engine", layout="wide")

# Paths
DATA_DIR = os.path.join(os.path.dirname(__file__), '../data')
FORECAST_PATH = os.path.join(DATA_DIR, 'forecast_results.csv')
WASTE_PATH = os.path.join(DATA_DIR, 'waste_report.csv')
INVENTORY_PATH = os.path.join(DATA_DIR, 'current_inventory.csv')

# Title
st.title("💊 Inventory Forecasting & Waste Analytics Engine")
st.markdown("---")

# Tabs
tab1, tab2, tab3 = st.tabs(["📈 Demand Forecast", "⚠️ Waste Analysis", "📦 Inventory Actions"])

with tab1:
    st.header("Sales Forecast (Next 15 Days)")
    
    if os.path.exists(FORECAST_PATH):
        df_forecast = pd.read_csv(FORECAST_PATH)
        df_forecast['date'] = pd.to_datetime(df_forecast['date'])
        
        # Metrics
        total_sales = df_forecast['predicted_sales'].sum()
        avg_sales = df_forecast['predicted_sales'].mean()
        
        c1, c2 = st.columns(2)
        c1.metric("Total Projected Sales", f"{total_sales:,.0f} units")
        c2.metric("Avg Daily Sales", f"{avg_sales:,.1f} units")
        
        # Chart
        # Use Plotly if available, else st.line_chart
        if HAS_PLOTLY:
            fig = px.line(df_forecast, x='date', y='predicted_sales', title='Predicted Sales Trend', markers=True)
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.line_chart(df_forecast.set_index('date')['predicted_sales'])
            
        st.dataframe(df_forecast)
    else:
        st.error("Forecast data not found. Please run the forecasting model.")

with tab2:
    st.header("Expiry & Waste Risk")
    
    if os.path.exists(INVENTORY_PATH):
        df_inv = pd.read_csv(INVENTORY_PATH)
        
        # summary stats
        total_batches = len(df_inv)
        # Re-calc expiry risk dynamically to be sure
        # (Or verify waste_report exists)
        
        if os.path.exists(WASTE_PATH):
            df_waste = pd.read_csv(WASTE_PATH)
            st.subheader("High Risk Items (Expiring < 45 Days)")
            st.warning(f"⚠️ {len(df_waste)} Medications have batches at risk!")
            st.dataframe(df_waste, use_container_width=True)
            
            # Simple bar chart of risk
            if 'Potential Waste Units' in df_waste.columns:
                 st.bar_chart(df_waste.set_index('med_name')['Potential Waste Units'])
        else:
            st.info("No immediate waste alerts found.")
            
        st.subheader("Full Inventory Browser")
        st.dataframe(df_inv)
    else:
        st.error("Inventory data not found.")

with tab3:
    st.header("Inventory Actions (Reorder Recommendations)")
    
    REORDER_PATH = os.path.join(DATA_DIR, 'reorder_recommendations.csv')
    if os.path.exists(REORDER_PATH):
        df_reorder = pd.read_csv(REORDER_PATH)
        
        # Color code status
        def color_status(val):
            color = 'red' if val == 'Reorder Needed' else 'green'
            return f'color: {color}'
            
        st.dataframe(df_reorder.style.applymap(color_status, subset=['status']), use_container_width=True)
        
        reorder_count = len(df_reorder[df_reorder['status'] == 'Reorder Needed'])
        if reorder_count > 0:
            st.error(f"Action Required: {reorder_count} medications need restocking.")
        else:
            st.success("All stock levels are sufficient.")
            
    else:
        st.info("No reorder recommendations found. Run reorder.py first.")

# Sidebar
st.sidebar.title("Controls")
if st.sidebar.button("Refresh Data"):
    st.cache_data.clear()
    st.rerun()
