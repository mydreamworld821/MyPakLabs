
-- Create app_versions table for APK management
CREATE TABLE public.app_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  version_name TEXT NOT NULL,
  version_code INTEGER NOT NULL,
  file_url TEXT NOT NULL,
  file_size_mb NUMERIC,
  release_notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  download_count INTEGER NOT NULL DEFAULT 0,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_versions ENABLE ROW LEVEL SECURITY;

-- Anyone can view active versions
CREATE POLICY "Anyone can view active app versions"
ON public.app_versions FOR SELECT
USING (is_active = true);

-- Admins can manage all versions
CREATE POLICY "Admins can manage app versions"
ON public.app_versions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for APK files
INSERT INTO storage.buckets (id, name, public)
VALUES ('app-releases', 'app-releases', true);

-- Allow anyone to download APK files
CREATE POLICY "Anyone can download APK files"
ON storage.objects FOR SELECT
USING (bucket_id = 'app-releases');

-- Only admins can upload APK files
CREATE POLICY "Admins can upload APK files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'app-releases' AND has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete APK files
CREATE POLICY "Admins can delete APK files"
ON storage.objects FOR DELETE
USING (bucket_id = 'app-releases' AND has_role(auth.uid(), 'admin'::app_role));
