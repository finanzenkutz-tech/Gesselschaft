-- Add visibility and image_url columns to inventory table

alter table public.inventory add column if not exists visibility text default 'private';
alter table public.inventory add column if not exists image_url text;

-- Create storage bucket for game images (run this in Supabase Dashboard > Storage)
-- insert into storage.buckets (id, name, public) values ('game-images', 'game-images', true);

-- Update RLS policy for storage if needed
-- create policy "Anyone can view game images" on storage.objects for select using (bucket_id = 'game-images');
-- create policy "Authenticated users can upload game images" on storage.objects for insert with check (bucket_id = 'game-images' and auth.role() = 'authenticated');
