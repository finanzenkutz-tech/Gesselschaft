-- Add category column to inventory and known_games
alter table public.inventory add column if not exists category text;
alter table public.known_games add column if not exists category text;
