import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDoctorProfile } from "@/hooks/useDoctorProfile";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import {
  Heart,
  MessageCircle,
  Share2,
  Eye,
  Clock,
  User,
  BadgeCheck,
  Plus,
  Send,
  ThumbsUp,
  Reply,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
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

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  parent_comment_id: string | null;
  content: string;
  is_doctor_reply: boolean;
  doctor_id: string | null;
  likes_count: number;
  created_at: string;
  profile?: { full_name: string | null } | null;
  doctor?: { full_name: string; photo_url: string | null } | null;
  replies?: Comment[];
}

const HealthHub = () => {
  const { user, isAdmin } = useAuth();
  const { doctorProfile, isApprovedDoctor } = useDoctorProfile();
  const queryClient = useQueryClient();
  const [selectedPost, setSelectedPost] = useState<HealthPost | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
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

  const { data: comments } = useQuery({
    queryKey: ["post-comments", selectedPost?.id],
    queryFn: async () => {
      if (!selectedPost) return [];
      const { data, error } = await supabase
        .from("health_post_comments")
        .select(`
          *,
          doctor:doctors(full_name, photo_url)
        `)
        .eq("post_id", selectedPost.id)
        .order("created_at", { ascending: true });
      if (error) throw error;

      // Fetch user profiles for non-doctor comments
      const userIds = [...new Set(data.filter(c => !c.is_doctor_reply).map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);

      // Organize into threads
      const commentMap = new Map<string, Comment>();
      const rootComments: Comment[] = [];

      data.forEach((comment) => {
        const enrichedComment: Comment = {
          ...comment,
          profile: { full_name: profileMap.get(comment.user_id) || null },
          replies: [],
        };
        commentMap.set(comment.id, enrichedComment);
      });

      data.forEach((comment) => {
        const enrichedComment = commentMap.get(comment.id)!;
        if (comment.parent_comment_id) {
          const parent = commentMap.get(comment.parent_comment_id);
          if (parent) {
            parent.replies?.push(enrichedComment);
          }
        } else {
          rootComments.push(enrichedComment);
        }
      });

      return rootComments;
    },
    enabled: !!selectedPost,
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

  const commentMutation = useMutation({
    mutationFn: async ({ postId, content, parentId }: { postId: string; content: string; parentId?: string }) => {
      if (!user) throw new Error("Please login to comment");
      const { error } = await supabase.from("health_post_comments").insert({
        post_id: postId,
        user_id: user.id,
        content,
        parent_comment_id: parentId || null,
        is_doctor_reply: !!doctorProfile,
        doctor_id: doctorProfile?.id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post-comments"] });
      queryClient.invalidateQueries({ queryKey: ["health-posts"] });
      setCommentText("");
      setReplyText("");
      setReplyingTo(null);
      toast({ title: "Success", description: "Comment posted!" });
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

  const sharePost = (post: HealthPost) => {
    const url = `${window.location.origin}/health-hub?post=${post.id}`;
    if (navigator.share) {
      navigator.share({ title: post.title, text: post.excerpt || "", url });
    } else {
      navigator.clipboard.writeText(url);
      toast({ title: "Link copied!", description: "Share this post with others" });
    }
  };

  const toggleReplies = (commentId: string) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedComments(newExpanded);
  };

  const renderComment = (comment: Comment, depth = 0) => {
    const isDoctor = comment.is_doctor_reply && comment.doctor;
    const authorName = isDoctor ? comment.doctor?.full_name : comment.profile?.full_name || "Anonymous";
    const hasReplies = comment.replies && comment.replies.length > 0;

    return (
      <div key={comment.id} className={`${depth > 0 ? "ml-8 border-l-2 border-muted pl-4" : ""}`}>
        <div className="flex gap-3 py-3">
          <Avatar className="w-8 h-8">
            {isDoctor && comment.doctor?.photo_url ? (
              <AvatarImage src={comment.doctor.photo_url} />
            ) : null}
            <AvatarFallback>
              <User className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{authorName}</span>
              {isDoctor && (
                <Badge variant="secondary" className="text-xs">
                  <BadgeCheck className="w-3 h-3 mr-1" />
                  Verified Doctor
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </span>
            </div>
            <p className="text-sm mt-1">{comment.content}</p>
            <div className="flex items-center gap-4 mt-2">
              <button className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                <ThumbsUp className="w-3 h-3" /> {comment.likes_count}
              </button>
              {user && (
                <button
                  className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                >
                  <Reply className="w-3 h-3" /> Reply
                </button>
              )}
              {hasReplies && (
                <button
                  className="text-xs text-primary flex items-center gap-1"
                  onClick={() => toggleReplies(comment.id)}
                >
                  {expandedComments.has(comment.id) ? (
                    <>
                      <ChevronUp className="w-3 h-3" /> Hide {comment.replies?.length} replies
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" /> Show {comment.replies?.length} replies
                    </>
                  )}
                </button>
              )}
            </div>

            {replyingTo === comment.id && (
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Write a reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    if (replyText.trim() && selectedPost) {
                      commentMutation.mutate({
                        postId: selectedPost.id,
                        content: replyText,
                        parentId: comment.id,
                      });
                    }
                  }}
                  disabled={commentMutation.isPending}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {hasReplies && expandedComments.has(comment.id) && (
          <div>{comment.replies?.map((reply) => renderComment(reply, depth + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Health Hub</h1>
              <p className="text-muted-foreground">Health stories, tips, and discussions</p>
            </div>
            {isApprovedDoctor && (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
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
            <Card className="max-w-md mx-auto">
              <CardContent className="p-6 text-center">
                <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No health posts yet. Check back soon!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts?.map((post) => {
                const isLiked = userLikes?.includes(post.id);
                return (
                  <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    {post.featured_image_url && (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={post.featured_image_url}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2 mb-2">
                        {post.author_type === "doctor" && post.doctor && (
                          <>
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={post.doctor.photo_url || ""} />
                              <AvatarFallback>
                                <User className="w-3 h-3" />
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">
                              Dr. {post.doctor.full_name}
                            </span>
                            <BadgeCheck className="w-4 h-4 text-primary" />
                          </>
                        )}
                        {post.author_type === "admin" && (
                          <Badge variant="secondary">Admin</Badge>
                        )}
                      </div>
                      <CardTitle
                        className="text-lg cursor-pointer hover:text-primary transition-colors line-clamp-2"
                        onClick={() => setSelectedPost(post)}
                      >
                        {post.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {post.excerpt || post.content.replace(/<[^>]*>/g, "").slice(0, 150)}
                      </p>
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {post.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="pt-2 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <button
                          className={`flex items-center gap-1 text-sm ${isLiked ? "text-red-500" : "text-muted-foreground hover:text-red-500"} transition-colors`}
                          onClick={() => likeMutation.mutate(post.id)}
                        >
                          <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
                          {post.likes_count}
                        </button>
                        <button
                          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                          onClick={() => setSelectedPost(post)}
                        >
                          <MessageCircle className="w-4 h-4" />
                          {post.comments_count}
                        </button>
                        <button
                          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                          onClick={() => sharePost(post)}
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(post.updated_at), "MMM d")}
                      </span>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Post Detail Dialog */}
        <Dialog open={!!selectedPost} onOpenChange={(open) => !open && setSelectedPost(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {selectedPost && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2 mb-2">
                    {selectedPost.author_type === "doctor" && selectedPost.doctor && (
                      <>
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={selectedPost.doctor.photo_url || ""} />
                          <AvatarFallback>
                            <User className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="font-medium">Dr. {selectedPost.doctor.full_name}</span>
                          <span className="text-xs text-muted-foreground block">
                            {selectedPost.doctor.specialization?.name}
                          </span>
                        </div>
                        <BadgeCheck className="w-5 h-5 text-primary" />
                      </>
                    )}
                    {selectedPost.author_type === "admin" && (
                      <Badge variant="secondary">Admin Post</Badge>
                    )}
                  </div>
                  <DialogTitle className="text-xl">{selectedPost.title}</DialogTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Updated {format(new Date(selectedPost.updated_at), "MMM d, yyyy 'at' h:mm a")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {selectedPost.views_count} views
                    </span>
                  </div>
                </DialogHeader>

                {selectedPost.featured_image_url && (
                  <div className="rounded-lg overflow-hidden my-4">
                    <img
                      src={selectedPost.featured_image_url}
                      alt={selectedPost.title}
                      className="w-full h-auto"
                    />
                  </div>
                )}

                <div
                  className="prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedPost.content }}
                />

                {selectedPost.tags && selectedPost.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {selectedPost.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-6 mt-4 py-4 border-y">
                  <button
                    className={`flex items-center gap-2 ${userLikes?.includes(selectedPost.id) ? "text-red-500" : "text-muted-foreground hover:text-red-500"}`}
                    onClick={() => likeMutation.mutate(selectedPost.id)}
                  >
                    <Heart className={`w-5 h-5 ${userLikes?.includes(selectedPost.id) ? "fill-current" : ""}`} />
                    {selectedPost.likes_count} Likes
                  </button>
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <MessageCircle className="w-5 h-5" />
                    {selectedPost.comments_count} Comments
                  </span>
                  <button
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary ml-auto"
                    onClick={() => sharePost(selectedPost)}
                  >
                    <Share2 className="w-5 h-5" />
                    Share
                  </button>
                </div>

                <div className="mt-4">
                  <h3 className="font-semibold mb-4">Comments</h3>
                  
                  {user ? (
                    <div className="flex gap-2 mb-4">
                      <Input
                        placeholder="Write a comment..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        onClick={() => {
                          if (commentText.trim()) {
                            commentMutation.mutate({
                              postId: selectedPost.id,
                              content: commentText,
                            });
                          }
                        }}
                        disabled={commentMutation.isPending}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mb-4">
                      Please login to join the discussion.
                    </p>
                  )}

                  <div className="space-y-1">
                    {comments?.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No comments yet. Be the first to share your thoughts!
                      </p>
                    ) : (
                      comments?.map((comment) => renderComment(comment))
                    )}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
};

export default HealthHub;
