-- Make chat-media bucket public so files can be accessed
UPDATE storage.buckets 
SET public = true 
WHERE id = 'chat-media';

-- Ensure RLS policy exists for public read access
DROP POLICY IF EXISTS "Public can view chat media" ON storage.objects;
CREATE POLICY "Public can view chat media"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-media');

-- Ensure authenticated users can upload
DROP POLICY IF EXISTS "Authenticated users can upload chat media" ON storage.objects;
CREATE POLICY "Authenticated users can upload chat media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-media' 
  AND auth.uid() IS NOT NULL
);

-- Allow users to update/delete their own uploads
DROP POLICY IF EXISTS "Users can manage own chat media" ON storage.objects;
CREATE POLICY "Users can manage own chat media"
ON storage.objects FOR ALL
USING (
  bucket_id = 'chat-media' 
  AND auth.uid() IS NOT NULL
);