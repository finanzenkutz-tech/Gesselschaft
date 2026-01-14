-- Add Guest Management support
ALTER TABLE public.event_attendees
ADD COLUMN IF NOT EXISTS guest_count integer DEFAULT 0 CHECK (guest_count >= 0);

COMMENT ON COLUMN public.event_attendees.guest_count IS 'Number of additional guests (+1s) brought by the user';
