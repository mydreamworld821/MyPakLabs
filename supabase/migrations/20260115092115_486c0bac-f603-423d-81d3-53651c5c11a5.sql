-- Add image blending controls to hero_settings
ALTER TABLE public.hero_settings
ADD COLUMN IF NOT EXISTS image_blend_mode text DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS image_gradient_direction text DEFAULT 'left',
ADD COLUMN IF NOT EXISTS image_fade_intensity integer DEFAULT 50,
ADD COLUMN IF NOT EXISTS image_soft_edges boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS image_mask_type text DEFAULT 'gradient';

-- Update existing row with defaults
UPDATE public.hero_settings SET
  image_blend_mode = COALESCE(image_blend_mode, 'normal'),
  image_gradient_direction = COALESCE(image_gradient_direction, 'left'),
  image_fade_intensity = COALESCE(image_fade_intensity, 50),
  image_soft_edges = COALESCE(image_soft_edges, true),
  image_mask_type = COALESCE(image_mask_type, 'gradient');