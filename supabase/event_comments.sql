-- Create event_comments table
create table if not exists event_comments (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references events(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table event_comments enable row level security;

-- Policies
create policy "Comments are viewable by everyone"
  on event_comments for select
  using ( true );

create policy "Authenticated users can insert comments"
  on event_comments for insert
  with check ( auth.uid() = user_id );

create policy "Users can delete own comments"
  on event_comments for delete
  using ( auth.uid() = user_id );

-- Realtime
alter publication supabase_realtime add table event_comments;
