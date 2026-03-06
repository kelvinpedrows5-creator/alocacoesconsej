
-- Activities table for demand control
CREATE TABLE public.activities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending',
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Activity scores for members
CREATE TABLE public.activity_scores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_id uuid NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  execution_score integer NOT NULL DEFAULT 0 CHECK (execution_score >= 0 AND execution_score <= 10),
  quality_score integer NOT NULL DEFAULT 0 CHECK (quality_score >= 0 AND quality_score <= 10),
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(activity_id, user_id)
);

-- Enable RLS
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_scores ENABLE ROW LEVEL SECURITY;

-- RLS for activities: authenticated can view, admins + demandas managers can manage
CREATE POLICY "Authenticated users can view activities" ON public.activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert activities" ON public.activities FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update activities" ON public.activities FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete activities" ON public.activities FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow Demandas managers to manage activities
CREATE POLICY "Demandas managers can insert activities" ON public.activities FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.leadership_positions WHERE user_id = auth.uid() AND directorate_id = 'dir-1' AND position_type = 'manager'));
CREATE POLICY "Demandas managers can update activities" ON public.activities FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.leadership_positions WHERE user_id = auth.uid() AND directorate_id = 'dir-1' AND position_type = 'manager'));
CREATE POLICY "Demandas managers can delete activities" ON public.activities FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.leadership_positions WHERE user_id = auth.uid() AND directorate_id = 'dir-1' AND position_type = 'manager'));

-- RLS for activity_scores
CREATE POLICY "Authenticated users can view activity_scores" ON public.activity_scores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert activity_scores" ON public.activity_scores FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update activity_scores" ON public.activity_scores FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete activity_scores" ON public.activity_scores FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Demandas managers can insert activity_scores" ON public.activity_scores FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.leadership_positions WHERE user_id = auth.uid() AND directorate_id = 'dir-1' AND position_type = 'manager'));
CREATE POLICY "Demandas managers can update activity_scores" ON public.activity_scores FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.leadership_positions WHERE user_id = auth.uid() AND directorate_id = 'dir-1' AND position_type = 'manager'));
CREATE POLICY "Demandas managers can delete activity_scores" ON public.activity_scores FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.leadership_positions WHERE user_id = auth.uid() AND directorate_id = 'dir-1' AND position_type = 'manager'));

-- Triggers for updated_at
CREATE TRIGGER handle_activities_updated_at BEFORE UPDATE ON public.activities FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_activity_scores_updated_at BEFORE UPDATE ON public.activity_scores FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
