-- Allow admins and customer service to view ALL customer_service_tickets
DROP POLICY IF EXISTS "Users can view own tickets" ON customer_service_tickets;
CREATE POLICY "Users and admins can view tickets" 
ON customer_service_tickets 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'customer_service'::app_role) 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- Allow admins to delete customer_service_tickets
CREATE POLICY "Admins can delete tickets" 
ON customer_service_tickets 
FOR DELETE 
USING (
  has_role(auth.uid(), 'customer_service'::app_role) 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- Allow admins to view ALL ai_support_tickets
DROP POLICY IF EXISTS "Users can view own AI tickets" ON ai_support_tickets;
CREATE POLICY "Users and admins can view AI tickets" 
ON ai_support_tickets 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'customer_service'::app_role) 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- Allow admins to delete ai_support_tickets
CREATE POLICY "Admins can delete AI tickets" 
ON ai_support_tickets 
FOR DELETE 
USING (
  has_role(auth.uid(), 'customer_service'::app_role) 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);