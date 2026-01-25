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
