-- Fix RLS Recursion and missing policies for Notifications
-- Run this in Supabase SQL Editor

-- 1. Helper function for membership check to avoid recursion in group_members
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

-- 2. Update group_members policies to be non-recursive
DROP POLICY IF EXISTS "Users can view members of their groups" ON public.group_members;
CREATE POLICY "Users can view members of their groups" ON public.group_members
FOR SELECT USING (
  public.is_member_of_group(group_id) OR public.is_super_admin()
);

-- 3. Update profiles policies (cleanup recursion from previous fix)
DROP POLICY IF EXISTS "Super-Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super-Admins can delete all profiles" ON public.profiles;

CREATE POLICY "Super-Admins can manage all profiles"
  ON public.profiles
  FOR ALL
  USING ( public.is_super_admin() );

-- 4. Fix Notifications policies
-- Ensure users can see their own
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
FOR SELECT USING (auth.uid() = user_id);

-- Add INSERT policy so users can notify others (e.g. on join)
DROP POLICY IF EXISTS "Any logged-in user can create notifications" ON public.notifications;
CREATE POLICY "Any logged-in user can create notifications" ON public.notifications
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Add Super-Admin policy for notifications
DROP POLICY IF EXISTS "Super-Admins can manage all notifications" ON public.notifications;
CREATE POLICY "Super-Admins can manage all notifications" ON public.notifications
FOR ALL USING ( public.is_super_admin() );
