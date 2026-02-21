-- 1. Grant Schema Usage (Critical for 404/PGRST205 errors)
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- 2. Grant Table Access
GRANT ALL ON TABLE public.inventory TO anon;
GRANT ALL ON TABLE public.inventory TO authenticated;
GRANT ALL ON TABLE public.inventory TO service_role;

GRANT ALL ON TABLE public.drugs TO anon;
GRANT ALL ON TABLE public.drugs TO authenticated;
GRANT ALL ON TABLE public.drugs TO service_role;

-- 3. Ensure RLS is disabled (Backup)
ALTER TABLE public.inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.drugs DISABLE ROW LEVEL SECURITY;

-- 4. Reload API Cache
NOTIFY pgrst, 'reload config';
