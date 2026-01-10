-- Create storage bucket for lab images
INSERT INTO storage.buckets (id, name, public)
VALUES ('lab-images', 'lab-images', true);

-- Allow anyone to view lab images (public bucket)
CREATE POLICY "Anyone can view lab images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'lab-images');

-- Only admins can upload lab images
CREATE POLICY "Admins can upload lab images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'lab-images' AND has_role(auth.uid(), 'admin'));

-- Only admins can update lab images
CREATE POLICY "Admins can update lab images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'lab-images' AND has_role(auth.uid(), 'admin'));

-- Only admins can delete lab images
CREATE POLICY "Admins can delete lab images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'lab-images' AND has_role(auth.uid(), 'admin'));