-- Create an example group "Brettspiel Paderborn"
-- This requires an admin user to exist first (run seed_admin.sql first)

insert into public.groups (id, name, description, created_by)
values (
  'b1234567-89ab-cdef-0123-456789abcdef', -- Fixed UUID for example group
  'Brettspiel Paderborn',
  'Die größte Brettspiel-Community in Paderborn! Wir treffen uns regelmäßig zum Spielen und haben immer Spaß dabei. Neue Mitglieder sind herzlich willkommen!',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' -- Admin User UUID
) on conflict (id) do nothing;

-- Add admin as group admin
insert into public.group_members (group_id, user_id, role)
values (
  'b1234567-89ab-cdef-0123-456789abcdef',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'admin'
) on conflict (group_id, user_id) do nothing;

-- Create an example event for this group
insert into public.events (id, group_id, title, description, start_time, end_time, location, created_by)
values (
  'e1234567-89ab-cdef-0123-456789abcdef',
  'b1234567-89ab-cdef-0123-456789abcdef',
  'Großer Spieleabend - Catan & Co',
  'Wir spielen die Klassiker! Bringt eure Lieblingsspiele mit. Snacks und Getränke werden gestellt.',
  '2026-01-20 19:00:00+01',
  '2026-01-20 23:00:00+01',
  'Gemeinschaftshaus Paderborn, Musterstraße 42',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
) on conflict (id) do nothing;

-- Admin attends the event
insert into public.event_attendees (event_id, user_id, status)
values (
  'e1234567-89ab-cdef-0123-456789abcdef',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'going'
) on conflict (event_id, user_id) do nothing;

-- Create an example feature request
insert into public.feature_requests (id, title, description, votes, created_by)
values (
  'f1234567-89ab-cdef-0123-456789abcdef',
  'BoardGameGeek Import',
  'Ich möchte meine Spielesammlung direkt von BGG importieren können, ohne alles manuell einzutragen.',
  5,
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
) on conflict (id) do nothing;
