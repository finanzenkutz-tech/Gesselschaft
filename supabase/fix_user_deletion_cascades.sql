-- Fix User Deletion Cascades
-- Ensures that when a profile is deleted, all dependent records are either deleted or unlinked.

-- 1. GROUPS (Delete groups created by user)
ALTER TABLE public.groups
DROP CONSTRAINT IF EXISTS groups_created_by_fkey,
ADD CONSTRAINT groups_created_by_fkey
FOREIGN KEY (created_by)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- 2. EVENTS (Delete events created by user)
ALTER TABLE public.events
DROP CONSTRAINT IF EXISTS events_created_by_fkey,
ADD CONSTRAINT events_created_by_fkey
FOREIGN KEY (created_by)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- 3. MARKETPLACE (Delete listings from seller)
ALTER TABLE public.marketplace_listings
DROP CONSTRAINT IF EXISTS marketplace_listings_seller_id_fkey,
ADD CONSTRAINT marketplace_listings_seller_id_fkey
FOREIGN KEY (seller_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- 4. INVENTORY (Remove owner from games, but keep the games if group-tied)
ALTER TABLE public.inventory
DROP CONSTRAINT IF EXISTS inventory_owner_id_fkey,
ADD CONSTRAINT inventory_owner_id_fkey
FOREIGN KEY (owner_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE; -- Or SET NULL if you want to keep the record

-- 5. FEATURE REQUESTS
ALTER TABLE public.feature_requests
DROP CONSTRAINT IF EXISTS feature_requests_created_by_fkey,
ADD CONSTRAINT feature_requests_created_by_fkey
FOREIGN KEY (created_by)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- 6. MARKETPLACE REPORTS (Cleanup reports by deleted user)
ALTER TABLE public.marketplace_reports
DROP CONSTRAINT IF EXISTS marketplace_reports_reporter_id_fkey,
ADD CONSTRAINT marketplace_reports_reporter_id_fkey
FOREIGN KEY (reporter_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- 7. GROUP MEMBERS (Actually already handled by primary key references usually, but good to be explicit)
ALTER TABLE public.group_members
DROP CONSTRAINT IF EXISTS group_members_user_id_fkey,
ADD CONSTRAINT group_members_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- 8. EVENT ATTENDEES
ALTER TABLE public.event_attendees
DROP CONSTRAINT IF EXISTS event_attendees_user_id_fkey,
ADD CONSTRAINT event_attendees_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;
