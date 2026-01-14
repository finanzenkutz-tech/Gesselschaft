-- Group Challenges Schema
-- Adds location support to groups and challenge system between groups

-- Add location columns to groups table
ALTER TABLE IF EXISTS public.groups 
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS location_name TEXT,
ADD COLUMN IF NOT EXISTS is_location_public BOOLEAN DEFAULT true;

-- Challenge table for group vs group challenges
CREATE TABLE IF NOT EXISTS public.group_challenges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  challenger_group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  challenged_group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  message TEXT,
  proposed_date TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  response_message TEXT,
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  responded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  responded_at TIMESTAMPTZ,
  
  -- Prevent duplicate pending challenges
  CONSTRAINT unique_pending_challenge UNIQUE (challenger_group_id, challenged_group_id, status)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_challenges_challenger ON group_challenges(challenger_group_id);
CREATE INDEX IF NOT EXISTS idx_challenges_challenged ON group_challenges(challenged_group_id);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON group_challenges(status);

-- Enable RLS
ALTER TABLE public.group_challenges ENABLE ROW LEVEL SECURITY;

-- Everyone can view challenges (for groups they are members of)
CREATE POLICY "Members can view their group challenges" ON group_challenges
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_members.user_id = auth.uid() 
    AND (group_members.group_id = challenger_group_id OR group_members.group_id = challenged_group_id)
  )
);

-- Group admins can create challenges
CREATE POLICY "Group admins can create challenges" ON group_challenges
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_members.user_id = auth.uid() 
    AND group_members.group_id = challenger_group_id
    AND group_members.role = 'admin'
  )
  AND created_by = auth.uid()
);

-- Challenged group admins can update (respond to) challenges
CREATE POLICY "Challenged group admins can respond" ON group_challenges
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_members.user_id = auth.uid() 
    AND group_members.group_id = challenged_group_id
    AND group_members.role = 'admin'
  )
);

-- Challenger group admins can cancel their own challenges
CREATE POLICY "Challenger admins can cancel" ON group_challenges
FOR DELETE USING (
  status = 'pending'
  AND EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_members.user_id = auth.uid() 
    AND group_members.group_id = challenger_group_id
    AND group_members.role = 'admin'
  )
);
