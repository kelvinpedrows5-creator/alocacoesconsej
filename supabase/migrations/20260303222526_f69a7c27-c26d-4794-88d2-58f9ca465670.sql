
-- Junction table: which clients belong to which cycle
CREATE TABLE public.client_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  cycle_id uuid NOT NULL REFERENCES public.allocation_cycles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_id, cycle_id)
);

ALTER TABLE public.client_cycles ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can view
CREATE POLICY "Authenticated users can view client_cycles"
  ON public.client_cycles FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can manage
CREATE POLICY "Admins can insert client_cycles"
  ON public.client_cycles FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete client_cycles"
  ON public.client_cycles FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow members to update their own coordination_id in member_allocations
CREATE POLICY "Users can update own allocation coordination"
  ON public.member_allocations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow members to insert their own allocation
CREATE POLICY "Users can insert own allocation"
  ON public.member_allocations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
