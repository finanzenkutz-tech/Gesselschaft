
-- Fix foreign key in group_messages to point to public.profiles
-- This enables PostgREST to automatically join profile data

ALTER TABLE public.group_messages
DROP CONSTRAINT IF EXISTS group_messages_user_id_fkey;

ALTER TABLE public.group_messages
ADD CONSTRAINT group_messages_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- Also optimize RLS for performance
DROP POLICY IF EXISTS "Members can view messages" ON group_messages;
CREATE POLICY "Members can view messages" ON group_messages
FOR SELECT USING ( is_group_member(group_id) );

DROP POLICY IF EXISTS "Members can insert messages" ON group_messages;
CREATE POLICY "Members can insert messages" ON group_messages
FOR INSERT WITH CHECK ( is_group_member(group_id) );
