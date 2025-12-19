import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
import socket
from urllib.parse import urlparse

# Load env from 2 levels up
dotenv_path = os.path.join(os.path.dirname(__file__), '../../.env')
load_dotenv(dotenv_path, override=True)



url = os.getenv("DB_CONNECTION_STRING")

print(f"Testing URL from .env: {url}")


print(f"Connection String Length: {len(url)}")

# Parse URL
try:
    if "postgresql://" not in url and "postgres://" not in url:
        print("⚠️ Warning: URL does not start with postgresql://")
    
    # Simple parse
    # If password has special chars, urlparse might fail if not encoded.
    # But usually it works enough to get hostname.
    parsed = urlparse(url)
    hostname = parsed.hostname
    port = parsed.port
    print(f"Hostname: {hostname}")
    print(f"Port: {port}")
    
    if not hostname:
        print("❌ Could not parse hostname.")
        sys.exit(1)

    # DNS Check
    print(f"Attempting DNS resolution for {hostname}...")
    try:
        ip = socket.gethostbyname(hostname)
        print(f"✅ DNS Resolved: {ip}")
    except Exception as e:
        print(f"❌ DNS Resolution Failed: {e}")
        # Suggest Supabase fix
        print("Tip: If this is Supabase, ensure you are using the correct Pooler URL (Transaction or Session mode).")

    # Connection Check
    print("Attempting SQLAlchemy Connect...")
    try:
        engine = create_engine(url, connect_args={'connect_timeout': 5})
        with engine.connect() as conn:
            ver = conn.execute(text("SELECT version()")).scalar()
            print(f"✅ SUCCESS! DB Version: {ver}")
    except Exception as e:
        print(f"❌ Connection Failed: {e}")

except Exception as e:
    print(f"Parsing/Runtime Error: {e}")
