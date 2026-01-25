alter table profiles 
add column if not exists guest_preferences jsonb default '{}'::jsonb;

-- Optional: Add hosting specific preferences too if not covered by place description
alter table profiles 
add column if not exists hosting_preferences jsonb default '{}'::jsonb;
