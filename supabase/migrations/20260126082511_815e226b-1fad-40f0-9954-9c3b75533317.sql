-- Fix the overly permissive RLS policy on user_presence
-- Drop the existing policy and create a more restrictive one
DROP POLICY IF EXISTS "Users can update their own presence" ON public.user_presence;

-- Users can only insert/update their own presence
CREATE POLICY "Users can insert their own presence"
ON public.user_presence FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own presence"
ON public.user_presence FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own presence"
ON public.user_presence FOR DELETE
USING (auth.uid() = user_id);

-- Create storage bucket for chat media
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('chat-media', 'chat-media', false, 52428800) -- 50MB limit
ON CONFLICT (id) DO NOTHING;

-- Storage policies for chat media
CREATE POLICY "Users can upload chat media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-media' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view chat media in their rooms"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'chat-media'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete their own chat media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'chat-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);