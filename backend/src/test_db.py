from db_direct import test_connection, DATABASE_URL

print("--- Testing Direct Database Connection ---")
print(f"URL Configured: {DATABASE_URL}")

success, message = test_connection()

if success:
    print("\n✅ SUCCESS: Connected to Supabase PostgreSQL!")
else:
    print(f"\n❌ FAILED: {message}")
    print("\nPlease ensure you have replaced [YOUR_PASSWORD] in the .env file.")
