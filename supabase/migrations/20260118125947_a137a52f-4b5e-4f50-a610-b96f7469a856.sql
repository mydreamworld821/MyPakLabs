-- Create health_packages table for lab-specific health packages
CREATE TABLE public.health_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lab_id UUID NOT NULL REFERENCES public.labs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  original_price NUMERIC NOT NULL DEFAULT 0,
  discount_percentage NUMERIC DEFAULT 0,
  discounted_price NUMERIC NOT NULL DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  featured_order INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create package_tests junction table to link packages with tests
CREATE TABLE public.package_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id UUID NOT NULL REFERENCES public.health_packages(id) ON DELETE CASCADE,
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  test_price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(package_id, test_id)
);

-- Enable RLS
ALTER TABLE public.health_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_tests ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Health packages are viewable by everyone" 
ON public.health_packages 
FOR SELECT 
USING (true);

CREATE POLICY "Package tests are viewable by everyone" 
ON public.package_tests 
FOR SELECT 
USING (true);

-- Create policies for admin write access
CREATE POLICY "Admins can manage health packages" 
ON public.health_packages 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage package tests" 
ON public.package_tests 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create triggers for updated_at
CREATE TRIGGER update_health_packages_updated_at
BEFORE UPDATE ON public.health_packages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_health_packages_lab_id ON public.health_packages(lab_id);
CREATE INDEX idx_health_packages_is_featured ON public.health_packages(is_featured) WHERE is_featured = true;
CREATE INDEX idx_package_tests_package_id ON public.package_tests(package_id);
CREATE INDEX idx_package_tests_test_id ON public.package_tests(test_id);