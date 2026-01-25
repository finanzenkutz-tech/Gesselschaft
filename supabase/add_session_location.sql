-- Add optional location column to game_sessions for standalone plays
ALTER TABLE public.game_sessions 
ADD COLUMN IF NOT EXISTS location text;

-- Add policies for game_sessions update if they don't exist
-- We already have policies for INSERT and SELECT, let's ensure UPDATE is allowed for creator as well,
-- which might be needed if they edit the session details later.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'game_sessions' AND policyname = 'Creators can update game sessions'
  ) THEN
    CREATE POLICY "Creators can update game sessions" ON game_sessions FOR UPDATE USING ( created_by = auth.uid() );
  END IF;
END $$;
