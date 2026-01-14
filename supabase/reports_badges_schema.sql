-- SESSION REPORTS (Spielberichte)
-- Extends game_sessions with report data

-- Add report fields to game_sessions
ALTER TABLE public.game_sessions 
ADD COLUMN IF NOT EXISTS report_text text,
ADD COLUMN IF NOT EXISTS report_image_url text,
ADD COLUMN IF NOT EXISTS winner_id uuid REFERENCES public.profiles(id);

-- Badges system
CREATE TABLE IF NOT EXISTS public.badge_definitions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  description text,
  icon text NOT NULL, -- Lucide icon name
  color text DEFAULT 'blue',
  points_value integer DEFAULT 10,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_badges (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) NOT NULL,
  badge_id uuid REFERENCES public.badge_definitions(id) NOT NULL,
  earned_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  event_id uuid REFERENCES public.events(id), -- Optional: which event triggered it
  UNIQUE(user_id, badge_id, event_id)
);

ALTER TABLE public.badge_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view badge definitions" ON badge_definitions
FOR SELECT USING (true);

CREATE POLICY "Anyone can view user badges" ON user_badges
FOR SELECT USING (true);

CREATE POLICY "System can award badges" ON user_badges
FOR INSERT WITH CHECK (true); -- Typically handled by backend/triggers

-- Seed default badges
INSERT INTO public.badge_definitions (name, description, icon, color, points_value) VALUES
('Erklär-Bär', 'Hat oft und gut Spielregeln erklärt', 'BookOpen', 'amber', 25),
('Pünktlichkeits-König', 'Immer pünktlich bei Events', 'Clock', 'green', 15),
('Snack-Held', 'Bringt regelmäßig Snacks mit', 'Pizza', 'orange', 10),
('Fahrer-Ass', 'Bietet oft Mitfahrgelegenheiten an', 'Car', 'blue', 20),
('Pile-Crusher', 'Hat 5+ Pile of Shame Spiele endlich gespielt', 'Trophy', 'purple', 30),
('Event-Organisator', 'Hat 10+ Events erstellt', 'Calendar', 'sky', 50),
('Sammler-Legende', 'Besitzt 50+ Spiele', 'Box', 'indigo', 40)
ON CONFLICT (name) DO NOTHING;

-- Punctuality tracking
ALTER TABLE public.event_attendees
ADD COLUMN IF NOT EXISTS checked_in_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS was_punctual boolean;
