-- Add documents field to properties table
ALTER TABLE public.properties 
ADD COLUMN documents jsonb DEFAULT '[]'::jsonb,
ADD COLUMN is_verified boolean DEFAULT false;