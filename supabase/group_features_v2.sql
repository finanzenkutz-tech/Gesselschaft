-- GROUP WISHLIST
CREATE TABLE IF NOT EXISTS public.group_wishlist (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  game_name text NOT NULL,
  bgg_id text,
  image_url text,
  added_by uuid REFERENCES public.profiles(id) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.group_wishlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members can view wishlist"
  ON public.group_wishlist FOR SELECT
  USING (group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()));

CREATE POLICY "Group members can add to wishlist"
  ON public.group_wishlist FOR INSERT
  WITH CHECK (group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()));

CREATE POLICY "Owners can remove from wishlist"
  ON public.group_wishlist FOR DELETE
  USING (added_by = auth.uid() OR group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid() AND role = 'admin'));

-- WISHLIST VOTES
CREATE TABLE IF NOT EXISTS public.group_wishlist_votes (
  wishlist_id uuid REFERENCES public.group_wishlist(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) NOT NULL,
  PRIMARY KEY (wishlist_id, user_id)
);

ALTER TABLE public.group_wishlist_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members can vote"
  ON public.group_wishlist_votes FOR ALL
  USING (wishlist_id IN (SELECT id FROM public.group_wishlist WHERE group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())));

-- GROUP GOALS (Seasonal Goals)
CREATE TABLE IF NOT EXISTS public.group_goals (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  target_value integer NOT NULL,
  current_value integer DEFAULT 0,
  unit text DEFAULT 'sessions', -- 'sessions', 'hours', 'players', 'games'
  start_date timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  end_date timestamp with time zone,
  status text DEFAULT 'active', -- 'active', 'completed', 'failed'
  created_by uuid REFERENCES public.profiles(id) NOT NULL
);

ALTER TABLE public.group_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members can view goals"
  ON public.group_goals FOR SELECT
  USING (group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage goals"
  ON public.group_goals FOR ALL
  USING (group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid() AND role = 'admin'));
