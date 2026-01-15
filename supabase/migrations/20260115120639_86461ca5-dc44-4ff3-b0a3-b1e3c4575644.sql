-- Insert page layout settings for other directory pages
INSERT INTO public.page_layout_settings (page_key, page_title, layout_type, columns_mobile, columns_tablet, columns_desktop, items_gap, card_padding, card_border_radius, card_shadow, card_min_height, logo_size, logo_border_radius, show_logo_border, show_description, show_rating, show_branch_count, description_lines, primary_button_text, secondary_button_text, button_width)
VALUES 
  ('doctors_listing', 'Doctors Directory', 'grid', 1, 2, 3, 24, 20, 16, 'md', 280, 120, 60, false, true, true, false, 2, 'Book Appointment', 'View Profile', 140),
  ('hospitals_listing', 'Hospitals Directory', 'list', 1, 1, 1, 20, 24, 12, 'md', 140, 80, 8, true, true, true, true, 2, 'View Details', 'Contact', 150),
  ('nurses_listing', 'Nurses Directory', 'grid', 1, 2, 3, 24, 20, 16, 'md', 300, 100, 50, false, true, true, false, 2, 'Book Nurse', 'View Profile', 140),
  ('pharmacies_listing', 'Pharmacies Directory', 'list', 1, 1, 1, 20, 24, 12, 'md', 120, 72, 8, true, true, true, true, 2, 'Order Medicine', 'View Details', 150)
ON CONFLICT (page_key) DO NOTHING;