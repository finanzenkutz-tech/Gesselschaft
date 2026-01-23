alter table inventory 
add column if not exists min_players int,
add column if not exists max_players int,
add column if not exists playtime int,
add column if not exists strategy_score numeric(3, 1),
add column if not exists luck_score numeric(3, 1);
