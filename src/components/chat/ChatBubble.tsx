import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { Play, Pause, Image as ImageIcon, Download, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatMessage } from '@/hooks/useChat';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageStatusIndicator, MessageStatus } from './MessageStatusIndicator';

interface ChatBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
}

export const ChatBubble = ({ message, isOwn }: ChatBubbleProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(message.media_duration || 0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Get public URL for media
  const getMediaUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    
    const { data } = supabase.storage.from('chat-media').getPublicUrl(path);
    return data.publicUrl;
  };

  const mediaUrl = getMediaUrl(message.media_url);

  // Handle audio playback
  const toggleAudio = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
        console.error('Audio playback error:', err);
      });
    }
  };

  // Update audio progress
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (audio.duration) {
        setAudioProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleLoadedMetadata = () => {
      setAudioDuration(audio.duration);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setAudioProgress(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const formatDuration = (seconds: number | null) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get message status
  const getMessageStatus = (): MessageStatus => {
    if (message.status) {
      return message.status as MessageStatus;
    }
    return message.is_read ? 'read' : 'sent';
  };

  // Download image
  const downloadImage = async () => {
    if (!mediaUrl) return;
    try {
      const response = await fetch(mediaUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `image-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const renderContent = () => {
    switch (message.message_type) {
      case 'image':
        return (
          <>
            <div 
              className="cursor-pointer rounded-lg overflow-hidden relative"
              onClick={() => !imageError && setImageOpen(true)}
            >
              {!imageLoaded && !imageError && (
                <div className="w-[200px] h-[150px] bg-muted flex items-center justify-center rounded-lg">
                  <div className="animate-pulse flex flex-col items-center gap-2">
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Loading...</span>
                  </div>
                </div>
              )}
              {imageError && (
                <div className="w-[200px] h-[150px] bg-muted flex items-center justify-center rounded-lg">
                  <div className="flex flex-col items-center gap-2">
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Failed to load</span>
                  </div>
                </div>
              )}
              {mediaUrl && (
                <img 
                  src={mediaUrl} 
                  alt="Shared image" 
                  className={cn(
                    "max-w-[200px] max-h-[200px] object-cover rounded-lg transition-opacity",
                    imageLoaded && !imageError ? "opacity-100" : "opacity-0 absolute"
                  )}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => {
                    setImageError(true);
                    console.error('Image load error:', mediaUrl);
                  }}
                />
              )}
            </div>
            <Dialog open={imageOpen} onOpenChange={setImageOpen}>
              <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden bg-black/90 border-0">
                <div className="relative flex items-center justify-center min-h-[300px]">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 z-10 text-white hover:bg-white/20"
                    onClick={() => setImageOpen(false)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 left-2 z-10 text-white hover:bg-white/20"
                    onClick={downloadImage}
                  >
                    <Download className="w-5 h-5" />
                  </Button>
                  <img 
                    src={mediaUrl || ''} 
                    alt="Shared image" 
                    className="max-w-full max-h-[80vh] object-contain"
                  />
                </div>
              </DialogContent>
            </Dialog>
          </>
        );
      
      case 'voice':
        return (
          <div className="flex items-center gap-3 min-w-[180px]">
            <button
              onClick={toggleAudio}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors",
                isOwn 
                  ? "bg-white/20 hover:bg-white/30" 
                  : "bg-primary/20 hover:bg-primary/30"
              )}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              {/* Progress bar */}
              <div className={cn(
                "h-1.5 rounded-full overflow-hidden",
                isOwn ? "bg-white/30" : "bg-primary/30"
              )}>
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-100",
                    isOwn ? "bg-white/70" : "bg-primary/70"
                  )}
                  style={{ width: `${audioProgress}%` }}
                />
              </div>
              <span className="text-[11px] opacity-80 mt-1 block">
                {formatDuration(isPlaying ? (audioProgress / 100) * audioDuration : audioDuration)}
              </span>
            </div>
            <audio
              ref={audioRef}
              src={mediaUrl || ''}
              preload="metadata"
            />
          </div>
        );
      
      default:
        return <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>;
    }
  };

  return (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] px-3 py-2 rounded-2xl shadow-sm",
          isOwn
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted text-foreground rounded-bl-sm"
        )}
      >
        {renderContent()}
        <div className={cn(
          "flex items-center justify-end gap-1.5 mt-1",
          isOwn ? "text-primary-foreground/80" : "text-muted-foreground"
        )}>
          <span className="text-[10px]">
            {format(new Date(message.created_at), 'h:mm a')}
          </span>
          {isOwn && (
            <MessageStatusIndicator status={getMessageStatus()} />
          )}
        </div>
      </div>
    </div>
  );
};
