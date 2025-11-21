-- Add foreign key constraints to link escrow_transactions to profiles
-- This allows us to easily fetch buyer and seller names

ALTER TABLE escrow_transactions
ADD CONSTRAINT escrow_transactions_buyer_id_fkey 
FOREIGN KEY (buyer_id) 
REFERENCES profiles(id) 
ON DELETE RESTRICT;

ALTER TABLE escrow_transactions
ADD CONSTRAINT escrow_transactions_seller_id_fkey 
FOREIGN KEY (seller_id) 
REFERENCES profiles(id) 
ON DELETE RESTRICT;