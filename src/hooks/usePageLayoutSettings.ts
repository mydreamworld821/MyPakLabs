import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PageLayoutSettings {
  id: string;
  page_key: string;
  page_title: string;
  layout_type: string;
  columns_mobile: number;
  columns_tablet: number;
  columns_desktop: number;
  items_gap: number;
  card_padding: number;
  card_border_radius: number;
  card_shadow: string;
  card_min_height: number;
  logo_size: number;
  logo_border_radius: number;
  show_logo_border: boolean;
  show_description: boolean;
  show_rating: boolean;
  show_branch_count: boolean;
  description_lines: number;
  primary_button_text: string;
  secondary_button_text: string | null;
  button_width: number;
}

const defaultSettings: PageLayoutSettings = {
  id: "",
  page_key: "",
  page_title: "",
  layout_type: "list",
  columns_mobile: 1,
  columns_tablet: 1,
  columns_desktop: 1,
  items_gap: 16,
  card_padding: 24,
  card_border_radius: 12,
  card_shadow: "md",
  card_min_height: 120,
  logo_size: 96,
  logo_border_radius: 8,
  show_logo_border: true,
  show_description: true,
  show_rating: true,
  show_branch_count: true,
  description_lines: 2,
  primary_button_text: "View Details",
  secondary_button_text: null,
  button_width: 160,
};

export const usePageLayoutSettings = (pageKey: string) => {
  const [settings, setSettings] = useState<PageLayoutSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("page_layout_settings")
          .select("*")
          .eq("page_key", pageKey)
          .single();

        if (error) {
          console.error("Error fetching page layout settings:", error);
          return;
        }

        if (data) {
          setSettings(data as PageLayoutSettings);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [pageKey]);

  const getCardStyle = (): React.CSSProperties => ({
    padding: `${settings.card_padding}px`,
    borderRadius: `${settings.card_border_radius}px`,
    minHeight: `${settings.card_min_height}px`,
    boxShadow:
      settings.card_shadow === "none"
        ? "none"
        : settings.card_shadow === "sm"
        ? "0 1px 2px rgba(0,0,0,0.05)"
        : settings.card_shadow === "lg"
        ? "0 10px 15px rgba(0,0,0,0.1)"
        : "0 4px 6px rgba(0,0,0,0.1)",
  });

  const getLogoStyle = (): React.CSSProperties => ({
    width: `${settings.logo_size}px`,
    height: `${settings.logo_size}px`,
    borderRadius: `${settings.logo_border_radius}px`,
    border: settings.show_logo_border ? "2px solid hsl(var(--border))" : "none",
  });

  const getGridClasses = (): string => {
    if (settings.layout_type === "list") {
      return "flex flex-col";
    }
    
    return `grid grid-cols-${settings.columns_mobile} md:grid-cols-${settings.columns_tablet} lg:grid-cols-${settings.columns_desktop}`;
  };

  return {
    settings,
    loading,
    getCardStyle,
    getLogoStyle,
    getGridClasses,
  };
};