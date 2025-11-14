-- Create enum for escrow status
CREATE TYPE escrow_status AS ENUM (
  'pending_payment',
  'funded',
  'inspection_period',
  'completed',
  'disputed',
  'cancelled',
  'refunded'
);

-- Create enum for dispute status
CREATE TYPE dispute_status AS ENUM (
  'pending',
  'under_review',
  'resolved_buyer',
  'resolved_seller',
  'resolved_partial'
);

-- Create escrow fee tiers table
CREATE TABLE public.escrow_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  min_amount NUMERIC NOT NULL,
  max_amount NUMERIC,
  fee_percentage NUMERIC NOT NULL,
  fixed_fee NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default fee tiers
INSERT INTO public.escrow_fees (min_amount, max_amount, fee_percentage, fixed_fee) VALUES
(0, 100000, 2.5, 500),
(100000, 500000, 2.0, 1000),
(500000, 1000000, 1.5, 2000),
(1000000, 5000000, 1.0, 5000),
(5000000, NULL, 0.8, 10000);

-- Create escrow transactions table
CREATE TABLE public.escrow_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  transaction_amount NUMERIC NOT NULL,
  escrow_fee NUMERIC NOT NULL,
  total_amount NUMERIC NOT NULL,
  status escrow_status NOT NULL DEFAULT 'pending_payment',
  paystack_reference TEXT,
  paystack_access_code TEXT,
  payment_verified_at TIMESTAMPTZ,
  inspection_start_date TIMESTAMPTZ,
  inspection_end_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  terms TEXT,
  buyer_confirmed BOOLEAN DEFAULT false,
  seller_confirmed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create payment records table
CREATE TABLE public.payment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escrow_id UUID REFERENCES public.escrow_transactions(id) ON DELETE CASCADE,
  paystack_reference TEXT UNIQUE NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'NGN',
  status TEXT NOT NULL,
  payment_method TEXT,
  paid_at TIMESTAMPTZ,
  webhook_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create escrow documents table
CREATE TABLE public.escrow_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escrow_id UUID REFERENCES public.escrow_transactions(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL,
  document_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create escrow disputes table
CREATE TABLE public.escrow_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escrow_id UUID REFERENCES public.escrow_transactions(id) ON DELETE CASCADE,
  raised_by UUID NOT NULL,
  reason TEXT NOT NULL,
  description TEXT NOT NULL,
  status dispute_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  resolution_action TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.escrow_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_disputes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for escrow_fees (public read, admin write)
CREATE POLICY "Anyone can view escrow fees"
ON public.escrow_fees FOR SELECT
USING (true);

-- RLS Policies for escrow_transactions
CREATE POLICY "Users can view own escrow transactions"
ON public.escrow_transactions FOR SELECT
USING (auth.uid() = buyer_id OR auth.uid() = seller_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create escrow transactions"
ON public.escrow_transactions FOR INSERT
WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Users can update own escrow transactions"
ON public.escrow_transactions FOR UPDATE
USING (auth.uid() = buyer_id OR auth.uid() = seller_id OR has_role(auth.uid(), 'admin'));

-- RLS Policies for payment_records
CREATE POLICY "Users can view own payment records"
ON public.payment_records FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.escrow_transactions 
    WHERE escrow_transactions.id = payment_records.escrow_id 
    AND (escrow_transactions.buyer_id = auth.uid() OR escrow_transactions.seller_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "Service can insert payment records"
ON public.payment_records FOR INSERT
WITH CHECK (true);

-- RLS Policies for escrow_documents
CREATE POLICY "Users can view escrow documents"
ON public.escrow_documents FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.escrow_transactions 
    WHERE escrow_transactions.id = escrow_documents.escrow_id 
    AND (escrow_transactions.buyer_id = auth.uid() OR escrow_transactions.seller_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "Users can upload escrow documents"
ON public.escrow_documents FOR INSERT
WITH CHECK (
  auth.uid() = uploaded_by AND
  EXISTS (
    SELECT 1 FROM public.escrow_transactions 
    WHERE escrow_transactions.id = escrow_documents.escrow_id 
    AND (escrow_transactions.buyer_id = auth.uid() OR escrow_transactions.seller_id = auth.uid())
  )
);

-- RLS Policies for escrow_disputes
CREATE POLICY "Users can view disputes for own escrows"
ON public.escrow_disputes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.escrow_transactions 
    WHERE escrow_transactions.id = escrow_disputes.escrow_id 
    AND (escrow_transactions.buyer_id = auth.uid() OR escrow_transactions.seller_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "Users can create disputes for own escrows"
ON public.escrow_disputes FOR INSERT
WITH CHECK (
  auth.uid() = raised_by AND
  EXISTS (
    SELECT 1 FROM public.escrow_transactions 
    WHERE escrow_transactions.id = escrow_disputes.escrow_id 
    AND (escrow_transactions.buyer_id = auth.uid() OR escrow_transactions.seller_id = auth.uid())
  )
);

CREATE POLICY "Admins can update disputes"
ON public.escrow_disputes FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Create indexes for performance
CREATE INDEX idx_escrow_transactions_buyer ON public.escrow_transactions(buyer_id);
CREATE INDEX idx_escrow_transactions_seller ON public.escrow_transactions(seller_id);
CREATE INDEX idx_escrow_transactions_property ON public.escrow_transactions(property_id);
CREATE INDEX idx_escrow_transactions_status ON public.escrow_transactions(status);
CREATE INDEX idx_payment_records_escrow ON public.payment_records(escrow_id);
CREATE INDEX idx_payment_records_reference ON public.payment_records(paystack_reference);
CREATE INDEX idx_escrow_documents_escrow ON public.escrow_documents(escrow_id);
CREATE INDEX idx_escrow_disputes_escrow ON public.escrow_disputes(escrow_id);

-- Create trigger for updated_at on escrow_transactions
CREATE TRIGGER update_escrow_transactions_updated_at
BEFORE UPDATE ON public.escrow_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on escrow_disputes
CREATE TRIGGER update_escrow_disputes_updated_at
BEFORE UPDATE ON public.escrow_disputes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on escrow_fees
CREATE TRIGGER update_escrow_fees_updated_at
BEFORE UPDATE ON public.escrow_fees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();