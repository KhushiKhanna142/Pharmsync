-- EMERGENCY FIX: Disable Row Level Security
ALTER TABLE drugs DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions DISABLE ROW LEVEL SECURITY;

-- Re-grant access just in case
GRANT ALL ON TABLE drugs TO anon, authenticated;
GRANT ALL ON TABLE inventory TO anon, authenticated;
GRANT ALL ON TABLE prescriptions TO anon, authenticated;

-- Reload Cache
NOTIFY pgrst, 'reload config';
