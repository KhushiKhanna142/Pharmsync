-- Bulk Update Pack Sizes based on Medicine Name
-- Run this in your Supabase SQL Editor

-- 1. Standard Tablets/Capsules (Most likely strips of 10)
-- Matches: "Dolo 650 Tablet", "Amoxycillin Cap", etc.
update public.inventory
set pack_size = 10
where (med_name ilike '%tablet%' 
    or med_name ilike '%tab%'
    or med_name ilike '%capsule%'
    or med_name ilike '%cap%')
    and pack_size is null; -- Only update if currently empty

-- 2. Liquids, Ointments, Injections (Single units)
-- Matches: "Cough Syrup", "Betadine Ointment", "Insulin Injection"
update public.inventory
set pack_size = 1
where (med_name ilike '%syrup%'
    or med_name ilike '%suspension%'
    or med_name ilike '%liquid%'
    or med_name ilike '%gel%'
    or med_name ilike '%ointment%'
    or med_name ilike '%cream%'
    or med_name ilike '%injection%'
    or med_name ilike '%inj%'
    or med_name ilike '%drop%'
    or med_name ilike '%solution%'
    or med_name ilike '%gargle%'
    or med_name ilike '%spray%'
    or med_name ilike '%powder%'
    or med_name ilike '%sachet%')
    and pack_size is null;

-- 3. Everything else -> Default to 1 (Safe fallback)
update public.inventory
set pack_size = 1
where pack_size is null;

-- 4. Check results
select med_name, pack_size from public.inventory limit 50;
