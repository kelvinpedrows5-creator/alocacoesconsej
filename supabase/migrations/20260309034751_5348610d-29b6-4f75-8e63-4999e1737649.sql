
ALTER TABLE public.help_reports 
  ADD COLUMN status text NOT NULL DEFAULT 'pending',
  ADD COLUMN leader_comment text;

ALTER PUBLICATION supabase_realtime ADD TABLE public.demand_submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.business_opportunities;
