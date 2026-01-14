-- EVENT CONTRIBUTIONS (Mitbringliste)
CREATE TABLE IF NOT EXISTS public.event_contributions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  item_name text NOT NULL,
  user_id uuid REFERENCES public.profiles(id), -- Null means unclaimed
  status text DEFAULT 'open' NOT NULL, -- 'open', 'claimed'
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.event_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contributions are viewable by everyone" ON event_contributions
FOR SELECT USING (true);

CREATE POLICY "Attendees can add/edit contributions" ON event_contributions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM event_attendees
    WHERE event_attendees.event_id = event_contributions.event_id
    AND event_attendees.user_id = auth.uid()
  )
);
