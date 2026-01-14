import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, MapPin, Clock, Star, Syringe, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmergencyFlashNotificationProps {
  requestId: string;
  patientName: string;
  city: string | null;
  services: string[];
  urgency: 'critical' | 'within_1_hour' | 'scheduled';
  distance: number | null;
  patientOfferPrice: number | null;
  onDismiss: () => void;
  autoHideSeconds?: number;
}

const SERVICES_MAP: Record<string, string> = {
  iv_cannula: "IV Cannula",
  injection: "Injection",
  wound_dressing: "Wound Dressing",
  medication_administration: "Medication",
  vital_signs: "Vital Signs",
  catheterization: "Catheterization",
  nebulization: "Nebulization",
  blood_sugar: "Blood Sugar",
  elderly_care: "Elderly Care",
  post_surgical: "Post-Surgical",
};

const EmergencyFlashNotification = ({
  requestId,
  patientName,
  city,
  services,
  urgency,
  distance,
  patientOfferPrice,
  onDismiss,
  autoHideSeconds = 30,
}: EmergencyFlashNotificationProps) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [countdown, setCountdown] = useState(autoHideSeconds);

  // Animate in on mount
  useEffect(() => {
    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, 50);
    return () => clearTimeout(showTimer);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!isVisible) return;
    
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          handleDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss();
    }, 300);
  };

  const handleViewRequest = () => {
    navigate('/nurse-emergency-feed');
    handleDismiss();
  };

  const urgencyConfig = {
    critical: {
      bg: 'bg-red-600',
      label: '🚨 CRITICAL',
      pulse: true,
    },
    within_1_hour: {
      bg: 'bg-orange-500',
      label: '⏰ URGENT',
      pulse: false,
    },
    scheduled: {
      bg: 'bg-blue-500',
      label: '📅 SCHEDULED',
      pulse: false,
    },
  };

  const config = urgencyConfig[urgency];
  const servicesText = services.slice(0, 2).map(s => SERVICES_MAP[s] || s).join(', ');

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-start justify-center pt-4 sm:pt-8 px-4 transition-all duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleDismiss}
      />

      {/* Notification Card - InDrive Style */}
      <div
        className={`relative w-full max-w-md transform transition-all duration-300 ${
          isVisible ? 'translate-y-0 scale-100' : '-translate-y-8 scale-95'
        }`}
      >
        {/* Cancel Request Button */}
        <button
          onClick={handleDismiss}
          className="flex items-center gap-2 mb-3 px-4 py-2 bg-red-900/90 text-white rounded-full text-sm font-medium hover:bg-red-800 transition-colors"
        >
          <X className="w-4 h-4" />
          Dismiss ({countdown}s)
        </button>

        {/* Main Card */}
        <div className="bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-zinc-700">
          {/* Urgency Banner */}
          <div className={`${config.bg} px-4 py-2 text-white font-bold text-center ${config.pulse ? 'animate-pulse' : ''}`}>
            {config.label} - New Emergency Request!
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Price and ETA Row */}
            <div className="flex items-baseline justify-between">
              <div>
                {patientOfferPrice ? (
                  <p className="text-3xl font-bold text-white">
                    PKR {patientOfferPrice.toLocaleString()}
                  </p>
                ) : (
                  <p className="text-2xl font-bold text-white">
                    Open Price
                  </p>
                )}
              </div>
              {distance !== null && (
                <div className="flex items-center gap-1 text-lime-400">
                  <MapPin className="w-4 h-4" />
                  <span className="text-lg font-semibold">{distance.toFixed(1)} km</span>
                </div>
              )}
            </div>

            {/* Services Badge */}
            <div className="inline-block px-3 py-1 bg-zinc-800 rounded-full text-zinc-300 text-sm">
              {servicesText}{services.length > 2 ? ` +${services.length - 2}` : ''}
            </div>

            {/* Patient Info */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold">{patientName}</span>
                </div>
                <div className="flex items-center gap-1 text-zinc-400 text-sm">
                  <MapPin className="w-3 h-3" />
                  <span>{city || 'Location shared'}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                variant="outline"
                className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 hover:text-white py-6 text-base font-semibold rounded-xl"
                onClick={handleDismiss}
              >
                Decline
              </Button>
              <Button
                className="bg-gradient-to-r from-lime-400 to-green-500 text-black hover:from-lime-500 hover:to-green-600 py-6 text-base font-semibold rounded-xl"
                onClick={handleViewRequest}
              >
                View & Respond
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyFlashNotification;
