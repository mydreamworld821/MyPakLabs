import { useReviews, ReviewEntityType } from "@/hooks/useReviews";
import { ReviewCard } from "./ReviewCard";
import { ReviewForm } from "./ReviewForm";
import { StarRating } from "./StarRating";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare } from "lucide-react";

interface ReviewsSectionProps {
  entityType: ReviewEntityType;
  entityId?: string | null;
  entityName: string;
  showForm?: boolean;
}

export const ReviewsSection = ({
  entityType,
  entityId,
  entityName,
  showForm = true,
}: ReviewsSectionProps) => {
  const { reviews, isLoading, userReview, submitReview, updateReview, deleteReview, averageRating, reviewCount } =
    useReviews(entityType, entityId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Patient Reviews
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
      {showForm && (
        <ReviewForm
          entityName={entityName}
          onSubmit={(data) => submitReview.mutate(data)}
          onUpdate={(data) => updateReview.mutate(data)}
          onDelete={(reviewId) => deleteReview.mutate(reviewId)}
          isSubmitting={submitReview.isPending}
          isUpdating={updateReview.isPending}
          isDeleting={deleteReview.isPending}
          existingReview={userReview}
        />
      )}

      {/* Reviews Grid */}
      {reviews && reviews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No reviews yet. Be the first to share your experience!</p>
        </div>
      )}
    </div>
  );
};
