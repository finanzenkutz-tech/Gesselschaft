-- Add Notification Preferences to Profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS pref_email_notifications boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS pref_push_notifications boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS pref_in_app_notifications boolean DEFAULT true;

-- Optional: Category based settings (Matrix)
-- If we want more granularity:
-- ADD COLUMN IF NOT EXISTS pref_notif_chat boolean DEFAULT true,
-- ADD COLUMN IF NOT EXISTS pref_notif_buddies boolean DEFAULT true,
-- ADD COLUMN IF NOT EXISTS pref_notif_groups boolean DEFAULT true,
-- ADD COLUMN IF NOT EXISTS pref_notif_marketplace boolean DEFAULT true;
