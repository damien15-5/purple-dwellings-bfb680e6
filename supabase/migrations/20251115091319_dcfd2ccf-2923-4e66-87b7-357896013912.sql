-- Ensure fast lookup and uniqueness for transaction hashes
CREATE INDEX IF NOT EXISTS idx_transactions_tx_hash ON public.transactions (tx_hash);
CREATE INDEX IF NOT EXISTS idx_payment_records_tx_hash ON public.payment_records (tx_hash);
CREATE INDEX IF NOT EXISTS idx_payment_records_reference ON public.payment_records (paystack_reference);
CREATE INDEX IF NOT EXISTS idx_escrow_transactions_reference ON public.escrow_transactions (paystack_reference);
CREATE UNIQUE INDEX IF NOT EXISTS uq_escrow_transactions_tx_hash ON public.escrow_transactions (tx_hash);
