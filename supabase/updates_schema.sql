-- Features Update
ALTER TABLE public.feature_requests
ADD COLUMN status text DEFAULT 'open', -- 'open', 'completed'
ADD COLUMN implemented_at timestamp with time zone;

-- Events Update for Series
ALTER TABLE public.events
ADD COLUMN is_recurring boolean DEFAULT false,
ADD COLUMN recurrence_pattern text, -- e.g. 'WEEKLY', 'BIWEEKLY'
ADD COLUMN recurrence_day_of_week int, -- 1=Monday, 7=Sunday
ADD COLUMN parent_series_id uuid references public.events(id); -- Self-reference if we want instances to point to a "master" event, or just group them.

-- Actually, for simplicity usage "Jeden Montag":
-- We can just store the pattern and let the UI/Backend generate the next instances.
-- But standard calendar implementations usually have a "recurrence rule" (RRULE).
-- Let's stick to simple columns for this specific requirement: "Every Monday 17-20".

-- We might also want a separate table for "Series" if we want to change all at once.
-- But adding columns to 'events' is easier to start.
