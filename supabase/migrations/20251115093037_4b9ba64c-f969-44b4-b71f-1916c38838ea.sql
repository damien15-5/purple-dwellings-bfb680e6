-- Add offer system columns to escrow_transactions
ALTER TABLE escrow_transactions
ADD COLUMN offer_amount numeric,
ADD COLUMN offer_status text CHECK (offer_status IN ('pending', 'accepted', 'rejected', 'none')) DEFAULT 'none',
ADD COLUMN offer_message text,
ADD COLUMN seller_response text,
ADD COLUMN seller_responded_at timestamp with time zone,
ADD COLUMN pay_later boolean DEFAULT false,
ADD COLUMN pay_later_reminder_sent boolean DEFAULT false;

-- Create index for offer status queries
CREATE INDEX idx_escrow_offer_status ON escrow_transactions(seller_id, offer_status) WHERE offer_status = 'pending';

-- Update RLS policies to allow sellers to update offer responses
CREATE POLICY "Sellers can update offer responses"
ON escrow_transactions
FOR UPDATE
USING (auth.uid() = seller_id)
WITH CHECK (auth.uid() = seller_id);