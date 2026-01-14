-- Fix group_members RLS policies - Infinite Recursion Error
-- Run this in Supabase SQL Editor

-- First, DROP the problematic policies
DROP POLICY IF EXISTS "Users can join groups" ON group_members;
DROP POLICY IF EXISTS "Members can view other members" ON group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON group_members;
DROP POLICY IF EXISTS "Admins can manage members" ON group_members;

-- Recreate policies WITHOUT infinite recursion

-- 1. Anyone can view group members (no recursion needed)
CREATE POLICY "Anyone can view group members" ON group_members
FOR SELECT USING (true);

-- 2. Users can join groups (insert their own record)
CREATE POLICY "Users can join groups" ON group_members
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Users can leave groups (delete their own record)
CREATE POLICY "Users can leave groups" ON group_members
FOR DELETE USING (auth.uid() = user_id);

-- 4. For admin operations, use a SECURITY DEFINER function instead
-- This avoids the infinite recursion by bypassing RLS for the check

CREATE OR REPLACE FUNCTION is_group_admin(check_group_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = check_group_id
    AND user_id = auth.uid()
    AND role = 'admin'
  );
$$;

-- 5. Admins can update member roles (using the function)
CREATE POLICY "Admins can update members" ON group_members
FOR UPDATE USING (
  auth.uid() = user_id  -- Users can update their own row
  OR is_group_admin(group_id)  -- Admins can update any row in their group
);

-- 6. Admins can remove members (kick)
CREATE POLICY "Admins can delete members" ON group_members
FOR DELETE USING (
  auth.uid() = user_id  -- Users can leave themselves
  OR is_group_admin(group_id)  -- Admins can kick anyone in their group
);
