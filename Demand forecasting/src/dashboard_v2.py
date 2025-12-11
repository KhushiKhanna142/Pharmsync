import streamlit as st
import pandas as pd
import os
import time

try:
    import plotly.express as px
    HAS_PLOTLY = True
except ImportError:
    HAS_PLOTLY = False

# --- Config ---
st.set_page_config(page_title="Smart Pharmacy | Analytics", layout="wide", page_icon="💊")

# Custom CSS for "Premium" feel
st.markdown("""
<style>
    .main { background-color: #f5f5f5; }
    .stMetric { background-color: #ffffff; padding: 15px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .metric-container { display: flex; justify-content: center; }
    h1, h2, h3 { color: #2c3e50; }
    .stButton>button { width: 100%; border-radius: 5px; }
</style>
""", unsafe_allow_html=True)

# --- Paths ---
DATA_DIR = os.path.join(os.path.dirname(__file__), '../data')
FORECAST_PATH = os.path.join(DATA_DIR, 'forecast_results.csv')
WASTE_PATH = os.path.join(DATA_DIR, 'waste_report.csv')
INVENTORY_PATH = os.path.join(DATA_DIR, 'current_inventory.csv')

# --- Helper Functions ---
def load_csv(path):
    if os.path.exists(path):
        return pd.read_csv(path)
    return pd.DataFrame()

def save_csv(df, path):
    df.to_csv(path, index=False)

def get_total_stock_value(df_inv):
    # Dummy price logic: Dolo=5, Augmentin=15, Pan=10, Azithral=20
    prices = {'Dolo 650': 5, 'Augmentin': 15, 'Pan 40': 10, 'Azithral': 20}
    if df_inv.empty: return 0
    df_inv['price'] = df_inv['med_name'].map(prices).fillna(10)
    return (df_inv['quantity'] * df_inv['price']).sum()

# --- Sidebar ---
with st.sidebar:
    st.image("https://img.icons8.com/color/96/000000/pharmacy-shop.png", width=80)
    st.title("Smart Pharmacy")
    st.caption("Inventory & Intelligence Engine")
    st.markdown("---")
    
    menu = st.radio("Navigation", ["📊 Dashboard", "📦 Inventory", "💰 POS (Sales)", "📈 Analytics"], index=0)
    
    st.markdown("---")
    if st.button("🔄 Refresh Data"):
        st.cache_data.clear()
        st.rerun()

# --- Modules ---

if menu == "📊 Dashboard":
    st.title("👋 Welcome Back, Administrator")
    st.markdown("Here's what's happening in your pharmacy today.")
    
    # Load Data
    df_inv = load_csv(INVENTORY_PATH)
    df_fore = load_csv(FORECAST_PATH)
    df_waste = load_csv(WASTE_PATH)
    
    # KPI Cards
    col1, col2, col3, col4 = st.columns(4)
    
    # Logic for metrics
    total_meds_count = df_inv['med_name'].nunique() if not df_inv.empty else 0
    total_stock = df_inv['quantity'].sum() if not df_inv.empty else 0
    stock_value = get_total_stock_value(df_inv)
    alerts_count = len(df_waste) if not df_waste.empty else 0
    
    forecast_today = 0
    if not df_fore.empty:
        # Just grab the first prediction as "Today's Target" for demo
        forecast_today = df_fore['predicted_sales'].iloc[0]

    with col1:
        st.metric("Total Products", f"{total_meds_count}", "Active SKU")
    with col2:
        st.metric("Total Stock", f"{total_stock:,.0f}", "Units On Hand")
    with col3:
        st.metric("Stock Value", f"${stock_value:,.0f}", "Est. Value")
    with col4:
        st.metric("Waste Alerts", f"{alerts_count}", "Expiring Soon", delta_color="inverse")

    # Main Visuals
    c1, c2 = st.columns([2, 1])
    
    with c1:
        st.subheader("Sales Trend (Forecast)")
        if not df_fore.empty:
            df_fore['date'] = pd.to_datetime(df_fore['date'])
            if HAS_PLOTLY:
                fig = px.area(df_fore, x='date', y='predicted_sales', color_discrete_sequence=['#4CAF50'])
                fig.update_layout(xaxis_title="", yaxis_title="Units", showlegend=False, margin=dict(l=0, r=0, t=0, b=0))
                st.plotly_chart(fig, use_container_width=True)
            else:
                st.line_chart(df_fore.set_index('date')['predicted_sales'])
        else:
            st.info("No forecast data available.")

    with c2:
        st.subheader("Inventory Distribution")
        if not df_inv.empty:
            dist = df_inv.groupby('med_name')['quantity'].sum().reset_index()
            if HAS_PLOTLY:
                fig2 = px.pie(dist, names='med_name', values='quantity', hole=0.4, color_discrete_sequence=px.colors.sequential.RdBu)
                fig2.update_layout(showlegend=False, margin=dict(l=0, r=0, t=0, b=0))
                st.plotly_chart(fig2, use_container_width=True)
            else:
                st.write(dist.set_index('med_name'))
    
elif menu == "📦 Inventory":
    st.title("Inventory Management")
    
    df_inv = load_csv(INVENTORY_PATH)
    
    tab_view, tab_add = st.tabs(["👁️ View Stock", "➕ Add New Batch"])
    
    with tab_view:
        st.subheader("Current Stock Levels")
        
        # Search
        search = st.text_input("🔍 Search Medicine", "")
        if not df_inv.empty:
            if search:
                df_inv = df_inv[df_inv['med_name'].str.contains(search, case=False)]
            
            # Styling
            st.dataframe(df_inv, use_container_width=True)
        else:
            st.warning("No inventory found.")
            
    with tab_add:
        st.subheader("Receive New Stock")
        with st.form("add_stock_form"):
            c1, c2 = st.columns(2)
            with c1:
                new_med = st.selectbox("Medicine Name", ["Dolo 650", "Augmentin", "Pan 40", "Azithral", "Other"])
                if new_med == "Other":
                    new_med = st.text_input("Enter Custom Name")
                new_batch = st.text_input("Batch ID (e.g., NEW-2024)")
            with c2:
                new_qty = st.number_input("Quantity", min_value=1, value=100)
                new_expiry = st.date_input("Expiry Date")
            
            submitted = st.form_submit_button("📥 Add to Inventory")
            
            if submitted:
                if new_med and new_batch:
                    new_row = {
                        'med_name': new_med,
                        'batch_id': new_batch,
                        'quantity': new_qty,
                        'expiry_date': str(new_expiry)
                    }
                    # Add to DF
                    df_inv = pd.concat([df_inv, pd.DataFrame([new_row])], ignore_index=True)
                    # Save
                    save_csv(df_inv, INVENTORY_PATH)
                    st.success(f"Added {new_qty} units of {new_med} successfully!")
                    time.sleep(1)
                    st.rerun()
                else:
                    st.error("Please fill all fields.")

elif menu == "💰 POS (Sales)":
    st.title("Point of Sale")
    st.markdown("Process customer transactions and update stock.")
    
    df_inv = load_csv(INVENTORY_PATH)
    
    if df_inv.empty:
        st.error("Inventory is empty. Cannot process sales.")
    else:
        # Transaction Form
        with st.container():
            col1, col2 = st.columns([1, 2])
            
            with col1:
                st.subheader("New Transaction")
                
                # Dynamic Logic: Select Med -> Filter Batches
                sel_med = st.selectbox("Select Medicine", df_inv['med_name'].unique())
                
                # Batches for this med
                batches = df_inv[df_inv['med_name'] == sel_med]
                batch_dict = {f"{r['batch_id']} (Qty: {r['quantity']}, Exp: {r['expiry_date']})": r['batch_id'] for i, r in batches.iterrows()}
                
                sel_batch_display = st.selectbox("Select Batch", list(batch_dict.keys()))
                sel_batch_id = batch_dict[sel_batch_display]
                
                # Max qty
                current_qty = batches[batches['batch_id'] == sel_batch_id]['quantity'].values[0]
                
                sell_qty = st.number_input("Sell Quantity", min_value=1, max_value=int(current_qty), value=1)
                
                # Mock Price
                prices = {'Dolo 650': 5, 'Augmentin': 15, 'Pan 40': 10, 'Azithral': 20}
                unit_price = prices.get(sel_med, 10)
                total_price = sell_qty * unit_price
                
                st.markdown(f"### Total: ${total_price}")
                
                if st.button("✅ Complete Sale"):
                    # Update Inventory Logic
                    # Find index
                    idx = df_inv.index[(df_inv['med_name'] == sel_med) & (df_inv['batch_id'] == sel_batch_id)].tolist()[0]
                    
                    new_qty = current_qty - sell_qty
                    
                    if new_qty == 0:
                        # Remove row? Or keep as 0? Let's keep as 0 for history, or drop. 
                        # Usually drop or mark inactive. Let's drop for clean demo.
                        df_inv = df_inv.drop(idx)
                    else:
                        df_inv.at[idx, 'quantity'] = new_qty
                        
                    save_csv(df_inv, INVENTORY_PATH)
                    
                    st.toast(f"Sold {sell_qty} x {sel_med}!", icon="💸")
                    time.sleep(1)
                    st.rerun()

            with col2:
                st.info("💡 **Tip**: Always pick the batch expiring earliest (FEFO - First Expired First Out).")
                # Show specific med details
                st.write(f"**Batch Details for {sel_med}**")
                st.dataframe(batches, use_container_width=True)

elif menu == "📈 Analytics":
    st.title("Advanced Analytics")
    
    t1, t2, t3 = st.tabs(["Forecasting", "Waste Analysis", "Reorder Actions"])
    
    df_fore = load_csv(FORECAST_PATH)
    df_waste = load_csv(WASTE_PATH)
    
    # Load Reorder Data
    REORDER_PATH = os.path.join(DATA_DIR, 'reorder_recommendations.csv')
    df_reorder = load_csv(REORDER_PATH)

    with t1:
        st.subheader("Demand Forecasting Model")
        if not df_fore.empty:
            df_fore['date'] = pd.to_datetime(df_fore['date'])
            if HAS_PLOTLY:
                fig = px.line(df_fore, x='date', y='predicted_sales', markers=True, title="15-Day Demand Projection")
                st.plotly_chart(fig, use_container_width=True)
            else:
                st.line_chart(df_fore.set_index('date')['predicted_sales'])
            st.dataframe(df_fore, use_container_width=True)
            
    with t2:
        st.subheader("Waste Risk Matrix")
        if not df_waste.empty:
            col_a, col_b = st.columns(2)
            with col_a:
                st.error(f"{len(df_waste)} Batches Critical")
            with col_b:
                if 'Potential Waste Units' in df_waste.columns:
                     st.metric("Potential Loss", f"{df_waste['Potential Waste Units'].sum()} Units")
            
            st.dataframe(df_waste, use_container_width=True)
    
    with t3:
        st.subheader("Restocking Recommendations")
        if not df_reorder.empty:
            # Highlight reorder needed
            def highlight_row(row):
                return ['background-color: #ffcdd2' if row['status'] == 'Reorder Needed' else '' for _ in row]
            
            st.dataframe(df_reorder.style.apply(highlight_row, axis=1), use_container_width=True)
        else:
            st.info("No reorder data available.")
