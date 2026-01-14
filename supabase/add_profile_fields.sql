-- Add new columns to profiles table
alter table public.profiles
add column if not exists bio text,
add column if not exists location text,
add column if not exists favorite_games text,
add column if not exists play_style_tags text[] default array[]::text[],
add column if not exists show_reputation boolean default false;

-- Enhance RLS policies to allow updating these new columns
-- (Existing policy "Users can update own profile" usually covers all columns, but good to double check if it was restricting columns)
-- In the schema.sql seen earlier:
-- create policy "Users can update own profile."
--   on profiles for update
--   using ( auth.uid() = id );
-- This existing policy is sufficient as it doesn't restrict columns.
