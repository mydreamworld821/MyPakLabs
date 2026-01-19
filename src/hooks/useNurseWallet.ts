import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface NurseWallet {
  id: string;
  nurse_id: string;
  total_earnings: number;
  total_commission_owed: number;
  total_commission_paid: number;
  pending_commission: number;
  is_suspended: boolean;
  suspension_reason: string | null;
  last_payment_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface NurseWalletTransaction {
  id: string;
  nurse_id: string;
  wallet_id: string;
  booking_type: 'emergency' | 'advance';
  booking_id: string;
  amount: number;
  commission_amount: number;
  net_amount: number;
  status: string;
  created_at: string;
}

export interface NurseCommissionPayment {
  id: string;
  nurse_id: string;
  wallet_id: string;
  amount: number;
  payment_method: string | null;
  screenshot_url: string | null;
  transaction_reference: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommissionSettings {
  id: string;
  commission_percentage: number;
  payment_cycle_days: number;
  grace_period_days: number;
  is_active: boolean;
}

export const useNurseWallet = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch nurse profile
  const { data: nurseProfile } = useQuery({
    queryKey: ['nurse-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('nurses')
        .select('id')
        .eq('user_id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch commission settings
  const { data: commissionSettings } = useQuery({
    queryKey: ['commission-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('commission_settings')
        .select('*')
        .eq('is_active', true)
        .single();
      if (error) throw error;
      return data as CommissionSettings;
    },
  });

  // Fetch nurse wallet
  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ['nurse-wallet', nurseProfile?.id],
    queryFn: async () => {
      if (!nurseProfile?.id) return null;
      const { data, error } = await supabase
        .from('nurse_wallets')
        .select('*')
        .eq('nurse_id', nurseProfile.id)
        .maybeSingle();
      if (error) throw error;
      return data as NurseWallet | null;
    },
    enabled: !!nurseProfile?.id,
  });

  // Fetch transactions
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ['nurse-wallet-transactions', nurseProfile?.id],
    queryFn: async () => {
      if (!nurseProfile?.id) return [];
      const { data, error } = await supabase
        .from('nurse_wallet_transactions')
        .select('*')
        .eq('nurse_id', nurseProfile.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as NurseWalletTransaction[];
    },
    enabled: !!nurseProfile?.id,
  });

  // Fetch commission payments
  const { data: commissionPayments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['nurse-commission-payments', nurseProfile?.id],
    queryFn: async () => {
      if (!nurseProfile?.id) return [];
      const { data, error } = await supabase
        .from('nurse_commission_payments')
        .select('*')
        .eq('nurse_id', nurseProfile.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as NurseCommissionPayment[];
    },
    enabled: !!nurseProfile?.id,
  });

  // Submit commission payment
  const submitPayment = useMutation({
    mutationFn: async ({
      amount,
      paymentMethod,
      screenshotUrl,
      transactionReference,
    }: {
      amount: number;
      paymentMethod: string;
      screenshotUrl: string;
      transactionReference?: string;
    }) => {
      if (!nurseProfile?.id || !wallet?.id) throw new Error('Wallet not found');

      const { error } = await supabase
        .from('nurse_commission_payments')
        .insert({
          nurse_id: nurseProfile.id,
          wallet_id: wallet.id,
          amount,
          payment_method: paymentMethod,
          screenshot_url: screenshotUrl,
          transaction_reference: transactionReference,
          status: 'pending',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nurse-commission-payments'] });
      toast.success('Payment submitted for verification');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    nurseProfile,
    wallet,
    transactions,
    commissionPayments,
    commissionSettings,
    isLoading: walletLoading || transactionsLoading || paymentsLoading,
    submitPayment,
  };
};

// Admin hook for managing nurse commissions
export const useAdminNurseCommissions = () => {
  const queryClient = useQueryClient();

  // Fetch all nurse wallets with nurse info
  const { data: nurseWallets = [], isLoading: walletsLoading } = useQuery({
    queryKey: ['admin-nurse-wallets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nurse_wallets')
        .select(`
          *,
          nurses:nurse_id (
            id,
            full_name,
            photo_url,
            phone,
            email,
            city
          )
        `)
        .order('pending_commission', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch all pending commission payments
  const { data: pendingPayments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['admin-pending-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nurse_commission_payments')
        .select(`
          *,
          nurses:nurse_id (
            id,
            full_name,
            photo_url,
            phone
          )
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch commission settings
  const { data: settings } = useQuery({
    queryKey: ['commission-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('commission_settings')
        .select('*')
        .eq('is_active', true)
        .single();
      if (error) throw error;
      return data as CommissionSettings;
    },
  });

  // Update commission settings
  const updateSettings = useMutation({
    mutationFn: async (newSettings: Partial<CommissionSettings>) => {
      const { error } = await supabase
        .from('commission_settings')
        .update(newSettings)
        .eq('is_active', true);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-settings'] });
      toast.success('Commission settings updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Approve/reject commission payment
  const reviewPayment = useMutation({
    mutationFn: async ({
      paymentId,
      status,
      adminNotes,
      userId,
    }: {
      paymentId: string;
      status: 'approved' | 'rejected';
      adminNotes?: string;
      userId: string;
    }) => {
      // Get payment details
      const { data: payment, error: fetchError } = await supabase
        .from('nurse_commission_payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (fetchError) throw fetchError;

      // Update payment status
      const { error: updateError } = await supabase
        .from('nurse_commission_payments')
        .update({
          status,
          admin_notes: adminNotes,
          reviewed_by: userId,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', paymentId);

      if (updateError) throw updateError;

      // If approved, update wallet
      if (status === 'approved') {
        // Get current wallet values
        const { data: walletData } = await supabase
          .from('nurse_wallets')
          .select('pending_commission, total_commission_paid')
          .eq('id', payment.wallet_id)
          .single();

        if (walletData) {
          const { error: walletError } = await supabase
            .from('nurse_wallets')
            .update({
              pending_commission: Math.max(0, (walletData.pending_commission || 0) - payment.amount),
              total_commission_paid: (walletData.total_commission_paid || 0) + payment.amount,
              last_payment_date: new Date().toISOString(),
              is_suspended: false,
              suspension_reason: null,
            })
            .eq('id', payment.wallet_id);

          if (walletError) throw walletError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-payments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-nurse-wallets'] });
      toast.success('Payment reviewed successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Suspend/unsuspend nurse
  const toggleSuspension = useMutation({
    mutationFn: async ({
      walletId,
      suspend,
      reason,
    }: {
      walletId: string;
      suspend: boolean;
      reason?: string;
    }) => {
      const { error } = await supabase
        .from('nurse_wallets')
        .update({
          is_suspended: suspend,
          suspension_reason: suspend ? reason : null,
        })
        .eq('id', walletId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-nurse-wallets'] });
      toast.success('Nurse status updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    nurseWallets,
    pendingPayments,
    settings,
    isLoading: walletsLoading || paymentsLoading,
    updateSettings,
    reviewPayment,
    toggleSuspension,
  };
};
