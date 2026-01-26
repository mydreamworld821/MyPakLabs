import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/hooks/useChat';
import { ChatRoomCard } from '@/components/chat/ChatRoomCard';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Loader2, MessageCircle, ArrowLeft } from 'lucide-react';

const ChatList = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { rooms, isLoading, userType } = useChat();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 pb-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 pb-8">
          <div className="container mx-auto px-4 text-center">
            <MessageCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-xl font-semibold mb-2">Sign in to view chats</h1>
            <p className="text-muted-foreground mb-4">
              Access your video consultation chats after signing in
            </p>
            <Button onClick={() => navigate('/auth')}>Sign In</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16 pb-20">
        <div className="container mx-auto max-w-2xl">
          {/* Header */}
          <div className="sticky top-16 z-10 bg-background border-b px-4 py-3">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate(-1)}
                className="h-8 w-8"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="font-semibold text-lg">Chats</h1>
                <p className="text-xs text-muted-foreground">
                  Video consultation messages
                </p>
              </div>
            </div>
          </div>

          {/* Chat List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-12 px-4">
              <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <h2 className="font-medium mb-1">No chats yet</h2>
              <p className="text-sm text-muted-foreground mb-4">
                {userType === 'patient' 
                  ? 'Book a video consultation to start chatting with your doctor'
                  : 'Your patient chats will appear here'}
              </p>
              {userType === 'patient' && (
                <Button onClick={() => navigate('/video-consultation')}>
                  Book Video Consultation
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {rooms.map((room) => (
                <ChatRoomCard
                  key={room.id}
                  room={room}
                  userType={userType}
                  onClick={() => navigate(`/chat/${room.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ChatList;
