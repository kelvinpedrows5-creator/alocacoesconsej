
CREATE TABLE public.business_opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  service_description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.business_opportunities ENABLE ROW LEVEL SECURITY;

-- Members can insert their own
CREATE POLICY "Users can insert own opportunities"
ON public.business_opportunities FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Members can view their own
CREATE POLICY "Users can view own opportunities"
ON public.business_opportunities FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can do everything
CREATE POLICY "Admins can view all opportunities"
ON public.business_opportunities FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update opportunities"
ON public.business_opportunities FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete opportunities"
ON public.business_opportunities FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Negócios managers can view all
CREATE POLICY "Negocios managers can view opportunities"
ON public.business_opportunities FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM leadership_positions
  WHERE leadership_positions.user_id = auth.uid()
    AND leadership_positions.directorate_id = 'dir-2'
    AND leadership_positions.position_type = 'manager'
));

-- Negócios director can view all
CREATE POLICY "Negocios director can view opportunities"
ON public.business_opportunities FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM leadership_positions
  WHERE leadership_positions.user_id = auth.uid()
    AND leadership_positions.directorate_id = 'dir-2'
    AND leadership_positions.position_type = 'director'
));

-- Negócios managers can update (change status)
CREATE POLICY "Negocios managers can update opportunities"
ON public.business_opportunities FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM leadership_positions
  WHERE leadership_positions.user_id = auth.uid()
    AND leadership_positions.directorate_id = 'dir-2'
    AND leadership_positions.position_type = 'manager'
));

-- Negócios director can update
CREATE POLICY "Negocios director can update opportunities"
ON public.business_opportunities FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM leadership_positions
  WHERE leadership_positions.user_id = auth.uid()
    AND leadership_positions.directorate_id = 'dir-2'
    AND leadership_positions.position_type = 'director'
));
