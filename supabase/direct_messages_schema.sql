-- Direct Chats (Conversations)
create table if not exists direct_chats (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Participants (M:N) - usually 2 people for DM
create table if not exists direct_chat_participants (
  chat_id uuid references direct_chats(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  last_read_at timestamptz default now(),
  primary key (chat_id, user_id)
);

-- Messages
create table if not exists direct_messages (
  id uuid default gen_random_uuid() primary key,
  chat_id uuid references direct_chats(id) on delete cascade,
  sender_id uuid references profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz default now(),
  is_read boolean default false
);

-- RLS
alter table direct_chats enable row level security;
alter table direct_chat_participants enable row level security;
alter table direct_messages enable row level security;

-- Policies for Direct Chats
create policy "Users can view chats they are part of"
  on direct_chats for select
  using (
    exists (
      select 1 from direct_chat_participants
      where chat_id = direct_chats.id
      and user_id = auth.uid()
    )
  );
-- Allow creation by authenticated users (logic handled by app to ensuring participants)
create policy "Users can create chats"
  on direct_chats for insert
  with check (auth.role() = 'authenticated');


-- Policies for Participants
create policy "Users can view participants of their chats"
  on direct_chat_participants for select
  using (
    exists (
      select 1 from direct_chat_participants dcp
      where dcp.chat_id = direct_chat_participants.chat_id
      and dcp.user_id = auth.uid()
    )
  );

create policy "Users can add themselves or others to chats they are creating"
  on direct_chat_participants for insert
  with check (auth.role() = 'authenticated');


-- Policies for Messages
create policy "Users can view messages in their chats"
  on direct_messages for select
  using (
    exists (
      select 1 from direct_chat_participants
      where chat_id = direct_messages.chat_id
      and user_id = auth.uid()
    )
  );

create policy "Users can send messages to their chats"
  on direct_messages for insert
  with check (
    auth.uid() = sender_id
    and
    exists (
      select 1 from direct_chat_participants
      where chat_id = direct_messages.chat_id
      and user_id = auth.uid()
    )
  );
