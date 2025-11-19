-- Create admin_credentials table for secure admin authentication
CREATE TABLE IF NOT EXISTS public.admin_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  second_password_hash text NOT NULL,
  role app_role NOT NULL CHECK (role IN ('super_admin', 'sub_admin')),
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  last_login timestamp with time zone,
  is_active boolean DEFAULT true
);

-- Enable RLS
ALTER TABLE public.admin_credentials ENABLE ROW LEVEL SECURITY;

-- Only super admins can view admin credentials
CREATE POLICY "Super admins can view admin credentials"
ON public.admin_credentials
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'));

-- Only super admins can insert admin credentials  
CREATE POLICY "Super admins can create admins"
ON public.admin_credentials
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Only super admins can update admin credentials
CREATE POLICY "Super admins can update admins"
ON public.admin_credentials
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'));

-- Only super admins can delete admin credentials
CREATE POLICY "Super admins can delete admins"
ON public.admin_credentials
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'));

-- Create admin activity logs table
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id) NOT NULL,
  action text NOT NULL,
  target_type text,
  target_id uuid,
  details jsonb,
  ip_address text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view their own logs, super admins can view all
CREATE POLICY "Admins can view activity logs"
ON public.admin_activity_logs
FOR SELECT
TO authenticated
USING (
  admin_id = auth.uid() OR 
  has_role(auth.uid(), 'super_admin')
);

-- Service can insert logs
CREATE POLICY "Service can insert logs"
ON public.admin_activity_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Insert the super admin account (damien15_5)
-- Note: Password stored as plain text for now as per requirements
INSERT INTO public.admin_credentials (username, password_hash, second_password_hash, role)
VALUES ('damien15_5', 'xavorian', 'EzeaniChika', 'super_admin')
ON CONFLICT (username) DO NOTHING;