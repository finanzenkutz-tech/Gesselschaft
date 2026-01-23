-- Add ON DELETE CASCADE to group dependencies

-- 1. GROUP MEMBERS
ALTER TABLE public.group_members
DROP CONSTRAINT IF EXISTS group_members_group_id_fkey,
ADD CONSTRAINT group_members_group_id_fkey
FOREIGN KEY (group_id)
REFERENCES public.groups(id)
ON DELETE CASCADE;

-- 2. EVENTS
ALTER TABLE public.events
DROP CONSTRAINT IF EXISTS events_group_id_fkey,
ADD CONSTRAINT events_group_id_fkey
FOREIGN KEY (group_id)
REFERENCES public.groups(id)
ON DELETE CASCADE;

-- 3. INVENTORY (optional but recommended if group-tied)
ALTER TABLE public.inventory
DROP CONSTRAINT IF EXISTS inventory_group_id_fkey,
ADD CONSTRAINT inventory_group_id_fkey
FOREIGN KEY (group_id)
REFERENCES public.groups(id)
ON DELETE SET NULL; -- Keep the game, but remove group association

-- 4. EVENT ATTENDEES (on event deletion)
ALTER TABLE public.event_attendees
DROP CONSTRAINT IF EXISTS event_attendees_event_id_fkey,
ADD CONSTRAINT event_attendees_event_id_fkey
FOREIGN KEY (event_id)
REFERENCES public.events(id)
ON DELETE CASCADE;

-- 5. EVENT MESSAGES
ALTER TABLE public.event_messages
DROP CONSTRAINT IF EXISTS event_messages_event_id_fkey,
ADD CONSTRAINT event_messages_event_id_fkey
FOREIGN KEY (event_id)
REFERENCES public.events(id)
ON DELETE CASCADE;

-- 6. CARPOOLING
ALTER TABLE public.carpooling
DROP CONSTRAINT IF EXISTS carpooling_event_id_fkey,
ADD CONSTRAINT carpooling_event_id_fkey
FOREIGN KEY (event_id)
REFERENCES public.events(id)
ON DELETE CASCADE;

-- 7. CARPOOL PASSENGERS
ALTER TABLE public.carpool_passengers
DROP CONSTRAINT IF EXISTS carpool_passengers_carpool_id_fkey,
ADD CONSTRAINT carpool_passengers_carpool_id_fkey
FOREIGN KEY (carpool_id)
REFERENCES public.carpooling(id)
ON DELETE CASCADE;
