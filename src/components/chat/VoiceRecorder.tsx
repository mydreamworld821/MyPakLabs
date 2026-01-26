import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob, duration: number) => void;
  disabled?: boolean;
  isSending?: boolean;
}

export const VoiceRecorder = ({ onRecordingComplete, disabled, isSending }: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      startTimeRef.current = Date.now();
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const recordingDuration = (Date.now() - startTimeRef.current) / 1000;
        onRecordingComplete(audioBlob, recordingDuration);
        
        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      
      // Update duration timer
      timerRef.current = setInterval(() => {
        setDuration((Date.now() - startTimeRef.current) / 1000);
      }, 100);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }, [onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setDuration(0);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isSending) {
    return (
      <Button size="icon" variant="ghost" disabled className="h-9 w-9">
        <Loader2 className="w-5 h-5 animate-spin" />
      </Button>
    );
  }

  if (isRecording) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 px-2 py-1 bg-destructive/10 rounded-full">
          <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
          <span className="text-xs text-destructive font-medium">{formatDuration(duration)}</span>
        </div>
        <Button 
          size="icon"
          variant="destructive"
          onClick={stopRecording}
          className="h-9 w-9 rounded-full"
        >
          <Square className="w-4 h-4 fill-current" />
        </Button>
      </div>
    );
  }

  return (
    <Button 
      size="icon" 
      variant="ghost"
      onClick={startRecording}
      disabled={disabled}
      className={cn("h-9 w-9", disabled && "opacity-50")}
    >
      <Mic className="w-5 h-5" />
    </Button>
  );
};
