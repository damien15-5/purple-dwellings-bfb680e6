-- Add account_type column to profiles table
CREATE TYPE account_type AS ENUM ('buyer', 'seller', 'agent');

ALTER TABLE profiles 
ADD COLUMN account_type account_type DEFAULT 'buyer';

-- Create index for better query performance
CREATE INDEX idx_profiles_account_type ON profiles(account_type);