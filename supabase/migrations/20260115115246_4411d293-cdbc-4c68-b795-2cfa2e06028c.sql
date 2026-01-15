-- Create a table for managing page-level layout settings
CREATE TABLE public.page_layout_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    page_key TEXT NOT NULL UNIQUE,
    page_title TEXT NOT NULL,
    
    -- Card Layout Settings
    layout_type TEXT DEFAULT 'list', -- 'list', 'grid', 'compact'
    columns_mobile INTEGER DEFAULT 1,
    columns_tablet INTEGER DEFAULT 1,
    columns_desktop INTEGER DEFAULT 1,
    items_gap INTEGER DEFAULT 16,
    
    -- Card Styling
    card_padding INTEGER DEFAULT 24,
    card_border_radius INTEGER DEFAULT 12,
    card_shadow TEXT DEFAULT 'md', -- 'none', 'sm', 'md', 'lg'
    card_min_height INTEGER DEFAULT 120,
    
    -- Logo/Image Settings
    logo_size INTEGER DEFAULT 96,
    logo_border_radius INTEGER DEFAULT 8,
    show_logo_border BOOLEAN DEFAULT true,
    
    -- Content Settings
    show_description BOOLEAN DEFAULT true,
    show_rating BOOLEAN DEFAULT true,
    show_branch_count BOOLEAN DEFAULT true,
    description_lines INTEGER DEFAULT 2,
    
    -- Button Settings
    primary_button_text TEXT DEFAULT 'View Details',
    secondary_button_text TEXT,
    button_width INTEGER DEFAULT 160,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.page_layout_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Anyone can view page layout settings"
ON public.page_layout_settings
FOR SELECT
USING (true);

-- Only admins can modify
CREATE POLICY "Admins can manage page layout settings"
ON public.page_layout_settings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_page_layout_settings_updated_at
BEFORE UPDATE ON public.page_layout_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings for labs page
INSERT INTO public.page_layout_settings (
    page_key,
    page_title,
    layout_type,
    columns_desktop,
    card_padding,
    card_border_radius,
    logo_size,
    primary_button_text,
    secondary_button_text
) VALUES (
    'labs_listing',
    'Labs Directory',
    'list',
    1,
    24,
    12,
    96,
    'Get Discount',
    'View Test Prices'
);