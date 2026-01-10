-- Create surgeries table
CREATE TABLE public.surgeries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  image_position_x INTEGER DEFAULT 50,
  image_position_y INTEGER DEFAULT 50,
  discount_percentage INTEGER DEFAULT 0,
  hospital_discount_percentage INTEGER DEFAULT 0,
  doctor_discount_percentage INTEGER DEFAULT 0,
  price_range TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.surgeries ENABLE ROW LEVEL SECURITY;

-- Public read policy
CREATE POLICY "Anyone can view active surgeries"
ON public.surgeries
FOR SELECT
USING (is_active = true);

-- Admin full access
CREATE POLICY "Admins can manage surgeries"
ON public.surgeries
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_surgeries_updated_at
BEFORE UPDATE ON public.surgeries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for surgery images
INSERT INTO storage.buckets (id, name, public) VALUES ('surgery-images', 'surgery-images', true);

-- Storage policies
CREATE POLICY "Surgery images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'surgery-images');

CREATE POLICY "Admins can upload surgery images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'surgery-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update surgery images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'surgery-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete surgery images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'surgery-images' AND public.has_role(auth.uid(), 'admin'));