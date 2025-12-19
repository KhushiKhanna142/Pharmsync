-- RUN THIS IN SUPABASE SQL EDITOR

-- Purpose: Delete expired batches from 'inventory' that are NOT present in 'waste_logs'.
-- This syncs the inventory with your waste logs, removing the extra rows.

DELETE FROM inventory 
WHERE expiry_date < NOW() 
AND med_name NOT IN (
    SELECT DISTINCT med_name FROM waste_logs
);

-- Check result
SELECT COUNT(*) as remaining_inventory FROM inventory;
