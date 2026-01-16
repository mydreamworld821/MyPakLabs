-- Create partners table for companies/banks/hospitals that register with the platform
CREATE TABLE public.partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  logo_url TEXT,
  website_url TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  partner_type TEXT DEFAULT 'company', -- company, bank, hospital, pharmacy, etc.
  description TEXT,
  is_approved BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- Public can view approved partners
CREATE POLICY "Anyone can view approved partners"
ON public.partners
FOR SELECT
USING (is_approved = true);

-- Anyone can submit a partner request (no auth required for registration)
CREATE POLICY "Anyone can submit partner registration"
ON public.partners
FOR INSERT
WITH CHECK (true);

-- Admins can manage all partners
CREATE POLICY "Admins can select all partners"
ON public.partners
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update partners"
ON public.partners
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete partners"
ON public.partners
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for partner logos
INSERT INTO storage.buckets (id, name, public) VALUES ('partner-logos', 'partner-logos', true);

-- Storage policies for partner logos
CREATE POLICY "Partner logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'partner-logos');

CREATE POLICY "Anyone can upload partner logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'partner-logos');

CREATE POLICY "Admins can update partner logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'partner-logos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete partner logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'partner-logos' AND has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_partners_updated_at
BEFORE UPDATE ON public.partners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();