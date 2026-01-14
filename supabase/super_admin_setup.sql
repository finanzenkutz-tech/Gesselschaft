-- 1. Spalte für system_role hinzufügen (standardmäßig 'user')
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS system_role text DEFAULT 'user';

-- 2. Hilfsfunktion zur Prüfung des Super-Admin-Status
-- (Wichtig für RLS und Backend-Checks)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT system_role = 'super_admin'
    FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RLS Policies anpassen

-- PROFILES: Super-Admin darf alles (sehen, aktualisieren, löschen)
CREATE POLICY "Super-Admins can manage all profiles."
  ON public.profiles
  FOR ALL
  USING ( public.is_super_admin() )
  WITH CHECK ( public.is_super_admin() );

-- GROUPS: Super-Admin darf alles (sehen, aktualisieren, löschen)
CREATE POLICY "Super-Admins can manage all groups."
  ON public.groups
  FOR ALL
  USING ( public.is_super_admin() )
  WITH CHECK ( public.is_super_admin() );

-- GROUP MEMBERS: Super-Admin darf alles
CREATE POLICY "Super-Admins can manage all group members."
  ON public.group_members
  FOR ALL
  USING ( public.is_super_admin() )
  WITH CHECK ( public.is_super_admin() );

-- EVENTS: Super-Admin darf alles
CREATE POLICY "Super-Admins can manage all events."
  ON public.events
  FOR ALL
  USING ( public.is_super_admin() )
  WITH CHECK ( public.is_super_admin() );

-- EVENT ATTENDEES: Super-Admin darf alles
CREATE POLICY "Super-Admins can manage all event attendees."
  ON public.event_attendees
  FOR ALL
  USING ( public.is_super_admin() )
  WITH CHECK ( public.is_super_admin() );

-- INVENTORY: Super-Admin darf alles
CREATE POLICY "Super-Admins can manage all inventory items."
  ON public.inventory
  FOR ALL
  USING ( public.is_super_admin() )
  WITH CHECK ( public.is_super_admin() );

-- 4. Setze einen initialen Super-Admin (Optional: Ersetze UUID mit deiner ID)
-- UPDATE public.profiles SET system_role = 'super_admin' WHERE email = 'deine-email@beispiel.de';
