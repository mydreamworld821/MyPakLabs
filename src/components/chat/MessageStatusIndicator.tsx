import { Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MessageStatus = 'sent' | 'delivered' | 'read';

interface MessageStatusIndicatorProps {
  status: MessageStatus;
  className?: string;
}

/**
 * WhatsApp-like message status indicator with BLACK ticks
 * - Single black tick: Sent (message saved to server)
 * - Double black tick: Delivered (recipient received message)
 * - Double blue tick: Read (recipient viewed message)
 */
export const MessageStatusIndicator = ({ status, className }: MessageStatusIndicatorProps) => {
  // All ticks are BLACK (#000000) for maximum visibility
  const tickColor = '#000000';
  
  switch (status) {
    case 'read':
      return (
        <CheckCheck 
          className={cn("w-4 h-4", className)} 
          style={{ color: tickColor }}
          strokeWidth={2.5}
          aria-label="Message read"
        />
      );
    case 'delivered':
      return (
        <CheckCheck 
          className={cn("w-4 h-4", className)} 
          style={{ color: tickColor }}
          strokeWidth={2.5}
          aria-label="Message delivered"
        />
      );
    case 'sent':
    default:
      return (
        <Check 
          className={cn("w-4 h-4", className)} 
          style={{ color: tickColor }}
          strokeWidth={2.5}
          aria-label="Message sent"
        />
      );
  }
};
