CREATE POLICY "Users can insert own GT membership"
ON public.gt_members
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);