-- Add ticket_number to customer_service_tickets if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_service_tickets' AND column_name = 'ticket_number') THEN
    ALTER TABLE public.customer_service_tickets ADD COLUMN ticket_number TEXT;
  END IF;
END $$;

-- Create or replace function to generate customer service ticket numbers
CREATE OR REPLACE FUNCTION public.generate_cs_ticket_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 5) AS INTEGER)), 0) + 1 INTO counter 
  FROM customer_service_tickets 
  WHERE ticket_number IS NOT NULL AND ticket_number LIKE 'CST-%';
  new_number := 'CST-' || LPAD(counter::TEXT, 6, '0');
  RETURN new_number;
END;
$$;

-- Create trigger function for auto-generating ticket number
CREATE OR REPLACE FUNCTION public.set_cs_ticket_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number := generate_cs_ticket_number();
  END IF;
  RETURN NEW;
END;
$$;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS set_customer_service_ticket_number ON public.customer_service_tickets;
CREATE TRIGGER set_customer_service_ticket_number
BEFORE INSERT ON public.customer_service_tickets
FOR EACH ROW
EXECUTE FUNCTION public.set_cs_ticket_number();