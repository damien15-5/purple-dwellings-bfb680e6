-- Create AI support tickets table
CREATE TABLE public.ai_support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  title TEXT NOT NULL,
  issue TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.ai_support_tickets ENABLE ROW LEVEL SECURITY;

-- Users can view their own AI tickets
CREATE POLICY "Users can view own AI tickets"
ON public.ai_support_tickets
FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'customer_service'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Service/AI can insert tickets (for edge function with service role)
CREATE POLICY "Service can insert AI tickets"
ON public.ai_support_tickets
FOR INSERT
WITH CHECK (true);

-- Admins can update AI tickets
CREATE POLICY "Admins can update AI tickets"
ON public.ai_support_tickets
FOR UPDATE
USING (has_role(auth.uid(), 'customer_service'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Create function to generate ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO counter FROM ai_support_tickets;
  new_number := 'XAV-' || LPAD(counter::TEXT, 6, '0');
  RETURN new_number;
END;
$$;