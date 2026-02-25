-- Run this in your Supabase SQL Editor to make thumbnails optional

-- Make thumbnail_url nullable in streams table
ALTER TABLE public.streams ALTER COLUMN thumbnail_url DROP NOT NULL;

-- Remove the column completely if you prefer
-- ALTER TABLE public.streams DROP COLUMN thumbnail_url;
