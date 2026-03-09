
-- Add new columns for the 8 handoff survey questions
ALTER TABLE public.gt_handoff_surveys 
  ADD COLUMN q1_demands_executed text,
  ADD COLUMN q2_pending_demands text,
  ADD COLUMN q3_client_interest text,
  ADD COLUMN q4_client_profile text,
  ADD COLUMN q5_difficulties text,
  ADD COLUMN q6_communication text,
  ADD COLUMN q7_client_value text,
  ADD COLUMN q8_general_summary text;

-- Add unique constraint for upsert
ALTER TABLE public.gt_handoff_surveys 
  ADD CONSTRAINT gt_handoff_surveys_unique_constraint UNIQUE (client_id, cycle_id, user_id);
