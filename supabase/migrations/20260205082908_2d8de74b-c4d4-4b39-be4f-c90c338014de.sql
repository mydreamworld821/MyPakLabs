-- Create doctor profile videos table
CREATE TABLE public.doctor_profile_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  title TEXT,
  description TEXT,
  duration_seconds INTEGER NOT NULL CHECK (duration_seconds <= 60),
  views_count INTEGER NOT NULL DEFAULT 0,
  likes_count INTEGER NOT NULL DEFAULT 0,
  helpful_count INTEGER NOT NULL DEFAULT 0,
  hearts_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(doctor_id) -- One video per doctor
);

-- Create video reactions table for tracking user reactions
CREATE TABLE public.doctor_video_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.doctor_profile_videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'helpful', 'heart')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(video_id, user_id) -- One reaction per user per video
);

-- Create video views tracking table
CREATE TABLE public.doctor_video_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.doctor_profile_videos(id) ON DELETE CASCADE,
  user_id UUID,
  ip_hash TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.doctor_profile_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_video_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_video_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for doctor_profile_videos
CREATE POLICY "Anyone can view active doctor videos"
ON public.doctor_profile_videos
FOR SELECT
USING (is_active = true);

CREATE POLICY "Doctors can manage their own video"
ON public.doctor_profile_videos
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.doctors
    WHERE doctors.id = doctor_profile_videos.doctor_id
    AND doctors.user_id = auth.uid()
  )
);

-- RLS Policies for doctor_video_reactions
CREATE POLICY "Anyone can view reactions"
ON public.doctor_video_reactions
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can add reactions"
ON public.doctor_video_reactions
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can update their own reactions"
ON public.doctor_video_reactions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions"
ON public.doctor_video_reactions
FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for doctor_video_views
CREATE POLICY "Anyone can insert views"
ON public.doctor_video_views
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view video views"
ON public.doctor_video_views
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_doctor_profile_videos_updated_at
BEFORE UPDATE ON public.doctor_profile_videos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to increment view count
CREATE OR REPLACE FUNCTION public.increment_video_view(video_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE doctor_profile_videos
  SET views_count = views_count + 1
  WHERE id = video_uuid;
END;
$$;

-- Function to update reaction counts
CREATE OR REPLACE FUNCTION public.update_video_reaction_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.reaction_type = 'like' THEN
      UPDATE doctor_profile_videos SET likes_count = likes_count + 1 WHERE id = NEW.video_id;
    ELSIF NEW.reaction_type = 'helpful' THEN
      UPDATE doctor_profile_videos SET helpful_count = helpful_count + 1 WHERE id = NEW.video_id;
    ELSIF NEW.reaction_type = 'heart' THEN
      UPDATE doctor_profile_videos SET hearts_count = hearts_count + 1 WHERE id = NEW.video_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.reaction_type = 'like' THEN
      UPDATE doctor_profile_videos SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.video_id;
    ELSIF OLD.reaction_type = 'helpful' THEN
      UPDATE doctor_profile_videos SET helpful_count = GREATEST(0, helpful_count - 1) WHERE id = OLD.video_id;
    ELSIF OLD.reaction_type = 'heart' THEN
      UPDATE doctor_profile_videos SET hearts_count = GREATEST(0, hearts_count - 1) WHERE id = OLD.video_id;
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Decrement old reaction
    IF OLD.reaction_type = 'like' THEN
      UPDATE doctor_profile_videos SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.video_id;
    ELSIF OLD.reaction_type = 'helpful' THEN
      UPDATE doctor_profile_videos SET helpful_count = GREATEST(0, helpful_count - 1) WHERE id = OLD.video_id;
    ELSIF OLD.reaction_type = 'heart' THEN
      UPDATE doctor_profile_videos SET hearts_count = GREATEST(0, hearts_count - 1) WHERE id = OLD.video_id;
    END IF;
    -- Increment new reaction
    IF NEW.reaction_type = 'like' THEN
      UPDATE doctor_profile_videos SET likes_count = likes_count + 1 WHERE id = NEW.video_id;
    ELSIF NEW.reaction_type = 'helpful' THEN
      UPDATE doctor_profile_videos SET helpful_count = helpful_count + 1 WHERE id = NEW.video_id;
    ELSIF NEW.reaction_type = 'heart' THEN
      UPDATE doctor_profile_videos SET hearts_count = hearts_count + 1 WHERE id = NEW.video_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for reaction counts
CREATE TRIGGER update_reaction_counts_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.doctor_video_reactions
FOR EACH ROW
EXECUTE FUNCTION public.update_video_reaction_counts();

-- Create storage bucket for doctor videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'doctor-videos',
  'doctor-videos',
  true,
  52428800, -- 50MB limit
  ARRAY['video/mp4', 'video/webm']
);

-- Storage policies for doctor-videos bucket
CREATE POLICY "Doctor videos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'doctor-videos');

CREATE POLICY "Doctors can upload their own videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'doctor-videos' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.doctors
    WHERE doctors.user_id = auth.uid()
  )
);

CREATE POLICY "Doctors can update their own videos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'doctor-videos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Doctors can delete their own videos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'doctor-videos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);