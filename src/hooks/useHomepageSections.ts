import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface HomepageSection {
  id: string;
  section_key: string;
  title: string;
  subtitle: string | null;
  is_visible: boolean;
  display_order: number;
  
  // Layout
  columns_desktop: number;
  columns_tablet: number;
  columns_mobile: number;
  section_padding_x: number;
  section_padding_y: number;
  items_gap: number;
  max_items: number;
  
  // Card
  card_width: string;
  card_height: number;
  card_border_radius: number;
  card_shadow: string;
  
  // Image
  image_height: number;
  image_width: string;
  image_position_x: number;
  image_position_y: number;
  image_fit: string;
  image_border_radius: number;
  
  // Style
  background_color: string;
  background_gradient: string | null;
  text_color: string;
  accent_color: string | null;
  
  section_type: string;
  custom_content: Record<string, unknown> | null;
}

export const useHomepageSections = () => {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSections = async () => {
    try {
      const { data, error } = await supabase
        .from("homepage_sections")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setSections(data as HomepageSection[]);
    } catch (error) {
      console.error("Error fetching homepage sections:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  const getSectionConfig = (sectionKey: string): HomepageSection | undefined => {
    return sections.find(s => s.section_key === sectionKey);
  };

  const getGridClasses = (section: HomepageSection): string => {
    const cols = {
      1: "grid-cols-1",
      2: "grid-cols-2",
      3: "grid-cols-3",
      4: "grid-cols-4",
      5: "grid-cols-5",
      6: "grid-cols-6",
    };
    return `grid ${cols[section.columns_mobile as keyof typeof cols] || "grid-cols-1"} md:${cols[section.columns_tablet as keyof typeof cols] || "grid-cols-2"} lg:${cols[section.columns_desktop as keyof typeof cols] || "grid-cols-4"}`;
  };

  const getCardStyle = (section: HomepageSection): React.CSSProperties => ({
    height: section.card_height ? `${section.card_height}px` : 'auto',
    borderRadius: `${section.card_border_radius}px`,
  });

  const getImageStyle = (section: HomepageSection): React.CSSProperties => ({
    height: section.image_height ? `${section.image_height}px` : 'auto',
    objectPosition: `${section.image_position_x}% ${section.image_position_y}%`,
    objectFit: section.image_fit as React.CSSProperties['objectFit'],
    borderRadius: `${section.image_border_radius}px`,
  });

  const getSectionStyle = (section: HomepageSection): React.CSSProperties => ({
    paddingLeft: `${section.section_padding_x}px`,
    paddingRight: `${section.section_padding_x}px`,
    paddingTop: `${section.section_padding_y}px`,
    paddingBottom: `${section.section_padding_y}px`,
    gap: `${section.items_gap}px`,
    backgroundColor: section.background_color !== 'transparent' ? section.background_color : undefined,
  });

  return { 
    sections, 
    loading, 
    refetch: fetchSections,
    getSectionConfig,
    getGridClasses,
    getCardStyle,
    getImageStyle,
    getSectionStyle
  };
};

export const useSectionConfig = (sectionKey: string) => {
  const [config, setConfig] = useState<HomepageSection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data, error } = await supabase
          .from("homepage_sections")
          .select("*")
          .eq("section_key", sectionKey)
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        setConfig(data as HomepageSection);
      } catch (error) {
        console.error(`Error fetching ${sectionKey} config:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [sectionKey]);

  return { config, loading };
};
