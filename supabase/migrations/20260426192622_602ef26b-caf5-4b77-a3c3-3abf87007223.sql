CREATE TABLE public.client_status_lights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  cycle_id UUID NOT NULL REFERENCES public.allocation_cycles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('blue','yellow','red')),
  notes TEXT,
  updated_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (client_id, cycle_id)
);

ALTER TABLE public.client_status_lights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view client status lights"
ON public.client_status_lights FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert client status lights"
ON public.client_status_lights FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update client status lights"
ON public.client_status_lights FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete client status lights"
ON public.client_status_lights FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Demandas managers can insert client status lights"
ON public.client_status_lights FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM leadership_positions
  WHERE user_id = auth.uid()
    AND directorate_id = 'dir-1'
    AND position_type = 'manager'
));

CREATE POLICY "Demandas managers can update client status lights"
ON public.client_status_lights FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM leadership_positions
  WHERE user_id = auth.uid()
    AND directorate_id = 'dir-1'
    AND position_type = 'manager'
));

CREATE POLICY "Demandas managers can delete client status lights"
ON public.client_status_lights FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM leadership_positions
  WHERE user_id = auth.uid()
    AND directorate_id = 'dir-1'
    AND position_type = 'manager'
));

CREATE TRIGGER update_client_status_lights_updated_at
BEFORE UPDATE ON public.client_status_lights
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();