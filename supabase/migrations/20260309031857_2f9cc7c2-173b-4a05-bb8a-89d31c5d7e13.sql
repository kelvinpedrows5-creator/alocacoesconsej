
DROP POLICY "GT members can view approved demands for their clients" ON public.demand_submissions;

CREATE POLICY "GT members can view evaluated demands for their clients"
ON public.demand_submissions
FOR SELECT
TO authenticated
USING (
  status = 'evaluated' 
  AND gt_client_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM gt_members
    WHERE gt_members.client_id = demand_submissions.gt_client_id
      AND gt_members.user_id = auth.uid()
  )
);
