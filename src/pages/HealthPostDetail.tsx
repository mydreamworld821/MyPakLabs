import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDoctorProfile } from "@/hooks/useDoctorProfile";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import {
  Heart,
  MessageCircle,
  Share2,
  Eye,
  Clock,
  User,
  BadgeCheck,
  Send,
  ThumbsUp,
  Reply,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

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

const HealthPostDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { doctorProfile } = useDoctorProfile();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

  const { data: post, isLoading } = useQuery({
    queryKey: ["health-post", postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("health_posts")
        .select(`
          *,
          doctor:doctors(id, full_name, photo_url, specialization:doctor_specializations(name))
        `)
        .eq("id", postId)
        .eq("is_published", true)
        .single();
      if (error) throw error;
      return data as HealthPost;
    },
    enabled: !!postId,
  });

  const { data: comments } = useQuery({
    queryKey: ["post-comments", postId],
    queryFn: async () => {
      if (!postId) return [];
      const { data, error } = await supabase
        .from("health_post_comments")
        .select(`
          *,
          doctor:doctors(full_name, photo_url)
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      if (error) throw error;

      const userIds = [...new Set(data.filter(c => !c.is_doctor_reply).map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);

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
    enabled: !!postId,
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
      queryClient.invalidateQueries({ queryKey: ["health-post", postId] });
      queryClient.invalidateQueries({ queryKey: ["user-post-likes"] });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async ({ content, parentId }: { content: string; parentId?: string }) => {
      if (!user || !postId) throw new Error("Please login to comment");
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
      queryClient.invalidateQueries({ queryKey: ["post-comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["health-post", postId] });
      setCommentText("");
      setReplyText("");
      setReplyingTo(null);
      toast({ title: "Success", description: "Comment posted!" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const sharePost = () => {
    if (!post) return;
    const url = window.location.href;
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
            <div className="flex items-center gap-2 flex-wrap">
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
                    if (replyText.trim()) {
                      commentMutation.mutate({ content: replyText, parentId: comment.id });
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 pb-8">
          <div className="container mx-auto px-4 text-center py-16">
            Loading post...
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 pb-8">
          <div className="container mx-auto px-4 text-center py-16">
            <p className="text-muted-foreground">Post not found</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate("/health-hub")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Health Hub
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isLiked = userLikes?.includes(post.id);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4"
            onClick={() => navigate("/health-hub")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Health Hub
          </Button>

          <article>
            <div className="flex items-center gap-3 mb-4">
              {post.author_type === "doctor" && post.doctor && (
                <>
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={post.doctor.photo_url || ""} />
                    <AvatarFallback>
                      <User className="w-5 h-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Dr. {post.doctor.full_name}</span>
                      <BadgeCheck className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {post.doctor.specialization?.name}
                    </span>
                  </div>
                </>
              )}
              {post.author_type === "admin" && (
                <Badge variant="secondary">Admin Post</Badge>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-bold mb-4">{post.title}</h1>

            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {format(new Date(post.updated_at), "MMM d, yyyy 'at' h:mm a")}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {post.views_count} views
              </span>
            </div>

            {post.featured_image_url && (
              <div className="rounded-lg overflow-hidden mb-6">
                <img
                  src={post.featured_image_url}
                  alt={post.title}
                  className="w-full h-auto max-h-[400px] object-cover"
                />
              </div>
            )}

            <div
              className="prose prose-sm dark:prose-invert max-w-none mb-6"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex items-center gap-6 py-4 border-y">
              <button
                className={`flex items-center gap-2 ${isLiked ? "text-red-500" : "text-muted-foreground hover:text-red-500"}`}
                onClick={() => likeMutation.mutate(post.id)}
              >
                <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
                {post.likes_count} Likes
              </button>
              <span className="flex items-center gap-2 text-muted-foreground">
                <MessageCircle className="w-5 h-5" />
                {post.comments_count} Comments
              </span>
              <button
                className="flex items-center gap-2 text-muted-foreground hover:text-primary ml-auto"
                onClick={sharePost}
              >
                <Share2 className="w-5 h-5" />
                Share
              </button>
            </div>

            <div className="mt-6">
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
                        commentMutation.mutate({ content: commentText });
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
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default HealthPostDetail;
