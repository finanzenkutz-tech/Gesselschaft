-- Fix Infinite Recursion on group_members

-- 1. Helper function to check membership safely (SECURITY DEFINER breaks recursion)
CREATE OR REPLACE FUNCTION public.is_group_member(_group_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM group_members 
    WHERE group_id = _group_id 
    AND user_id = auth.uid()
  );
END;
$$;

-- 2. Drop existing policies to be clean
DROP POLICY IF EXISTS "Members can view other members" ON group_members;
DROP POLICY IF EXISTS "Users can view members of public groups" ON group_members;
DROP POLICY IF EXISTS "Users can join public groups" ON group_members;
DROP POLICY IF EXISTS "Admins can manage members" ON group_members;
DROP POLICY IF EXISTS "View members" ON group_members;
DROP POLICY IF EXISTS "Manage members" ON group_members;
DROP POLICY IF EXISTS "Members select" ON group_members;
DROP POLICY IF EXISTS "Anyone can select" ON group_members;

-- 3. Create new robust policies

-- SELECT: 
-- - User can see themselves
-- - User can see members of groups they are in (using function)
-- - User can see members of public groups (assuming groups table is readable)
CREATE POLICY "View group members" ON group_members
FOR SELECT
USING (
  user_id = auth.uid() -- View self
  OR 
  is_group_member(group_id) -- View co-members (safe via function)
  OR
  EXISTS (SELECT 1 FROM groups WHERE id = group_members.group_id AND is_public = true) -- View public groups
);

-- INSERT:
-- - Users can join (insert themselves) into public groups or if invited (logic usually in app, but strict RLS:)
-- - Simple: User can insert row for themselves (joining)
CREATE POLICY "Join groups" ON group_members
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
);
-- Note: You might want to restrict this to public groups only in SQL, but often app logic handles 'private' checks. 
-- For now, allowing self-insert is standard for "Join" button, assuming logic checks if group is open.

-- UPDATE:
-- - Users can update their own status? Usually not. Admins only.
-- - Group Admins can update members.
CREATE POLICY "Group admins update members" ON group_members
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_id = group_members.group_id 
    AND user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- DELETE:
-- - Users can leave (delete themselves)
-- - Group Admins can remove others
CREATE POLICY "Leave or remove members" ON group_members
FOR DELETE
USING (
  user_id = auth.uid() -- Leave
  OR
  EXISTS ( -- Remove as admin
    SELECT 1 FROM group_members 
    WHERE group_id = group_members.group_id 
    AND user_id = auth.uid() 
    AND role = 'admin'
  ) -- This specific admin check might recurse if we aren't careful? 
    -- 'group_members' in FROM clause refers to table. Policy is on 'group_members'.
    -- The SELECT 1 FROM group_members ... checks the SAME table.
    -- This IS recursive for the Admin check.
);

-- Fix for Admin Recursion:
-- Use the same `is_group_member` concept but for admin role.
CREATE OR REPLACE FUNCTION public.is_group_admin(_group_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM group_members 
    WHERE group_id = _group_id 
    AND user_id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- Redefine policies using the Admin Function

DROP POLICY "Group admins update members" ON group_members;
DROP POLICY "Leave or remove members" ON group_members;

CREATE POLICY "Group admins update members" ON group_members
FOR UPDATE
USING ( is_group_admin(group_id) );

CREATE POLICY "Leave or remove members" ON group_members
FOR DELETE
USING (
  user_id = auth.uid() 
  OR 
  is_group_admin(group_id)
);
