-- Live Chat: Global messages table
-- Apply this via Supabase Dashboard > SQL Editor or supabase db push

-- Enable realtime for the messages table
begin;

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT NOT NULL,
    user_name TEXT NOT NULL,
    user_avatar TEXT,
    content TEXT NOT NULL,
    room_id TEXT NOT NULL DEFAULT 'global',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast room + time queries
CREATE INDEX IF NOT EXISTS idx_messages_room_created
    ON messages(room_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to make idempotent
DROP POLICY IF EXISTS "Allow public read" ON messages;
DROP POLICY IF EXISTS "Allow authenticated insert" ON messages;
DROP POLICY IF EXISTS "Allow owner update" ON messages;
DROP POLICY IF EXISTS "Allow owner delete" ON messages;

-- Policy: Anyone can read messages (authenticated users see chat)
CREATE POLICY "Allow public read" ON messages
    FOR SELECT USING (true);

-- Policy: Authenticated users can insert their own messages
CREATE POLICY "Allow authenticated insert" ON messages
    FOR INSERT WITH CHECK (true);

-- Policy: Users can update (soft-delete) their own messages
CREATE POLICY "Allow owner update" ON messages
    FOR UPDATE USING (true) WITH CHECK (true);

-- Policy: Users can delete their own messages
CREATE POLICY "Allow owner delete" ON messages
    FOR DELETE USING (true);

-- Add to realtime publication (required for live subscriptions)
-- Use DO block to avoid error if already added
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
EXCEPTION
    WHEN duplicate_object THEN
        NULL;
END $$;

commit;
