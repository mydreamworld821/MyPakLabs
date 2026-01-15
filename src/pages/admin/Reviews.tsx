import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { StarRating } from "@/components/reviews/StarRating";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Check, X, Eye, MessageSquare, Clock, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type ReviewStatus = 'pending' | 'approved' | 'rejected';
type EntityType = 'doctor' | 'lab' | 'hospital' | 'nurse' | 'pharmacy' | 'platform';

interface Review {
  id: string;
  user_id: string;
  entity_type: EntityType;
  entity_id: string | null;
  rating: number;
  comment: string | null;
  status: ReviewStatus;
  admin_notes: string | null;
  created_at: string;
  profiles?: {
    full_name: string | null;
    email?: string;
  };
}

const AdminReviews = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'all'>('pending');
  const [entityFilter, setEntityFilter] = useState<EntityType | 'all'>('all');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['admin-reviews', statusFilter, entityFilter],
    queryFn: async () => {
      let query = supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      if (entityFilter !== 'all') {
        query = query.eq('entity_type', entityFilter);
      }

      const { data: reviewsData, error } = await query;
      if (error) throw error;

      // Fetch profiles for each review
      const userIds = [...new Set(reviewsData.map(r => r.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      // Merge profiles with reviews
      const reviewsWithProfiles = reviewsData.map(review => ({
        ...review,
        profiles: profilesData?.find(p => p.user_id === review.user_id) || null,
      }));

      return reviewsWithProfiles as Review[];
    },
  });

  const updateReview = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: ReviewStatus; notes?: string }) => {
      const { error } = await supabase
        .from('reviews')
        .update({
          status,
          admin_notes: notes || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      setSelectedReview(null);
      setAdminNotes("");
      toast.success('Review updated successfully');
    },
    onError: () => {
      toast.error('Failed to update review');
    },
  });

  const handleQuickApprove = (review: Review) => {
    updateReview.mutate({ id: review.id, status: 'approved' });
  };

  const handleQuickReject = (review: Review) => {
    updateReview.mutate({ id: review.id, status: 'rejected' });
  };

  const handleDetailedUpdate = (status: ReviewStatus) => {
    if (!selectedReview) return;
    updateReview.mutate({ 
      id: selectedReview.id, 
      status, 
      notes: adminNotes 
    });
  };

  const getStatusBadge = (status: ReviewStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-100 text-green-800"><Check className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-100 text-red-800"><X className="h-3 w-3 mr-1" />Rejected</Badge>;
    }
  };

  const getEntityBadge = (type: EntityType) => {
    const colors: Record<EntityType, string> = {
      platform: 'bg-purple-100 text-purple-800',
      doctor: 'bg-blue-100 text-blue-800',
      lab: 'bg-green-100 text-green-800',
      hospital: 'bg-orange-100 text-orange-800',
      nurse: 'bg-pink-100 text-pink-800',
      pharmacy: 'bg-cyan-100 text-cyan-800',
    };
    return <Badge variant="outline" className={colors[type]}>{type}</Badge>;
  };

  const pendingCount = reviews?.filter(r => r.status === 'pending').length || 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MessageSquare className="h-6 w-6" />
              Review Management
            </h1>
            <p className="text-muted-foreground">
              {pendingCount > 0 && (
                <span className="text-yellow-600 font-medium">{pendingCount} pending reviews • </span>
              )}
              Approve or reject patient reviews
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ReviewStatus | 'all')}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={entityFilter} onValueChange={(v) => setEntityFilter(v as EntityType | 'all')}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Entity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="platform">Platform</SelectItem>
              <SelectItem value="doctor">Doctor</SelectItem>
              <SelectItem value="lab">Lab</SelectItem>
              <SelectItem value="hospital">Hospital</SelectItem>
              <SelectItem value="nurse">Nurse</SelectItem>
              <SelectItem value="pharmacy">Pharmacy</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reviews List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : reviews?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No reviews found matching your filters</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews?.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {getStatusBadge(review.status)}
                        {getEntityBadge(review.entity_type)}
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <StarRating rating={review.rating} size="sm" />
                        <span className="font-medium">
                          {review.profiles?.full_name || 'Anonymous'}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          "{review.comment}"
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedReview(review);
                          setAdminNotes(review.admin_notes || "");
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      {review.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleQuickApprove(review)}
                            disabled={updateReview.isPending}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleQuickReject(review)}
                            disabled={updateReview.isPending}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedReview} onOpenChange={() => setSelectedReview(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Details</DialogTitle>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedReview.status)}
                {getEntityBadge(selectedReview.entity_type)}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Submitted by</p>
                <p className="font-medium">
                  {selectedReview.profiles?.full_name || 'Anonymous'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rating</p>
                <StarRating rating={selectedReview.rating} size="md" />
              </div>
              {selectedReview.comment && (
                <div>
                  <p className="text-sm text-muted-foreground">Comment</p>
                  <p className="bg-muted p-3 rounded-md">{selectedReview.comment}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Admin Notes</p>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this review..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="destructive"
              onClick={() => handleDetailedUpdate('rejected')}
              disabled={updateReview.isPending}
            >
              <X className="h-4 w-4 mr-1" />
              Reject
            </Button>
            <Button
              onClick={() => handleDetailedUpdate('approved')}
              disabled={updateReview.isPending}
            >
              <Check className="h-4 w-4 mr-1" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminReviews;
