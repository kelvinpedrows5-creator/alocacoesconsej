
-- Table for member demand submissions
CREATE TABLE public.demand_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table for helpers on each submission
CREATE TABLE public.demand_submission_helpers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.demand_submissions(id) ON DELETE CASCADE,
  helper_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.demand_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demand_submission_helpers ENABLE ROW LEVEL SECURITY;

-- RLS for demand_submissions
CREATE POLICY "Users can insert their own submissions" ON public.demand_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own submissions" ON public.demand_submissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Demandas managers can view all submissions" ON public.demand_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM leadership_positions
      WHERE leadership_positions.user_id = auth.uid()
        AND leadership_positions.directorate_id = 'dir-1'
        AND leadership_positions.position_type = 'manager'
    )
  );

CREATE POLICY "Admins can view all submissions" ON public.demand_submissions
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Demandas managers can update submissions" ON public.demand_submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM leadership_positions
      WHERE leadership_positions.user_id = auth.uid()
        AND leadership_positions.directorate_id = 'dir-1'
        AND leadership_positions.position_type = 'manager'
    )
  );

CREATE POLICY "Admins can update submissions" ON public.demand_submissions
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete submissions" ON public.demand_submissions
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS for demand_submission_helpers
CREATE POLICY "Users can insert helpers for own submissions" ON public.demand_submission_helpers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM demand_submissions
      WHERE demand_submissions.id = submission_id
        AND demand_submissions.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated can view helpers" ON public.demand_submission_helpers
  FOR SELECT USING (true);

CREATE POLICY "Admins can delete helpers" ON public.demand_submission_helpers
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Updated_at trigger
CREATE TRIGGER handle_demand_submissions_updated_at
  BEFORE UPDATE ON public.demand_submissions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
