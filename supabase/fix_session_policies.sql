-- Improve policies for game_sessions and game_session_players
-- Allow Group Admins to also update/delete sessions in their group

-- 1. Game Sessions Policies
DROP POLICY IF EXISTS "Creators can update game sessions" ON public.game_sessions;
CREATE POLICY "Creators and group admins can update game sessions" 
  ON public.game_sessions 
  FOR UPDATE 
  USING ( 
    created_by = auth.uid() OR 
    group_id IN (
      SELECT group_id FROM public.group_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Creators can delete game sessions" ON public.game_sessions;
CREATE POLICY "Creators and group admins can delete game sessions" 
  ON public.game_sessions 
  FOR DELETE 
  USING ( 
    created_by = auth.uid() OR 
    group_id IN (
      SELECT group_id FROM public.group_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 2. Game Session Players Policies
DROP POLICY IF EXISTS "Session creators can update players" ON public.game_session_players;
CREATE POLICY "Session creators and group admins can update players"
  ON public.game_session_players
  FOR UPDATE
  USING (
    session_id IN (
      SELECT id FROM public.game_sessions 
      WHERE created_by = auth.uid() OR 
      group_id IN (
        SELECT group_id FROM public.group_members 
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
  );

DROP POLICY IF EXISTS "Session creators can delete players" ON public.game_session_players;
CREATE POLICY "Session creators and group admins can delete players"
  ON public.game_session_players
  FOR DELETE
  USING (
    session_id IN (
      SELECT id FROM public.game_sessions 
      WHERE created_by = auth.uid() OR 
      group_id IN (
        SELECT group_id FROM public.group_members 
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
  );

DROP POLICY IF EXISTS "Session creator can add players" ON public.game_session_players;
CREATE POLICY "Session creators and group admins can add players"
  ON public.game_session_players
  FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM public.game_sessions 
      WHERE created_by = auth.uid() OR 
      group_id IN (
        SELECT group_id FROM public.group_members 
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
  );
