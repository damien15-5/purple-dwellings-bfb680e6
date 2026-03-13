
-- Add slug column to properties
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS slug text;
CREATE UNIQUE INDEX IF NOT EXISTS properties_slug_unique ON public.properties(slug) WHERE slug IS NOT NULL;

-- Function to generate slug from property details
CREATE OR REPLACE FUNCTION public.generate_property_slug()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 1;
BEGIN
  base_slug := '';
  IF NEW.bedrooms IS NOT NULL AND NEW.bedrooms > 0 THEN
    base_slug := base_slug || NEW.bedrooms || '-bed-';
  END IF;
  base_slug := base_slug || COALESCE(NEW.property_type, 'property');
  IF NEW.listing_type IS NOT NULL AND NEW.listing_type != '' THEN
    base_slug := base_slug || '-for-' || NEW.listing_type;
  END IF;
  IF NEW.city IS NOT NULL AND NEW.city != '' THEN
    base_slug := base_slug || '-in-' || NEW.city;
  END IF;
  base_slug := lower(base_slug);
  base_slug := regexp_replace(base_slug, '[^a-z0-9-]', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.properties WHERE slug = final_slug AND id != NEW.id) LOOP
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
  NEW.slug := final_slug;
  RETURN NEW;
END;
$$;

-- Trigger to auto-generate slug
DROP TRIGGER IF EXISTS trigger_generate_property_slug ON public.properties;
CREATE TRIGGER trigger_generate_property_slug
  BEFORE INSERT OR UPDATE ON public.properties
  FOR EACH ROW
  WHEN (NEW.slug IS NULL OR NEW.slug = '')
  EXECUTE FUNCTION public.generate_property_slug();

-- Generate slugs for existing properties
UPDATE public.properties SET updated_at = now() WHERE slug IS NULL OR slug = '';

-- Create blog_posts table
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text NOT NULL DEFAULT '',
  excerpt text NOT NULL DEFAULT '',
  author text NOT NULL DEFAULT 'Xavorian Team',
  published_at timestamp with time zone,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published blog posts"
  ON public.blog_posts FOR SELECT
  TO public
  USING (status = 'published' OR (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role)));

-- Insert placeholder blog posts
INSERT INTO public.blog_posts (title, slug, excerpt, content, author, status) VALUES
('How to Verify Land Documents in Nigeria Before Buying', 'how-to-verify-land-documents-nigeria', 'Learn the essential steps to verify land documents before making a purchase in Nigeria. Protect yourself from fraud.', 'Coming soon...', 'Xavorian Team', 'draft'),
('Real Estate Scams in Nigeria: How to Spot and Avoid Them', 'real-estate-scams-nigeria-how-to-avoid', 'Discover the most common real estate scams in Nigeria and learn practical tips to protect yourself.', 'Coming soon...', 'Xavorian Team', 'draft'),
('Best Areas to Invest in Benin City Real Estate in 2025', 'best-areas-invest-benin-city-real-estate', 'Explore the top neighborhoods in Benin City for real estate investment with high growth potential.', 'Coming soon...', 'Xavorian Team', 'draft'),
('Complete Guide to Renting an Apartment in Benin City', 'guide-renting-apartment-benin-city', 'Everything you need to know about finding and renting an apartment in Benin City, from budgeting to signing.', 'Coming soon...', 'Xavorian Team', 'draft'),
('How to Buy Land in Lagos Safely: Step by Step', 'how-to-buy-land-lagos-safely', 'A comprehensive step-by-step guide to purchasing land safely in Lagos, Nigeria.', 'Coming soon...', 'Xavorian Team', 'draft'),
('Understanding the C of O: Certificate of Occupancy in Nigeria', 'certificate-of-occupancy-nigeria-explained', 'A detailed explanation of what a Certificate of Occupancy is, why it matters, and how to obtain one.', 'Coming soon...', 'Xavorian Team', 'draft');
