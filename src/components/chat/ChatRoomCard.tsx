import { format, isToday, isYesterday } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Image, Mic, Video, Lock, Clock, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatRoom } from '@/hooks/useChat';
import { isChatActiveForAppointment } from '@/hooks/useChatStatus';

interface ChatRoomCardProps {
  room: ChatRoom;
  userType: 'patient' | 'doctor';
  onClick: () => void;
  isActive?: boolean;
}

export const ChatRoomCard = ({ room, userType, onClick, isActive }: ChatRoomCardProps) => {
  const displayName = userType === 'patient' 
    ? room.doctor?.full_name 
    : room.patient?.full_name || 'Patient';
  
  const photoUrl = userType === 'patient' 
    ? room.doctor?.photo_url 
    : room.patient?.avatar_url;

  const appointmentDate = room.appointment?.appointment_date;
  const appointmentTime = room.appointment?.appointment_time;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d');
  };

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, 'h:mm a');
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d');
  };

  const getLastMessagePreview = () => {
    if (!room.last_message) return 'No messages yet';
    
    switch (room.last_message.message_type) {
      case 'image':
        return '📷 Photo';
      case 'voice':
        return '🎤 Voice message';
      default:
        return room.last_message.content?.substring(0, 40) + 
          (room.last_message.content && room.last_message.content.length > 40 ? '...' : '');
    }
  };

  const isChatActive = () => {
    if (!room.appointment) return false;
    
    return isChatActiveForAppointment(
      room.appointment.appointment_date,
      room.appointment.appointment_time,
      room.appointment.status
    );
  };

  const chatActive = isChatActive();

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors border-b",
        isActive && "bg-muted"
      )}
    >
      <div className="relative">
        <Avatar className="h-12 w-12">
          <AvatarImage src={photoUrl || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {displayName?.charAt(0)?.toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
        {chatActive ? (
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
        ) : (
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-muted-foreground rounded-full border-2 border-background" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-medium text-sm truncate">{displayName}</h3>
          <span className="text-[10px] text-muted-foreground shrink-0">
            {room.last_message 
              ? formatMessageTime(room.last_message.created_at)
              : appointmentDate && formatDate(appointmentDate)
            }
          </span>
        </div>
        
        <div className="flex items-center gap-1 mt-0.5">
          <Video className="w-3 h-3 text-primary shrink-0" />
          <span className="text-[10px] text-muted-foreground truncate">
            {appointmentDate && appointmentTime && (
              <>
                {formatDate(appointmentDate)} at {appointmentTime}
              </>
            )}
          </span>
        </div>
        
        <p className={cn(
          "text-xs mt-1 truncate",
          room.unread_count && room.unread_count > 0 
            ? "text-foreground font-medium" 
            : "text-muted-foreground"
        )}>
          {getLastMessagePreview()}
        </p>
      </div>

      {room.unread_count && room.unread_count > 0 && (
        <Badge className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
          {room.unread_count > 9 ? '9+' : room.unread_count}
        </Badge>
      )}
    </div>
  );
};
