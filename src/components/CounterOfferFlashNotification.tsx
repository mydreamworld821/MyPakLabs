import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, DollarSign, Clock, User, Loader2, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type CounterRole = 'nurse' | 'patient';

export interface CounterOfferFlashProps {
  offerId: string;
  requestId: string;
  role: CounterRole; // who is viewing this popup
  counterpartyName: string;
  myCurrentPrice: number; // last price I had on the table
  theirCounterPrice: number; // price the other side is now proposing
  etaMinutes?: number;
  onDismiss: () => void;
  autoHideSeconds?: number;
}

const CounterOfferFlashNotification = ({
  offerId,
  requestId,
  role,
  counterpartyName,
  myCurrentPrice,
  theirCounterPrice,
  etaMinutes,
  onDismiss,
  autoHideSeconds = 60,
}: CounterOfferFlashProps) => {
  let navigate: ReturnType<typeof useNavigate> | null = null;
  try { navigate = useNavigate(); } catch { /* outside router */ }

  const [visible, setVisible] = useState(false);
  const [countdown, setCountdown] = useState(autoHideSeconds);
  const [showCounterInput, setShowCounterInput] = useState(false);
  const [newPrice, setNewPrice] = useState(theirCounterPrice.toString());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!visible || showCounterInput) return;
    const i = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { handleDismiss(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(i);
  }, [visible, showCounterInput]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    setTimeout(() => onDismiss(), 300);
  }, [onDismiss]);

  const handleAccept = async () => {
    setSubmitting(true);
    // Whoever accepts -> set offered_price to theirCounterPrice, clear counter, mark pending again
    // If role==='patient' accepting nurse's response: same logic.
    const { error } = await supabase
      .from('nurse_offers')
      .update({
        offered_price: theirCounterPrice,
        patient_counter_price: null,
        status: 'pending' as any,
      })
      .eq('id', offerId);
    setSubmitting(false);
    if (error) {
      toast({ title: 'Error', description: 'Failed to accept counter', variant: 'destructive' });
      return;
    }
    toast({ title: 'Counter Accepted ✅', description: `Price set to PKR ${theirCounterPrice.toLocaleString()}` });
    handleDismiss();
  };

  const handleSendCounter = async () => {
    if (!newPrice || isNaN(parseInt(newPrice))) {
      toast({ title: 'Enter price', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    // If I'm the patient -> set patient_counter_price + status='countered'
    // If I'm the nurse  -> update offered_price (new ask), clear patient_counter_price, status='pending'
    const update = role === 'patient'
      ? { patient_counter_price: parseInt(newPrice), status: 'countered' as any }
      : { offered_price: parseInt(newPrice), patient_counter_price: null, status: 'pending' as any };

    const { error } = await supabase.from('nurse_offers').update(update).eq('id', offerId);
    setSubmitting(false);
    if (error) {
      toast({ title: 'Error', description: 'Failed to send counter', variant: 'destructive' });
      return;
    }
    toast({ title: 'Counter Sent 💰', description: `PKR ${parseInt(newPrice).toLocaleString()} proposed` });
    handleDismiss();
  };

  const handleView = () => {
    if (role === 'nurse') {
      navigate ? navigate('/nurse-emergency-feed') : (window.location.href = '/nurse-emergency-feed');
    } else {
      const url = `/emergency-request-status/${requestId}`;
      navigate ? navigate(url) : (window.location.href = url);
    }
    handleDismiss();
  };

  const title = role === 'nurse' ? '💰 Patient Counter Offer' : '💰 Nurse Counter Response';

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-300 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className={`absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`} />
      <div
        className={`relative w-full sm:max-w-md transform transition-all duration-500 ease-out ${
          visible ? 'translate-y-0 scale-100' : 'translate-y-full sm:translate-y-8 scale-95'
        }`}
      >
        <div className="bg-zinc-900 sm:rounded-3xl overflow-hidden shadow-2xl border-t-4 sm:border-2 border-amber-500">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3 flex items-center justify-between">
            <span className="text-white font-bold text-sm tracking-wide flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4" /> {title}
            </span>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-white font-bold text-sm">{countdown}</span>
              </div>
              <button onClick={handleDismiss} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div className="bg-zinc-800/50 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <User className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-zinc-400 text-xs uppercase tracking-wider">{role === 'nurse' ? 'Patient' : 'Nurse'}</p>
                <h3 className="text-white font-semibold text-lg truncate">{counterpartyName}</h3>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-800 rounded-2xl p-4 text-center">
                <p className="text-zinc-400 text-xs uppercase mb-1">Your last price</p>
                <p className="text-2xl font-bold text-zinc-300">PKR {myCurrentPrice.toLocaleString()}</p>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/40 rounded-2xl p-4 text-center">
                <p className="text-amber-300 text-xs uppercase mb-1">Their counter</p>
                <p className="text-2xl font-bold text-amber-400">PKR {theirCounterPrice.toLocaleString()}</p>
              </div>
            </div>

            {etaMinutes != null && (
              <div className="flex items-center justify-center gap-2 text-zinc-400 text-sm">
                <Clock className="w-4 h-4" /> ETA {etaMinutes} min
              </div>
            )}

            {showCounterInput ? (
              <div className="bg-zinc-800 rounded-2xl p-4 space-y-3">
                <label className="text-zinc-400 text-xs uppercase tracking-wider block">Your new price (PKR)</label>
                <Input
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="bg-zinc-700 border-zinc-600 text-white text-lg font-semibold h-12"
                />
                <Button
                  className="w-full bg-gradient-to-r from-lime-400 to-green-500 text-black hover:from-lime-500 hover:to-green-600 py-6 font-bold rounded-xl"
                  onClick={handleSendCounter}
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Counter'}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button
                  variant="outline"
                  className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 hover:text-white py-6 font-semibold rounded-xl"
                  onClick={() => setShowCounterInput(true)}
                >
                  <DollarSign className="w-4 h-4 mr-1" /> Counter Back
                </Button>
                <Button
                  className="bg-gradient-to-r from-lime-400 to-green-500 text-black hover:from-lime-500 hover:to-green-600 py-6 font-bold rounded-xl"
                  onClick={handleAccept}
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : `Accept PKR ${theirCounterPrice.toLocaleString()}`}
                </Button>
              </div>
            )}

            <button onClick={handleView} className="w-full text-center text-zinc-400 hover:text-white text-sm py-2">
              View full details →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CounterOfferFlashNotification;
