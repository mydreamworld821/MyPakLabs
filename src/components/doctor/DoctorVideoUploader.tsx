 import { useState, useRef, useEffect } from "react";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Textarea } from "@/components/ui/textarea";
 import { Label } from "@/components/ui/label";
 import { Progress } from "@/components/ui/progress";
 import { Badge } from "@/components/ui/badge";
 import { useDoctorVideo } from "@/hooks/useDoctorVideo";
 import { useAuth } from "@/contexts/AuthContext";
 import { toast } from "sonner";
 import {
   Video,
   Upload,
   X,
   Play,
   Trash2,
   Edit2,
   Save,
   Loader2,
   Clock,
   Eye,
   ThumbsUp,
   Heart,
   HelpCircle,
 } from "lucide-react";
 
 interface DoctorVideoUploaderProps {
   doctorId: string;
 }
 
 const MAX_DURATION = 60; // 60 seconds
 const MAX_SIZE_MB = 50;
 
 const DoctorVideoUploader = ({ doctorId }: DoctorVideoUploaderProps) => {
   const { user } = useAuth();
   const {
     video,
     isLoading,
     isUploading,
     uploadProgress,
     uploadVideo,
     updateVideoMetadata,
     deleteVideo,
   } = useDoctorVideo(doctorId);
 
   const [isDragging, setIsDragging] = useState(false);
   const [selectedFile, setSelectedFile] = useState<File | null>(null);
   const [videoDuration, setVideoDuration] = useState<number>(0);
   const [previewUrl, setPreviewUrl] = useState<string | null>(null);
   const [title, setTitle] = useState("");
   const [description, setDescription] = useState("");
   const [isEditing, setIsEditing] = useState(false);
   const [isSaving, setIsSaving] = useState(false);
 
   const fileInputRef = useRef<HTMLInputElement>(null);
   const videoRef = useRef<HTMLVideoElement>(null);
 
   // Initialize form with existing video data
   useEffect(() => {
     if (video) {
       setTitle(video.title || "");
       setDescription(video.description || "");
     }
   }, [video]);
 
   // Clean up preview URL
   useEffect(() => {
     return () => {
       if (previewUrl) {
         URL.revokeObjectURL(previewUrl);
       }
     };
   }, [previewUrl]);
 
   const validateFile = (file: File): Promise<{ valid: boolean; duration: number; error?: string }> => {
     return new Promise((resolve) => {
       // Check file type
       const allowedTypes = ["video/mp4", "video/webm"];
       if (!allowedTypes.includes(file.type)) {
         resolve({ valid: false, duration: 0, error: "Only MP4 and WebM formats are allowed" });
         return;
       }
 
       // Check file size
       if (file.size > MAX_SIZE_MB * 1024 * 1024) {
         resolve({ valid: false, duration: 0, error: `File size must be less than ${MAX_SIZE_MB}MB` });
         return;
       }
 
       // Check duration
       const video = document.createElement("video");
       video.preload = "metadata";
       video.onloadedmetadata = () => {
         URL.revokeObjectURL(video.src);
         if (video.duration > MAX_DURATION) {
           resolve({
             valid: false,
             duration: video.duration,
             error: `Video duration must be ${MAX_DURATION} seconds or less (current: ${Math.round(video.duration)}s)`,
           });
         } else {
           resolve({ valid: true, duration: video.duration });
         }
       };
       video.onerror = () => {
         resolve({ valid: false, duration: 0, error: "Failed to read video file" });
       };
       video.src = URL.createObjectURL(file);
     });
   };
 
   const handleFileSelect = async (file: File) => {
     const validation = await validateFile(file);
 
     if (!validation.valid) {
       toast.error(validation.error);
       return;
     }
 
     setSelectedFile(file);
     setVideoDuration(validation.duration);
     setPreviewUrl(URL.createObjectURL(file));
   };
 
   const handleDragOver = (e: React.DragEvent) => {
     e.preventDefault();
     setIsDragging(true);
   };
 
   const handleDragLeave = () => {
     setIsDragging(false);
   };
 
   const handleDrop = async (e: React.DragEvent) => {
     e.preventDefault();
     setIsDragging(false);
     const file = e.dataTransfer.files[0];
     if (file) {
       await handleFileSelect(file);
     }
   };
 
   const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (file) {
       await handleFileSelect(file);
     }
   };
 
   const handleUpload = async () => {
     if (!selectedFile || !user) return;
 
     try {
       await uploadVideo(
         selectedFile,
         { title, description, duration: videoDuration },
         user.id
       );
       setSelectedFile(null);
       setPreviewUrl(null);
       setTitle("");
       setDescription("");
     } catch (error) {
       // Error handled in hook
     }
   };
 
   const handleCancelUpload = () => {
     setSelectedFile(null);
     if (previewUrl) {
       URL.revokeObjectURL(previewUrl);
       setPreviewUrl(null);
     }
     setTitle("");
     setDescription("");
   };
 
   const handleSaveMetadata = async () => {
     if (!video) return;
     setIsSaving(true);
     try {
       await updateVideoMetadata(title, description);
       setIsEditing(false);
     } finally {
       setIsSaving(false);
     }
   };
 
   const handleDelete = async () => {
     if (!video || !user) return;
 
     if (window.confirm("Are you sure you want to delete your profile video?")) {
       await deleteVideo(user.id);
     }
   };
 
   const formatDuration = (seconds: number) => {
     const mins = Math.floor(seconds / 60);
     const secs = Math.round(seconds % 60);
     return `${mins}:${secs.toString().padStart(2, "0")}`;
   };
 
   if (isLoading) {
     return (
       <Card>
         <CardContent className="p-6 flex items-center justify-center">
           <Loader2 className="w-6 h-6 animate-spin text-primary" />
         </CardContent>
       </Card>
     );
   }
 
   // Show existing video
   if (video && !selectedFile) {
     return (
       <Card>
         <CardHeader className="py-3">
           <CardTitle className="text-sm flex items-center gap-2">
             <Video className="w-4 h-4 text-primary" />
             Profile Video
           </CardTitle>
         </CardHeader>
         <CardContent className="space-y-4">
           {/* Video Player */}
           <div className="relative rounded-lg overflow-hidden bg-black">
             <video
               src={video.video_url}
               controls
               className="w-full aspect-video"
               poster={video.thumbnail_url || undefined}
             />
           </div>
 
           {/* Stats */}
           <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
             <span className="flex items-center gap-1">
               <Clock className="w-3 h-3" />
               {formatDuration(video.duration_seconds)}
             </span>
             <span className="flex items-center gap-1">
               <Eye className="w-3 h-3" />
               {video.views_count} views
             </span>
             <span className="flex items-center gap-1">
               <ThumbsUp className="w-3 h-3" />
               {video.likes_count}
             </span>
             <span className="flex items-center gap-1">
               <HelpCircle className="w-3 h-3" />
               {video.helpful_count}
             </span>
             <span className="flex items-center gap-1">
               <Heart className="w-3 h-3" />
               {video.hearts_count}
             </span>
           </div>
 
           {/* Title & Description */}
           {isEditing ? (
             <div className="space-y-3">
               <div>
                 <Label className="text-xs">Title</Label>
                 <Input
                   value={title}
                   onChange={(e) => setTitle(e.target.value)}
                   placeholder="Video title"
                   className="text-xs h-8"
                 />
               </div>
               <div>
                 <Label className="text-xs">Description</Label>
                 <Textarea
                   value={description}
                   onChange={(e) => setDescription(e.target.value)}
                   placeholder="Describe your experience, specialty, or message for patients..."
                   className="text-xs min-h-[80px]"
                 />
               </div>
               <div className="flex gap-2">
                 <Button
                   size="sm"
                   onClick={handleSaveMetadata}
                   disabled={isSaving}
                 >
                   {isSaving ? (
                     <Loader2 className="w-3 h-3 animate-spin mr-1" />
                   ) : (
                     <Save className="w-3 h-3 mr-1" />
                   )}
                   Save
                 </Button>
                 <Button
                   size="sm"
                   variant="outline"
                   onClick={() => {
                     setIsEditing(false);
                     setTitle(video.title || "");
                     setDescription(video.description || "");
                   }}
                 >
                   Cancel
                 </Button>
               </div>
             </div>
           ) : (
             <>
               {video.title && (
                 <h4 className="font-medium text-sm">{video.title}</h4>
               )}
               {video.description && (
                 <p className="text-xs text-muted-foreground">{video.description}</p>
               )}
             </>
           )}
 
           {/* Actions */}
           <div className="flex gap-2 pt-2">
             <Button
               size="sm"
               variant="outline"
               onClick={() => setIsEditing(true)}
               disabled={isEditing}
             >
               <Edit2 className="w-3 h-3 mr-1" />
               Edit Details
             </Button>
             <Button
               size="sm"
               variant="outline"
               onClick={() => fileInputRef.current?.click()}
             >
               <Upload className="w-3 h-3 mr-1" />
               Replace Video
             </Button>
             <Button
               size="sm"
               variant="destructive"
               onClick={handleDelete}
             >
               <Trash2 className="w-3 h-3 mr-1" />
               Delete
             </Button>
           </div>
 
           <input
             ref={fileInputRef}
             type="file"
             accept="video/mp4,video/webm"
             className="hidden"
             onChange={handleInputChange}
           />
         </CardContent>
       </Card>
     );
   }
 
   // Show upload form (for new video or replacement)
   return (
     <Card>
       <CardHeader className="py-3">
         <CardTitle className="text-sm flex items-center gap-2">
           <Video className="w-4 h-4 text-primary" />
           {video ? "Replace Profile Video" : "Add Profile Video"}
         </CardTitle>
         <p className="text-xs text-muted-foreground">
           Upload a 1-minute video introducing yourself to patients
         </p>
       </CardHeader>
       <CardContent className="space-y-4">
         {!selectedFile ? (
           // Drop zone
           <div
             className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
               isDragging
                 ? "border-primary bg-primary/5"
                 : "border-border hover:border-primary/50"
             }`}
             onDragOver={handleDragOver}
             onDragLeave={handleDragLeave}
             onDrop={handleDrop}
           >
             <input
               ref={fileInputRef}
               type="file"
               accept="video/mp4,video/webm"
               className="hidden"
               onChange={handleInputChange}
             />
             <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
               <Video className="w-8 h-8 text-primary" />
             </div>
             <h4 className="font-medium text-sm mb-2">Upload Profile Video</h4>
             <p className="text-xs text-muted-foreground mb-4">
               Drag & drop your video here, or click to browse
             </p>
             <Button
               variant="outline"
               onClick={() => fileInputRef.current?.click()}
             >
               Choose Video
             </Button>
             <div className="flex flex-wrap justify-center gap-2 mt-4 text-xs text-muted-foreground">
               <Badge variant="outline">MP4 / WebM</Badge>
               <Badge variant="outline">Max 60 seconds</Badge>
               <Badge variant="outline">Max 50MB</Badge>
             </div>
           </div>
         ) : (
           // Preview and metadata form
           <div className="space-y-4">
             {/* Video Preview */}
             <div className="relative rounded-lg overflow-hidden bg-black">
               <video
                 ref={videoRef}
                 src={previewUrl || undefined}
                 controls
                 className="w-full aspect-video"
               />
               <Button
                 size="icon"
                 variant="destructive"
                 className="absolute top-2 right-2 h-7 w-7"
                 onClick={handleCancelUpload}
               >
                 <X className="w-4 h-4" />
               </Button>
             </div>
 
             {/* Duration Badge */}
             <div className="flex items-center gap-2">
               <Badge variant="secondary" className="text-xs">
                 <Clock className="w-3 h-3 mr-1" />
                 {formatDuration(videoDuration)}
               </Badge>
               <span className="text-xs text-muted-foreground">
                 {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
               </span>
             </div>
 
             {/* Metadata Form */}
             <div className="space-y-3">
               <div>
                 <Label className="text-xs">Video Title (Optional)</Label>
                 <Input
                   value={title}
                   onChange={(e) => setTitle(e.target.value)}
                   placeholder="e.g., Meet Dr. Ahmed - Cardiologist"
                   className="text-xs h-8"
                 />
               </div>
               <div>
                 <Label className="text-xs">Description (Optional)</Label>
                 <Textarea
                   value={description}
                   onChange={(e) => setDescription(e.target.value)}
                   placeholder="Share your experience, specialty, or a message for your patients..."
                   className="text-xs min-h-[80px]"
                 />
               </div>
             </div>
 
             {/* Upload Progress */}
             {isUploading && (
               <div className="space-y-2">
                 <div className="flex items-center justify-between text-xs">
                   <span className="text-muted-foreground">Uploading...</span>
                   <span className="font-medium">{uploadProgress}%</span>
                 </div>
                 <Progress value={uploadProgress} className="h-2" />
               </div>
             )}
 
             {/* Actions */}
             <div className="flex gap-2">
               <Button
                 onClick={handleUpload}
                 disabled={isUploading}
                 className="flex-1"
               >
                 {isUploading ? (
                   <Loader2 className="w-4 h-4 animate-spin mr-2" />
                 ) : (
                   <Upload className="w-4 h-4 mr-2" />
                 )}
                 {isUploading ? "Uploading..." : "Upload Video"}
               </Button>
               <Button
                 variant="outline"
                 onClick={handleCancelUpload}
                 disabled={isUploading}
               >
                 Cancel
               </Button>
             </div>
           </div>
         )}
       </CardContent>
     </Card>
   );
 };
 
 export default DoctorVideoUploader;