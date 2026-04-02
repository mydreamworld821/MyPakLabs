
-- Add 'app' to the review_entity_type enum
ALTER TYPE public.review_entity_type ADD VALUE IF NOT EXISTS 'app';

-- Create review_replies table for admin replies to reviews
CREATE TABLE public.review_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.review_replies ENABLE ROW LEVEL SECURITY;

-- Anyone can view replies
CREATE POLICY "Anyone can view review replies"
  ON public.review_replies FOR SELECT
  USING (true);

-- Only admins can create replies
CREATE POLICY "Admins can create review replies"
  ON public.review_replies FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can update their own replies
CREATE POLICY "Admins can update review replies"
  ON public.review_replies FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete review replies
CREATE POLICY "Admins can delete review replies"
  ON public.review_replies FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));
