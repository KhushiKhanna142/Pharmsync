-- Create a specific function to fetch inventory
-- "SECURITY DEFINER" means it runs with the privileges of the creator (Admin)
-- This BYPASSES all RLS and Permission issues for the 'anon' user.

CREATE OR REPLACE FUNCTION get_inventory()
RETURNS SETOF inventory
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM inventory ORDER BY quantity ASC;
$$;

-- Grant execute permission to anon API
GRANT EXECUTE ON FUNCTION get_inventory() TO anon;
GRANT EXECUTE ON FUNCTION get_inventory() TO authenticated;
GRANT EXECUTE ON FUNCTION get_inventory() TO service_role;

NOTIFY pgrst, 'reload config';
