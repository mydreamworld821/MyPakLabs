-- Add google_maps_url column to medical_stores table for easy directions
ALTER TABLE public.medical_stores 
ADD COLUMN google_maps_url text;