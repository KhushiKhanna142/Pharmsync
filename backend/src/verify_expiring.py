import requests
import json

try:
    response = requests.get("http://localhost:8000/waste/analytics")
    if response.status_code == 200:
        data = response.json()
        kpi = data.get('kpi', {})
        print(f"Expired Items (Past): {kpi.get('expired_items_count')}")
        print(f"Expiring Soon (Future): {kpi.get('expiring_soon_count')}")
    else:
        print(f"Failed: {response.status_code}")
except Exception as e:
    print(f"Error: {e}")
