-- Allow all authenticated users to view basic profile info (for GT matching and member listing)
CREATE POLICY "Authenticated users can view all profiles"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);
