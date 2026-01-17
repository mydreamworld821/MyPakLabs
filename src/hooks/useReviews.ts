import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type ReviewEntityType = 'doctor' | 'lab' | 'hospital' | 'nurse' | 'pharmacy' | 'platform';

export interface Review {
  id: string;
  user_id: string;
  entity_type: ReviewEntityType;
  entity_id: string | null;
  rating: number;
  comment: string | null;
  admin_notes?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export const useReviews = (entityType?: ReviewEntityType, entityId?: string | null) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch approved reviews for an entity or platform
  const { data: reviews, isLoading } = useQuery({
    queryKey: ['reviews', entityType, entityId],
    queryFn: async () => {
      let query = supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (entityType) {
        query = query.eq('entity_type', entityType);
      }

      if (entityId) {
        query = query.eq('entity_id', entityId);
      } else if (entityType === 'platform') {
        query = query.is('entity_id', null);
      }

      const { data: reviewsData, error } = await query;
      if (error) throw error;

      // Fetch profiles for each review
      const userIds = [...new Set(reviewsData.map(r => r.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);

      // Merge profiles with reviews
      const reviewsWithProfiles = reviewsData.map(review => ({
        ...review,
        profiles: profilesData?.find(p => p.user_id === review.user_id) || null,
      }));

      return reviewsWithProfiles as Review[];
    },
    enabled: !!entityType,
  });

  // Fetch user's own reviews for an entity
  const { data: userReview } = useQuery({
    queryKey: ['user-review', entityType, entityId, user?.id],
    queryFn: async () => {
      if (!user) return null;

      let query = supabase
        .from('reviews')
        .select('*')
        .eq('user_id', user.id)
        .eq('entity_type', entityType!);

      if (entityId) {
        query = query.eq('entity_id', entityId);
      } else {
        query = query.is('entity_id', null);
      }

      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data as Review | null;
    },
    enabled: !!user && !!entityType,
  });

  // Submit a review
  const submitReview = useMutation({
    mutationFn: async ({ rating, comment }: { rating: number; comment: string }) => {
      if (!user) throw new Error('Must be logged in to submit a review');

      const reviewData = {
        user_id: user.id,
        entity_type: entityType!,
        entity_id: entityId || null,
        rating,
        comment: comment || null,
      };

      const { data, error } = await supabase
        .from('reviews')
        .insert(reviewData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', entityType, entityId] });
      queryClient.invalidateQueries({ queryKey: ['user-review', entityType, entityId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['featured-reviews'] });
      toast.success('Review submitted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit review');
    },
  });

  // Calculate average rating
  const averageRating = reviews?.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return {
    reviews,
    isLoading,
    userReview,
    submitReview,
    averageRating,
    reviewCount: reviews?.length || 0,
  };
};

// Fetch featured platform reviews for homepage
export const useFeaturedReviews = (limit = 6) => {
  return useQuery({
    queryKey: ['featured-reviews', limit],
    queryFn: async () => {
      const { data: reviewsData, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('entity_type', 'platform')
        .gte('rating', 4)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Fetch profiles for each review
      const userIds = [...new Set(reviewsData.map(r => r.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);

      // Merge profiles with reviews
      const reviewsWithProfiles = reviewsData.map(review => ({
        ...review,
        profiles: profilesData?.find(p => p.user_id === review.user_id) || null,
      }));

      return reviewsWithProfiles as Review[];
    },
  });
};
