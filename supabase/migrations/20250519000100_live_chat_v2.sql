-- Live Chat v2: Moderation + soft delete
-- Run this AFTER the initial 20250519_live_chat.sql migration

begin;

-- Add soft-delete and moderation columns
ALTER TABLE messages
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS deleted_by BIGINT,
    ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN NOT NULL DEFAULT false;

-- Enable full row replication for realtime UPDATE broadcasts
-- Without this, Supabase Realtime only sends PK + changed columns on UPDATE,
-- so subscribers never see deleted_at changes.
DO $$
BEGIN
    ALTER TABLE public.messages REPLICA IDENTITY FULL;
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- Partial index: only fetch non-deleted messages efficiently
CREATE INDEX IF NOT EXISTS idx_messages_room_active
    ON messages(room_id, created_at DESC)
    WHERE deleted_at IS NULL;

-- Slur filter: blocks messages containing prohibited language on insert.
-- Customize the word list as needed.
CREATE OR REPLACE FUNCTION reject_slurs()
RETURNS TRIGGER AS $$
DECLARE
    lower_content TEXT;
BEGIN
    lower_content := lower(NEW.content);
    -- PostgreSQL \m = start of word, \M = end of word
    IF lower_content ~ '\m(nigger|nigga|faggot|fag|chink|kike|wetback|retard)\M' THEN
        RAISE EXCEPTION 'Message blocked: contains prohibited language';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reject_slurs ON messages;
CREATE TRIGGER trg_reject_slurs
    BEFORE INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION reject_slurs();

commit;
