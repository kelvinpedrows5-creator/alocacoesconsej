ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS joined_at date,
  ADD COLUMN IF NOT EXISTS past_coordinations text[] NOT NULL DEFAULT '{}'::text[];