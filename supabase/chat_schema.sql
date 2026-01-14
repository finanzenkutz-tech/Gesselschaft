-- DIRECT MESSAGES: Chat between users
-- Run this in Supabase SQL Editor

-- Messages table for direct chats
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_dm_sender ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_dm_receiver ON direct_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_dm_created ON direct_messages(created_at DESC);

-- Enable RLS
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only see their own messages
CREATE POLICY "Users can view their own messages" ON direct_messages
FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);

-- Users can send messages
CREATE POLICY "Users can send messages" ON direct_messages
FOR INSERT WITH CHECK (
  auth.uid() = sender_id
);

-- Users can mark their received messages as read
CREATE POLICY "Users can update their received messages" ON direct_messages
FOR UPDATE USING (
  auth.uid() = receiver_id
);

-- Users can delete their own sent messages
CREATE POLICY "Users can delete their own messages" ON direct_messages
FOR DELETE USING (
  auth.uid() = sender_id
);

-- Enable Realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;
