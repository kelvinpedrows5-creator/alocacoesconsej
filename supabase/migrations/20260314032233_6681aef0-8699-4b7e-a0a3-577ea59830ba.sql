
-- Allow demand managers to delete GT members
CREATE POLICY "Demandas managers can delete GT members"
ON public.gt_members
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM leadership_positions
    WHERE leadership_positions.user_id = auth.uid()
      AND leadership_positions.directorate_id = 'dir-1'
      AND leadership_positions.position_type = 'manager'
  )
);

-- Allow demand managers to insert GT members
CREATE POLICY "Demandas managers can insert GT members"
ON public.gt_members
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM leadership_positions
    WHERE leadership_positions.user_id = auth.uid()
      AND leadership_positions.directorate_id = 'dir-1'
      AND leadership_positions.position_type = 'manager'
  )
);

-- Allow demand managers to insert clients
CREATE POLICY "Demandas managers can insert clients"
ON public.clients
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM leadership_positions
    WHERE leadership_positions.user_id = auth.uid()
      AND leadership_positions.directorate_id = 'dir-1'
      AND leadership_positions.position_type = 'manager'
  )
);

-- Allow demand managers to insert client_cycles
CREATE POLICY "Demandas managers can insert client_cycles"
ON public.client_cycles
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM leadership_positions
    WHERE leadership_positions.user_id = auth.uid()
      AND leadership_positions.directorate_id = 'dir-1'
      AND leadership_positions.position_type = 'manager'
  )
);

-- Enable realtime for demand_dispatches so consultants get notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.demand_dispatches;
