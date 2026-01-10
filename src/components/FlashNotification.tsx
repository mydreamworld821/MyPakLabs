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
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Animate in on mount
  useEffect(() => {
    console.log('FlashNotification mounted with:', { title, message, type });
    // Small delay to trigger CSS animation
    const showTimer = setTimeout(() => {
      setIsVisible(true);
      setIsAnimating(true);
    }, 50);

    return () => clearTimeout(showTimer);
  }, []);

  useEffect(() => {
    if (autoHideSeconds && isVisible) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoHideSeconds * 1000);
      return () => clearTimeout(timer);
    }
  }, [autoHideSeconds, isVisible]);

  const handleDismiss = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss();
    }, 300);
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

  // Always render but control visibility with CSS
  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[9999] transform transition-all duration-300 ease-out ${
        isAnimating ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}
      style={{ pointerEvents: isAnimating ? 'auto' : 'none' }}
    >
      <div className={`${bgColors[type]} shadow-2xl`}>
        <div className="safe-area-inset-top" />
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0 p-2 bg-white/20 rounded-full">
                {icons[type]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-white text-sm sm:text-base">
                  {title}
                </p>
                <p className="text-white/90 text-xs sm:text-sm mt-0.5">
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
                  className="bg-white text-gray-900 hover:bg-white/90 font-semibold shadow-lg"
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
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlashNotification;
