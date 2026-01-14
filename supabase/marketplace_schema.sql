-- Marketplace Listings Table
create table if not exists public.marketplace_listings (
  id uuid default uuid_generate_v4() primary key,
  seller_id uuid references public.profiles(id) not null,
  title text not null,
  description text,
  game_id uuid references public.inventory(id), -- Optional link to inventory item
  listing_type text not null check (listing_type in ('sell', 'trade', 'both')),
  price numeric(10, 2), -- Can be null if only for trade
  condition text check (condition in ('new', 'like_new', 'good', 'acceptable', 'poor')),
  location text, -- Postal code or city
  images text[] default array[]::text[],
  status text not null default 'active' check (status in ('active', 'reserved', 'sold')),
  
  -- Game Stats (Synced from BoardGameGeek or manually entered)
  min_players int,
  max_players int,
  playtime int, -- in minutes
  min_age int,
  complexity numeric(3, 2), -- 1.00 to 5.00
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.marketplace_listings enable row level security;

-- Policies
create policy "Marketplace listings are viewable by everyone"
  on marketplace_listings for select
  using ( true );

create policy "Users can insert their own listings"
  on marketplace_listings for insert
  with check ( auth.uid() = seller_id );

create policy "Users can update their own listings"
  on marketplace_listings for update
  using ( auth.uid() = seller_id );

create policy "Users can delete their own listings"
  on marketplace_listings for delete
  using ( auth.uid() = seller_id );

-- Marketplace Favorites Table
create table if not exists public.marketplace_favorites (
    user_id uuid references public.profiles(id) not null,
    listing_id uuid references public.marketplace_listings(id) on delete cascade not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (user_id, listing_id)
);

alter table public.marketplace_favorites enable row level security;

create policy "Users can view their own favorites"
    on marketplace_favorites for select
    using ( auth.uid() = user_id );

create policy "Users can add their own favorites"
    on marketplace_favorites for insert
    with check ( auth.uid() = user_id );

create policy "Users can remove their own favorites"
    on marketplace_favorites for delete
    using ( auth.uid() = user_id );

-- Marketplace Reports Table
create table if not exists public.marketplace_reports (
    id uuid default uuid_generate_v4() primary key,
    reporter_id uuid references public.profiles(id) not null,
    listing_id uuid references public.marketplace_listings(id) on delete set null,
    reason text not null,
    description text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    status text default 'open' check (status in ('open', 'resolved', 'dismissed'))
);

alter table public.marketplace_reports enable row level security;

create policy "Users can create reports"
    on marketplace_reports for insert
    with check ( auth.uid() = reporter_id );

create policy "Admins can view reports"
    on marketplace_reports for select
    using ( 
        exists (
            select 1 from public.profiles
            where id = auth.uid() and role in ('admin', 'super_admin')
        )
    );

-- Realtime
alter publication supabase_realtime add table marketplace_listings;

-- Updated_at trigger (if not already exists globally, but good to ensure)
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_marketplace_listings_updated
  before update on marketplace_listings
  for each row execute procedure public.handle_updated_at();
