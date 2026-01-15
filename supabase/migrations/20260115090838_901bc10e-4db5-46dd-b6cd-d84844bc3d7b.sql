-- Add image overlay settings to hero_settings
ALTER TABLE public.hero_settings 
ADD COLUMN image_overlay_opacity INTEGER DEFAULT 30,
ADD COLUMN image_overlay_color TEXT DEFAULT 'from-background';