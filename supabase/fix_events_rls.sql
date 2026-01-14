-- Fix Events RLS policies for creating events
-- Run this in Supabase SQL Editor

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view events in their groups" ON events;
DROP POLICY IF EXISTS "Group members can create events" ON events;
DROP POLICY IF EXISTS "Event creator can update" ON events;
DROP POLICY IF EXISTS "Event creator can delete" ON events;

-- 1. Anyone can view events (for now, to avoid recursion issues)
CREATE POLICY "Anyone can view events" ON events
FOR SELECT USING (true);

-- 2. Group members can create events - use SECURITY DEFINER function
CREATE OR REPLACE FUNCTION is_group_member(check_group_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = check_group_id
    AND user_id = auth.uid()
  );
$$;

CREATE POLICY "Group members can create events" ON events
FOR INSERT WITH CHECK (is_group_member(group_id));

-- 3. Event creator or group admin can update
CREATE POLICY "Event creator can update" ON events
FOR UPDATE USING (
  created_by = auth.uid() OR is_group_admin(group_id)
);

-- 4. Event creator or group admin can delete
CREATE POLICY "Event creator can delete" ON events
FOR DELETE USING (
  created_by = auth.uid() OR is_group_admin(group_id)
);

-- Fix event_attendees policies
DROP POLICY IF EXISTS "Users can view event attendees" ON event_attendees;
DROP POLICY IF EXISTS "Users can add themselves" ON event_attendees;
DROP POLICY IF EXISTS "Users can update their attendance" ON event_attendees;
DROP POLICY IF EXISTS "Users can remove themselves" ON event_attendees;

CREATE POLICY "Anyone can view event attendees" ON event_attendees
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can add themselves" ON event_attendees
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attendance" ON event_attendees
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can remove themselves" ON event_attendees
FOR DELETE USING (auth.uid() = user_id);

-- Fix event_contributions policies
DROP POLICY IF EXISTS "Users can view contributions" ON event_contributions;
DROP POLICY IF EXISTS "Users can add contributions" ON event_contributions;
DROP POLICY IF EXISTS "Users can update their contributions" ON event_contributions;
DROP POLICY IF EXISTS "Users can delete their contributions" ON event_contributions;

CREATE POLICY "Anyone can view contributions" ON event_contributions
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can add contributions" ON event_contributions
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contributions" ON event_contributions
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contributions" ON event_contributions
FOR DELETE USING (auth.uid() = user_id);
