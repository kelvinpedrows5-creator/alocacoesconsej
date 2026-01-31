-- Create table for clients (GTs)
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- RLS policies for clients
CREATE POLICY "Authenticated users can view clients"
  ON public.clients FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert clients"
  ON public.clients FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update clients"
  ON public.clients FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete clients"
  ON public.clients FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create table for GT composition (member roles in each GT)
CREATE TABLE public.gt_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('director', 'manager', 'consultant')),
  cycle_id UUID NOT NULL REFERENCES public.allocation_cycles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (client_id, user_id, cycle_id)
);

-- Enable RLS
ALTER TABLE public.gt_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for gt_members
CREATE POLICY "Users can view GT members for visible cycles"
  ON public.gt_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM allocation_cycles ac
      WHERE ac.id = gt_members.cycle_id
      AND (ac.is_visible = true OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

CREATE POLICY "Admins can insert GT members"
  ON public.gt_members FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update GT members"
  ON public.gt_members FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete GT members"
  ON public.gt_members FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create table for client profiles (10 questions)
CREATE TABLE public.client_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE UNIQUE,
  question_1 TEXT,
  question_2 TEXT,
  question_3 TEXT,
  question_4 TEXT,
  question_5 TEXT,
  question_6 TEXT,
  question_7 TEXT,
  question_8 TEXT,
  question_9 TEXT,
  question_10 TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for client_profiles
CREATE POLICY "Authenticated users can view client profiles"
  ON public.client_profiles FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert client profiles"
  ON public.client_profiles FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update client profiles"
  ON public.client_profiles FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete client profiles"
  ON public.client_profiles FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add GT assignment to member_allocations (optional, for partial allocation status)
ALTER TABLE public.member_allocations 
  ADD COLUMN gt_client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  ADD COLUMN gt_role TEXT CHECK (gt_role IS NULL OR gt_role IN ('director', 'manager', 'consultant'));

-- Create triggers for updated_at
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_gt_members_updated_at
  BEFORE UPDATE ON public.gt_members
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_client_profiles_updated_at
  BEFORE UPDATE ON public.client_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();