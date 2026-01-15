-- Add hero layout controls
ALTER TABLE public.hero_settings
ADD COLUMN IF NOT EXISTS hero_max_width integer DEFAULT 1400,
ADD COLUMN IF NOT EXISTS hero_min_height integer DEFAULT 400,
ADD COLUMN IF NOT EXISTS hero_padding_x integer DEFAULT 16,
ADD COLUMN IF NOT EXISTS hero_padding_y integer DEFAULT 48,
ADD COLUMN IF NOT EXISTS content_ratio integer DEFAULT 50,
ADD COLUMN IF NOT EXISTS hero_alignment text DEFAULT 'center';

-- Update existing row with defaults
UPDATE public.hero_settings SET
  hero_max_width = COALESCE(hero_max_width, 1400),
  hero_min_height = COALESCE(hero_min_height, 400),
  hero_padding_x = COALESCE(hero_padding_x, 16),
  hero_padding_y = COALESCE(hero_padding_y, 48),
  content_ratio = COALESCE(content_ratio, 50),
  hero_alignment = COALESCE(hero_alignment, 'center');