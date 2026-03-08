
CREATE POLICY "Users can delete their own submissions"
ON public.demand_submissions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete helpers for own submissions"
ON public.demand_submission_helpers FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM demand_submissions
  WHERE demand_submissions.id = demand_submission_helpers.submission_id
  AND demand_submissions.user_id = auth.uid()
));
