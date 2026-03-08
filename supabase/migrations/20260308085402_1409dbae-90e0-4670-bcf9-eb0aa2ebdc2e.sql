-- Drop the restrictive "Users can update own escrow transactions" policy and recreate as PERMISSIVE
DROP POLICY IF EXISTS "Users can update own escrow transactions" ON public.escrow_transactions;

CREATE POLICY "Users can update own escrow transactions"
ON public.escrow_transactions
FOR UPDATE
TO authenticated
USING ((auth.uid() = buyer_id) OR (auth.uid() = seller_id) OR has_role(auth.uid(), 'admin'::app_role));

-- Also make the seller update policy permissive by dropping and recreating
DROP POLICY IF EXISTS "Sellers can update offer responses" ON public.escrow_transactions;

CREATE POLICY "Sellers can update offer responses"
ON public.escrow_transactions
FOR UPDATE
TO authenticated
USING (auth.uid() = seller_id)
WITH CHECK (auth.uid() = seller_id);