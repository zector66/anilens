-- OG title unlock tracking
-- Stores when a user first qualified for the OG title (before July 1, 2026)
-- Once set, it persists forever — even if user clears browser storage
begin;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS og_unlocked_at TIMESTAMPTZ;

-- Index for fast "do I have OG?" lookups
CREATE INDEX IF NOT EXISTS idx_users_og_unlocked
    ON users(og_unlocked_at)
    WHERE og_unlocked_at IS NOT NULL;

commit;
