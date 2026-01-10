import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Bell, AlertTriangle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FlashNotificationProps {
  title: string;
  message: string;
  type?: 'critical' | 'urgent' | 'info';
  onDismiss: () => void;
  navigateTo?: string;
  autoHideSeconds?: number;
}

const FlashNotification = ({
  title,
  message,
  type = 'urgent',
  onDismiss,
  navigateTo,
  autoHideSeconds,
}: FlashNotificationProps) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoHideSeconds) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoHideSeconds * 1000);
      return () => clearTimeout(timer);
    }
  }, [autoHideSeconds]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  const handleViewClick = () => {
    if (navigateTo) {
      navigate(navigateTo);
    }
    handleDismiss();
  };

  const bgColors = {
    critical: 'bg-red-600',
    urgent: 'bg-orange-500',
    info: 'bg-blue-600',
  };

  const icons = {
    critical: <AlertTriangle className="w-6 h-6 text-white animate-pulse" />,
    urgent: <Clock className="w-6 h-6 text-white" />,
    info: <Bell className="w-6 h-6 text-white" />,
  };

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[100] transform transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className={`${bgColors[type]} shadow-lg`}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0">
                {icons[type]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-white text-sm sm:text-base truncate">
                  {title}
                </p>
                <p className="text-white/90 text-xs sm:text-sm truncate">
                  {message}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {navigateTo && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleViewClick}
                  className="bg-white/20 hover:bg-white/30 text-white border-0"
                >
                  View
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                onClick={handleDismiss}
                className="text-white hover:bg-white/20 h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlashNotification;
