-- Fix Infinite Recursion for Super-Admins on Profiles table
-- Run this in Supabase SQL Editor

-- 1. Ensure is_super_admin function is robust and bypasses RLS correctly
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean AS $$
DECLARE
  is_admin boolean;
BEGIN
  -- We use a subquery that bypasses RLS because the function is SECURITY DEFINER
  -- and it's owned by a superuser (postgres).
  SELECT (system_role = 'super_admin') INTO is_admin
  FROM public.profiles
  WHERE id = auth.uid();
  
  RETURN coalesce(is_admin, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Drop the recursive policy on profiles
DROP POLICY IF EXISTS "Super-Admins can manage all profiles." ON public.profiles;

-- 3. Create a non-recursive policy for Profiles management
-- Instead of FOR ALL with a recursive check, we split it.
-- SELECT is already covered by "Public profiles are viewable by everyone."

CREATE POLICY "Super-Admins can update all profiles"
  ON public.profiles
  FOR UPDATE
  USING ( (SELECT system_role FROM public.profiles WHERE id = auth.uid()) = 'super_admin' );

CREATE POLICY "Super-Admins can delete all profiles"
  ON public.profiles
  FOR DELETE
  USING ( (SELECT system_role FROM public.profiles WHERE id = auth.uid()) = 'super_admin' );

-- Note: The subquery (SELECT system_role ...) in USING usually avoids 
-- some types of recursion better than a function call in some Postgres versions,
-- but the main fix is the SECURITY DEFINER function for other tables.

-- 4. Fix group_members policies to ensure system admins can always see everything
DROP POLICY IF EXISTS "Super-Admins can manage all group members." ON public.group_members;
CREATE POLICY "Super-Admins can manage all group members"
  ON public.group_members
  FOR ALL
  USING ( public.is_super_admin() );

-- 5. Fix groups policies
DROP POLICY IF EXISTS "Super-Admins can manage all groups." ON public.groups;
CREATE POLICY "Super-Admins can manage all groups"
  ON public.groups
  FOR ALL
  USING ( public.is_super_admin() );
