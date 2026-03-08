ALTER TABLE public.demand_submissions 
ADD COLUMN performed_at timestamp with time zone DEFAULT NULL,
ADD COLUMN gt_client_id uuid DEFAULT NULL REFERENCES public.clients(id);