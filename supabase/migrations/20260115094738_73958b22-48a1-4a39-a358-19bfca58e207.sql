-- Add left and right margin controls for hero positioning
ALTER TABLE public.hero_settings
ADD COLUMN IF NOT EXISTS hero_margin_left INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS hero_margin_right INTEGER DEFAULT 0;