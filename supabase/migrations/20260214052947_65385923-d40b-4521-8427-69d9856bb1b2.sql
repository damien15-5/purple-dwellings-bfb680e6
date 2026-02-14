
-- Create property_promotions table
CREATE TABLE public.property_promotions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  promotion_id text NOT NULL UNIQUE,
  days_promoted integer NOT NULL CHECK (days_promoted >= 1),
  amount_paid numeric NOT NULL,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  paystack_reference text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.property_promotions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own promotions" ON public.property_promotions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own promotions" ON public.property_promotions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own promotions" ON public.property_promotions
  FOR UPDATE USING (auth.uid() = user_id);

-- Public read for active promotions (needed to show promoted badge)
CREATE POLICY "Anyone can view active promotions" ON public.property_promotions
  FOR SELECT USING (is_active = true AND expires_at > now());

-- Index for fast lookups
CREATE INDEX idx_promotions_active ON public.property_promotions (property_id, is_active, expires_at);
CREATE INDEX idx_promotions_user ON public.property_promotions (user_id);

-- Enable realtime for promotions
ALTER PUBLICATION supabase_realtime ADD TABLE public.property_promotions;
