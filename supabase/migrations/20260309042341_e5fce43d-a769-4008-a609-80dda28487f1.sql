
CREATE TABLE public.handoff_read_confirmations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  cycle_id UUID NOT NULL REFERENCES public.allocation_cycles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  confirmed_top BOOLEAN NOT NULL DEFAULT false,
  confirmed_bottom BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, cycle_id, user_id)
);

ALTER TABLE public.handoff_read_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view read confirmations"
  ON public.handoff_read_confirmations FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Users can insert own read confirmations"
  ON public.handoff_read_confirmations FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own read confirmations"
  ON public.handoff_read_confirmations FOR UPDATE
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete read confirmations"
  ON public.handoff_read_confirmations FOR DELETE
  TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
