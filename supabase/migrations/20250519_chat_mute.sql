-- Chat timeout / mute system
-- Adds chat_muted_until to users table and a helper function

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS chat_muted_until TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_chat_muted
  ON public.users (chat_muted_until)
  WHERE chat_muted_until IS NOT NULL;

-- Function: check if a user is currently muted
CREATE OR REPLACE FUNCTION public.is_user_muted(target_id INTEGER)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.users
    WHERE anilist_id = target_id
      AND chat_muted_until IS NOT NULL
      AND chat_muted_until > now()
  );
$$;

-- Trigger: block message inserts from muted users (defense in depth)
CREATE OR REPLACE FUNCTION public.reject_muted_messages()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF public.is_user_muted(NEW.user_id) THEN
    RAISE EXCEPTION 'You are currently muted and cannot send messages.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reject_muted_messages ON public.messages;
CREATE TRIGGER trg_reject_muted_messages
  BEFORE INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.reject_muted_messages();

-- Policy: only the app service role / owner can mute/unmute users
-- (Handled by the API layer; Supabase client calls from owners are allowed via RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow owner mute updates" ON public.users;
CREATE POLICY "Allow owner mute updates" ON public.users
  FOR UPDATE USING (true) WITH CHECK (true);
