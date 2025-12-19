import requests
import json

try:
    response = requests.get("http://localhost:8000/waste/analytics")
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print("Success!")
        print(f"Total Waste Units: {data.get('kpi', {}).get('total_waste_units')}")
        print(f"Expired Items Count: {data.get('kpi', {}).get('expired_items_count')}")
    else:
        print(f"Failed: {response.text}")
except Exception as e:
    print(f"Error: {e}")
