-- Add rental fields to marketplace_listings
ALTER TABLE marketplace_listings 
ADD COLUMN IF NOT EXISTS is_for_rent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS rental_period_days INTEGER; -- Typical rental period if specified

-- Add rental fields to marketplace_offers (for specific requests)
ALTER TABLE marketplace_offers
ADD COLUMN IF NOT EXISTS is_rental_request BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS return_date DATE;

-- Update listing types to include 'rent' if we want a separate category, 
-- but 'listing_type' is already 'sell', 'trade', 'both'. 
-- We'll use 'is_for_rent' as a flag or expand listing_type.
-- Let's expand listing_type check too.
ALTER TABLE marketplace_listings DROP CONSTRAINT IF EXISTS marketplace_listings_listing_type_check;
ALTER TABLE marketplace_listings ADD CONSTRAINT marketplace_listings_listing_type_check 
CHECK (listing_type IN ('sell', 'trade', 'both', 'rent'));
