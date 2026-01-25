create table if not exists group_messages (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references groups(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now() not null
);

alter table group_messages enable row level security;

create policy "Members can view messages"
  on group_messages for select
  using (
    exists (
      select 1 from group_members
      where group_members.group_id = group_messages.group_id
      and group_members.user_id = auth.uid()
    )
  );

create policy "Members can insert messages"
  on group_messages for insert
  with check (
    exists (
      select 1 from group_members
      where group_members.group_id = group_messages.group_id
      and group_members.user_id = auth.uid()
    )
  );
