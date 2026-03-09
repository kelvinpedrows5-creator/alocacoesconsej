
-- Allow users to delete their own sent reports
CREATE POLICY "Users can delete own reports"
ON public.help_reports
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Allow leaders to delete reports targeted to them
CREATE POLICY "Leaders can delete reports targeted to them"
ON public.help_reports
FOR DELETE
TO authenticated
USING (auth.uid() = target_leader_id);
