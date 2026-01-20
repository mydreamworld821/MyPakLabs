import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface LegalPageSection {
  title: string;
  content: string;
}

export interface LegalPage {
  id: string;
  page_type: string;
  title: string;
  subtitle: string | null;
  badge_text: string | null;
  icon_name: string | null;
  sections: LegalPageSection[];
  is_active: boolean;
  display_order: number;
  show_in_footer: boolean;
  footer_section: 'legal' | 'partners';
  footer_label: string | null;
  route_path: string;
  last_updated: string | null;
  created_at: string;
  updated_at: string;
}

// Public hook to fetch legal pages
export const useLegalPages = () => {
  return useQuery({
    queryKey: ['legal-pages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('legal_pages')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return (data || []).map(d => ({ ...d, sections: d.sections as unknown as LegalPageSection[] })) as LegalPage[];
    },
  });
};

// Hook to fetch a single legal page by route
export const useLegalPage = (routePath: string) => {
  return useQuery({
    queryKey: ['legal-page', routePath],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('legal_pages')
        .select('*')
        .eq('route_path', routePath)
        .eq('is_active', true)
        .single();
      
      if (error) throw error;
      return { ...data, sections: data.sections as unknown as LegalPageSection[] } as LegalPage;
    },
    enabled: !!routePath,
  });
};

// Admin hook for managing legal pages
export const useAdminLegalPages = () => {
  const queryClient = useQueryClient();

  const { data: pages = [], isLoading } = useQuery({
    queryKey: ['admin-legal-pages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('legal_pages')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return (data || []).map(d => ({ ...d, sections: d.sections as unknown as LegalPageSection[] })) as LegalPage[];
    },
  });

  const createPage = useMutation({
    mutationFn: async (page: Partial<LegalPage>) => {
      const { error } = await supabase
        .from('legal_pages')
        .insert(page as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-legal-pages'] });
      queryClient.invalidateQueries({ queryKey: ['legal-pages'] });
      toast.success('Legal page created');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updatePage = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LegalPage> & { id: string }) => {
      const { error } = await supabase
        .from('legal_pages')
        .update(updates as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-legal-pages'] });
      queryClient.invalidateQueries({ queryKey: ['legal-pages'] });
      toast.success('Legal page updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deletePage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('legal_pages')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-legal-pages'] });
      queryClient.invalidateQueries({ queryKey: ['legal-pages'] });
      toast.success('Legal page deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    pages,
    isLoading,
    createPage,
    updatePage,
    deletePage,
  };
};
