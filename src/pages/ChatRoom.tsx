import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, isToday, isYesterday } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/hooks/useChat';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Video, Lock, Calendar, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const ChatRoom = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    messages,
    currentRoom,
    isLoading,
    isSending,
    userType,
    sendMessage,
    sendImage,
    sendVoiceMessage,
    isChatActive,
  } = useChat({ roomId });

  const isActive = isChatActive(currentRoom);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  if (!currentRoom) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Chat not found</p>
          <Button onClick={() => navigate('/chats')}>Back to Chats</Button>
        </div>
      </div>
    );
  }

  const displayName = userType === 'patient' 
    ? currentRoom.doctor?.full_name 
    : currentRoom.patient?.full_name || 'Patient';
  
  const photoUrl = userType === 'patient' 
    ? currentRoom.doctor?.photo_url 
    : currentRoom.patient?.avatar_url;

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'EEEE, MMMM d, yyyy');
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = format(new Date(message.created_at), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, typeof messages>);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background border-b px-3 py-2 safe-area-inset-top">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/chats')}
            className="h-8 w-8 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          
          <Avatar className="h-10 w-10">
            <AvatarImage src={photoUrl || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {displayName?.charAt(0)?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h1 className="font-medium text-sm truncate">{displayName}</h1>
            <div className="flex items-center gap-1">
              <Video className="w-3 h-3 text-primary" />
              <span className="text-[10px] text-muted-foreground">
                {currentRoom.appointment?.appointment_date && (
                  <>
                    {format(new Date(currentRoom.appointment.appointment_date), 'MMM d')} at{' '}
                    {currentRoom.appointment.appointment_time}
                  </>
                )}
              </span>
            </div>
          </div>

          {isActive ? (
            <Badge className="bg-green-100 text-green-700 text-[10px]">Active</Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px]">
              <Lock className="w-2.5 h-2.5 mr-1" />
              Inactive
            </Badge>
          )}
        </div>
      </div>

      {/* Chat Info Banner */}
      {!isActive && currentRoom.appointment && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
          <div className="flex items-center gap-2 text-amber-800">
            <Lock className="w-4 h-4 shrink-0" />
            <p className="text-xs">
              Chat is available from 15 minutes before to 24 hours after your appointment.
              {currentRoom.appointment.status === 'cancelled' && ' (Appointment cancelled)'}
            </p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 bg-muted/30">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <Video className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {isActive 
                ? 'Send a message to start the conversation'
                : 'Messages will appear here when the chat becomes active'}
            </p>
            {currentRoom.appointment && (
              <div className="mt-4 inline-flex items-center gap-2 bg-background rounded-lg px-3 py-2 text-xs">
                <Calendar className="w-3 h-3 text-primary" />
                <span>{format(new Date(currentRoom.appointment.appointment_date), 'MMM d, yyyy')}</span>
                <Clock className="w-3 h-3 text-primary ml-2" />
                <span>{currentRoom.appointment.appointment_time}</span>
              </div>
            )}
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date}>
              <div className="flex justify-center mb-3">
                <span className="bg-background text-muted-foreground text-[10px] px-3 py-1 rounded-full shadow-sm">
                  {formatDateHeader(dateMessages[0].created_at)}
                </span>
              </div>
              <div className="space-y-2">
                {dateMessages.map((message) => (
                  <ChatBubble
                    key={message.id}
                    message={message}
                    isOwn={message.sender_id === user.id}
                  />
                ))}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput
        onSendMessage={sendMessage}
        onSendImage={sendImage}
        onSendVoice={sendVoiceMessage}
        disabled={!isActive}
        isSending={isSending}
      />
    </div>
  );
};

export default ChatRoom;
