-- Marketplace Offers Table
CREATE TYPE offer_status AS ENUM ('pending', 'accepted', 'rejected', 'cancelled');

CREATE TABLE IF NOT EXISTS marketplace_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID REFERENCES marketplace_listings(id) ON DELETE CASCADE,
    buyer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    message TEXT,
    status offer_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Offers
ALTER TABLE marketplace_offers ENABLE ROW LEVEL SECURITY;

-- Buyers can see their own offers
CREATE POLICY "Users can see their own offers" ON marketplace_offers
    FOR SELECT USING (auth.uid() = buyer_id);

-- Sellers can see offers for their listings
CREATE POLICY "Sellers can see offers for their listings" ON marketplace_offers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM marketplace_listings
            WHERE marketplace_listings.id = marketplace_offers.listing_id
            AND marketplace_listings.seller_id = auth.uid()
        )
    );

-- Users can create offers
CREATE POLICY "Users can create offers" ON marketplace_offers
    FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Users can update status of their own offers (cancel) or sellers can (accept/reject)
CREATE POLICY "Relevant users can update offer status" ON marketplace_offers
    FOR UPDATE USING (
        auth.uid() = buyer_id OR
        EXISTS (
            SELECT 1 FROM marketplace_listings
            WHERE marketplace_listings.id = marketplace_offers.listing_id
            AND marketplace_listings.seller_id = auth.uid()
        )
    );

-- Marketplace Saved Searches Table
CREATE TABLE IF NOT EXISTS marketplace_saved_searches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    filters JSONB DEFAULT '{}'::jsonb,
    label TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Saved Searches
ALTER TABLE marketplace_saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own saved searches" ON marketplace_saved_searches
    USING (auth.uid() = user_id);

-- Trigger for updated_at on offers
CREATE TRIGGER set_updated_at_offers
BEFORE UPDATE ON marketplace_offers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
