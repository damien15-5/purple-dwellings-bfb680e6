-- Add message_type to messages table for system messages, offers, warnings
ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'user' CHECK (message_type IN ('user', 'system', 'offer', 'counter_offer', 'accept', 'reject', 'warning', 'document'));

-- Add offer-related data to messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS offer_amount NUMERIC;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS offer_status TEXT;