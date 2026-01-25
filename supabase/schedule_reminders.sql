-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the 'send-reminders' edge function to run every day at 12:00 PM UTC
-- Note: Requires the Edge Function 'send-reminders' to be deployed.
SELECT cron.schedule(
    'send-event-reminders', -- name of the cron job
    '0 12 * * *',           -- schedule (every day at 12:00)
    $$
    SELECT process_checkout_reminders();
    $$
);
