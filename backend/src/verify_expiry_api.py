import requests
import json

try:
    response = requests.get("http://localhost:8000/expiry/alerts")
    if response.status_code == 200:
        data = response.json()
        print(f"Status: {response.status_code}")
        print(f"KPI Keys: {list(data.get('kpi', {}).keys())}")
        print(f"Critical Items: {data['kpi'].get('critical_items')}")
        print(f"Total Drugs: {len(data.get('drugs', []))}")
        if len(data.get('drugs', [])) > 0:
            d = data['drugs'][0]
            print(f"Drug: {d['name']} | Cat: {d.get('category')} | Loss: {d.get('estimated_loss')}")
            if len(d['batches']) > 0:
                b = d['batches'][0]
                print(f"Batch: {b['id']} | Loc: {b.get('location')} | Supp: {b.get('supplier')}")
    else:
        print(f"Failed: {response.status_code}")
        print(response.text)
except Exception as e:
    print(f"Error: {e}")
