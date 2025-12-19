-- 1. HEURISTIC: Auto-set Pack Size to 10 for Tablets/Capsules if missing
-- This ensures the unit price calculation has a divisor to work with.
UPDATE inventory
SET pack_size = 10
WHERE (pack_size IS NULL OR pack_size = 1)
  AND (
    med_name ILIKE '%Tablet%' OR 
    med_name ILIKE '%Capsule%' OR 
    med_name ILIKE '% Tab%' OR 
    med_name ILIKE '% Cap%' OR
    med_name ILIKE '%Strip%'
  );

-- 2. Add unit_price column
ALTER TABLE inventory 
ADD COLUMN IF NOT EXISTS unit_price numeric(12,2);

-- 3. Backfill existing rows with calculated Unit Price
UPDATE inventory
SET unit_price = CASE
  WHEN pack_size IS NULL OR pack_size = 0 THEN cost_price
  ELSE ROUND((cost_price::numeric / pack_size::numeric), 2)
END;

-- 4. Create Trigger Function
CREATE OR REPLACE FUNCTION trg_calc_unit_price() RETURNS trigger AS $$
BEGIN
  -- Auto-default pack_size to 10 for tablets if not provided
  IF (NEW.pack_size IS NULL OR NEW.pack_size = 1) AND 
     (NEW.med_name ILIKE '%Tablet%' OR NEW.med_name ILIKE '%Capsule%') THEN
      NEW.pack_size := 10;
  END IF;

  -- Calculate Unit Price
  IF NEW.pack_size IS NULL OR NEW.pack_size = 0 THEN
    NEW.unit_price := NEW.cost_price;
  ELSE
    NEW.unit_price := ROUND((NEW.cost_price::numeric / NEW.pack_size::numeric), 2);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create Trigger
DROP TRIGGER IF EXISTS inventory_unit_price_before_ins_upd ON inventory;

CREATE TRIGGER inventory_unit_price_before_ins_upd
  BEFORE INSERT OR UPDATE ON inventory
  FOR EACH ROW EXECUTE FUNCTION trg_calc_unit_price();

-- Verification
SELECT med_name, pack_size, cost_price, unit_price FROM inventory LIMIT 10;
