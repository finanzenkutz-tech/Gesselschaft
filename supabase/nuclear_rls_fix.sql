-- =============================================================
-- NUCLEAR RLS FIX - Temporarily disables RLS on problematic tables
-- Run this in Supabase SQL Editor
-- =============================================================

-- Disable RLS on group_members (allows joining)
ALTER TABLE public.group_members DISABLE ROW LEVEL SECURITY;

-- Disable RLS on place_ratings (allows rating)
ALTER TABLE public.place_ratings DISABLE ROW LEVEL SECURITY;

-- Disable RLS on groups (allows location updates)
-- Note: We keep select policies so groups are still visible
-- ALTER TABLE public.groups DISABLE ROW LEVEL SECURITY;

-- Disable RLS on notifications (allows creating notifications for others)
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- Check current RLS status
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('group_members', 'place_ratings', 'groups', 'notifications');
