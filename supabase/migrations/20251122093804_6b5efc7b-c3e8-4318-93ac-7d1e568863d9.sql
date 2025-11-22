-- Add payment method tracking and transaction hash to escrow_transactions
ALTER TABLE escrow_transactions 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'escrow',
ADD COLUMN IF NOT EXISTS payment_timing TEXT DEFAULT 'now',
ADD COLUMN IF NOT EXISTS atara_fee NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS platform_fee NUMERIC DEFAULT 0;

-- Update existing records to have proper fees
UPDATE escrow_transactions
SET 
  atara_fee = CASE 
    WHEN transaction_amount > 0 THEN transaction_amount * 0.015
    ELSE 0
  END,
  platform_fee = CASE 
    WHEN transaction_amount > 30000000 THEN transaction_amount * 0.005
    WHEN transaction_amount > 0 THEN transaction_amount * 0.01
    ELSE 0
  END
WHERE atara_fee = 0 AND platform_fee = 0;