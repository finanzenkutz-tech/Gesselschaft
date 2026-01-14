-- Add last_seen column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen timestamp with time zone default timezone('utc'::text, now());

-- Allow users to update their own last_seen
CREATE POLICY "Users can update own last_seen" ON public.profiles
FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
