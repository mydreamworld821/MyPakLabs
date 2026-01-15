-- Add image position fields to hero_settings
ALTER TABLE public.hero_settings 
ADD COLUMN image_position_x INTEGER DEFAULT 50,
ADD COLUMN image_position_y INTEGER DEFAULT 30;