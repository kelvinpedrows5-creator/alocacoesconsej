-- Create allocation_cycles table for managing cycles
CREATE TABLE public.allocation_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  value text NOT NULL UNIQUE,
  is_visible boolean NOT NULL DEFAULT false,
  is_current boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.allocation_cycles ENABLE ROW LEVEL SECURITY;

-- Everyone can view visible cycles
CREATE POLICY "Everyone can view visible cycles"
ON public.allocation_cycles
FOR SELECT
USING (is_visible = true OR has_role(auth.uid(), 'admin'::app_role));

-- Only admins can manage cycles
CREATE POLICY "Admins can insert cycles"
ON public.allocation_cycles
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update cycles"
ON public.allocation_cycles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete cycles"
ON public.allocation_cycles
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create leadership_positions table for managers and directors
CREATE TABLE public.leadership_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  directorate_id text NOT NULL,
  position_type text NOT NULL CHECK (position_type IN ('manager', 'director')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, directorate_id, position_type)
);

-- Enable RLS
ALTER TABLE public.leadership_positions ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can view leadership positions
CREATE POLICY "Authenticated users can view leadership positions"
ON public.leadership_positions
FOR SELECT
TO authenticated
USING (true);

-- Only admins can manage leadership positions
CREATE POLICY "Admins can insert leadership positions"
ON public.leadership_positions
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update leadership positions"
ON public.leadership_positions
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete leadership positions"
ON public.leadership_positions
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create member_allocations table for tracking allocations per cycle
CREATE TABLE public.member_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cycle_id uuid NOT NULL REFERENCES public.allocation_cycles(id) ON DELETE CASCADE,
  coordination_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, cycle_id)
);

-- Enable RLS
ALTER TABLE public.member_allocations ENABLE ROW LEVEL SECURITY;

-- Users can view allocations for visible cycles or their own
CREATE POLICY "Users can view allocations for visible cycles"
ON public.member_allocations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.allocation_cycles ac 
    WHERE ac.id = cycle_id AND (ac.is_visible = true OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- Only admins can manage allocations
CREATE POLICY "Admins can insert allocations"
ON public.member_allocations
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update allocations"
ON public.member_allocations
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete allocations"
ON public.member_allocations
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add triggers for updated_at
CREATE TRIGGER update_allocation_cycles_updated_at
BEFORE UPDATE ON public.allocation_cycles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_leadership_positions_updated_at
BEFORE UPDATE ON public.leadership_positions
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_member_allocations_updated_at
BEFORE UPDATE ON public.member_allocations
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Insert the default cycle (1º Ciclo de 2026)
INSERT INTO public.allocation_cycles (label, value, is_visible, is_current)
VALUES ('1º Ciclo de 2026', '2026-C1', true, true);