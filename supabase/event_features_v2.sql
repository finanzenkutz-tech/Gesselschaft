-- Event Brings (Was Leute mitbringen)
create table if not exists public.event_brings (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid references public.events(id) not null,
  user_id uuid references public.profiles(id) not null,
  inventory_id uuid references public.inventory(id), -- Optional: if referencing a specific inventory item
  custom_item text, -- Optional: Free text if not in inventory OR additional detail
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Constraint: Must have either inventory_id or custom_item
  constraint check_item_source check (inventory_id is not null or custom_item is not null)
);

alter table public.event_brings enable row level security;

do $$
begin
  if not exists (
    select from pg_policies where tablename = 'event_brings' and policyname = 'Anyone can view what is brought'
  ) then
    create policy "Anyone can view what is brought" on event_brings for select using ( true );
  end if;

  if not exists (
    select from pg_policies where tablename = 'event_brings' and policyname = 'Authenticated users can add items'
  ) then
    create policy "Authenticated users can add items" on event_brings for insert with check ( auth.role() = 'authenticated' );
  end if;

  if not exists (
    select from pg_policies where tablename = 'event_brings' and policyname = 'Users can remove their own items'
  ) then
    create policy "Users can remove their own items" on event_brings for delete using ( auth.uid() = user_id );
  end if;
end
$$;

-- Event Wishes (Spielwünsche)
create table if not exists public.event_wishes (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid references public.events(id) not null,
  user_id uuid references public.profiles(id) not null,
  inventory_id uuid references public.inventory(id) not null, -- The game they wish for
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.event_wishes enable row level security;

do $$
begin
  if not exists (
    select from pg_policies where tablename = 'event_wishes' and policyname = 'Anyone can view wishes'
  ) then
    create policy "Anyone can view wishes" on event_wishes for select using ( true );
  end if;

  if not exists (
    select from pg_policies where tablename = 'event_wishes' and policyname = 'Authenticated users can wish'
  ) then
    create policy "Authenticated users can wish" on event_wishes for insert with check ( auth.role() = 'authenticated' );
  end if;

  if not exists (
    select from pg_policies where tablename = 'event_wishes' and policyname = 'Users can remove their wishes'
  ) then
    create policy "Users can remove their wishes" on event_wishes for delete using ( auth.uid() = user_id );
  end if;
end
$$;

-- Ensure Game Sessions Tables Updates

create table if not exists public.game_sessions (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid references public.events(id) not null,
  game_name text not null,
  game_image_url text,
  played_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references public.profiles(id) not null
);

-- Add Report Columns if they don't exist
alter table public.game_sessions add column if not exists report_text text;
alter table public.game_sessions add column if not exists report_image_url text;
alter table public.game_sessions add column if not exists winner_id uuid references public.profiles(id);

alter table public.game_sessions enable row level security;

-- Policies for game_sessions
do $$
begin
  if not exists (
    select from pg_policies where tablename = 'game_sessions' and policyname = 'Anyone can view game sessions'
  ) then
    create policy "Anyone can view game sessions" on game_sessions for select using ( true );
  end if;

  if not exists (
    select from pg_policies where tablename = 'game_sessions' and policyname = 'Authenticated users can create game sessions'
  ) then
    create policy "Authenticated users can create game sessions" on game_sessions for insert with check ( auth.role() = 'authenticated' );
  end if;

  if not exists (
    select from pg_policies where tablename = 'game_sessions' and policyname = 'Creators can update game sessions'
  ) then
     create policy "Creators can update game sessions" on game_sessions for update using ( created_by = auth.uid() );
  end if;
end
$$;


create table if not exists public.game_session_players (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references public.game_sessions(id) not null,
  user_id uuid references public.profiles(id) not null,
  score integer,
  placement integer, -- 1st, 2nd, 3rd
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(session_id, user_id)
);

alter table public.game_session_players enable row level security;

-- Policies for game_session_players
do $$
begin
  if not exists (
    select from pg_policies where tablename = 'game_session_players' and policyname = 'Anyone can view game session players'
  ) then
    create policy "Anyone can view game session players" on game_session_players for select using ( true );
  end if;

  if not exists (
    select from pg_policies where tablename = 'game_session_players' and policyname = 'Authenticated users can add players'
  ) then
    create policy "Authenticated users can add players" on game_session_players for insert with check ( auth.role() = 'authenticated' );
  end if;
end
$$;
