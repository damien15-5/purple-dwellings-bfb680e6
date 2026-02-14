
-- Create purchase_transactions table for direct Paystack/transfer payments
CREATE TABLE public.purchase_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id),
  buyer_id UUID NOT NULL REFERENCES public.profiles(id),
  seller_id UUID NOT NULL REFERENCES public.profiles(id),
  transaction_amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'paystack' CHECK (payment_method IN ('paystack', 'transfer')),
  payment_timing TEXT NOT NULL DEFAULT 'now' CHECK (payment_timing IN ('now', 'later')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'successful', 'failed', 'cancelled')),
  paystack_reference TEXT,
  paystack_access_code TEXT,
  payment_verified_at TIMESTAMPTZ,
  seller_bank_name TEXT,
  seller_account_number TEXT,
  seller_account_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.purchase_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own purchase transactions"
ON public.purchase_transactions FOR SELECT
USING (auth.uid() = buyer_id OR auth.uid() = seller_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create purchase transactions"
ON public.purchase_transactions FOR INSERT
WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Users can update own purchase transactions"
ON public.purchase_transactions FOR UPDATE
USING (auth.uid() = buyer_id OR auth.uid() = seller_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can delete own purchase transactions"
ON public.purchase_transactions FOR DELETE
USING (auth.uid() = buyer_id OR auth.uid() = seller_id OR has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_purchase_transactions_updated_at
BEFORE UPDATE ON public.purchase_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
