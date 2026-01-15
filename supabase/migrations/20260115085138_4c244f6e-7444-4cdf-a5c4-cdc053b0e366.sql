-- Add trust_badges column to hero_settings table
ALTER TABLE public.hero_settings 
ADD COLUMN trust_badges JSONB DEFAULT '[
  {"icon": "Shield", "text": "ISO Certified"},
  {"icon": "Clock", "text": "Quick Results"},
  {"icon": "TrendingDown", "text": "Best Prices"}
]'::jsonb;

-- Update existing row with default badges
UPDATE public.hero_settings 
SET trust_badges = '[
  {"icon": "Shield", "text": "ISO Certified"},
  {"icon": "Clock", "text": "Quick Results"},
  {"icon": "TrendingDown", "text": "Best Prices"}
]'::jsonb
WHERE trust_badges IS NULL;