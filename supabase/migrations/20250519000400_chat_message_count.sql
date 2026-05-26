-- Track lifetime chat message count per user for progression-based titles.
-- Counts ALL messages ever sent (including soft-deleted) to prevent gaming
-- via self-deletion.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS chat_message_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_users_chat_message_count
  ON public.users (chat_message_count DESC);

-- Backfill from existing messages table (one-time on apply)
UPDATE public.users u
SET chat_message_count = sub.cnt
FROM (
  SELECT user_id, COUNT(*)::int AS cnt
  FROM public.messages
  GROUP BY user_id
) sub
WHERE u.anilist_id = sub.user_id;

-- Trigger: increment counter whenever a user sends a new message.
CREATE OR REPLACE FUNCTION public.increment_chat_message_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.users
     SET chat_message_count = chat_message_count + 1
   WHERE anilist_id = NEW.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_increment_chat_message_count ON public.messages;
CREATE TRIGGER trg_increment_chat_message_count
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_chat_message_count();
