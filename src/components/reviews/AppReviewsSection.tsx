import { useReviews } from "@/hooks/useReviews";
import { AppReviewCard } from "./AppReviewCard";
import { ReviewForm } from "./ReviewForm";
import { StarRating } from "./StarRating";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Smartphone } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const AppReviewsSection = () => {
  const { user } = useAuth();
  const { reviews, isLoading, userReview, submitReview, updateReview, deleteReview, averageRating, reviewCount } =
    useReviews("app");

  // Check if current user is admin
  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            App Reviews
          </h3>
          {reviewCount > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <StarRating rating={Math.round(averageRating)} size="sm" />
              <span className="text-sm text-muted-foreground">
                {averageRating.toFixed(1)} out of 5 ({reviewCount} reviews)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Review Form */}
      <ReviewForm
        entityName="MyPakLabs App"
        onSubmit={(data) => submitReview.mutate(data)}
        onUpdate={(data) => updateReview.mutate(data)}
        onDelete={(reviewId) => deleteReview.mutate(reviewId)}
        isSubmitting={submitReview.isPending}
        isUpdating={updateReview.isPending}
        isDeleting={deleteReview.isPending}
        existingReview={userReview}
      />

      {/* Reviews List - single column */}
      {reviews && reviews.length > 0 ? (
        <div className="space-y-3">
          {reviews.map((review) => (
            <AppReviewCard key={review.id} review={review} isAdmin={isAdmin || false} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No app reviews yet. Be the first to rate the app!</p>
        </div>
      )}
    </div>
  );
};
