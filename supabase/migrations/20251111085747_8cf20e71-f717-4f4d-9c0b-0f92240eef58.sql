-- Add video_url column to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS video_url text;