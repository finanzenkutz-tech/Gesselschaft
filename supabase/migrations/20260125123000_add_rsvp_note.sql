-- Add note column to event_attendees if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_attendees' AND column_name = 'note') THEN
        ALTER TABLE event_attendees ADD COLUMN note text;
    END IF;
END $$;
