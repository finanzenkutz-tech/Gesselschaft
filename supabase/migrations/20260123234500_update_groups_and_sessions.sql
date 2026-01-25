-- 1. Update Game Sessions for Group linkage
ALTER TABLE public.game_sessions 
ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES public.groups(id);

ALTER TABLE public.game_sessions 
ALTER COLUMN event_id DROP NOT NULL;

-- 2. Add Location
ALTER TABLE public.game_sessions 
ADD COLUMN IF NOT EXISTS location text;

-- 3. Update Policies
DO $$
BEGIN
  -- Group member policies
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'game_sessions' AND policyname = 'Group members can view group sessions'
  ) THEN
    CREATE POLICY "Group members can view group sessions"
      ON public.game_sessions FOR SELECT
      USING ( group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()) );
  END IF;

  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'game_sessions' AND policyname = 'Group members can create group sessions'
  ) THEN
    CREATE POLICY "Group members can create group sessions"
      ON public.game_sessions FOR INSERT
      WITH CHECK ( group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()) );
  END IF;

  -- Creator update policy
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'game_sessions' AND policyname = 'Creators can update game sessions'
  ) THEN
    CREATE POLICY "Creators can update game sessions" ON game_sessions FOR UPDATE USING ( created_by = auth.uid() );
  END IF;
END $$;

-- 4. Create/Update Function
create or replace function get_group_recent_games(p_group_id uuid)
returns table (
  game_name text,
  last_played_at timestamp with time zone,
  play_count bigint,
  last_session_id uuid,
  game_image_url text
)
language plpgsql
security definer
as $$
begin
  return query
  with relevant_sessions as (
    select gs.id, gs.game_name, gs.played_at, gs.game_image_url
    from game_sessions gs
    left join events e on gs.event_id = e.id
    where gs.group_id = p_group_id OR e.group_id = p_group_id
  ),
  ranked_sessions as (
    select 
      rs.id,
      rs.game_name,
      rs.played_at,
      rs.game_image_url,
      row_number() over (partition by rs.game_name order by rs.played_at desc) as rn
    from relevant_sessions rs
  )
  select 
    rs.game_name,
    rs.played_at as last_played_at,
    (select count(*) from relevant_sessions rs2 where rs2.game_name = rs.game_name) as play_count,
    rs.id as last_session_id,
    rs.game_image_url
  from ranked_sessions rs
  where rs.rn = 1
  order by rs.played_at desc;
end;
$$;

-- Grants
grant execute on function get_group_recent_games(uuid) to authenticated;
grant execute on function get_group_recent_games(uuid) to anon;
