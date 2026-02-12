
-- Add telegram username to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telegram_username text;

-- Add bank details to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bank_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_number text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS paystack_subaccount_code text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bank_verified boolean DEFAULT false;

-- Add notification preferences to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notification_email boolean DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notification_push boolean DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notification_offers boolean DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notification_messages boolean DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notification_telegram boolean DEFAULT true;
