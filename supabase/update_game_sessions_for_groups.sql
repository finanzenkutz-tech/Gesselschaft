-- Allow game sessions to exist without an event, but linked to a group
ALTER TABLE public.game_sessions 
ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES public.groups(id);

ALTER TABLE public.game_sessions 
ALTER COLUMN event_id DROP NOT NULL;

-- Enable RLS for group_id access
CREATE POLICY "Group members can view group sessions"
  ON public.game_sessions
  FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can create group sessions"
  ON public.game_sessions
  FOR INSERT
  WITH CHECK (
    group_id IN (
      SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
    )
  );
