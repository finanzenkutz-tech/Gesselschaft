-- GAMIFICATION: Add points and badges to profiles
alter table public.profiles add column if not exists points integer default 0;
alter table public.profiles add column if not exists badges text[] default '{}';
alter table public.profiles add column if not exists last_seen timestamp with time zone default now();

-- CHALLENGES: Challenge other members
create table if not exists public.challenges (
  id uuid default uuid_generate_v4() primary key,
  challenger_id uuid references public.profiles(id) not null,
  challenged_id uuid references public.profiles(id) not null,
  game_suggestion text,
  status text default 'pending', -- pending, accepted, declined, completed
  winner_id uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.challenges enable row level security;

create policy "Users can view their own challenges"
  on challenges for select
  using ( challenger_id = auth.uid() or challenged_id = auth.uid() );

create policy "Authenticated users can create challenges"
  on challenges for insert
  with check ( auth.uid() = challenger_id );

create policy "Participants can update challenges"
  on challenges for update
  using ( challenger_id = auth.uid() or challenged_id = auth.uid() );

-- GAME SESSIONS: Track games played at events
create table if not exists public.game_sessions (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid references public.events(id) not null,
  game_name text not null,
  game_image_url text,
  played_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references public.profiles(id) not null
);

alter table public.game_sessions enable row level security;

create policy "Anyone can view game sessions"
  on game_sessions for select
  using ( true );

create policy "Event attendees can create game sessions"
  on game_sessions for insert
  with check ( 
    exists (
      select 1 from event_attendees ea 
      where ea.event_id = game_sessions.event_id and ea.user_id = auth.uid()
    )
  );

-- GAME SESSION PLAYERS: Who played in each session
create table if not exists public.game_session_players (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references public.game_sessions(id) not null,
  user_id uuid references public.profiles(id) not null,
  score integer,
  placement integer, -- 1st, 2nd, 3rd, etc.
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(session_id, user_id)
);

alter table public.game_session_players enable row level security;

create policy "Anyone can view game session players"
  on game_session_players for select
  using ( true );

create policy "Session creator can add players"
  on game_session_players for insert
  with check ( 
    exists (
      select 1 from game_sessions gs 
      where gs.id = game_session_players.session_id and gs.created_by = auth.uid()
    )
  );

-- Function to update last_seen
create or replace function update_last_seen()
returns trigger as $$
begin
  update profiles set last_seen = now() where id = auth.uid();
  return new;
end;
$$ language plpgsql security definer;
