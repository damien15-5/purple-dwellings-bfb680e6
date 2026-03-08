
-- Track user property views for personalization
CREATE TABLE public.user_property_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  property_type text,
  price numeric,
  city text,
  state text,
  bedrooms integer,
  listing_type text,
  viewed_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for fast lookups by user
CREATE INDEX idx_user_property_views_user ON public.user_property_views(user_id, viewed_at DESC);

-- Enable RLS
ALTER TABLE public.user_property_views ENABLE ROW LEVEL SECURITY;

-- Users can insert their own views
CREATE POLICY "Users can insert own views"
ON public.user_property_views FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can read their own views
CREATE POLICY "Users can view own history"
ON public.user_property_views FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Users can delete own views
CREATE POLICY "Users can delete own views"
ON public.user_property_views FOR DELETE TO authenticated
USING (auth.uid() = user_id);
