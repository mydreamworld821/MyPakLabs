import { Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MessageStatus = 'sent' | 'delivered' | 'read';

interface MessageStatusIndicatorProps {
  status: MessageStatus;
  className?: string;
}

/**
 * WhatsApp-like message status indicator
 * - Single dark tick: Sent (message saved to server)
 * - Double dark tick: Delivered (recipient received message)
 * - Double blue tick: Read (recipient viewed message)
 */
export const MessageStatusIndicator = ({ status, className }: MessageStatusIndicatorProps) => {
  switch (status) {
    case 'read':
      return (
        <CheckCheck 
          className={cn("w-4 h-4", className)} 
          style={{ color: '#34B7F1' }} // WhatsApp blue
          strokeWidth={2.5}
          aria-label="Message read"
        />
      );
    case 'delivered':
      return (
        <CheckCheck 
          className={cn("w-4 h-4", className)} 
          style={{ color: '#667781' }} // Dark gray for visibility
          strokeWidth={2.5}
          aria-label="Message delivered"
        />
      );
    case 'sent':
    default:
      return (
        <Check 
          className={cn("w-4 h-4", className)} 
          style={{ color: '#667781' }} // Dark gray for visibility
          strokeWidth={2.5}
          aria-label="Message sent"
        />
      );
  }
};
