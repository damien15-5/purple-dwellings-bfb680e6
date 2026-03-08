ALTER TABLE public.escrow_transactions 
ADD COLUMN IF NOT EXISTS transfer_status text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS transfer_reference text DEFAULT NULL;