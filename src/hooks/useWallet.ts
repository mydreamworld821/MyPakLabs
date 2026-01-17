import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Wallet {
  id: string;
  user_id: string;
  total_credits: number;
  created_at: string;
  updated_at: string;
}

interface WalletTransaction {
  id: string;
  user_id: string;
  wallet_id: string;
  type: "credit" | "debit";
  credits: number;
  service_type: string;
  reference_id: string | null;
  description: string | null;
  created_at: string;
}

interface WalletSettings {
  id: string;
  is_enabled: boolean;
  credits_per_booking: number;
  minimum_redemption_credits: number;
  credits_to_pkr_ratio: number;
  credits_expiry_months: number | null;
}

export const useWallet = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch wallet settings (public)
  const { data: settings } = useQuery({
    queryKey: ["wallet-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wallet_settings")
        .select("*")
        .single();

      if (error) throw error;
      return data as WalletSettings;
    },
  });

  // Fetch user wallet
  const { data: wallet, isLoading: isLoadingWallet } = useQuery({
    queryKey: ["wallet", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      // If no wallet exists, create one
      if (!data) {
        const { data: newWallet, error: createError } = await supabase
          .from("wallets")
          .insert({ user_id: user.id, total_credits: 0 })
          .select()
          .single();

        if (createError) throw createError;
        return newWallet as Wallet;
      }

      return data as Wallet;
    },
    enabled: !!user,
  });

  // Fetch wallet transactions
  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery({
    queryKey: ["wallet-transactions", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as WalletTransaction[];
    },
    enabled: !!user,
  });

  // Add credits mutation
  const addCredits = useMutation({
    mutationFn: async ({
      credits,
      serviceType,
      referenceId,
      description,
    }: {
      credits: number;
      serviceType: string;
      referenceId?: string;
      description?: string;
    }) => {
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase.rpc("add_wallet_credits", {
        p_user_id: user.id,
        p_credits: credits,
        p_service_type: serviceType,
        p_reference_id: referenceId || null,
        p_description: description || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["wallet-transactions", user?.id] });
    },
    onError: (error) => {
      console.error("Error adding credits:", error);
      toast.error("Failed to add wallet credits");
    },
  });

  // Deduct credits mutation
  const deductCredits = useMutation({
    mutationFn: async ({
      credits,
      serviceType,
      referenceId,
      description,
    }: {
      credits: number;
      serviceType: string;
      referenceId?: string;
      description?: string;
    }) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase.rpc("deduct_wallet_credits", {
        p_user_id: user.id,
        p_credits: credits,
        p_service_type: serviceType,
        p_reference_id: referenceId || null,
        p_description: description || null,
      });

      if (error) throw error;
      if (!data) throw new Error("Insufficient credits");

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["wallet-transactions", user?.id] });
    },
    onError: (error: any) => {
      console.error("Error deducting credits:", error);
      toast.error(error.message || "Failed to deduct wallet credits");
    },
  });

  // Calculate PKR value from credits
  const creditsToPKR = (credits: number): number => {
    const ratio = settings?.credits_to_pkr_ratio || 10;
    return Math.floor(credits / ratio);
  };

  // Calculate credits needed for PKR amount
  const pkrToCredits = (pkr: number): number => {
    const ratio = settings?.credits_to_pkr_ratio || 10;
    return pkr * ratio;
  };

  // Check if user can redeem credits
  const canRedeem = (requiredCredits: number): boolean => {
    if (!settings?.is_enabled) return false;
    if (!wallet) return false;
    if (wallet.total_credits < (settings?.minimum_redemption_credits || 1000)) return false;
    if (wallet.total_credits < requiredCredits) return false;
    return true;
  };

  return {
    wallet,
    transactions,
    settings,
    isLoading: isLoadingWallet || isLoadingTransactions,
    addCredits,
    deductCredits,
    creditsToPKR,
    pkrToCredits,
    canRedeem,
    totalCredits: wallet?.total_credits || 0,
    totalPKR: creditsToPKR(wallet?.total_credits || 0),
    minimumCredits: settings?.minimum_redemption_credits || 1000,
    creditsPerBooking: settings?.credits_per_booking || 10,
    isEnabled: settings?.is_enabled ?? true,
  };
};

// Hook for admin wallet management
export const useAdminWallet = () => {
  const queryClient = useQueryClient();

  // Fetch all wallets with user info
  const { data: wallets = [], isLoading } = useQuery({
    queryKey: ["admin-wallets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wallets")
        .select(`
          *,
          profiles:user_id (
            full_name,
            phone,
            city
          )
        `)
        .order("total_credits", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Fetch wallet settings
  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["wallet-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wallet_settings")
        .select("*")
        .single();

      if (error) throw error;
      return data as WalletSettings;
    },
  });

  // Update settings
  const updateSettings = useMutation({
    mutationFn: async (updates: Partial<WalletSettings>) => {
      const { error } = await supabase
        .from("wallet_settings")
        .update(updates)
        .eq("id", settings?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet-settings"] });
      toast.success("Wallet settings updated");
    },
    onError: (error) => {
      console.error("Error updating settings:", error);
      toast.error("Failed to update settings");
    },
  });

  // Admin add credits to user
  const adminAddCredits = useMutation({
    mutationFn: async ({
      userId,
      credits,
      description,
    }: {
      userId: string;
      credits: number;
      description?: string;
    }) => {
      const { error } = await supabase.rpc("add_wallet_credits", {
        p_user_id: userId,
        p_credits: credits,
        p_service_type: "admin_adjustment",
        p_reference_id: null,
        p_description: description || "Admin credit adjustment",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-wallets"] });
      toast.success("Credits added successfully");
    },
    onError: (error) => {
      console.error("Error adding credits:", error);
      toast.error("Failed to add credits");
    },
  });

  // Admin deduct credits from user
  const adminDeductCredits = useMutation({
    mutationFn: async ({
      userId,
      credits,
      description,
    }: {
      userId: string;
      credits: number;
      description?: string;
    }) => {
      const { data, error } = await supabase.rpc("deduct_wallet_credits", {
        p_user_id: userId,
        p_credits: credits,
        p_service_type: "admin_adjustment",
        p_reference_id: null,
        p_description: description || "Admin debit adjustment",
      });

      if (error) throw error;
      if (!data) throw new Error("Insufficient credits");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-wallets"] });
      toast.success("Credits deducted successfully");
    },
    onError: (error: any) => {
      console.error("Error deducting credits:", error);
      toast.error(error.message || "Failed to deduct credits");
    },
  });

  // Fetch user transactions for admin view
  const fetchUserTransactions = async (userId: string) => {
    const { data, error } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;
    return data;
  };

  return {
    wallets,
    settings,
    isLoading: isLoading || isLoadingSettings,
    updateSettings,
    adminAddCredits,
    adminDeductCredits,
    fetchUserTransactions,
  };
};
