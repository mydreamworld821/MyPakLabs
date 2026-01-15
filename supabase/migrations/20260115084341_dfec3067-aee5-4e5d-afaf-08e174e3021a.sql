-- Create hero_settings table for admin-managed hero content
CREATE TABLE public.hero_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title_line1 TEXT NOT NULL DEFAULT 'Find and Book the',
  title_highlight TEXT NOT NULL DEFAULT 'Best Doctors',
  title_line2 TEXT NOT NULL DEFAULT 'near you',
  badge_text TEXT DEFAULT '25K+ doctors',
  hero_image_url TEXT,
  typing_words TEXT[] DEFAULT ARRAY['Doctors', 'Labs', 'Hospitals', 'Pharmacies', 'Nurses'],
  search_placeholder TEXT DEFAULT 'Search doctors, hospitals, conditions...',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hero_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (everyone can view hero)
CREATE POLICY "Hero settings are publicly readable" 
ON public.hero_settings 
FOR SELECT 
USING (true);

-- Create policy for admin write access
CREATE POLICY "Admins can manage hero settings" 
ON public.hero_settings 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Insert default hero settings
INSERT INTO public.hero_settings (
  title_line1, 
  title_highlight, 
  title_line2, 
  badge_text, 
  typing_words,
  search_placeholder
) VALUES (
  'Find and Access',
  'Best Healthcare',
  'Services Near You',
  'Verified Providers',
  ARRAY['Doctors', 'Labs', 'Hospitals', 'Pharmacies', 'Nurses', 'Surgeries'],
  'Search doctors, labs, hospitals...'
);

-- Create storage bucket for hero images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('hero-images', 'hero-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for public read access to hero images
CREATE POLICY "Hero images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'hero-images');

-- Create policy for admin upload access
CREATE POLICY "Admins can upload hero images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'hero-images' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Create policy for admin update access
CREATE POLICY "Admins can update hero images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'hero-images' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Create policy for admin delete access
CREATE POLICY "Admins can delete hero images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'hero-images' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);