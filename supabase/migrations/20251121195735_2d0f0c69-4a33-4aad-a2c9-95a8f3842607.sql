-- Add indices for faster query performance
CREATE INDEX IF NOT EXISTS idx_saved_properties_user_id ON saved_properties(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_properties_created_at ON saved_properties(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_escrow_transactions_buyer_id ON escrow_transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_escrow_transactions_seller_id ON escrow_transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_escrow_transactions_offer_status ON escrow_transactions(offer_status) WHERE offer_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_escrow_transactions_created_at ON escrow_transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status) WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_kyc_documents_user_status ON kyc_documents(user_id, status);

CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);

-- Optimize notifications query
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);