-- COMPREHENSIVE FIX FOR USER DELETION CASCADES (SAFE MODE)
-- This script safely checks if tables exist before attempting to modify them.

-- 1. GROUPS
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'groups') THEN
        ALTER TABLE public.groups DROP CONSTRAINT IF EXISTS groups_created_by_fkey;
        ALTER TABLE public.groups ADD CONSTRAINT groups_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. GROUP MEMBERS
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'group_members') THEN
        ALTER TABLE public.group_members DROP CONSTRAINT IF EXISTS group_members_user_id_fkey;
        ALTER TABLE public.group_members ADD CONSTRAINT group_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. EVENTS
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'events') THEN
        ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_created_by_fkey;
        ALTER TABLE public.events ADD CONSTRAINT events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4. EVENT ATTENDEES
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'event_attendees') THEN
        ALTER TABLE public.event_attendees DROP CONSTRAINT IF EXISTS event_attendees_user_id_fkey;
        ALTER TABLE public.event_attendees ADD CONSTRAINT event_attendees_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 5. EVENT MESSAGES
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'event_messages') THEN
        ALTER TABLE public.event_messages DROP CONSTRAINT IF EXISTS event_messages_user_id_fkey;
        ALTER TABLE public.event_messages ADD CONSTRAINT event_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 6. INVENTORY
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'inventory') THEN
        ALTER TABLE public.inventory DROP CONSTRAINT IF EXISTS inventory_owner_id_fkey;
        ALTER TABLE public.inventory ADD CONSTRAINT inventory_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 7. MARKETPLACE LISTINGS
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'marketplace_listings') THEN
        ALTER TABLE public.marketplace_listings DROP CONSTRAINT IF EXISTS marketplace_listings_seller_id_fkey;
        ALTER TABLE public.marketplace_listings ADD CONSTRAINT marketplace_listings_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 8. MARKETPLACE REPORTS
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'marketplace_reports') THEN
        ALTER TABLE public.marketplace_reports DROP CONSTRAINT IF EXISTS marketplace_reports_reporter_id_fkey;
        ALTER TABLE public.marketplace_reports ADD CONSTRAINT marketplace_reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 9. FEATURE REQUESTS
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'feature_requests') THEN
        ALTER TABLE public.feature_requests DROP CONSTRAINT IF EXISTS feature_requests_created_by_fkey;
        ALTER TABLE public.feature_requests ADD CONSTRAINT feature_requests_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 10. POLLS
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'event_polls') THEN
        ALTER TABLE public.event_polls DROP CONSTRAINT IF EXISTS event_polls_created_by_fkey;
        ALTER TABLE public.event_polls ADD CONSTRAINT event_polls_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 11. POLL VOTES
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'poll_votes') THEN
        ALTER TABLE public.poll_votes DROP CONSTRAINT IF EXISTS poll_votes_user_id_fkey;
        ALTER TABLE public.poll_votes ADD CONSTRAINT poll_votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 12. CHALLENGES
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'challenges') THEN
        ALTER TABLE public.challenges DROP CONSTRAINT IF EXISTS challenges_challenger_id_fkey;
        ALTER TABLE public.challenges ADD CONSTRAINT challenges_challenger_id_fkey FOREIGN KEY (challenger_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
        
        ALTER TABLE public.challenges DROP CONSTRAINT IF EXISTS challenges_challenged_id_fkey;
        ALTER TABLE public.challenges ADD CONSTRAINT challenges_challenged_id_fkey FOREIGN KEY (challenged_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
        
        ALTER TABLE public.challenges DROP CONSTRAINT IF EXISTS challenges_winner_id_fkey;
        ALTER TABLE public.challenges ADD CONSTRAINT challenges_winner_id_fkey FOREIGN KEY (winner_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 13. GAME SESSIONS
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'game_sessions') THEN
        ALTER TABLE public.game_sessions DROP CONSTRAINT IF EXISTS game_sessions_created_by_fkey;
        ALTER TABLE public.game_sessions ADD CONSTRAINT game_sessions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 14. GAME SESSION PLAYERS
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'game_session_players') THEN
        ALTER TABLE public.game_session_players DROP CONSTRAINT IF EXISTS game_session_players_user_id_fkey;
        ALTER TABLE public.game_session_players ADD CONSTRAINT game_session_players_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;
