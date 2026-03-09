
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_demand_style text,
  ADD COLUMN IF NOT EXISTS profile_availability_times text,
  ADD COLUMN IF NOT EXISTS profile_scope_affinity text,
  ADD COLUMN IF NOT EXISTS profile_scope_dislikes text,
  ADD COLUMN IF NOT EXISTS profile_availability_shift text,
  ADD COLUMN IF NOT EXISTS profile_coworker_issue text,
  ADD COLUMN IF NOT EXISTS profile_coworker_issue_details text;
