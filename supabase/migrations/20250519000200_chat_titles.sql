-- Chat titles + owner badge support
begin;

-- Add title columns to messages
ALTER TABLE messages
    ADD COLUMN IF NOT EXISTS title TEXT,
    ADD COLUMN IF NOT EXISTS title_color TEXT;

commit;
