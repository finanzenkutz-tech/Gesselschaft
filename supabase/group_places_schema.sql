-- GROUP PLACES (Orte)
CREATE TABLE IF NOT EXISTS public.group_places (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  address text,
  services text, -- e.g. "Getränke, Snacks, WLAN"
  created_by uuid REFERENCES public.profiles(id) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.group_places ENABLE ROW LEVEL SECURITY;

-- Anyone can view group places
CREATE POLICY "Group places are viewable by everyone" ON group_places
FOR SELECT USING (true);

-- Group members can add places
CREATE POLICY "Group members can add places" ON group_places
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_members.group_id = group_places.group_id 
    AND group_members.user_id = auth.uid()
  )
);

-- Admins or the creator can delete/update
CREATE POLICY "Admins or creator can update/delete places" ON group_places
FOR ALL USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_members.group_id = group_places.group_id 
    AND group_members.user_id = auth.uid()
    AND group_members.role = 'admin'
  )
);

-- MISSING GROUP MEMBER POLICYS
CREATE POLICY "Users can join groups" ON group_members
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members can view other members" ON group_members
FOR SELECT USING (true);

CREATE POLICY "Users can leave groups" ON group_members
FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage members" ON group_members
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM group_members AS members
    WHERE members.group_id = group_members.group_id 
    AND members.user_id = auth.uid()
    AND members.role = 'admin'
  )
);
