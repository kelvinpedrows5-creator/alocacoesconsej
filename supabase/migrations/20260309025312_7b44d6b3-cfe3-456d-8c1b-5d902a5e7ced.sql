
-- Add contract_scope_url and contract_scope_type to clients table
ALTER TABLE public.clients 
  ADD COLUMN contract_scope_url text DEFAULT NULL,
  ADD COLUMN contract_scope_type text DEFAULT NULL;

-- Create storage bucket for contract PDFs
INSERT INTO storage.buckets (id, name, public) 
VALUES ('contracts', 'contracts', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for contracts bucket
CREATE POLICY "Authenticated users can view contracts"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'contracts');

CREATE POLICY "Admins can upload contracts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'contracts' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete contracts"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'contracts' AND public.has_role(auth.uid(), 'admin'::public.app_role));
