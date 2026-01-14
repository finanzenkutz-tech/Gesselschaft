-- Fix inventory RLS policies
-- Run this in Supabase SQL Editor

-- Allow users to view all inventory items (with visibility rules)
create policy "Users can view inventory based on visibility"
  on public.inventory for select
  using (
    visibility = 'profile'
    OR owner_id = auth.uid()
    OR (
      visibility = 'groups' AND (
        -- User is in the same group as the game
        group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
        -- Or user is in any group with the owner
        OR owner_id IN (
          SELECT gm2.user_id FROM group_members gm1
          JOIN group_members gm2 ON gm1.group_id = gm2.group_id
          WHERE gm1.user_id = auth.uid()
        )
      )
    )
    OR (
      visibility = 'buddies' AND (
        -- Check if they are buddies (you'd need a buddies table)
        owner_id IN (SELECT buddy_id FROM buddies WHERE user_id = auth.uid() AND status = 'accepted')
        OR owner_id IN (SELECT user_id FROM buddies WHERE buddy_id = auth.uid() AND status = 'accepted')
      )
    )
  );

-- Allow authenticated users to insert their own inventory items  
create policy "Users can insert their own inventory"
  on public.inventory for insert
  with check ( auth.uid() = owner_id );

-- Allow users to update their own inventory items
create policy "Users can update their own inventory"
  on public.inventory for update
  using ( auth.uid() = owner_id );

-- Allow users to delete their own inventory items
create policy "Users can delete their own inventory"
  on public.inventory for delete
  using ( auth.uid() = owner_id );
