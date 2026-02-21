-- 1. Grant usage on schema (just in case)
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 2. Grant access to tables
GRANT ALL ON TABLE drugs TO anon, authenticated;
GRANT ALL ON TABLE inventory TO anon, authenticated;
GRANT ALL ON TABLE prescriptions TO anon, authenticated;

-- 3. Ensure RLS Policies exist (Idempotent-ish)
DROP POLICY IF EXISTS "Allow Anon Access Drugs" ON drugs;
CREATE POLICY "Allow Anon Access Drugs" ON drugs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow Anon Access Inventory" ON inventory;
CREATE POLICY "Allow Anon Access Inventory" ON inventory FOR ALL USING (true) WITH CHECK (true);

-- 4. Force Schema Cache Reload
NOTIFY pgrst, 'reload config';
