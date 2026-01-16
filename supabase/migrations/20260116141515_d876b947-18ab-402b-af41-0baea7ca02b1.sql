
-- Health Hub Posts table
CREATE TABLE public.health_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  featured_image_url TEXT,
  author_id UUID NOT NULL,
  author_type TEXT NOT NULL CHECK (author_type IN ('admin', 'doctor')),
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  is_published BOOLEAN NOT NULL DEFAULT false,
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  views_count INTEGER NOT NULL DEFAULT 0,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Health Post Comments table (supports threading)
CREATE TABLE public.health_post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.health_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  parent_comment_id UUID REFERENCES public.health_post_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_doctor_reply BOOLEAN NOT NULL DEFAULT false,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Health Post Likes table
CREATE TABLE public.health_post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.health_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Comment Likes table
CREATE TABLE public.health_comment_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.health_post_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Enable RLS
ALTER TABLE public.health_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_comment_likes ENABLE ROW LEVEL SECURITY;

-- Posts policies
CREATE POLICY "Anyone can view published posts" ON public.health_posts
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage all posts" ON public.health_posts
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Doctors can create posts" ON public.health_posts
  FOR INSERT WITH CHECK (
    author_type = 'doctor' AND 
    EXISTS (SELECT 1 FROM public.doctors WHERE id = doctor_id AND user_id = auth.uid() AND status = 'approved')
  );

CREATE POLICY "Doctors can update own posts" ON public.health_posts
  FOR UPDATE USING (
    author_type = 'doctor' AND 
    EXISTS (SELECT 1 FROM public.doctors WHERE id = doctor_id AND user_id = auth.uid())
  );

CREATE POLICY "Doctors can delete own posts" ON public.health_posts
  FOR DELETE USING (
    author_type = 'doctor' AND 
    EXISTS (SELECT 1 FROM public.doctors WHERE id = doctor_id AND user_id = auth.uid())
  );

-- Comments policies
CREATE POLICY "Anyone can view comments" ON public.health_post_comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" ON public.health_post_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON public.health_post_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON public.health_post_comments
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all comments" ON public.health_post_comments
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Post Likes policies
CREATE POLICY "Anyone can view likes" ON public.health_post_likes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like" ON public.health_post_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike" ON public.health_post_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Comment Likes policies
CREATE POLICY "Anyone can view comment likes" ON public.health_comment_likes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like comments" ON public.health_comment_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike comments" ON public.health_comment_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_health_posts_updated_at
  BEFORE UPDATE ON public.health_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_health_post_comments_updated_at
  BEFORE UPDATE ON public.health_post_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update post likes count
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.health_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.health_posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_post_likes_count
  AFTER INSERT OR DELETE ON public.health_post_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_post_likes_count();

-- Function to update post comments count
CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.health_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.health_posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_post_comments_count
  AFTER INSERT OR DELETE ON public.health_post_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_post_comments_count();

-- Function to update comment likes count
CREATE OR REPLACE FUNCTION public.update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.health_post_comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.health_post_comments SET likes_count = likes_count - 1 WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_comment_likes_count
  AFTER INSERT OR DELETE ON public.health_comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_comment_likes_count();

-- Create storage bucket for health post images
INSERT INTO storage.buckets (id, name, public) VALUES ('health-posts', 'health-posts', true);

CREATE POLICY "Anyone can view health post images" ON storage.objects
  FOR SELECT USING (bucket_id = 'health-posts');

CREATE POLICY "Admins can upload health post images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'health-posts' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Doctors can upload health post images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'health-posts' AND 
    EXISTS (SELECT 1 FROM public.doctors WHERE user_id = auth.uid() AND status = 'approved')
  );

CREATE POLICY "Admins can delete health post images" ON storage.objects
  FOR DELETE USING (bucket_id = 'health-posts' AND public.has_role(auth.uid(), 'admin'));
