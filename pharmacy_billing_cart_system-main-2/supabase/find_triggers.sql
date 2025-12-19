-- 1. List all triggers on the inventory table to identify the culprit
SELECT event_object_table AS table_name, trigger_name 
FROM information_schema.triggers 
WHERE event_object_table = 'inventory';

-- 2. Once identified (likely named 'calculate_unit_price' or similar), DROP it.
-- RUN THIS ONLY IF YOU SEE A TRIGGER RELATED TO PRICES/PACK SIZES
-- DROP TRIGGER IF EXISTS [trigger_name] ON public.inventory;

-- 3. Also check for the function it calls
-- DROP FUNCTION IF EXISTS [function_name]();
