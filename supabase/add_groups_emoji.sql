-- Add emoji column to groups table
-- This column stores the group's emoji icon

ALTER TABLE groups 
ADD COLUMN IF NOT EXISTS emoji TEXT DEFAULT '🎲';

-- Update any existing groups that have null emoji
UPDATE groups SET emoji = '🎲' WHERE emoji IS NULL;

COMMENT ON COLUMN groups.emoji IS 'Emoji icon representing the group';
