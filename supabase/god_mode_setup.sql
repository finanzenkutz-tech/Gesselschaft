-- Add column to track if super admin has seen the intro popup
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_seen_god_mode boolean DEFAULT false;

-- Allow users to update their own has_seen_god_mode flag (for the "Understood" action)
CREATE POLICY "Users can update own god mode flag" ON public.profiles
FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- (RLS Policies for Super Admin are already set in super_admin_setup.sql)
