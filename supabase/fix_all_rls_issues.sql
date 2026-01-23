-- =============================================================
-- COMPREHENSIVE RLS FIX FOR ADMIN USERS
-- Run this ENTIRE script in Supabase SQL Editor
-- =============================================================

-- 1. RECREATE is_super_admin() function with proper SECURITY DEFINER
-- This bypasses RLS when checking admin status to prevent recursion
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean AS $$
DECLARE
  role_value text;
BEGIN
  SELECT system_role INTO role_value
  FROM public.profiles
  WHERE id = auth.uid();
  
  RETURN coalesce(role_value = 'super_admin', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Helper function for group membership (non-recursive)
CREATE OR REPLACE FUNCTION public.is_member_of_group(target_group_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = target_group_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =============================================================
-- FIX PROFILES TABLE RLS
-- =============================================================
DROP POLICY IF EXISTS "Super-Admins can manage all profiles." ON public.profiles;
DROP POLICY IF EXISTS "Super-Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super-Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super-Admins can delete all profiles" ON public.profiles;

CREATE POLICY "Super-Admins can manage all profiles"
  ON public.profiles FOR ALL
  USING (public.is_super_admin());

-- =============================================================
-- FIX GROUPS TABLE RLS
-- =============================================================
DROP POLICY IF EXISTS "Super-Admins can manage all groups." ON public.groups;
DROP POLICY IF EXISTS "Super-Admins can manage all groups" ON public.groups;

CREATE POLICY "Super-Admins can manage all groups"
  ON public.groups FOR ALL
  USING (public.is_super_admin());

-- Allow group creators and admins to update their groups
DROP POLICY IF EXISTS "Group admins can update their groups" ON public.groups;
CREATE POLICY "Group admins can update their groups"
  ON public.groups FOR UPDATE
  USING (
    auth.uid() = created_by 
    OR EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_id = id 
      AND user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- =============================================================
-- FIX GROUP_MEMBERS TABLE RLS
-- =============================================================
DROP POLICY IF EXISTS "Super-Admins can manage all group members." ON public.group_members;
DROP POLICY IF EXISTS "Super-Admins can manage all group members" ON public.group_members;
DROP POLICY IF EXISTS "Users can view members of their groups" ON public.group_members;
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON public.group_members;

-- Everyone can view group members (needed for display)
CREATE POLICY "Anyone can view group members"
  ON public.group_members FOR SELECT
  USING (true);

-- Authenticated users can join any group
CREATE POLICY "Authenticated users can join groups"
  ON public.group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can leave groups (delete their own membership)
CREATE POLICY "Users can leave groups"
  ON public.group_members FOR DELETE
  USING (auth.uid() = user_id);

-- Super-Admins can do everything
CREATE POLICY "Super-Admins can manage all group members"
  ON public.group_members FOR ALL
  USING (public.is_super_admin());

-- =============================================================
-- FIX GROUP_PLACES TABLE RLS
-- =============================================================
DROP POLICY IF EXISTS "Super-Admins can manage all group places" ON public.group_places;
DROP POLICY IF EXISTS "Members can view group places" ON public.group_places;
DROP POLICY IF EXISTS "Members can rate places" ON public.group_places;
DROP POLICY IF EXISTS "Members can add places" ON public.group_places;

-- Everyone can view places
CREATE POLICY "Anyone can view group places"
  ON public.group_places FOR SELECT
  USING (true);

-- Members can add places
CREATE POLICY "Members can add places"
  ON public.group_places FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Members can update places (for ratings)
CREATE POLICY "Members can update places"
  ON public.group_places FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Super-Admins can do everything
CREATE POLICY "Super-Admins can manage all group places"
  ON public.group_places FOR ALL
  USING (public.is_super_admin());

-- =============================================================
-- FIX PLACE_RATINGS TABLE RLS (if exists)
-- =============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'place_ratings') THEN
    DROP POLICY IF EXISTS "Users can rate places" ON public.place_ratings;
    DROP POLICY IF EXISTS "Users can view ratings" ON public.place_ratings;
    
    EXECUTE 'CREATE POLICY "Anyone can view ratings" ON public.place_ratings FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "Authenticated users can rate" ON public.place_ratings FOR INSERT WITH CHECK (auth.uid() IS NOT NULL)';
    EXECUTE 'CREATE POLICY "Users can update own ratings" ON public.place_ratings FOR UPDATE USING (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Super-Admins can manage ratings" ON public.place_ratings FOR ALL USING (public.is_super_admin())';
  END IF;
END $$;

-- =============================================================
-- FIX NOTIFICATIONS TABLE RLS
-- =============================================================
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Any logged-in user can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Super-Admins can manage all notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Super-Admins can manage all notifications"
  ON public.notifications FOR ALL
  USING (public.is_super_admin());

-- =============================================================
-- FIX EVENTS TABLE RLS
-- =============================================================
DROP POLICY IF EXISTS "Super-Admins can manage all events." ON public.events;
DROP POLICY IF EXISTS "Super-Admins can manage all events" ON public.events;

CREATE POLICY "Super-Admins can manage all events"
  ON public.events FOR ALL
  USING (public.is_super_admin());

-- =============================================================
-- DONE! All RLS policies have been reset.
-- =============================================================
SELECT 'RLS Fix Complete! All admin policies have been updated.' as status;
