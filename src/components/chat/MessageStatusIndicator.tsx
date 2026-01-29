import { Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MessageStatus = 'sent' | 'delivered' | 'read';

interface MessageStatusIndicatorProps {
  status: MessageStatus;
  className?: string;
}

/**
 * WhatsApp-like message status indicator
 * - Single gray tick: Sent (message saved to server)
 * - Double gray tick: Delivered (recipient received message)
 * - Double blue tick: Read (recipient viewed message)
 */
export const MessageStatusIndicator = ({ status, className }: MessageStatusIndicatorProps) => {
  switch (status) {
    case 'read':
      return (
        <CheckCheck 
          className={cn("w-3.5 h-3.5 text-sky-500", className)} 
          aria-label="Message read"
        />
      );
    case 'delivered':
      return (
        <CheckCheck 
          className={cn("w-3.5 h-3.5 text-muted-foreground", className)} 
          aria-label="Message delivered"
        />
      );
    case 'sent':
    default:
      return (
        <Check 
          className={cn("w-3.5 h-3.5 text-muted-foreground", className)} 
          aria-label="Message sent"
        />
      );
  }
};
