-- Add new profile fields for expanded questionnaire (15 questions)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profile_communication_style text,
ADD COLUMN IF NOT EXISTS profile_problem_solving text,
ADD COLUMN IF NOT EXISTS profile_time_management text,
ADD COLUMN IF NOT EXISTS profile_team_role text,
ADD COLUMN IF NOT EXISTS profile_learning_style text,
ADD COLUMN IF NOT EXISTS profile_stress_handling text,
ADD COLUMN IF NOT EXISTS profile_leadership_style text,
ADD COLUMN IF NOT EXISTS profile_feedback_preference text,
ADD COLUMN IF NOT EXISTS profile_project_type text,
ADD COLUMN IF NOT EXISTS profile_collaboration_tools text;