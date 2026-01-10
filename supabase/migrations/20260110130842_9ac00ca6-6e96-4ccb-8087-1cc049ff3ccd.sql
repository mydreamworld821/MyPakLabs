-- Create provinces table
CREATE TABLE public.provinces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cities table
CREATE TABLE public.cities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  province_id UUID NOT NULL REFERENCES public.provinces(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(name, province_id)
);

-- Enable RLS
ALTER TABLE public.provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

-- RLS policies for provinces
CREATE POLICY "Anyone can view active provinces"
ON public.provinces
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage provinces"
ON public.provinces
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for cities
CREATE POLICY "Anyone can view active cities"
ON public.cities
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage cities"
ON public.cities
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for better performance
CREATE INDEX idx_cities_province_id ON public.cities(province_id);
CREATE INDEX idx_cities_name ON public.cities(name);
CREATE INDEX idx_provinces_name ON public.provinces(name);

-- Add trigger for updated_at
CREATE TRIGGER update_provinces_updated_at
BEFORE UPDATE ON public.provinces
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cities_updated_at
BEFORE UPDATE ON public.cities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();