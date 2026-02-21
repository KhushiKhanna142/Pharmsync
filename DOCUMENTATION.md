# Zenith Pharmacy Hub - Technical Documentation 📘

This document provides a deep dive into the technology stack, architecture, and core algorithms powering the Zenith Pharmacy Hub.

---

## 🏗️ Technology Stack

### **Frontend (Client-Side)**
*   **Framework**: [React.js](https://react.dev/) (v18.0) with [Vite](https://vitejs.dev/) for high-performance building and HMR.
*   **Language**: TypeScript (TSX) for type safety and scalability.
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) for utility-first styling.
*   **UI Components**: [Shadcn UI](https://ui.shadcn.com/) (based on Radix Primitives) for accessible, consistent design elements.
*   **Charts**: [Recharts](https://recharts.org/) for responsive, composable data visualization (Demand Bars, Trends).
*   **Icons**: [Lucide React](https://lucide.dev/) for consistent iconography.

### **Backend (Server-Side)**
*   **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python) for high-performance, async API endpoints.
*   **Database ORM**: [SQLAlchemy](https://www.sqlalchemy.org/) for database abstraction and query management.
*   **Data Validation**: [Pydantic](https://docs.pydantic.dev/) schemes for strict request/response validation.

### **Database**
*   **System**: PostgreSQL (hosted on [Supabase](https://supabase.com/)).
*   **Tables**:
    *   `inventory`: Tracks batches, quantities, expiry dates.
    *   `drugs`: Catalog of brand/generic names and manufacturers.
    *   `waste_logs`: Audit trail of expired or damaged items.
    *   `sales`: Transaction history (POS).

---

## 🧠 Core Algorithms & Logic

### 1. **Demand Forecasting Engine** 📊
*   **Location**: `backend/src/forecasting_v2.py`
*   **Purpose**: Predict future consumption to optimize stock levels.
*   **Algorithm Details**:
    *   **ARIMA Model**: The system trains an AutoRegressive Integrated Moving Average (ARIMA) model for each medicine based on historic daily prescription data to forecast the next 90 days of demand and establish a 95% confidence interval.
    *   **Seasonality Rules & Day of Week Multipliers**: The ARIMA forecast means are adjusted using domain-specific multipliers based on the "Season" (Winter, Spring, Summer, Fall) and Drug Type, as well as day of the week multipliers.
        *   *Example*: Antibiotics (`Azithral`) and Fever meds (`Dolo`) get a **1.2x multiplier in Winter** (Respiratory season) and **1.3x in Summer** (Heat/Injury correlation).
    *   **Trend Detection**: Analyzes the generated synthetic 6-month lookahead.
        *   If `New_Qty > Old_Qty * 1.05` → Trend "UP".
        *   If `New_Qty < Old_Qty * 0.95` → Trend "DOWN".
    *   **Explanation Logic ("Why?")**: A rule-based inference engine attaches specific reasons to predictions.
        *   *If Season=Winter & Demand=High* → "Winter season - higher respiratory infections".

### 2. **Smart Reorder Algorithm** 📦
*   **Location**: `backend/src/api.py`
*   **Purpose**: Prevent stockouts without overstocking (Just-In-Time).
*   **Logic**:
    *   **Safety Stock Calculation**: `Safety Stock = Average Monthly Demand * 0.5` (2 weeks cover).
    *   **Priority Triggering**:
        *   **High Priority**: If `Current Stock < Safety Stock`. Immediate order recommended.
        *   **Medium Priority**: If `Current Stock < Average Monthly Demand`. Order recommended for next cycle.
        *   **Low Priority**: If Stock is healthy. Routine cyclical refill only.
    *   **Real-Time Fallback**: If the database returns `0` stock (e.g., demo mode on fresh DB), the system simulates a fallback stock (200-300 units) to ensure the UI remains functional for demonstration.

### 3. **Expiry Sweeper (Waste Management)** 🧹
*   **Location**: `backend/src/daily_sweep.py`
*   **Purpose**: Automate inventory hygiene.
*   **Logic**:
    *   **Cron-Job Style Sweep**: Runs a daily query: `SELECT * FROM inventory WHERE expiry_date <= CURRENT_DATE`.
    *   **Transaction Atomicity**:
        1.  Identifies expired batches.
        2.  Inserts record into `waste_logs` (Audit trail).
        3.  Updates `inventory` status to 'Expired' OR deletes the row (configurable).
        4.  commits as a single transaction block to prevent data inconsistency.

### 4. **Point of Sale (Billing) System** 💳
*   **Location**: `src/pages/Billing.tsx` & `api.py`
*   **Purpose**: Handle sales and inventory deduction.
*   **Logic**:
    *   **Real-Time Deduction**: On checkout, backend verifies `quantity >= requested_qty`.
    *   **Optimistic UI**: Frontend assumes success for speed, but Backend enforces the hard constraint (SQL `UPDATE ... WHERE quantity >= :qty`).
    *   **Stock Entry (Upsert)**: When adding stock:
        *   *Check*: Does this Batch ID exist?
        *   *Yes*: `UPDATE quantity = quantity + new_qty`.
        *   *No*: `INSERT` new batch row.

### 5. **Outbreak Intelligence** 🦠
*   **Location**: `src/pages/Dashboard.tsx` (Widget)
*   **Purpose**: Correlate external health events with pharmacy needs.
*   **Logic**:
    *   Listens for predefined "Outbreak Signals" (mocked via API).
    *   Maps outbreak type (e.g., "Flu") to specific Drug Categories (Antivirals, Antipyretics).
    *   Triggers "High Demand" alert on the Dashboard if correlation is strong.

---

## 🔐 Security & Optimization

*   **Environment Variables**: All db credentials stored in `.env` (never committed).
*   **Connection Pooling**: SQLAlchemy uses connection pooling to handle high concurrency efficiently without overloading the database.
*   **Type Safety**: TypeScript ensures frontend stability by catching data-type errors at build time.
