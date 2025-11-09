-- Create proper role system with security
CREATE TYPE public.app_role AS ENUM ('buyer', 'seller', 'agent', 'admin', 'customer_service');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create customer service tickets table
CREATE TABLE public.customer_service_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.customer_service_tickets ENABLE ROW LEVEL SECURITY;

-- RLS for customer service tickets
CREATE POLICY "Users can view own tickets"
  ON public.customer_service_tickets FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'customer_service') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create own tickets"
  ON public.customer_service_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Customer service can update tickets"
  ON public.customer_service_tickets FOR UPDATE
  USING (public.has_role(auth.uid(), 'customer_service') OR public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_customer_service_tickets_updated_at
  BEFORE UPDATE ON public.customer_service_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create analytics tracking table
CREATE TABLE public.user_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  total_listings INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  total_sales INTEGER DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analytics"
  ON public.user_analytics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own analytics"
  ON public.user_analytics FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analytics"
  ON public.user_analytics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_customer_service_tickets_user_id ON public.customer_service_tickets(user_id);
CREATE INDEX idx_customer_service_tickets_status ON public.customer_service_tickets(status);
CREATE INDEX idx_user_analytics_user_id ON public.user_analytics(user_id);