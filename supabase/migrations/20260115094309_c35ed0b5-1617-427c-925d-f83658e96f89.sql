-- Add hero card styling columns for floating card effect
ALTER TABLE public.hero_settings
ADD COLUMN IF NOT EXISTS hero_border_radius INTEGER DEFAULT 24,
ADD COLUMN IF NOT EXISTS hero_margin_top INTEGER DEFAULT 24,
ADD COLUMN IF NOT EXISTS hero_margin_bottom INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS page_background_color TEXT DEFAULT '#0f172a',
ADD COLUMN IF NOT EXISTS hero_shadow_intensity INTEGER DEFAULT 30;