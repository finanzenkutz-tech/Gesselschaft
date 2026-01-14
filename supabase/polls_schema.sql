-- EVENT POLLS (Termin-Umfragen / Doodle-Stil)

-- Poll table
CREATE TABLE IF NOT EXISTS public.event_polls (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  created_by uuid REFERENCES public.profiles(id) NOT NULL,
  status text DEFAULT 'open' CHECK (status IN ('open', 'closed', 'decided')),
  decided_date timestamp with time zone, -- The winning date once decided
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.event_polls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Polls are viewable by group members" ON event_polls
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = event_polls.group_id
    AND group_members.user_id = auth.uid()
  )
);

CREATE POLICY "Group members can create polls" ON event_polls
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = event_polls.group_id
    AND group_members.user_id = auth.uid()
  )
);

CREATE POLICY "Poll creator can update" ON event_polls
FOR UPDATE USING (created_by = auth.uid());

-- Poll date options
CREATE TABLE IF NOT EXISTS public.poll_options (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  poll_id uuid REFERENCES public.event_polls(id) ON DELETE CASCADE NOT NULL,
  date_option timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Options viewable by poll viewers" ON poll_options
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM event_polls ep
    JOIN group_members gm ON gm.group_id = ep.group_id
    WHERE ep.id = poll_options.poll_id AND gm.user_id = auth.uid()
  )
);

CREATE POLICY "Poll creator can add options" ON poll_options
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM event_polls ep
    WHERE ep.id = poll_options.poll_id AND ep.created_by = auth.uid()
  )
);

-- Poll votes
CREATE TABLE IF NOT EXISTS public.poll_votes (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  option_id uuid REFERENCES public.poll_options(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) NOT NULL,
  vote_type text DEFAULT 'yes' CHECK (vote_type IN ('yes', 'maybe', 'no')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(option_id, user_id)
);

ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Votes viewable by poll viewers" ON poll_votes
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM poll_options po
    JOIN event_polls ep ON ep.id = po.poll_id
    JOIN group_members gm ON gm.group_id = ep.group_id
    WHERE po.id = poll_votes.option_id AND gm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can vote" ON poll_votes
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can change own vote" ON poll_votes
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own vote" ON poll_votes
FOR DELETE USING (user_id = auth.uid());
