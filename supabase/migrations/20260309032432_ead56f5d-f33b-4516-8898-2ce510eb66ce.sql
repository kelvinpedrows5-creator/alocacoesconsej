CREATE POLICY "GT members can upload contracts for their clients"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'contracts'
  AND EXISTS (
    SELECT 1
    FROM public.gt_members gm
    WHERE gm.user_id = auth.uid()
      AND gm.client_id::text = (storage.foldername(name))[1]
  )
);