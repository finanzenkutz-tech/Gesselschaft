-- Seed badges for Idea Submissions
-- We use ON CONFLICT DO NOTHING to avoid errors if run multiple times

INSERT INTO public.badge_definitions (name, description, icon, color, points_value) VALUES
('Idea Starter', 'Hat die erste Idee eingereicht', 'Lightbulb', 'blue', 50),
('Idea Machine', 'Hat 3 Ideen eingereicht', 'Zap', 'amber', 100),
('Innovator', 'Hat 10 Ideen eingereicht', 'Rocket', 'purple', 300)
ON CONFLICT (name) DO NOTHING;
