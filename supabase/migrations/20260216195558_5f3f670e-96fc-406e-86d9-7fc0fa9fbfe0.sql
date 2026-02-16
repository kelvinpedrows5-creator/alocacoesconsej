
-- Create GT handoff surveys table for cycle-end documentation
CREATE TABLE public.gt_handoff_surveys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  cycle_id UUID NOT NULL REFERENCES public.allocation_cycles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  work_style TEXT,
  communication_notes TEXT,
  key_learnings TEXT,
  recommendations TEXT,
  difficulty_level TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, cycle_id, user_id)
);

ALTER TABLE public.gt_handoff_surveys ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view surveys (for handoff purposes)
CREATE POLICY "All authenticated users can view handoff surveys"
ON public.gt_handoff_surveys FOR SELECT TO authenticated USING (true);

-- Users can insert their own surveys
CREATE POLICY "Users can insert their own handoff surveys"
ON public.gt_handoff_surveys FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own surveys
CREATE POLICY "Users can update their own handoff surveys"
ON public.gt_handoff_surveys FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- Admins can delete surveys
CREATE POLICY "Admins can delete handoff surveys"
ON public.gt_handoff_surveys FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
