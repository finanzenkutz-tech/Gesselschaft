-- Add Rental fields to marketplace_listings
ALTER TABLE marketplace_listings 
ADD COLUMN IF NOT EXISTS is_for_rent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS rental_period_days INTEGER;

-- Add Rental fields to marketplace_offers
ALTER TABLE marketplace_offers
ADD COLUMN IF NOT EXISTS is_rental_request BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS return_date TIMESTAMPTZ;

-- Ensure marketplace_reports table exists
CREATE TABLE IF NOT EXISTS marketplace_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES marketplace_listings(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'open', -- open, resolved, dismissed
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Reports
ALTER TABLE marketplace_reports ENABLE ROW LEVEL SECURITY;

-- Admins can see all reports
CREATE POLICY "Admins can see all reports" ON marketplace_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- Users can create reports
CREATE POLICY "Users can create reports" ON marketplace_reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Admins can update reports
CREATE POLICY "Admins can update reports" ON marketplace_reports
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );
