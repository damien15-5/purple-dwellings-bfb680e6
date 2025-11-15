-- Add transaction hash and audit logging tables

-- Add tx_hash column to escrow_transactions
ALTER TABLE public.escrow_transactions
ADD COLUMN IF NOT EXISTS tx_hash VARCHAR(128) UNIQUE,
ADD COLUMN IF NOT EXISTS paystack_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS release_requested_by UUID,
ADD COLUMN IF NOT EXISTS release_requested_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS release_reason TEXT;

-- Create index on tx_hash for fast lookups
CREATE INDEX IF NOT EXISTS idx_escrow_transactions_tx_hash ON public.escrow_transactions(tx_hash);

-- Create transactions table for immutable event log
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_hash VARCHAR(128) NOT NULL,
  event_type VARCHAR(64) NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_tx_hash ON public.transactions(tx_hash);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Allow users to view transactions for their escrows
CREATE POLICY "Users can view transactions for own escrows"
ON public.transactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM escrow_transactions
    WHERE escrow_transactions.tx_hash = transactions.tx_hash
    AND (escrow_transactions.buyer_id = auth.uid() OR escrow_transactions.seller_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- Service can insert transactions
CREATE POLICY "Service can insert transactions"
ON public.transactions
FOR INSERT
WITH CHECK (true);

-- Create audit_logs table for payment state changes
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escrow_id UUID NOT NULL REFERENCES escrow_transactions(id) ON DELETE CASCADE,
  actor_id UUID,
  action VARCHAR(128) NOT NULL,
  before_state JSONB,
  after_state JSONB,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_escrow_id ON public.audit_logs(escrow_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow users to view audit logs for their escrows
CREATE POLICY "Users can view audit logs for own escrows"
ON public.audit_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM escrow_transactions
    WHERE escrow_transactions.id = audit_logs.escrow_id
    AND (escrow_transactions.buyer_id = auth.uid() OR escrow_transactions.seller_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- Service can insert audit logs
CREATE POLICY "Service can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (true);

-- Update payment_records to add tx_hash
ALTER TABLE public.payment_records
ADD COLUMN IF NOT EXISTS tx_hash VARCHAR(128);

CREATE INDEX IF NOT EXISTS idx_payment_records_tx_hash ON public.payment_records(tx_hash);