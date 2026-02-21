#!/bin/bash

# Configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC_DIR="$PROJECT_DIR/src"
DATA_DIR="$PROJECT_DIR/data"

echo "==========================================="
echo "   Pharmacy Inventory Engine - Pipeline    "
echo "==========================================="
echo "Date: $(date)"
echo "Project Dir: $PROJECT_DIR"
echo "-------------------------------------------"

# 1. Ingest Data
echo "[1/5] Running Data Ingestion..."
python3 "$SRC_DIR/ingestion.py"
if [ $? -ne 0 ]; then
    echo "❌ Error in Ingestion. Exiting."
    exit 1
fi

# 2. Generate Batches (Optional - usually runs once or on schedule, but good for demo)
echo "[2/5] Updating Inventory Batches..."
python3 "$SRC_DIR/generate_batches.py"

# 3. Forecast
echo "[3/5] Generating Sales Forecast..."
python3 "$SRC_DIR/forecasting.py"

# 4. Waste Analysis
echo "[4/5] Analyzing Waste Risks..."
python3 "$SRC_DIR/waste_analysis.py"

# 5. Reorder Logic
echo "[5/5] Calculating Reorder Recommendations..."
python3 "$SRC_DIR/reorder.py"

echo "-------------------------------------------"
echo "✅ Pipeline Completed Successfully!"
echo "Check '$DATA_DIR' for updated reports."
