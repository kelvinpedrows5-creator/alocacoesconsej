
CREATE TABLE public.help_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  target_leader_id uuid NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.help_reports ENABLE ROW LEVEL SECURITY;

-- Users can insert their own reports
CREATE POLICY "Users can insert own reports"
ON public.help_reports
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can view their own reports
CREATE POLICY "Users can view own reports"
ON public.help_reports
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Leaders can view reports targeted to them
CREATE POLICY "Leaders can view reports targeted to them"
ON public.help_reports
FOR SELECT
TO authenticated
USING (auth.uid() = target_leader_id);

-- Admins can view all reports
CREATE POLICY "Admins can view all reports"
ON public.help_reports
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
