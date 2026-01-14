-- Enable pgcrypto for password hashing
create extension if not exists "pgcrypto";

-- Insert 'admin@example.com' with password 'password123' into auth.users
-- We use a specific UUID (id) as the conflict target
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) values (
  '00000000-0000-0000-0000-000000000000',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', -- Fixed UUID for Admin
  'authenticated',
  'authenticated',
  'admin@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name": "Admin User"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) on conflict (id) do nothing; -- Changed to 'id' which is definitely unique

-- Insert into public.profiles
insert into public.profiles (id, email, full_name, has_seen_onboarding)
values (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'admin@example.com',
  'Admin User',
  true
) on conflict (id) do nothing;
