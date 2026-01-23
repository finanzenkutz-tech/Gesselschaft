-- Known Games Catalog (Top 100 List)
create table known_games (
    id uuid primary key default gen_random_uuid(),
    bgg_id text unique not null,
    name text not null,
    image_url text,
    thumbnail_url text,
    description text,
    min_players int,
    max_players int,
    playtime_min int,
    playtime_max int,
    min_age int,
    year_published int,
    complexity numeric(3, 2), -- 1.00 to 5.00
    rating numeric(3, 2), -- 1.00 to 10.00
    strategy_score numeric(3, 1), -- inferred or manual, 0-10 probably
    luck_score numeric(3, 1), -- inferred or manual
    is_top_100 boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table known_games enable row level security;

-- Policy: Everyone can read
create policy "Everyone can read known games"
    on known_games for select
    using (true);

-- Policy: Authenticated users can insert/update (for seeding/community contribution)
create policy "Authenticated users can manage known games"
    on known_games for all
    using ( auth.role() = 'authenticated' )
    with check ( auth.role() = 'authenticated' );

-- Indexes for search
create index known_games_name_idx on known_games using btree (name);
create index known_games_bgg_id_idx on known_games using btree (bgg_id);
