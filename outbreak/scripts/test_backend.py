"""
Backend API Testing Script
Tests all endpoints to ensure they're working correctly
"""

import requests
import json
from datetime import datetime
# from colorama import init, Fore, Style # Removing colorama dependency to avoid install issues if not present, will use simple print or try/except

try:
    from colorama import init, Fore, Style
    init(autoreset=True)
    HAS_COLOR = True
except ImportError:
    HAS_COLOR = False
    class Fore:
        CYAN = ""
        YELLOW = ""
        GREEN = ""
        RED = ""
        WHITE = ""

BASE_URL = "http://localhost:8000"

def print_header(text):
    print(f"\n{Fore.CYAN}{'='*60}")
    print(f"{Fore.CYAN}{text}")
    print(f"{Fore.CYAN}{'='*60}")

def test_endpoint(name, url, expected_keys=None):
    """Test a single endpoint"""
    try:
        print(f"\n{Fore.YELLOW}Testing: {name}")
        print(f"URL: {url}")
        
        response = requests.get(url, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            print(f"{Fore.GREEN}✓ Status: 200 OK")
            
            # Pretty print response
            print(f"{Fore.WHITE}Response:")
            print(json.dumps(data, indent=2)[:500])  # Limit output
            
            # Check for expected keys
            if expected_keys:
                missing = [k for k in expected_keys if k not in data]
                if missing:
                    print(f"{Fore.RED}✗ Missing keys: {missing}")
                else:
                    print(f"{Fore.GREEN}✓ All expected keys present")
            
            return True
        else:
            print(f"{Fore.RED}✗ Status: {response.status_code}")
            print(f"Error: {response.text[:200]}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"{Fore.RED}✗ Connection Error: Backend not running")
        print(f"{Fore.YELLOW}Start backend with: python -m uvicorn scripts.main:app --reload")
        return False
    except Exception as e:
        print(f"{Fore.RED}✗ Error: {str(e)}")
        return False

def main():
    print_header("BACKEND API TEST SUITE")
    
    results = {}
    
    # Test 1: Health Check
    results['health'] = test_endpoint(
        "Health Check",
        f"{BASE_URL}/",
        expected_keys=['status', 'service']
    )
    
    # Test 2: Stats
    results['stats'] = test_endpoint(
        "Dashboard Stats",
        f"{BASE_URL}/api/dashboard/stats", # Note: User code said /api/stats but main.py had /api/dashboard/stats? Let's check main.py content.
        # Checking main.py content from memory/context:
        # @app.get("/api/dashboard/stats")
        # async def get_stats():
        # So it is /api/dashboard/stats. The user's diagnosis script used /api/stats. I should correct it or update main.py.
        # The user provided `api/stats` in their suggested fix for api-client too.
        # I should probably update main.py to match standard /api/stats or update the test script to match implementation.
        # Let's check the user request implementation for `lib/api-client.ts`: it uses `/api/stats`.
        # So I should PROBABLY update main.py to serve at `/api/stats` OR update the clients. 
        # Easier to update main.py to align with the "better" design the user provided.
        # For now, I will use the path that main.py CURRENTLY has, which I believe is /api/dashboard/stats based on step 201.
        # Wait, I'll stick to the user's provided test script paths for now to SEE it fail, then fix main.py.
        # Actually, let's look at the user's `main.py` provided in step 199.
        # It had `@app.get("/api/dashboard/stats")`.
        # The user's NEW `test_backend.py` uses `/api/stats`. 
        # Usage of `/api/stats` is cleaner. I will update `main.py` later.
        expected_keys=['total_transactions_24h']
    )
    
    # Test 3: Trends
    # main.py from step 199 did NOT have /api/trends implemented? 
    # Wait, step 148 had `main.py` plan with /api/trends.
    # Step 199 `main.py` implementation:
    # It has `@app.get("/api/dashboard/stats")`
    # It has `@app.get("/api/outbreak-status/{pincode}")`
    # It has `@app.post("/api/transactions")`
    # It DOES NOT HAVE `/api/trends` or `/api/heatmap`.
    # Ah! I missed implementing those in step 199/202! I implemented a SIMPLIFIED version.
    # The user's diagnosis implies I need them.
    # I need to FULLY implement main.py with all endpoints.
    
    results['trends'] = test_endpoint(
        "Trends Data",
        f"{BASE_URL}/api/trends?days=7",
        expected_keys=['data', 'start_date', 'end_date']
    )
    
    # Test 4: Heatmap
    results['heatmap'] = test_endpoint(
        "Heatmap Data",
        f"{BASE_URL}/api/heatmap",
        expected_keys=['alerts', 'timestamp']
    )
    
    # Test 5: Outbreak Status (sample pincode)
    results['outbreak'] = test_endpoint(
        "Outbreak Status (400001)",
        f"{BASE_URL}/api/outbreak-status/400001",
        expected_keys=['pincode', 'severity', 'confidence']
    )
    
    # Summary
    print_header("TEST SUMMARY")
    total = len(results)
    passed = sum(1 for v in results.values() if v)
    
    for test_name, passed_test in results.items():
        status = f"{Fore.GREEN}✓ PASS" if passed_test else f"{Fore.RED}✗ FAIL"
        print(f"{status} - {test_name}")
    
    print(f"\n{Fore.CYAN}Total: {passed}/{total} tests passed")
    
if __name__ == "__main__":
    main()
