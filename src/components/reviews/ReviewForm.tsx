import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StarRating } from "./StarRating";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { MessageSquarePlus, Clock, CheckCircle2 } from "lucide-react";
import { Review } from "@/hooks/useReviews";
import { Badge } from "@/components/ui/badge";

interface ReviewFormProps {
  entityName: string;
  onSubmit: (data: { rating: number; comment: string }) => void;
  isSubmitting?: boolean;
  existingReview?: Review | null;
}

export const ReviewForm = ({
  entityName,
  onSubmit,
  isSubmitting = false,
  existingReview,
}: ReviewFormProps) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    onSubmit({ rating, comment });
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center space-y-3">
          <MessageSquarePlus className="h-10 w-10 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">
            Please login to share your experience
          </p>
          <Button asChild>
            <Link to="/auth">Login to Review</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (existingReview) {
    return (
      <Card>
        <CardContent className="p-6 space-y-3">
          <div className="flex items-center gap-2">
            {existingReview.status === 'pending' ? (
              <>
                <Clock className="h-5 w-5 text-yellow-500" />
                <span className="font-medium">Your review is pending approval</span>
              </>
            ) : existingReview.status === 'approved' ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="font-medium">Your review has been published</span>
              </>
            ) : (
              <Badge variant="destructive">Review was rejected</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <StarRating rating={existingReview.rating} size="sm" />
            <span className="text-sm text-muted-foreground">
              ({existingReview.rating}/5)
            </span>
          </div>
          {existingReview.comment && (
            <p className="text-sm text-muted-foreground italic">
              "{existingReview.comment}"
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquarePlus className="h-5 w-5 text-primary" />
          Share Your Experience
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Rate your experience with {entityName}
            </label>
            <StarRating
              rating={rating}
              size="lg"
              interactive
              onRatingChange={setRating}
            />
            {rating === 0 && (
              <p className="text-xs text-muted-foreground">
                Click on stars to rate
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="comment" className="text-sm font-medium">
              Your Review (Optional)
            </label>
            <Textarea
              id="comment"
              placeholder="Tell us about your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>

          <Button 
            type="submit" 
            disabled={rating === 0 || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Your review will be visible after admin approval
          </p>
        </form>
      </CardContent>
    </Card>
  );
};
