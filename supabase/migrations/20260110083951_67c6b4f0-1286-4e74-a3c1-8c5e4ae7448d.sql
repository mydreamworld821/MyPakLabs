-- Create service_cards table for homepage service cards
CREATE TABLE public.service_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT,
  icon_name TEXT DEFAULT 'Star',
  bg_color TEXT DEFAULT 'bg-primary/10',
  link TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_cards ENABLE ROW LEVEL SECURITY;

-- Public read access for service cards
CREATE POLICY "Service cards are viewable by everyone" 
ON public.service_cards 
FOR SELECT 
USING (is_active = true);

-- Admin can manage service cards
CREATE POLICY "Admins can manage service cards" 
ON public.service_cards 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- Create storage bucket for service card images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('service-images', 'service-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for service images
CREATE POLICY "Service images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'service-images');

CREATE POLICY "Admins can upload service images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'service-images' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Admins can update service images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'service-images' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete service images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'service-images' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- Insert default service cards
INSERT INTO public.service_cards (title, subtitle, icon_name, bg_color, link, display_order) VALUES
('Video Consultation', 'Talk to Specialists', 'Video', 'bg-primary/10', '/video-consultation', 1),
('In-Clinic Visit', 'Book Appointments', 'Calendar', 'bg-amber-50', '/in-clinic-visit', 2),
('INSTANT DOCTOR+', 'Get Instant Relief in a Click', 'Zap', 'bg-sky-50', '/instant-doctor', 3);

-- Add trigger for updated_at
CREATE TRIGGER update_service_cards_updated_at
BEFORE UPDATE ON public.service_cards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();