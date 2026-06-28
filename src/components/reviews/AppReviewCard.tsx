import { useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "./StarRating";
import { Review } from "@/hooks/useReviews";
import { User, MessageSquare, Send, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface ReviewReply {
  id: string;
  review_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  profiles?: { full_name: string | null; avatar_url: string | null };
}

interface AppReviewCardProps {
  review: Review;
  isAdmin?: boolean;
}

export const AppReviewCard = ({ review, isAdmin = false }: AppReviewCardProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [replyText, setReplyText] = useState("");
  const [showReplyForm, setShowReplyForm] = useState(false);

  const profile = review.profiles;
  const displayName = profile?.full_name || "Anonymous User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Fetch replies for this review
  const { data: replies } = useQuery({
    queryKey: ["review-replies", review.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("review_replies")
        .select("*")
        .eq("review_id", review.id)
        .order("created_at", { ascending: true });
      if (error) throw error;

      // Fetch profiles
      const userIds = [...new Set((data || []).map((r: any) => r.user_id))];
      if (userIds.length === 0) return [] as ReviewReply[];

      const { data: profilesRaw } = await supabase
        .from("public_profiles" as any)
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);
      const profilesData = (profilesRaw || []) as unknown as Array<{ user_id: string; full_name: string | null; avatar_url: string | null }>;

      return (data || []).map((reply: any) => ({
        ...reply,
        profiles: profilesData?.find((p) => p.user_id === reply.user_id) || null,
      })) as ReviewReply[];
    },
  });

  const submitReply = useMutation({
    mutationFn: async (comment: string) => {
      if (!user) throw new Error("Must be logged in");
      const { error } = await supabase
        .from("review_replies")
        .insert({ review_id: review.id, user_id: user.id, comment });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review-replies", review.id] });
      setReplyText("");
      setShowReplyForm(false);
      toast.success("Reply posted!");
    },
    onError: () => toast.error("Failed to post reply"),
  });

  const handleReply = () => {
    if (!replyText.trim()) return;
    submitReply.mutate(replyText.trim());
  };

  return (
    <Card className="border border-border/50 hover:shadow-md transition-shadow duration-300">
      <CardContent className="p-4 space-y-3">
        {/* User info & rating */}
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 ring-2 ring-primary/10">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {initials || <User className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{displayName}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <StarRating rating={review.rating} size="sm" />
              <span className="text-xs text-muted-foreground">
                {format(new Date(review.created_at), "MMM d, yyyy")} •{" "}
                {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>

        {/* Comment */}
        {review.comment && (
          <p className="text-sm text-foreground/80 leading-relaxed pl-[52px]">
            {review.comment}
          </p>
        )}

        {/* Replies */}
        {replies && replies.length > 0 && (
          <div className="pl-[52px] space-y-2">
            {replies.map((reply) => (
              <div
                key={reply.id}
                className="bg-primary/5 border border-primary/10 rounded-lg p-3 space-y-1"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold text-primary">
                    {reply.profiles?.full_name || "MyPakLabs Team"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-foreground/80">{reply.comment}</p>
              </div>
            ))}
          </div>
        )}

        {/* Admin reply button */}
        {isAdmin && (
          <div className="pl-[52px]">
            {showReplyForm ? (
              <div className="space-y-2">
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply as admin..."
                  rows={2}
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleReply}
                    disabled={submitReply.isPending || !replyText.trim()}
                    className="gap-1"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {submitReply.isPending ? "Sending..." : "Reply"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setShowReplyForm(false); setReplyText(""); }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                className="gap-1 text-xs text-muted-foreground hover:text-primary"
                onClick={() => setShowReplyForm(true)}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Reply
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
