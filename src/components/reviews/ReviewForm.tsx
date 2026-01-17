import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StarRating } from "./StarRating";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { MessageSquarePlus, Clock, CheckCircle2, Pencil, Trash2, X, Save } from "lucide-react";
import { Review } from "@/hooks/useReviews";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ReviewFormProps {
  entityName: string;
  onSubmit: (data: { rating: number; comment: string }) => void;
  onUpdate?: (data: { reviewId: string; comment: string }) => void;
  onDelete?: (reviewId: string) => void;
  isSubmitting?: boolean;
  isUpdating?: boolean;
  isDeleting?: boolean;
  existingReview?: Review | null;
}

export const ReviewForm = ({
  entityName,
  onSubmit,
  onUpdate,
  onDelete,
  isSubmitting = false,
  isUpdating = false,
  isDeleting = false,
  existingReview,
}: ReviewFormProps) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || "");
  const [isEditing, setIsEditing] = useState(false);
  const [editComment, setEditComment] = useState(existingReview?.comment || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    onSubmit({ rating, comment });
  };

  const handleUpdate = () => {
    if (existingReview && onUpdate) {
      onUpdate({ reviewId: existingReview.id, comment: editComment });
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    if (existingReview && onDelete) {
      onDelete(existingReview.id);
    }
  };

  const startEditing = () => {
    setEditComment(existingReview?.comment || "");
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditComment(existingReview?.comment || "");
    setIsEditing(false);
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {existingReview.status === 'pending' ? (
                <>
                  <Clock className="h-5 w-5 text-yellow-500" />
                  <span className="font-medium">Your review is pending</span>
                </>
              ) : existingReview.status === 'approved' ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="font-medium">Your review is published</span>
                </>
              ) : (
                <Badge variant="destructive">Review was rejected</Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              {!isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={startEditing}
                  className="h-8 w-8 p-0"
                  title="Edit comment"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    title="Delete review"
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Review?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete your review. You can submit a new review afterwards.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <StarRating rating={existingReview.rating} size="sm" />
            <span className="text-sm text-muted-foreground">
              ({existingReview.rating}/5) - Rating cannot be changed
            </span>
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <Textarea
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
                placeholder="Update your comment..."
                rows={3}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className="flex items-center gap-1"
                >
                  <Save className="h-4 w-4" />
                  {isUpdating ? "Saving..." : "Save"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={cancelEditing}
                  className="flex items-center gap-1"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            existingReview.comment && (
              <p className="text-sm text-muted-foreground italic">
                "{existingReview.comment}"
              </p>
            )
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
            Rating can only be given once. Comments can be edited anytime.
          </p>
        </form>
      </CardContent>
    </Card>
  );
};
