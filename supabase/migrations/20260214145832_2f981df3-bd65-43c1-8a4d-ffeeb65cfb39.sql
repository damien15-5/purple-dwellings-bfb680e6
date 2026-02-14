
-- Table to store admin Telegram chat IDs
CREATE TABLE public.telegram_admin_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  chat_id bigint NOT NULL UNIQUE,
  username text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.telegram_admin_chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service can manage admin chats" ON public.telegram_admin_chats FOR ALL USING (true) WITH CHECK (true);

-- Table to store user Telegram connections
CREATE TABLE public.telegram_user_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  chat_id bigint NOT NULL UNIQUE,
  username text,
  is_verified boolean DEFAULT false,
  verification_code text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.telegram_user_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service can manage user links" ON public.telegram_user_links FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can view own link" ON public.telegram_user_links FOR SELECT USING (auth.uid() = user_id);

-- Table for telegram notification log
CREATE TABLE public.telegram_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id bigint NOT NULL,
  message_type text NOT NULL,
  message_text text NOT NULL,
  reference_id uuid,
  reference_type text,
  sent_at timestamptz DEFAULT now(),
  delivered boolean DEFAULT true
);

ALTER TABLE public.telegram_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service can manage notifications" ON public.telegram_notifications FOR ALL USING (true) WITH CHECK (true);
