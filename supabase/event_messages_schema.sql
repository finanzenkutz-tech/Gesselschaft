-- EVENT CHAT MESSAGES
create table public.event_messages (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid references public.events(id) not null,
  user_id uuid references public.profiles(id) not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.event_messages enable row level security;

create policy "Event messages are viewable by event attendees."
  on event_messages for select
  using ( 
    exists (
      select 1 from event_attendees ea 
      where ea.event_id = event_messages.event_id and ea.user_id = auth.uid()
    )
  );

create policy "Event attendees can post messages."
  on event_messages for insert
  with check ( 
    exists (
      select 1 from event_attendees ea 
      where ea.event_id = event_messages.event_id and ea.user_id = auth.uid()
    )
  );

-- Enable Realtime for event_messages
alter publication supabase_realtime add table event_messages;
