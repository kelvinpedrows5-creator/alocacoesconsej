
CREATE TABLE public.demand_dispatches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  deadline_hours INTEGER NOT NULL DEFAULT 24,
  created_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.demand_dispatches ENABLE ROW LEVEL SECURITY;

-- Demandas managers can do everything
CREATE POLICY "Demandas managers can insert dispatches" ON public.demand_dispatches
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM leadership_positions
      WHERE leadership_positions.user_id = auth.uid()
        AND leadership_positions.directorate_id = 'dir-1'
        AND leadership_positions.position_type = 'manager'
    )
  );

CREATE POLICY "Demandas managers can view dispatches" ON public.demand_dispatches
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM leadership_positions
      WHERE leadership_positions.user_id = auth.uid()
        AND leadership_positions.directorate_id = 'dir-1'
        AND leadership_positions.position_type = 'manager'
    )
  );

CREATE POLICY "Demandas managers can update dispatches" ON public.demand_dispatches
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM leadership_positions
      WHERE leadership_positions.user_id = auth.uid()
        AND leadership_positions.directorate_id = 'dir-1'
        AND leadership_positions.position_type = 'manager'
    )
  );

CREATE POLICY "Demandas managers can delete dispatches" ON public.demand_dispatches
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM leadership_positions
      WHERE leadership_positions.user_id = auth.uid()
        AND leadership_positions.directorate_id = 'dir-1'
        AND leadership_positions.position_type = 'manager'
    )
  );

-- Admins full access
CREATE POLICY "Admins can manage dispatches" ON public.demand_dispatches
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- GT members can view dispatches for their clients
CREATE POLICY "GT members can view dispatches for their clients" ON public.demand_dispatches
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM gt_members
      WHERE gt_members.client_id = demand_dispatches.client_id
        AND gt_members.user_id = auth.uid()
    )
  );

-- Add updated_at trigger
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.demand_dispatches
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
