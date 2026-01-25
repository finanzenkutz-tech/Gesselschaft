-- Group Game Wishes (Wishlist)
CREATE TABLE IF NOT EXISTS public.group_game_wishes (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    game_name text NOT NULL,
    bgg_id text,
    vote_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(group_id, game_name)
);

-- Event Game Suggestions (for Event Prep)
CREATE TABLE IF NOT EXISTS public.event_game_suggestions (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    game_name text NOT NULL,
    suggested_by uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    votes integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Update Event Participants for Time Slots
ALTER TABLE public.event_attendees
ADD COLUMN IF NOT EXISTS expected_arrival time,
ADD COLUMN IF NOT EXISTS expected_departure time;

-- Wishlist Votes (to track who voted for what)
CREATE TABLE IF NOT EXISTS public.group_game_wish_votes (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    wish_id uuid REFERENCES public.group_game_wishes(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(wish_id, user_id)
);


-- RLS
ALTER TABLE public.group_game_wishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_game_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_game_wish_votes ENABLE ROW LEVEL SECURITY;

-- Wishlist Policies
CREATE POLICY "Group members can view wishes" ON public.group_game_wishes
FOR SELECT USING (
    exists (
        select 1 from group_members
        where group_id = group_game_wishes.group_id
        and user_id = auth.uid()
    )
);

CREATE POLICY "Group members can add wishes" ON public.group_game_wishes
FOR INSERT WITH CHECK (
    exists (
        select 1 from group_members
        where group_id = group_game_wishes.group_id
        and user_id = auth.uid()
    )
    AND auth.uid() = user_id
);

CREATE POLICY "Users can manage their own wishes" ON public.group_game_wishes
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wishes" ON public.group_game_wishes
FOR DELETE USING (auth.uid() = user_id);


-- Vote Policies
CREATE POLICY "Group members can view votes" ON public.group_game_wish_votes
FOR SELECT USING (
    exists (
        select 1 from group_game_wishes w
        join group_members gm on gm.group_id = w.group_id
        where w.id = group_game_wish_votes.wish_id
        and gm.user_id = auth.uid()
    )
);

CREATE POLICY "Group members can vote" ON public.group_game_wish_votes
FOR INSERT WITH CHECK (
    exists (
        select 1 from group_game_wishes w
        join group_members gm on gm.group_id = w.group_id
        where w.id = group_game_wish_votes.wish_id
        and gm.user_id = auth.uid()
    )
);

CREATE POLICY "Users can remove their vote" ON public.group_game_wish_votes
FOR DELETE USING (auth.uid() = user_id);

-- Functions to handle vote counts
CREATE OR REPLACE FUNCTION update_wish_vote_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.group_game_wishes
        SET vote_count = vote_count + 1
        WHERE id = NEW.wish_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.group_game_wishes
        SET vote_count = vote_count - 1
        WHERE id = OLD.wish_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_wish_votes
AFTER INSERT OR DELETE ON public.group_game_wish_votes
FOR EACH ROW EXECUTE FUNCTION update_wish_vote_count();
