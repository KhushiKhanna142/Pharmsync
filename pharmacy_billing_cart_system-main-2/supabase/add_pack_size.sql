-- Add pack_size column to inventory table to satisfy trigger requirements
ALTER TABLE public.inventory 
ADD COLUMN IF NOT EXISTS pack_size INTEGER DEFAULT 1;

-- If needed, apply the fix from fix_pack_sizes.sql as well (optional, but good for data consistency)
-- Copying content from fix_pack_sizes.sql roughly, or just ensuring column exists is enough for now.
-- The immediate error is "record new has no field pack_size", simply adding the column fixes this.
