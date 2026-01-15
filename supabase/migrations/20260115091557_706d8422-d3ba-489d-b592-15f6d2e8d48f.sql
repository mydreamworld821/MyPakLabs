-- Create homepage_sections table for full layout control
CREATE TABLE public.homepage_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT,
  is_visible BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  
  -- Layout controls
  columns_desktop INTEGER DEFAULT 4,
  columns_tablet INTEGER DEFAULT 2,
  columns_mobile INTEGER DEFAULT 1,
  section_padding_x INTEGER DEFAULT 16,
  section_padding_y INTEGER DEFAULT 48,
  items_gap INTEGER DEFAULT 24,
  max_items INTEGER DEFAULT 8,
  
  -- Card controls
  card_width TEXT DEFAULT 'auto',
  card_height INTEGER DEFAULT 280,
  card_border_radius INTEGER DEFAULT 12,
  card_shadow TEXT DEFAULT 'md',
  
  -- Image controls
  image_height INTEGER DEFAULT 160,
  image_width TEXT DEFAULT 'full',
  image_position_x INTEGER DEFAULT 50,
  image_position_y INTEGER DEFAULT 50,
  image_fit TEXT DEFAULT 'cover',
  image_border_radius INTEGER DEFAULT 8,
  
  -- Style controls
  background_color TEXT DEFAULT 'transparent',
  background_gradient TEXT,
  text_color TEXT DEFAULT 'inherit',
  accent_color TEXT,
  
  -- Section type
  section_type TEXT DEFAULT 'grid',
  
  -- Custom section content (for dynamic sections)
  custom_content JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Homepage sections are publicly readable" 
ON public.homepage_sections 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage homepage sections" 
ON public.homepage_sections 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_roles.user_id = auth.uid() 
  AND user_roles.role = 'admin'::app_role
));

-- Insert default sections
INSERT INTO public.homepage_sections (section_key, title, subtitle, display_order, columns_desktop, card_height, image_height, section_type) VALUES
('service_cards', 'Our Services', 'Access quality healthcare services', 1, 4, 200, 100, 'grid'),
('featured_labs', 'Featured Labs', 'Partner with the best diagnostic labs', 2, 6, 280, 140, 'grid'),
('featured_doctors', 'Top Doctors', 'Consult with verified specialists', 3, 4, 320, 180, 'carousel'),
('featured_nurses', 'Home Nursing', 'Professional care at your doorstep', 4, 4, 300, 160, 'carousel'),
('surgeries', 'Surgeries', 'Affordable surgical procedures', 5, 4, 240, 140, 'grid');

-- Create trigger for updated_at
CREATE TRIGGER update_homepage_sections_updated_at
BEFORE UPDATE ON public.homepage_sections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();