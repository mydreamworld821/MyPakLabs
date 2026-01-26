import { useState, useRef, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Image as ImageIcon, Loader2 } from 'lucide-react';
import { VoiceRecorder } from './VoiceRecorder';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSendMessage: (content: string) => Promise<unknown>;
  onSendImage: (file: File) => Promise<unknown>;
  onSendVoice: (blob: Blob, duration: number) => Promise<unknown>;
  disabled?: boolean;
  isSending?: boolean;
}

export const ChatInput = ({
  onSendMessage,
  onSendImage,
  onSendVoice,
  disabled,
  isSending,
}: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = async () => {
    if (!message.trim() || disabled || isSending) return;
    
    const content = message;
    setMessage('');
    await onSendMessage(content);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onSendImage(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className={cn(
      "p-3 border-t bg-background",
      disabled && "opacity-50 pointer-events-none"
    )}>
      <div className="flex items-end gap-2">
        {/* Image Upload */}
        <Button
          size="icon"
          variant="ghost"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isSending}
          className="h-9 w-9 shrink-0"
        >
          <ImageIcon className="w-5 h-5" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageSelect}
        />

        {/* Text Input */}
        <div className="flex-1 relative">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? "Chat not active" : "Type a message..."}
            disabled={disabled || isSending}
            className="min-h-[40px] max-h-[120px] resize-none pr-10 py-2"
            rows={1}
          />
        </div>

        {/* Voice Recorder or Send Button */}
        {message.trim() ? (
          <Button
            size="icon"
            onClick={handleSend}
            disabled={disabled || isSending}
            className="h-9 w-9 shrink-0 rounded-full"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        ) : (
          <VoiceRecorder
            onRecordingComplete={onSendVoice}
            disabled={disabled}
            isSending={isSending}
          />
        )}
      </div>
      
      {disabled && (
        <p className="text-xs text-muted-foreground text-center mt-2">
          Chat is only active from 15 minutes before to 24 hours after the appointment
        </p>
      )}
    </div>
  );
};
