-- Marketplace V2 Schema Extensions

-- 1. Favorites
create table public.marketplace_favorites (
  user_id uuid references public.profiles(id) on delete cascade not null,
  listing_id uuid references public.marketplace_listings(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, listing_id)
);

alter table public.marketplace_favorites enable row level security;

create policy "Users can view their own favorites"
  on marketplace_favorites for select
  using ( auth.uid() = user_id );

create policy "Users can add favorites"
  on marketplace_favorites for insert
  with check ( auth.uid() = user_id );

create policy "Users can remove favorites"
  on marketplace_favorites for delete
  using ( auth.uid() = user_id );

-- 2. Reports
create table public.marketplace_reports (
  id uuid default uuid_generate_v4() primary key,
  reporter_id uuid references public.profiles(id) not null,
  listing_id uuid references public.marketplace_listings(id) not null,
  reason text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.marketplace_reports enable row level security;

create policy "Users can create reports"
  on marketplace_reports for insert
  with check ( auth.uid() = reporter_id );

-- 3. Reviews
create table public.user_reviews (
  id uuid default uuid_generate_v4() primary key,
  reviewer_id uuid references public.profiles(id) not null,
  reviewed_user_id uuid references public.profiles(id) not null,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.user_reviews enable row level security;

create policy "Reviews are viewable by everyone"
  on user_reviews for select
  using ( true );

create policy "Users can write reviews"
  on user_reviews for insert
  with check ( auth.uid() = reviewer_id );

-- 4. Extended Listing Stats & Location
alter table public.marketplace_listings 
add column if not exists min_players int,
add column if not exists max_players int,
add column if not exists playtime int, -- minutes
add column if not exists min_age int,
add column if not exists complexity numeric(3,1), -- 1.0 to 5.0
add column if not exists lat double precision,
add column if not exists lng double precision;

-- 5. Radius Search Function
create or replace function get_listings_within_radius(
  user_lat double precision,
  user_lng double precision,
  radius_km double precision
)
returns setof marketplace_listings
language sql
stable
as $$
  select *
  from marketplace_listings
  where (
    6371 * acos(
      least(1.0, greatest(-1.0,
        cos(radians(user_lat)) * cos(radians(lat)) *
        cos(radians(lng) - radians(user_lng)) +
        sin(radians(user_lat)) * sin(radians(lat))
      ))
    )
  ) <= radius_km
  and status = 'active';
$$;
