
-- Allow members to update their own reports (to mark member_seen)
CREATE POLICY "Users can update own reports member_seen"
ON public.help_reports
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Trigger to set member_seen = false when leader comments or resolves
CREATE OR REPLACE FUNCTION public.handle_help_report_leader_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF (OLD.leader_comment IS DISTINCT FROM NEW.leader_comment) OR (OLD.status IS DISTINCT FROM NEW.status) THEN
    NEW.member_seen = false;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_help_report_leader_update
  BEFORE UPDATE ON public.help_reports
  FOR EACH ROW
  WHEN (OLD.target_leader_id = NEW.target_leader_id)
  EXECUTE FUNCTION public.handle_help_report_leader_update();
