-- Add image size fields to hero_settings
ALTER TABLE public.hero_settings 
ADD COLUMN image_width INTEGER DEFAULT 100,
ADD COLUMN image_height INTEGER DEFAULT 100;