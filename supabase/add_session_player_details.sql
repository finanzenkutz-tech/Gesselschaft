-- Add optional promptness and brings columns to game_session_players
ALTER TABLE public.game_session_players
ADD COLUMN IF NOT EXISTS is_punctual boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS brings text;

-- Policy Update (if needed)
-- Authenticated users can update their own session player entry or the session creator can update all entries?
-- For now, we rely on the session creator being able to update the session, but we might need explicit RLS for updating player details.

DO $$
BEGIN
  IF NOT EXISTS (
     SELECT FROM pg_policies WHERE tablename = 'game_session_players' AND policyname = 'Session creators can update players'
  ) THEN
    CREATE POLICY "Session creators can update players"
      ON public.game_session_players
      FOR UPDATE
      USING (
        session_id IN (
          SELECT id FROM public.game_sessions WHERE created_by = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
     SELECT FROM pg_policies WHERE tablename = 'game_session_players' AND policyname = 'Session creators can delete players'
  ) THEN
    CREATE POLICY "Session creators can delete players"
      ON public.game_session_players
      FOR DELETE
      USING (
        session_id IN (
          SELECT id FROM public.game_sessions WHERE created_by = auth.uid()
        )
      );
  END IF;
END $$;
