-- Add DELETE policy for escrow transactions
-- Allow buyers or sellers to delete their own transactions
CREATE POLICY "Users can delete own escrow transactions"
ON escrow_transactions
FOR DELETE
USING (
  auth.uid() = buyer_id 
  OR auth.uid() = seller_id 
  OR has_role(auth.uid(), 'admin'::app_role)
);