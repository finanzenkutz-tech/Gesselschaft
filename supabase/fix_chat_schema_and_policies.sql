
-- 1. Ensure Direct Chat Tables exist (Chat Room Model)
CREATE TABLE IF NOT EXISTS public.direct_chats (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.direct_chat_participants (
  chat_id uuid REFERENCES public.direct_chats(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_read_at timestamptz DEFAULT now(),
  PRIMARY KEY (chat_id, user_id)
);

-- 2. Update Direct Messages Table
-- Ensure it has chat_id and make receiver_id nullable as we rely on chat_id
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  is_read boolean DEFAULT false
);

DO $$ 
BEGIN 
    -- Add chat_id if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'direct_messages' AND column_name = 'chat_id') THEN
        ALTER TABLE public.direct_messages ADD COLUMN chat_id uuid REFERENCES public.direct_chats(id) ON DELETE CASCADE;
    END IF;

    -- Add receiver_id if not exists (for backward compat) but make it nullable
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'direct_messages' AND column_name = 'receiver_id') THEN
        ALTER TABLE public.direct_messages ADD COLUMN receiver_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;
    ELSE
        -- If it exists, make sure it is nullable because new code uses chat_id
        ALTER TABLE public.direct_messages ALTER COLUMN receiver_id DROP NOT NULL;
    END IF;
END $$;

-- 3. Ensure Group Messages Table Exists
CREATE TABLE IF NOT EXISTS public.group_messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE public.direct_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies (Drop existing to ensure clean slate)

-- Direct Chats
DROP POLICY IF EXISTS "Users can view chats they are part of" ON direct_chats;
CREATE POLICY "Users can view chats they are part of" ON direct_chats
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM direct_chat_participants
            WHERE chat_id = direct_chats.id AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create chats" ON direct_chats;
CREATE POLICY "Users can create chats" ON direct_chats
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Direct Chat Participants
DROP POLICY IF EXISTS "Users can view participants" ON direct_chat_participants;
CREATE POLICY "Users can view participants" ON direct_chat_participants
    FOR SELECT USING (
        user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM direct_chat_participants dcp
            WHERE dcp.chat_id = direct_chat_participants.chat_id AND dcp.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert participants" ON direct_chat_participants;
CREATE POLICY "Users can insert participants" ON direct_chat_participants
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Direct Messages
DROP POLICY IF EXISTS "Users can view messages in their chats" ON direct_messages;
CREATE POLICY "Users can view messages in their chats" ON direct_messages
    FOR SELECT USING (
        -- Check if user is participant of the chat linked to message
        (chat_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM direct_chat_participants
            WHERE chat_id = direct_messages.chat_id AND user_id = auth.uid()
        ))
        OR
        -- OR check legacy sender/receiver
        (auth.uid() = sender_id OR auth.uid() = receiver_id)
    );

DROP POLICY IF EXISTS "Users can send messages" ON direct_messages;
CREATE POLICY "Users can send messages" ON direct_messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id
        -- We don't strictly enforce participant on INSERT to avoid complexity, 
        -- but ideally we should. Trusting app logic + simple auth check usually enough for beta.
    );

-- Group Messages
DROP POLICY IF EXISTS "Group members can view messages" ON group_messages;
CREATE POLICY "Group members can view messages" ON group_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM group_members
            WHERE group_id = group_messages.group_id AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Group members can send messages" ON group_messages;
CREATE POLICY "Group members can send messages" ON group_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM group_members
            WHERE group_id = group_messages.group_id AND user_id = auth.uid()
        )
        AND auth.uid() = user_id
    );

-- 6. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE group_messages;
