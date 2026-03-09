
CREATE POLICY "GT members can update client contract scope"
ON public.clients
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM gt_members
    WHERE gt_members.client_id = clients.id
      AND gt_members.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM gt_members
    WHERE gt_members.client_id = clients.id
      AND gt_members.user_id = auth.uid()
  )
);
