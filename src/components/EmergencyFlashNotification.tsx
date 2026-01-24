import { useState, useEffect, useCallback, Component, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, MapPin, Clock, Star, User, Navigation, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useGeolocation } from '@/hooks/useGeolocation';
import { toast } from '@/hooks/use-toast';

// Error Boundary to prevent white screen crashes
interface ErrorBoundaryState {
  hasError: boolean;
}

class NotificationErrorBoundary extends Component<{ children: ReactNode; onError?: () => void }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode; onError?: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('EmergencyFlashNotification Error:', error, errorInfo);
    // Don't crash the whole app - just hide the notification
    this.props.onError?.();
  }

  render() {
    if (this.state.hasError) {
      return null; // Render nothing if there's an error - prevents white screen
    }
    return this.props.children;
  }
}

interface EmergencyFlashNotificationProps {
  requestId: string;
  patientName: string;
  patientPhone?: string;
  city: string | null;
  locationAddress?: string | null;
  services: string[];
  urgency: 'critical' | 'within_1_hour' | 'scheduled';
  distance: number | null;
  patientOfferPrice: number | null;
  nurseId: string;
  onDismiss: () => void;
  onAccepted?: () => void;
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

const EmergencyFlashNotificationContent = ({
  requestId,
  patientName,
  patientPhone: _patientPhone,
  city,
  locationAddress,
  services,
  urgency,
  distance,
  patientOfferPrice,
  nurseId,
  onDismiss,
  onAccepted,
  autoHideSeconds = 45,
}: EmergencyFlashNotificationProps) => {
  // Safely handle navigation - wrap in try-catch
  let navigate: ReturnType<typeof useNavigate> | null = null;
  try {
    navigate = useNavigate();
  } catch (e) {
    console.error('useNavigate failed:', e);
  }

  const { getCurrentPosition } = useGeolocation();
  const [isVisible, setIsVisible] = useState(false);
  const [countdown, setCountdown] = useState(autoHideSeconds);
  const [showOfferInput, setShowOfferInput] = useState(false);
  const [offerPrice, setOfferPrice] = useState(patientOfferPrice?.toString() || '');
  const [etaMinutes, setEtaMinutes] = useState(distance ? Math.ceil(distance * 3).toString() : '15');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);

  // Animate in on mount
  useEffect(() => {
    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, 50);
    return () => clearTimeout(showTimer);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!isVisible || showOfferInput) return;
    
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
  }, [isVisible, showOfferInput]);

  // Subscribe to request status changes (if another nurse accepts)
  useEffect(() => {
    const channel = supabase
      .channel(`request-${requestId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'emergency_nursing_requests',
          filter: `id=eq.${requestId}`,
        },
        (payload) => {
          if (payload.new.status !== 'live') {
            // Request is no longer available
            toast({
              title: "Request Taken",
              description: "This request has been accepted by another nurse",
            });
            handleDismiss();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId]);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss();
    }, 300);
  }, [onDismiss]);

  const handleDecline = () => {
    handleDismiss();
  };

  const handleAcceptClick = () => {
    setShowOfferInput(true);
  };

  const handleSubmitOffer = async () => {
    if (!offerPrice || !etaMinutes) {
      toast({
        title: "Missing Information",
        description: "Please enter your price and ETA",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current location for the offer
      let currentLat: number | null = null;
      let currentLng: number | null = null;
      
      const position = await getCurrentPosition();
      if (position) {
        currentLat = position.latitude;
        currentLng = position.longitude;
      }

      // Submit the offer
      const { error } = await supabase
        .from('nurse_offers')
        .insert({
          request_id: requestId,
          nurse_id: nurseId,
          offered_price: parseInt(offerPrice),
          eta_minutes: parseInt(etaMinutes),
          nurse_lat: currentLat,
          nurse_lng: currentLng,
          distance_km: distance,
          status: 'pending',
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Already Submitted",
            description: "You've already sent an offer for this request",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        setIsAccepted(true);
        toast({
          title: "Offer Sent! 🎉",
          description: "The patient will review your offer and respond shortly",
        });
        
        // Wait a moment then dismiss
        setTimeout(() => {
          onAccepted?.();
          handleDismiss();
        }, 2000);
      }
    } catch (error) {
      console.error('Error submitting offer:', error);
      toast({
        title: "Error",
        description: "Failed to submit offer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDetails = () => {
    if (navigate) {
      navigate('/nurse-emergency-feed');
    } else {
      // Fallback: use window.location for navigation if router is not available
      window.location.href = '/nurse-emergency-feed';
    }
    handleDismiss();
  };

  const urgencyConfig = {
    critical: {
      bg: 'bg-gradient-to-r from-red-600 to-red-500',
      border: 'border-red-500',
      label: '🚨 CRITICAL EMERGENCY',
      pulse: true,
      color: 'text-red-500',
    },
    within_1_hour: {
      bg: 'bg-gradient-to-r from-orange-500 to-amber-500',
      border: 'border-orange-500',
      label: '⏰ URGENT REQUEST',
      pulse: false,
      color: 'text-orange-500',
    },
    scheduled: {
      bg: 'bg-gradient-to-r from-blue-500 to-cyan-500',
      border: 'border-blue-500',
      label: '📅 SCHEDULED VISIT',
      pulse: false,
      color: 'text-blue-500',
    },
  };

  const config = urgencyConfig[urgency];
  const servicesText = services.slice(0, 3).map(s => SERVICES_MAP[s] || s).join(' • ');
  const estimatedETA = distance ? Math.ceil(distance * 3) : null; // Rough estimate: 3 min per km

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Notification Card - Uber/InDrive Style */}
      <div
        className={`relative w-full sm:max-w-md transform transition-all duration-500 ease-out ${
          isVisible ? 'translate-y-0 scale-100' : 'translate-y-full sm:translate-y-8 scale-95'
        }`}
      >
        {/* Main Card */}
        <div className={`bg-zinc-900 sm:rounded-3xl overflow-hidden shadow-2xl ${config.border} border-t-4 sm:border-2`}>
          {/* Urgency Banner with Countdown */}
          <div className={`${config.bg} px-5 py-3 flex items-center justify-between ${config.pulse ? 'animate-pulse' : ''}`}>
            <span className="text-white font-bold text-sm tracking-wide">{config.label}</span>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-white font-bold text-sm">{countdown}</span>
              </div>
              <button
                onClick={handleDismiss}
                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-5 space-y-4">
            {/* Price and Distance Header */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-zinc-400 text-xs uppercase tracking-wider mb-1">
                  {patientOfferPrice ? 'Patient Offers' : 'Make Your Offer'}
                </p>
                <p className="text-4xl font-bold text-white">
                  {patientOfferPrice ? (
                    <>PKR {patientOfferPrice.toLocaleString()}</>
                  ) : (
                    <span className="text-2xl text-lime-400">Open Bidding</span>
                  )}
                </p>
              </div>
              <div className="text-right">
                {distance !== null && (
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1 text-lime-400">
                      <Navigation className="w-4 h-4" />
                      <span className="text-xl font-bold">{distance.toFixed(1)} km</span>
                    </div>
                    {estimatedETA && (
                      <div className="flex items-center gap-1 text-zinc-400 text-sm">
                        <Clock className="w-3 h-3" />
                        <span>~{estimatedETA} min</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Services Tags */}
            <div className="flex flex-wrap gap-2">
              {services.slice(0, 4).map((s) => (
                <span
                  key={s}
                  className="px-3 py-1 bg-zinc-800 rounded-full text-zinc-300 text-sm font-medium"
                >
                  {SERVICES_MAP[s] || s}
                </span>
              ))}
              {services.length > 4 && (
                <span className="px-3 py-1 bg-zinc-800 rounded-full text-zinc-400 text-sm">
                  +{services.length - 4} more
                </span>
              )}
            </div>

            {/* Patient Info Card */}
            <div className="bg-zinc-800/50 rounded-2xl p-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                  <User className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold text-lg truncate">{patientName}</h3>
                  <div className="flex items-center gap-1 text-zinc-400 text-sm">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{locationAddress || city || 'Location shared'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Offer Input Section (shown after clicking Accept) */}
            {showOfferInput && !isAccepted && (
              <div className="bg-zinc-800 rounded-2xl p-4 space-y-4 animate-in slide-in-from-bottom-4 duration-300">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">
                      Your Price (PKR)
                    </label>
                    <Input
                      type="number"
                      value={offerPrice}
                      onChange={(e) => setOfferPrice(e.target.value)}
                      placeholder="2000"
                      className="bg-zinc-700 border-zinc-600 text-white text-lg font-semibold h-12"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1 block">
                      ETA (Minutes)
                    </label>
                    <Input
                      type="number"
                      value={etaMinutes}
                      onChange={(e) => setEtaMinutes(e.target.value)}
                      placeholder="15"
                      className="bg-zinc-700 border-zinc-600 text-white text-lg font-semibold h-12"
                    />
                  </div>
                </div>
                <Button
                  className="w-full bg-gradient-to-r from-lime-400 to-green-500 text-black hover:from-lime-500 hover:to-green-600 py-6 text-lg font-bold rounded-xl"
                  onClick={handleSubmitOffer}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Confirm & Send Offer'
                  )}
                </Button>
              </div>
            )}

            {/* Success State */}
            {isAccepted && (
              <div className="bg-green-900/30 border border-green-500/30 rounded-2xl p-4 text-center animate-in zoom-in-95 duration-300">
                <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-3">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-green-400 font-bold text-lg">Offer Sent Successfully!</h3>
                <p className="text-zinc-400 text-sm">Waiting for patient response...</p>
              </div>
            )}

            {/* Action Buttons */}
            {!showOfferInput && !isAccepted && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button
                  variant="outline"
                  className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 hover:text-white py-7 text-lg font-semibold rounded-xl"
                  onClick={handleDecline}
                >
                  Decline
                </Button>
                <Button
                  className="bg-gradient-to-r from-lime-400 to-green-500 text-black hover:from-lime-500 hover:to-green-600 py-7 text-lg font-bold rounded-xl"
                  onClick={handleAcceptClick}
                >
                  Accept
                </Button>
              </div>
            )}

            {/* View Details Link */}
            {!isAccepted && (
              <button
                onClick={handleViewDetails}
                className="w-full text-center text-zinc-400 hover:text-white text-sm py-2 transition-colors"
              >
                View all details →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Wrapper component with error boundary to prevent white screen crashes
const EmergencyFlashNotification = (props: EmergencyFlashNotificationProps) => {
  return (
    <NotificationErrorBoundary onError={props.onDismiss}>
      <EmergencyFlashNotificationContent {...props} />
    </NotificationErrorBoundary>
  );
};

export default EmergencyFlashNotification;
