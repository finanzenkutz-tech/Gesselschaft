-- Add price columns to inventory table
ALTER TABLE public.inventory 
ADD COLUMN IF NOT EXISTS price_new numeric(10,2),
ADD COLUMN IF NOT EXISTS price_used numeric(10,2);
