import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDoctorProfile } from "@/hooks/useDoctorProfile";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import {
  Heart,
  MessageCircle,
  Share2,
  Clock,
  User,
  BadgeCheck,
  Plus,
} from "lucide-react";
import { format } from "date-fns";
import ImageUpload from "@/components/admin/ImageUpload";

interface HealthPost {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  featured_image_url: string | null;
  author_id: string;
  author_type: string;
  doctor_id: string | null;
  is_published: boolean;
  likes_count: number;
  comments_count: number;
  views_count: number;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  doctor?: {
    id: string;
    full_name: string;
    photo_url: string | null;
    specialization: { name: string } | null;
  } | null;
}

const HealthHub = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { doctorProfile, isApprovedDoctor } = useDoctorProfile();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    excerpt: "",
    featured_image_url: "",
    is_published: true,
    tags: "",
  });

  const { data: posts, isLoading } = useQuery({
    queryKey: ["health-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("health_posts")
        .select(`
          *,
          doctor:doctors(id, full_name, photo_url, specialization:doctor_specializations(name))
        `)
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as HealthPost[];
    },
  });

  const { data: userLikes } = useQuery({
    queryKey: ["user-post-likes", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("health_post_likes")
        .select("post_id")
        .eq("user_id", user.id);
      if (error) throw error;
      return data.map((l) => l.post_id);
    },
    enabled: !!user,
  });

  const likeMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (!user) throw new Error("Please login to like posts");
      const isLiked = userLikes?.includes(postId);
      if (isLiked) {
        await supabase.from("health_post_likes").delete().eq("post_id", postId).eq("user_id", user.id);
      } else {
        await supabase.from("health_post_likes").insert({ post_id: postId, user_id: user.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health-posts"] });
      queryClient.invalidateQueries({ queryKey: ["user-post-likes"] });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user) throw new Error("Not authenticated");
      if (!doctorProfile) throw new Error("Only verified doctors can post");

      const { error } = await supabase.from("health_posts").insert({
        title: data.title,
        content: data.content,
        excerpt: data.excerpt || null,
        featured_image_url: data.featured_image_url || null,
        is_published: data.is_published,
        tags: data.tags ? data.tags.split(",").map((t) => t.trim()) : null,
        author_id: user.id,
        author_type: "doctor",
        doctor_id: doctorProfile.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health-posts"] });
      toast({ title: "Success", description: "Post created successfully!" });
      setIsCreateDialogOpen(false);
      setFormData({ title: "", content: "", excerpt: "", featured_image_url: "", is_published: true, tags: "" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const sharePost = (e: React.MouseEvent, post: HealthPost) => {
    e.stopPropagation();
    const url = `${window.location.origin}/health-hub/${post.id}`;
    if (navigator.share) {
      navigator.share({ title: post.title, text: post.excerpt || "", url });
    } else {
      navigator.clipboard.writeText(url);
      toast({ title: "Link copied!", description: "Share this post with others" });
    }
  };

  const handleLike = (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    likeMutation.mutate(postId);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Health Hub</h1>
              <p className="text-muted-foreground text-sm">Health stories, tips, and discussions</p>
            </div>
            {isApprovedDoctor && (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Write Post
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create Health Post</DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      createPostMutation.mutate(formData);
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Enter post title"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="excerpt">Summary</Label>
                      <Textarea
                        id="excerpt"
                        value={formData.excerpt}
                        onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                        placeholder="Brief summary"
                        rows={2}
                      />
                    </div>
                    <ImageUpload
                      label="Featured Image"
                      bucket="health-posts"
                      folder="featured"
                      currentUrl={formData.featured_image_url}
                      onUpload={(url) => setFormData({ ...formData, featured_image_url: url })}
                      aspectRatio="banner"
                      skipCrop={true}
                    />
                    <div>
                      <Label htmlFor="content">Content</Label>
                      <Textarea
                        id="content"
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        placeholder="Write your health article..."
                        rows={12}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="tags">Tags (comma separated)</Label>
                      <Input
                        id="tags"
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                        placeholder="health, nutrition, fitness"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_published"
                        checked={formData.is_published}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                      />
                      <Label htmlFor="is_published">Publish immediately</Label>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createPostMutation.isPending}>
                        Publish Post
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {isLoading ? (
            <div className="text-center py-16">Loading posts...</div>
          ) : posts?.length === 0 ? (
            <div className="max-w-md mx-auto text-center py-16">
              <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No health posts yet. Check back soon!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts?.map((post) => {
                const isLiked = userLikes?.includes(post.id);
                return (
                  <div
                    key={post.id}
                    className="flex gap-3 p-3 bg-card rounded-lg border hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/health-hub/${post.id}`)}
                  >
                    {post.featured_image_url && (
                      <div className="w-20 h-20 flex-shrink-0 rounded-md overflow-hidden">
                        <img
                          src={post.featured_image_url}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {post.author_type === "doctor" && post.doctor && (
                          <>
                            <Avatar className="w-5 h-5">
                              <AvatarImage src={post.doctor.photo_url || ""} />
                              <AvatarFallback>
                                <User className="w-3 h-3" />
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground truncate">
                              Dr. {post.doctor.full_name}
                            </span>
                            <BadgeCheck className="w-3 h-3 text-primary flex-shrink-0" />
                          </>
                        )}
                        {post.author_type === "admin" && (
                          <Badge variant="secondary" className="text-xs py-0">Admin</Badge>
                        )}
                        <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto flex-shrink-0">
                          <Clock className="w-3 h-3" />
                          {format(new Date(post.updated_at), "MMM d")}
                        </span>
                      </div>
                      <h3 className="font-medium text-sm line-clamp-1 mb-1">{post.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {post.excerpt || post.content.replace(/<[^>]*>/g, "").slice(0, 100)}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <button
                          className={`flex items-center gap-1 text-xs ${isLiked ? "text-red-500" : "text-muted-foreground hover:text-red-500"} transition-colors`}
                          onClick={(e) => handleLike(e, post.id)}
                        >
                          <Heart className={`w-3 h-3 ${isLiked ? "fill-current" : ""}`} />
                          {post.likes_count}
                        </button>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MessageCircle className="w-3 h-3" />
                          {post.comments_count}
                        </span>
                        <button
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                          onClick={(e) => sharePost(e, post)}
                        >
                          <Share2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default HealthHub;
