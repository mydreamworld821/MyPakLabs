 import { useState, useRef, useEffect } from "react";
 import { Card, CardContent } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { useDoctorVideo } from "@/hooks/useDoctorVideo";
 import { useAuth } from "@/contexts/AuthContext";
 import { cn } from "@/lib/utils";
 import {
   Play,
   Pause,
   Volume2,
   VolumeX,
   Maximize,
   Loader2,
   Clock,
   Eye,
   ThumbsUp,
   Heart,
   HelpCircle,
 } from "lucide-react";
 
 interface DoctorVideoPlayerProps {
   doctorId: string;
   doctorName?: string;
   className?: string;
 }
 
 const DoctorVideoPlayer = ({
   doctorId,
   doctorName,
   className,
 }: DoctorVideoPlayerProps) => {
   const { user } = useAuth();
   const {
     video,
     userReaction,
     isLoading,
     trackView,
     addReaction,
   } = useDoctorVideo(doctorId);
 
   const [isPlaying, setIsPlaying] = useState(false);
   const [isMuted, setIsMuted] = useState(true);
   const [showControls, setShowControls] = useState(true);
   const [hasTrackedView, setHasTrackedView] = useState(false);
   const [isReacting, setIsReacting] = useState(false);
 
   const videoRef = useRef<HTMLVideoElement>(null);
   const containerRef = useRef<HTMLDivElement>(null);
 
   // Track view when video is played for at least 3 seconds
   useEffect(() => {
     if (!video) return;
 
     let viewTimer: NodeJS.Timeout;
 
     const handleTimeUpdate = () => {
       if (videoRef.current && videoRef.current.currentTime >= 3 && !hasTrackedView) {
         trackView();
         setHasTrackedView(true);
       }
     };
 
     videoRef.current?.addEventListener("timeupdate", handleTimeUpdate);
 
     return () => {
       videoRef.current?.removeEventListener("timeupdate", handleTimeUpdate);
       clearTimeout(viewTimer);
     };
   }, [video, hasTrackedView, trackView]);
 
   const handlePlayPause = () => {
     if (!videoRef.current) return;
 
     if (isPlaying) {
       videoRef.current.pause();
     } else {
       videoRef.current.play();
       setIsMuted(false);
       videoRef.current.muted = false;
     }
     setIsPlaying(!isPlaying);
   };
 
   const handleMuteToggle = () => {
     if (!videoRef.current) return;
     videoRef.current.muted = !isMuted;
     setIsMuted(!isMuted);
   };
 
   const handleFullscreen = () => {
     if (containerRef.current) {
       if (document.fullscreenElement) {
         document.exitFullscreen();
       } else {
         containerRef.current.requestFullscreen();
       }
     }
   };
 
   const handleVideoEnded = () => {
     setIsPlaying(false);
     setShowControls(true);
   };
 
   const handleReaction = async (type: "like" | "helpful" | "heart") => {
     if (isReacting) return;
     setIsReacting(true);
     try {
       await addReaction(type);
     } finally {
       setIsReacting(false);
     }
   };
 
   const formatDuration = (seconds: number) => {
     const mins = Math.floor(seconds / 60);
     const secs = Math.round(seconds % 60);
     return `${mins}:${secs.toString().padStart(2, "0")}`;
   };
 
   if (isLoading) {
     return (
       <Card className={cn("overflow-hidden", className)}>
         <CardContent className="p-0 aspect-video flex items-center justify-center bg-muted">
           <Loader2 className="w-8 h-8 animate-spin text-primary" />
         </CardContent>
       </Card>
     );
   }
 
   if (!video) {
     // Show placeholder when no video exists
     return (
       <Card className={cn("overflow-hidden", className)}>
         <CardContent className="p-6 text-center">
           <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
             <Play className="w-8 h-8 text-muted-foreground" />
           </div>
           <h4 className="font-medium text-sm mb-1">No Profile Video</h4>
           <p className="text-xs text-muted-foreground">
             This doctor hasn't uploaded a profile video yet.
           </p>
         </CardContent>
       </Card>
     );
   }
 
   return (
     <Card className={cn("overflow-hidden", className)}>
       <div
         ref={containerRef}
         className="relative bg-black group"
         onMouseEnter={() => setShowControls(true)}
         onMouseLeave={() => isPlaying && setShowControls(false)}
       >
         {/* Video Element */}
         <video
           ref={videoRef}
           src={video.video_url}
           poster={video.thumbnail_url || undefined}
           className="w-full aspect-video object-contain"
           muted={isMuted}
           playsInline
           onEnded={handleVideoEnded}
           onPlay={() => setIsPlaying(true)}
           onPause={() => setIsPlaying(false)}
           onClick={handlePlayPause}
         />
 
         {/* Thumbnail Overlay (when not playing) */}
         {!isPlaying && (
           <div
             className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/30"
             onClick={handlePlayPause}
           >
             <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center shadow-lg transition-transform hover:scale-110">
               <Play className="w-8 h-8 text-primary-foreground ml-1" />
             </div>
           </div>
         )}
 
         {/* Controls Overlay */}
         <div
           className={cn(
             "absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent transition-opacity",
             showControls || !isPlaying ? "opacity-100" : "opacity-0"
           )}
         >
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
               <Button
                 size="icon"
                 variant="ghost"
                 className="h-8 w-8 text-white hover:bg-white/20"
                 onClick={handlePlayPause}
               >
                 {isPlaying ? (
                   <Pause className="w-4 h-4" />
                 ) : (
                   <Play className="w-4 h-4" />
                 )}
               </Button>
               <Button
                 size="icon"
                 variant="ghost"
                 className="h-8 w-8 text-white hover:bg-white/20"
                 onClick={handleMuteToggle}
               >
                 {isMuted ? (
                   <VolumeX className="w-4 h-4" />
                 ) : (
                   <Volume2 className="w-4 h-4" />
                 )}
               </Button>
               <span className="text-xs text-white/80">
                 {formatDuration(video.duration_seconds)}
               </span>
             </div>
             <Button
               size="icon"
               variant="ghost"
               className="h-8 w-8 text-white hover:bg-white/20"
               onClick={handleFullscreen}
             >
               <Maximize className="w-4 h-4" />
             </Button>
           </div>
         </div>
 
         {/* Duration Badge (top right, always visible when paused) */}
         {!isPlaying && (
           <Badge
             variant="secondary"
             className="absolute top-2 right-2 text-xs bg-black/70 text-white border-0"
           >
             <Clock className="w-3 h-3 mr-1" />
             {formatDuration(video.duration_seconds)}
           </Badge>
         )}
       </div>
 
       {/* Video Info & Reactions */}
       <CardContent className="p-4 space-y-3">
         {video.title && (
           <h4 className="font-medium text-sm">{video.title}</h4>
         )}
         {video.description && (
           <p className="text-xs text-muted-foreground line-clamp-2">
             {video.description}
           </p>
         )}
 
         {/* Stats & Reactions */}
         <div className="flex items-center justify-between pt-2 border-t">
           <div className="flex items-center gap-3 text-xs text-muted-foreground">
             <span className="flex items-center gap-1">
               <Eye className="w-3 h-3" />
               {video.views_count} views
             </span>
           </div>
 
           {/* Reaction Buttons */}
           <div className="flex items-center gap-1">
             <Button
               size="sm"
               variant="ghost"
               className={cn(
                 "h-8 text-xs gap-1",
                 userReaction?.reaction_type === "like" && "text-primary bg-primary/10"
               )}
               onClick={() => handleReaction("like")}
               disabled={isReacting}
             >
               <ThumbsUp className="w-3 h-3" />
               {video.likes_count > 0 && video.likes_count}
             </Button>
             <Button
               size="sm"
               variant="ghost"
               className={cn(
                 "h-8 text-xs gap-1",
                 userReaction?.reaction_type === "helpful" && "text-primary bg-primary/10"
               )}
               onClick={() => handleReaction("helpful")}
               disabled={isReacting}
             >
               <HelpCircle className="w-3 h-3" />
               {video.helpful_count > 0 && video.helpful_count}
             </Button>
             <Button
               size="sm"
               variant="ghost"
               className={cn(
                 "h-8 text-xs gap-1",
                 userReaction?.reaction_type === "heart" && "text-destructive bg-destructive/10"
               )}
               onClick={() => handleReaction("heart")}
               disabled={isReacting}
             >
               <Heart className="w-3 h-3" />
               {video.hearts_count > 0 && video.hearts_count}
             </Button>
           </div>
         </div>
       </CardContent>
     </Card>
   );
 };
 
 export default DoctorVideoPlayer;