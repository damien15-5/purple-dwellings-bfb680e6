
CREATE TABLE IF NOT EXISTS public.telegram_admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_chat_id bigint NOT NULL,
  admin_username text,
  action text NOT NULL,
  details text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.telegram_admin_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service can manage admin actions" ON public.telegram_admin_actions
  FOR ALL USING (true) WITH CHECK (true);
