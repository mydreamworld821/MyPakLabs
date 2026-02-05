 import { useState, useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/contexts/AuthContext";
 import { toast } from "sonner";
 
 export interface DoctorProfileVideo {
   id: string;
   doctor_id: string;
   video_url: string;
   thumbnail_url: string | null;
   title: string | null;
   description: string | null;
   duration_seconds: number;
   views_count: number;
   likes_count: number;
   helpful_count: number;
   hearts_count: number;
   is_active: boolean;
   created_at: string;
   updated_at: string;
 }
 
 export interface VideoReaction {
   id: string;
   video_id: string;
   user_id: string;
   reaction_type: "like" | "helpful" | "heart";
   created_at: string;
 }
 
 type ReactionType = "like" | "helpful" | "heart";
 
 export const useDoctorVideo = (doctorId: string | undefined) => {
   const { user } = useAuth();
   const [video, setVideo] = useState<DoctorProfileVideo | null>(null);
   const [userReaction, setUserReaction] = useState<VideoReaction | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [isUploading, setIsUploading] = useState(false);
   const [uploadProgress, setUploadProgress] = useState(0);
 
   // Fetch video and user reaction
   const fetchVideo = async () => {
     if (!doctorId) {
       setIsLoading(false);
       return;
     }
 
     try {
       const { data: videoData, error: videoError } = await supabase
         .from("doctor_profile_videos")
         .select("*")
         .eq("doctor_id", doctorId)
         .eq("is_active", true)
         .maybeSingle();
 
       if (videoError) throw videoError;
       setVideo(videoData);
 
       // Fetch user's reaction if logged in and video exists
       if (user && videoData) {
         const { data: reactionData } = await supabase
           .from("doctor_video_reactions")
           .select("*")
           .eq("video_id", videoData.id)
           .eq("user_id", user.id)
           .maybeSingle();
 
         if (reactionData) {
           setUserReaction({
             ...reactionData,
             reaction_type: reactionData.reaction_type as ReactionType,
           });
         }
       }
     } catch (error) {
       console.error("Error fetching doctor video:", error);
     } finally {
       setIsLoading(false);
     }
   };
 
   useEffect(() => {
     fetchVideo();
   }, [doctorId, user]);
 
   // Upload video
   const uploadVideo = async (
     file: File,
     metadata: { title?: string; description?: string; duration: number },
     userId: string
   ) => {
     if (!doctorId) return;
 
     setIsUploading(true);
     setUploadProgress(0);
 
     try {
       // Validate file size (50MB max)
       if (file.size > 50 * 1024 * 1024) {
         throw new Error("Video file size must be less than 50MB");
       }
 
       // Validate duration
       if (metadata.duration > 60) {
         throw new Error("Video duration must be 60 seconds or less");
       }
 
       // Validate format
       const allowedTypes = ["video/mp4", "video/webm"];
       if (!allowedTypes.includes(file.type)) {
         throw new Error("Only MP4 and WebM formats are allowed");
       }
 
       setUploadProgress(10);
 
       // Upload to storage
       const fileExt = file.name.split(".").pop();
       const fileName = `${userId}/${Date.now()}.${fileExt}`;
 
       const { error: uploadError } = await supabase.storage
         .from("doctor-videos")
         .upload(fileName, file, {
           cacheControl: "3600",
           upsert: true,
         });
 
       if (uploadError) throw uploadError;
 
       setUploadProgress(60);
 
       // Get public URL
       const { data: urlData } = supabase.storage
         .from("doctor-videos")
         .getPublicUrl(fileName);
 
       setUploadProgress(80);
 
       // Delete existing video record if any
       await supabase
         .from("doctor_profile_videos")
         .delete()
         .eq("doctor_id", doctorId);
 
       // Create new video record
       const { data: newVideo, error: insertError } = await supabase
         .from("doctor_profile_videos")
         .insert({
           doctor_id: doctorId,
           video_url: urlData.publicUrl,
           title: metadata.title || null,
           description: metadata.description || null,
           duration_seconds: Math.round(metadata.duration),
         })
         .select()
         .single();
 
       if (insertError) throw insertError;
 
       setUploadProgress(100);
       setVideo(newVideo);
       toast.success("Profile video uploaded successfully!");
 
       return newVideo;
     } catch (error: any) {
       console.error("Error uploading video:", error);
       toast.error(error.message || "Failed to upload video");
       throw error;
     } finally {
       setIsUploading(false);
       setUploadProgress(0);
     }
   };
 
   // Update video metadata
   const updateVideoMetadata = async (title: string, description: string) => {
     if (!video) return;
 
     try {
       const { error } = await supabase
         .from("doctor_profile_videos")
         .update({ title, description })
         .eq("id", video.id);
 
       if (error) throw error;
 
       setVideo((prev) => (prev ? { ...prev, title, description } : null));
       toast.success("Video details updated!");
     } catch (error: any) {
       console.error("Error updating video:", error);
       toast.error(error.message || "Failed to update video");
     }
   };
 
   // Delete video
   const deleteVideo = async (userId: string) => {
     if (!video) return;
 
     try {
       // Delete from storage
       const urlParts = video.video_url.split("/");
       const filePath = urlParts.slice(-2).join("/");
 
       await supabase.storage.from("doctor-videos").remove([filePath]);
 
       // Delete from database
       const { error } = await supabase
         .from("doctor_profile_videos")
         .delete()
         .eq("id", video.id);
 
       if (error) throw error;
 
       setVideo(null);
       toast.success("Profile video deleted");
     } catch (error: any) {
       console.error("Error deleting video:", error);
       toast.error(error.message || "Failed to delete video");
     }
   };
 
   // Track video view
   const trackView = async () => {
     if (!video) return;
 
     try {
       // Call the RPC function to increment view
       await supabase.rpc("increment_video_view", { video_uuid: video.id });
 
       // Optionally track detailed view
       await supabase.from("doctor_video_views").insert({
         video_id: video.id,
         user_id: user?.id || null,
       });
 
       // Update local state
       setVideo((prev) =>
         prev ? { ...prev, views_count: prev.views_count + 1 } : null
       );
     } catch (error) {
       console.error("Error tracking view:", error);
     }
   };
 
   // Add or update reaction
   const addReaction = async (reactionType: "like" | "helpful" | "heart") => {
     if (!video || !user) {
       toast.error("Please login to react");
       return;
     }
 
     try {
       if (userReaction) {
         if (userReaction.reaction_type === reactionType) {
           // Remove reaction if same type
           const { error } = await supabase
             .from("doctor_video_reactions")
             .delete()
             .eq("id", userReaction.id);
 
           if (error) throw error;
           setUserReaction(null);
         } else {
           // Update to new reaction type
           const { data, error } = await supabase
             .from("doctor_video_reactions")
             .update({ reaction_type: reactionType })
             .eq("id", userReaction.id)
             .select()
             .single();
 
           if (error) throw error;
           setUserReaction({
             ...data,
             reaction_type: data.reaction_type as ReactionType,
           });
         }
       } else {
         // Insert new reaction
         const { data, error } = await supabase
           .from("doctor_video_reactions")
           .insert({
             video_id: video.id,
             user_id: user.id,
             reaction_type: reactionType,
           })
           .select()
           .single();
 
         if (error) throw error;
         setUserReaction({
           ...data,
           reaction_type: data.reaction_type as ReactionType,
         });
       }
 
       // Refetch video to get updated counts
       await fetchVideo();
     } catch (error: any) {
       console.error("Error adding reaction:", error);
       toast.error(error.message || "Failed to add reaction");
     }
   };
 
   return {
     video,
     userReaction,
     isLoading,
     isUploading,
     uploadProgress,
     uploadVideo,
     updateVideoMetadata,
     deleteVideo,
     trackView,
     addReaction,
     refetch: fetchVideo,
   };
 };