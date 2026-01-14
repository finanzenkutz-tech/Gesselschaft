-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  avatar_url text,
  has_seen_onboarding boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- GROUPS
create table public.groups (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  created_by uuid references public.profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.groups enable row level security;

create policy "Groups are viewable by everyone."
  on groups for select
  using ( true );

create policy "Authenticated users can create groups."
  on groups for insert
  with check ( auth.role() = 'authenticated' );

-- GROUP MEMBERS
create table public.group_members (
  group_id uuid references public.groups(id) not null,
  user_id uuid references public.profiles(id) not null,
  role text default 'member', -- 'admin', 'member'
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (group_id, user_id)
);

alter table public.group_members enable row level security;
-- (Add more policies as needed)

-- EVENTS
create table public.events (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references public.groups(id) not null,
  title text not null,
  description text,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone,
  location text,
  created_by uuid references public.profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.events enable row level security;

-- EVENT ATTENDEES
create table public.event_attendees (
  event_id uuid references public.events(id) not null,
  user_id uuid references public.profiles(id) not null,
  status text default 'going', -- 'going', 'maybe', 'not_going'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (event_id, user_id)
);

alter table public.event_attendees enable row level security;

-- CARPOOLING (Fahrgemeinschaften)
create table public.carpooling (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid references public.events(id) not null,
  driver_id uuid references public.profiles(id) not null,
  seats_available int not null default 4,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.carpooling enable row level security;

create table public.carpool_passengers (
  carpool_id uuid references public.carpooling(id) not null,
  passenger_id uuid references public.profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (carpool_id, passenger_id)
);

alter table public.carpool_passengers enable row level security;

-- INVENTORY (Spiele)
create table public.inventory (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  owner_id uuid references public.profiles(id),
  group_id uuid references public.groups(id),
  bgg_link text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.inventory enable row level security;

-- FEATURE REQUESTS
create table public.feature_requests (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  votes int default 0,
  created_by uuid references public.profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.feature_requests enable row level security;

-- T rigger for new profiles usually handled by supabase function
-- or just handled by the frontend on first login check
