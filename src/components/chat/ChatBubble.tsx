import { useState, useRef } from 'react';
import { format } from 'date-fns';
import { Play, Pause, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatMessage } from '@/hooks/useChat';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { MessageStatusIndicator, MessageStatus } from './MessageStatusIndicator';

interface ChatBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
}

export const ChatBubble = ({ message, isOwn }: ChatBubbleProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const getMediaUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    
    const { data } = supabase.storage.from('chat-media').getPublicUrl(path);
    return data.publicUrl;
  };

  const toggleAudio = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get message status - use new status field if available, fallback to is_read
  const getMessageStatus = (): MessageStatus => {
    if (message.status) {
      return message.status as MessageStatus;
    }
    // Fallback for old messages without status field
    return message.is_read ? 'read' : 'sent';
  };

  const renderContent = () => {
    switch (message.message_type) {
      case 'image':
        const imageUrl = getMediaUrl(message.media_url);
        return (
          <>
            <div 
              className="cursor-pointer rounded-lg overflow-hidden"
              onClick={() => setImageOpen(true)}
            >
              {imageUrl ? (
                <img 
                  src={imageUrl} 
                  alt="Shared image" 
                  className="max-w-[200px] max-h-[200px] object-cover rounded-lg"
                />
              ) : (
                <div className="w-[200px] h-[150px] bg-muted flex items-center justify-center rounded-lg">
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
            </div>
            <Dialog open={imageOpen} onOpenChange={setImageOpen}>
              <DialogContent className="max-w-3xl p-0 overflow-hidden">
                <img 
                  src={imageUrl || ''} 
                  alt="Shared image" 
                  className="w-full h-auto"
                />
              </DialogContent>
            </Dialog>
          </>
        );
      
      case 'voice':
        const audioUrl = getMediaUrl(message.media_url);
        return (
          <div className="flex items-center gap-3 min-w-[150px]">
            <button
              onClick={toggleAudio}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                isOwn ? "bg-primary-foreground/20" : "bg-primary/20"
              )}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 ml-0.5" />
              )}
            </button>
            <div className="flex-1">
              <div className={cn(
                "h-1 rounded-full",
                isOwn ? "bg-primary-foreground/30" : "bg-primary/30"
              )}>
                <div 
                  className={cn(
                    "h-full rounded-full transition-all",
                    isOwn ? "bg-primary-foreground/60" : "bg-primary/60"
                  )}
                  style={{ width: isPlaying ? '100%' : '0%' }}
                />
              </div>
              <span className="text-[10px] opacity-70">
                {formatDuration(message.media_duration)}
              </span>
            </div>
            <audio
              ref={audioRef}
              src={audioUrl || ''}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
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
          "max-w-[75%] px-3 py-2 rounded-2xl",
          isOwn
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted text-foreground rounded-bl-sm"
        )}
      >
        {renderContent()}
        <div className={cn(
          "flex items-center justify-end gap-1 mt-1",
          isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
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
