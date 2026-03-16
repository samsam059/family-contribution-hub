
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'entry');

-- Users table
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'entry',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Families table
CREATE TABLE public.families (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  card_number TEXT NOT NULL UNIQUE,
  family_head_name TEXT NOT NULL,
  photo TEXT,
  total_members INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Members table
CREATE TABLE public.members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  member_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending approval')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Subscriptions table
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  paid_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (paid_status IN ('paid', 'unpaid')),
  paid_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(family_id, month, year)
);

-- Pending requests table
CREATE TABLE public.pending_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  member_name TEXT NOT NULL,
  request_type TEXT NOT NULL DEFAULT 'add_member',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_requests ENABLE ROW LEVEL SECURITY;

-- Allow all access (security handled at app level with role-based login)
CREATE POLICY "Allow all access to users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to families" ON public.families FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to members" ON public.members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to subscriptions" ON public.subscriptions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to pending_requests" ON public.pending_requests FOR ALL USING (true) WITH CHECK (true);

-- Storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true);
CREATE POLICY "Photos are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'photos');
CREATE POLICY "Anyone can upload photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'photos');
CREATE POLICY "Anyone can update photos" ON storage.objects FOR UPDATE USING (bucket_id = 'photos');
CREATE POLICY "Anyone can delete photos" ON storage.objects FOR DELETE USING (bucket_id = 'photos');
