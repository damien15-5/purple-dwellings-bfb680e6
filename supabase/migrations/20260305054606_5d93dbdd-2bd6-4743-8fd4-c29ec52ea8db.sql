-- Add is_verified_badge column to profiles for admin badge management
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified_badge boolean DEFAULT false;

-- Create a function to get total published property count (for KYC threshold)
CREATE OR REPLACE FUNCTION public.get_published_property_count()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*) FROM public.properties WHERE status = 'published';
$$;
