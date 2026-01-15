-- Add layout settings columns to quick_access_services table (for section-wide settings)
-- We'll store these in homepage_sections table for the quick_access section

-- First, let's add the quick_access section if it doesn't exist
INSERT INTO homepage_sections (section_key, title, is_visible, display_order)
VALUES ('quick_access', 'Quick Access', true, 5)
ON CONFLICT (section_key) DO NOTHING;

-- Add new layout columns to homepage_sections for quick access
ALTER TABLE homepage_sections 
ADD COLUMN IF NOT EXISTS icon_container_size integer DEFAULT 56,
ADD COLUMN IF NOT EXISTS icon_size integer DEFAULT 24,
ADD COLUMN IF NOT EXISTS show_labels boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS justify_content text DEFAULT 'center',
ADD COLUMN IF NOT EXISTS layout_mode text DEFAULT 'auto';