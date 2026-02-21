import os
import sys

# Ensure local lib is in path
sys.path.append(os.path.join(os.path.dirname(__file__), 'lib'))

from supabase import create_client, Client

# Add parent directory to path to find .env if needed, 
# but usually we rely on environment variables being loaded or reading .env file manually
from dotenv import load_dotenv

# Path to .env file (one level up from src, then one level up from backend)
# Actually, the .env is in the root of the project: ../../.env
env_path = os.path.join(os.path.dirname(__file__), '../../.env')
load_dotenv(env_path)

url: str = os.environ.get("VITE_SUPABASE_URL")
key: str = os.environ.get("VITE_SUPABASE_PUBLISHABLE_KEY")

if not url or not key:
    print("Error: Supabase credentials not found in .env")
    sys.exit(1)

supabase: Client = create_client(url, key)

def get_supabase_client() -> Client:
    return supabase
