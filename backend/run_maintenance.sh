#!/bin/bash

# Maintenance Script for Zenith Pharmacy Hub
# Runs schema updates and daily data synchronization

echo "==========================================="
echo "   Pharmacy Data Maintenance "
echo "==========================================="
echo "Date: $(date)"


# Resolve script directory (backend)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 1. Update Schema (Safe to run multiple times)
echo "[1/2] Checking Database Schema..."
python3 src/update_waste_schema.py

if [ $? -ne 0 ]; then
    echo "❌ Schema update failed. Check your Database Connection in .env"
    echo "   Ensure DB_CONNECTION_STRING is correct and accessible."
    exit 1
fi

# 2. Run Expiry Sweep
echo "[2/2] Running Expiry Synchronization..."
python3 src/sync_expiry.py

if [ $? -eq 0 ]; then
    echo "✅ Maintenance Complete. Inventory and Waste are now synced."
else
    echo "❌ Sync failed."
fi
