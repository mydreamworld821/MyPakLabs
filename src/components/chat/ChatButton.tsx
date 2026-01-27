import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MessageCircle, Lock, Clock, CheckCircle } from 'lucide-react';
import { useChatStatus } from '@/hooks/useChatStatus';
import { cn } from '@/lib/utils';

interface ChatButtonProps {
  appointmentId: string;
  appointmentDate: string;
  appointmentTime: string;
  consultationType: string;
  appointmentStatus: string;
  variant?: 'icon' | 'full' | 'badge';
  className?: string;
}

export const ChatButton = ({
  appointmentId,
  appointmentDate,
  appointmentTime,
  consultationType,
  appointmentStatus,
  variant = 'icon',
  className,
}: ChatButtonProps) => {
  const navigate = useNavigate();
  
  const chatStatus = useChatStatus({
    appointmentId,
    appointmentDate,
    appointmentTime,
    consultationType,
    appointmentStatus,
  });

  // Don't show for non-online consultations
  if (consultationType !== 'online') {
    return null;
  }

  // Don't show for cancelled appointments
  if (appointmentStatus === 'cancelled') {
    return null;
  }

  const handleClick = () => {
    if (chatStatus.chatRoomId) {
      navigate(`/chat/${chatStatus.chatRoomId}`);
    } else {
      navigate('/chats');
    }
  };

  const getStatusIcon = () => {
    if (chatStatus.isActive) {
      return <CheckCircle className="w-3 h-3" />;
    }
    if (chatStatus.status === 'not_started') {
      return <Clock className="w-3 h-3" />;
    }
    return <Lock className="w-3 h-3" />;
  };

  const getStatusColor = () => {
    if (chatStatus.isActive) {
      return 'text-green-600 border-green-200 bg-green-50 hover:bg-green-100';
    }
    if (chatStatus.status === 'not_started') {
      return 'text-yellow-600 border-yellow-200 bg-yellow-50 hover:bg-yellow-100';
    }
    return 'text-muted-foreground border-muted bg-muted/50';
  };

  if (variant === 'badge') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className={cn(
                'cursor-pointer flex items-center gap-1',
                getStatusColor(),
                className
              )}
              onClick={handleClick}
            >
              <MessageCircle className="w-3 h-3" />
              {chatStatus.isActive ? 'Chat Active' : chatStatus.status === 'not_started' ? 'Chat Soon' : 'View Chat'}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{chatStatus.message}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === 'full') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'flex items-center gap-2',
                chatStatus.isActive && 'border-green-300 text-green-700 hover:bg-green-50',
                className
              )}
              onClick={handleClick}
            >
              <MessageCircle className="w-4 h-4" />
              {chatStatus.isActive ? 'Open Chat' : 'View Chat'}
              {getStatusIcon()}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{chatStatus.message}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Icon variant (default)
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              chatStatus.isActive 
                ? 'text-green-600 hover:text-green-700 hover:bg-green-50' 
                : 'text-primary hover:text-primary/80',
              className
            )}
            onClick={handleClick}
          >
            <MessageCircle className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span>{chatStatus.message}</span>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
