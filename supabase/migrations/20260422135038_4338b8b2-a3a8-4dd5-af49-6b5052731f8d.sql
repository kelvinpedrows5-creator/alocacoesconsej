-- 1. PROFILES: Drop and recreate SELECT policies as PERMISSIVE
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Helper function: check if user holds a leadership position (director or manager)
CREATE OR REPLACE FUNCTION public.is_leader(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.leadership_positions
    WHERE user_id = _user_id
  )
$$;

-- Helper function: check if user is in the same GT (client) for any cycle
CREATE OR REPLACE FUNCTION public.is_gt_member_of_client(_user_id uuid, _client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.gt_members
    WHERE user_id = _user_id
      AND client_id = _client_id
  )
$$;

-- 2. GT_HANDOFF_SURVEYS: restrict SELECT
DROP POLICY IF EXISTS "All authenticated users can view handoff surveys" ON public.gt_handoff_surveys;
DROP POLICY IF EXISTS "Authenticated users can view handoff surveys" ON public.gt_handoff_surveys;

CREATE POLICY "Survey authors can view their own surveys"
ON public.gt_handoff_surveys
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all surveys"
ON public.gt_handoff_surveys
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Leaders can view all surveys"
ON public.gt_handoff_surveys
FOR SELECT
TO authenticated
USING (public.is_leader(auth.uid()));

CREATE POLICY "GT members can view surveys for their clients"
ON public.gt_handoff_surveys
FOR SELECT
TO authenticated
USING (public.is_gt_member_of_client(auth.uid(), client_id));

-- 3. GT_MEMBERS: tighten insert policy
DROP POLICY IF EXISTS "Users can insert own GT membership" ON public.gt_members;
DROP POLICY IF EXISTS "Users can insert their own GT membership" ON public.gt_members;

-- Admins can insert any GT membership
CREATE POLICY "Admins can insert GT memberships"
ON public.gt_members
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Leaders can insert any GT membership
CREATE POLICY "Leaders can insert GT memberships"
ON public.gt_members
FOR INSERT
TO authenticated
WITH CHECK (public.is_leader(auth.uid()));

-- Users can self-insert ONLY if they have no membership in that cycle yet (onboarding)
CREATE POLICY "Users can self-insert during onboarding"
ON public.gt_members
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND NOT EXISTS (
    SELECT 1 FROM public.gt_members existing
    WHERE existing.user_id = auth.uid()
      AND existing.cycle_id = gt_members.cycle_id
  )
);

-- 4. CONTRACTS BUCKET: make private
UPDATE storage.buckets SET public = false WHERE id = 'contracts';

-- Drop existing broad SELECT policies on contracts
DROP POLICY IF EXISTS "Authenticated users can view contracts" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view contracts" ON storage.objects;
DROP POLICY IF EXISTS "Public can view contracts" ON storage.objects;

-- Admins can read all contracts
CREATE POLICY "Admins can read contracts"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'contracts'
  AND public.has_role(auth.uid(), 'admin')
);

-- GT members can read contracts of their clients
-- File path convention: <client_id>/<filename>
CREATE POLICY "GT members can read their client contracts"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'contracts'
  AND public.is_gt_member_of_client(
    auth.uid(),
    ((storage.foldername(name))[1])::uuid
  )
);

-- Leaders can read all contracts
CREATE POLICY "Leaders can read contracts"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'contracts'
  AND public.is_leader(auth.uid())
);