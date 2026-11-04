-- Printosk 2.0 Row-Level Security (RLS) & Access Policies

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kiosks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.print_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.print_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.print_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_heartbeats ENABLE ROW LEVEL SECURITY;

-- 1. KIOSKS TABLE POLICIES
-- Anyone can view active kiosk availability (for QR code landing pages)
CREATE POLICY "Public kiosks can view status" 
ON public.kiosks 
FOR SELECT 
USING (true);

-- Only service role or admin can update kiosk records
CREATE POLICY "Admins full access on kiosks" 
ON public.kiosks 
FOR ALL 
TO authenticated 
USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- 2. PRINT JOBS POLICIES
-- Users can view their own print jobs
CREATE POLICY "Users can view their own jobs" 
ON public.print_jobs 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- Allow anonymous or customer users to create pending print jobs
CREATE POLICY "Anyone can create pending print jobs" 
ON public.print_jobs 
FOR INSERT 
WITH CHECK (true);

-- Admins can view and manage all jobs
CREATE POLICY "Admins full access on print_jobs" 
ON public.print_jobs 
FOR ALL 
TO authenticated 
USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- 3. PRINT FILES POLICIES
-- Admins can view files
CREATE POLICY "Admins full access on print_files" 
ON public.print_files 
FOR ALL 
TO authenticated 
USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- 4. PAYMENTS POLICIES
-- Users can view their own payment receipts
CREATE POLICY "Users view own payments" 
ON public.payments 
FOR SELECT 
TO authenticated 
USING (
    EXISTS (SELECT 1 FROM public.print_jobs WHERE print_jobs.id = payments.job_id AND print_jobs.user_id = auth.uid())
);

-- 5. DEVICE HEARTBEATS POLICIES
-- Admin can view heartbeats
CREATE POLICY "Admins view heartbeats" 
ON public.device_heartbeats 
FOR SELECT 
TO authenticated 
USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- 6. STORAGE BUCKETS SETUP (Supabase Storage)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('processed-prints', 'processed-prints', false)
ON CONFLICT (id) DO NOTHING;

