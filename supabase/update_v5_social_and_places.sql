-- 1. Inventory: Kategorie-Spalte sicherstellen (Fix für "Could not find column")
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS category text;

-- 2. Gruppen: Postleitzahl hinzufügen
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS zip_code text;

-- 3. Orte: Sternebewertung (1-5 Sterne)
CREATE TABLE IF NOT EXISTS public.place_ratings (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  place_id uuid REFERENCES public.group_places(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rating int CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  unique(place_id, user_id)
);

ALTER TABLE public.place_ratings ENABLE ROW LEVEL SECURITY;

-- Jeder kann Bewertungen sehen
CREATE POLICY "Ratings viewable by everyone" ON place_ratings
FOR SELECT USING (true);

-- Mitglieder können bewerten
CREATE POLICY "Members can rate places" ON place_ratings
FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM group_places 
    JOIN group_members ON group_members.group_id = group_places.group_id
    WHERE group_places.id = place_ratings.place_id 
    AND group_members.user_id = auth.uid()
  )
);

-- Eigene Bewertung löschen/ändern
CREATE POLICY "Users can manage own ratings" ON place_ratings
FOR ALL USING (auth.uid() = user_id);
