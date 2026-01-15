import { useFeaturedReviews } from "@/hooks/useReviews";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { StarRating } from "@/components/reviews/StarRating";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { MessageSquare, ArrowRight } from "lucide-react";

export const PatientTestimonials = () => {
  const { data: reviews, isLoading } = useFeaturedReviews(6);

  if (isLoading) {
    return (
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <Skeleton className="h-8 w-64 mx-auto mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!reviews?.length) {
    return null;
  }

  const avgRating =
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold">
              What Our Patients Say
            </h2>
          </div>
          <div className="flex items-center justify-center gap-2">
            <StarRating rating={Math.round(avgRating)} size="md" />
            <span className="text-muted-foreground">
              {avgRating.toFixed(1)} average from {reviews.length}+ reviews
            </span>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button asChild variant="outline">
            <Link to="/reviews" className="gap-2">
              View All Reviews
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
