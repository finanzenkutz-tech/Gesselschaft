-- Performance Optimization Indexes

-- Indexes for group_members
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);

-- Indexes for inventory
CREATE INDEX IF NOT EXISTS idx_inventory_owner_id ON public.inventory(owner_id);
CREATE INDEX IF NOT EXISTS idx_inventory_group_id ON public.inventory(group_id);

-- Indexes for events
CREATE INDEX IF NOT EXISTS idx_events_start_time ON public.events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_group_id ON public.events(group_id);

-- Indexes for event_attendees
CREATE INDEX IF NOT EXISTS idx_event_attendees_user_id ON public.event_attendees(user_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_event_id ON public.event_attendees(event_id);

-- Index for profiles points (Leaderboard)
CREATE INDEX IF NOT EXISTS idx_profiles_points ON public.profiles(points DESC);
