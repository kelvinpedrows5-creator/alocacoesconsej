
-- Leaders can update reports targeted to them (to mark as read)
CREATE POLICY "Leaders can update reports targeted to them"
ON public.help_reports
FOR UPDATE
TO authenticated
USING (auth.uid() = target_leader_id)
WITH CHECK (auth.uid() = target_leader_id);
