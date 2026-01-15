-- Add background gradient field to hero_settings
ALTER TABLE public.hero_settings 
ADD COLUMN background_gradient TEXT DEFAULT 'from-amber-800 via-amber-700 to-blue-900';

-- Update existing record
UPDATE public.hero_settings 
SET background_gradient = 'from-amber-800 via-amber-700 to-blue-900' 
WHERE background_gradient IS NULL;