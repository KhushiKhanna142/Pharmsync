# Zenith Pharmacy Hub 🏥💊

**Zenith Pharmacy Hub** is an advanced, AI-powered pharmacy management system designed to optimize inventory, reduce waste, forecast demand, and streamline billing operations. It integrates real-time analytics with smart forecasting to ensure critical medicines are always in stock while minimizing expiration losses.

![Zenith Dashboard](https://via.placeholder.com/1200x600?text=Zenith+Pharmacy+Hub+Dashboard)

## 🚀 Key Features

### 1. **Smart Dashboard**
- **Real-time Metrics**: Track Total Products, Low Stock Alerts, and Expiring Items.
- **Outbreak Intelligence**: Live alerts on local disease outbreaks (e.g., Flu in Mumbai) to prep inventory.
- **Visual Analytics**: Interactive charts for demand trends and inventory health.

### 2. **AI-Powered Demand Forecasting** 📈
- **Predictive Models**: 6-month demand forecasts using historical data and seasonal trends.
- **"Why?" Logic**: Explainable AI that tells you *why* demand is rising (e.g., "Winter season - higher respiratory infections").
- **Smart Reordering**: Automated reorder schedules (High/Medium/Low priority) based on real-time stock vs. safety stock levels.
- **Seasonal Analysis**: Visual impact of seasons (Winter vs. Summer demand multipliers).

### 3. **Inventory & Expiry Management** ⏳
- **Batch Tracking**: Manage inventory by batch ID and expiry dates.
- **Waste Analysis**: Comprehensive reports on expired stock, financial loss, and primary waste contributors.
- **Automated Sweeps**: Background scripts automatically move expired items to waste logs.
- **Stock Entry**: Seamlessly add new stock via the Billing interface.

### 4. **Billing & POS System** 💳
- **Fast Checkout**: User-friendly Point of Sale interface for rapid customer billing.
- **Inventory Sync**: Automatic deduction of sold items from inventory.
- **Receipt Generation**: (Planned) Digital receipt and print support.

### 5. **Outbreak Intelligence** 🦠
- **Early Warning System**: Monitors external data triggers to warn about potential local health outbreaks.
- **Stock Correlation**: Suggests stock increases for relevant medicines (e.g., Paracetamol during a fever outbreak).

---

## 🛠️ Tech Stack

- **Frontend**: React (Vite), Tailwind CSS, Shadcn UI, Recharts, Lucide Icons.
- **Backend**: Python (FastAPI), SQLAlchemy, Pydantic.
- **Database**: PostgreSQL (Supabase).
- **AI/ML**: Custom Python logic for seasonality and trend forecasting.
- **Data Pipeline**: Python scripts for daily expiry sweeps and waste consolidation.

---

## 📂 Project Structure

```
zenith-pharmacy-hub/
├── src/                    # React Frontend
│   ├── pages/              # Dashboard, Forecasting, Billing, WasteAnalysis
│   ├── components/         # Reusable UI components
│   └── lib/                # Utilities
├── Demand forecasting/     # Python Backend & ML
│   ├── src/
│   │   ├── api.py          # FastAPI Server (Port 8000)
│   │   ├── db_direct.py    # Database Connection
│   │   └── seed_*.py       # Data Seeding Scripts
│   └── data/               # Datasets
├── outbreak/               # Outbreak Intelligence Module
└── public/                 # Static Assets
```

---

## ⚡ Getting Started

### Prerequisites
- Node.js & npm
- Python 3.9+
- PostgreSQL Database (Supabase recommended)

### 1. Backend Setup
```bash
cd "Demand forecasting/src"
pip install -r requirements.txt
# Set up your .env file with DB_CONNECTION_STRING
python api.py
```
*Server runs on `http://localhost:8000`*

### 2. Frontend Setup
```bash
# In the root directory
npm install
npm run dev
```
*Client runs on `http://localhost:5173`*

---

## 🧪 Key Scripts

- **`daily_sweep.py`**: Runs daily to move expired inventory to waste logs.
- **`seed_dolo_para.py`**: Seeds demo data for specific medicines.
- **`api.py`**: Main backend API handling forecasting and billing logic.

---

## 🤝 Contributing
1. Fork the repo
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

© 2025 Zenith Pharmacy Hub. All Rights Reserved.
