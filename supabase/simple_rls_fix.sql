-- =============================================================
-- SIMPLE RLS FIX - Run this in Supabase SQL Editor
-- =============================================================

-- 1. Drop all problematic policies on place_ratings
DROP POLICY IF EXISTS "Ratings viewable by everyone" ON public.place_ratings;
DROP POLICY IF EXISTS "Members can rate places" ON public.place_ratings;
DROP POLICY IF EXISTS "Users can manage own ratings" ON public.place_ratings;
DROP POLICY IF EXISTS "Anyone can view ratings" ON public.place_ratings;
DROP POLICY IF EXISTS "Authenticated users can rate" ON public.place_ratings;
DROP POLICY IF EXISTS "Users can update own ratings" ON public.place_ratings;
DROP POLICY IF EXISTS "Super-Admins can manage ratings" ON public.place_ratings;

-- 2. Create simple, non-recursive policies for place_ratings
CREATE POLICY "place_ratings_select" ON public.place_ratings FOR SELECT USING (true);
CREATE POLICY "place_ratings_insert" ON public.place_ratings FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "place_ratings_update" ON public.place_ratings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "place_ratings_delete" ON public.place_ratings FOR DELETE USING (auth.uid() = user_id);

-- 3. Drop all problematic policies on group_members
DROP POLICY IF EXISTS "Anyone can view group members" ON public.group_members;
DROP POLICY IF EXISTS "Authenticated users can join groups" ON public.group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON public.group_members;
DROP POLICY IF EXISTS "Super-Admins can manage all group members" ON public.group_members;
DROP POLICY IF EXISTS "Super-Admins can manage all group members." ON public.group_members;
DROP POLICY IF EXISTS "Users can view members of their groups" ON public.group_members;
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;

-- 4. Create simple policies for group_members
CREATE POLICY "gm_select" ON public.group_members FOR SELECT USING (true);
CREATE POLICY "gm_insert" ON public.group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "gm_delete" ON public.group_members FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "gm_update" ON public.group_members FOR UPDATE USING (auth.uid() = user_id);

-- 5. Fix groups update policy
DROP POLICY IF EXISTS "Group admins can update their groups" ON public.groups;
DROP POLICY IF EXISTS "Super-Admins can manage all groups" ON public.groups;
DROP POLICY IF EXISTS "Super-Admins can manage all groups." ON public.groups;

CREATE POLICY "groups_update" ON public.groups FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "groups_delete" ON public.groups FOR DELETE USING (auth.uid() = created_by);

-- 6. Fix notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Super-Admins can manage all notifications" ON public.notifications;

CREATE POLICY "notif_select" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notif_insert" ON public.notifications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "notif_update" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

SELECT 'Done! Simple RLS policies applied.' as status;
