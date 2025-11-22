-- Add views and clicks columns to properties table
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS views integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS clicks integer DEFAULT 0;