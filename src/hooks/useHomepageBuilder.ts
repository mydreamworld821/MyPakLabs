import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { HomepageSection } from "@/hooks/useHomepageSections";

export interface BuilderState {
  sections: HomepageSection[];
  selectedIds: string[];
  clipboard: HomepageSection[];
  history: HomepageSection[][];
  historyIndex: number;
  devicePreview: "desktop" | "tablet" | "mobile";
  gridSnap: boolean;
  isDragging: boolean;
}

const MAX_HISTORY = 50;

export const useHomepageBuilder = () => {
  const [state, setState] = useState<BuilderState>({
    sections: [],
    selectedIds: [],
    clipboard: [],
    history: [],
    historyIndex: -1,
    devicePreview: "desktop",
    gridSnap: true,
    isDragging: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch sections from database
  const fetchSections = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("homepage_sections")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      
      const sections = data as HomepageSection[];
      setState(prev => ({
        ...prev,
        sections,
        history: [sections],
        historyIndex: 0,
      }));
    } catch (error) {
      console.error("Error fetching sections:", error);
      toast.error("Failed to load homepage sections");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  // Push to history for undo/redo
  const pushHistory = useCallback((newSections: HomepageSection[]) => {
    setState(prev => {
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(newSections);
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
      }
      return {
        ...prev,
        sections: newSections,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  }, []);

  // Undo
  const undo = useCallback(() => {
    setState(prev => {
      if (prev.historyIndex <= 0) return prev;
      const newIndex = prev.historyIndex - 1;
      return {
        ...prev,
        sections: prev.history[newIndex],
        historyIndex: newIndex,
      };
    });
  }, []);

  // Redo
  const redo = useCallback(() => {
    setState(prev => {
      if (prev.historyIndex >= prev.history.length - 1) return prev;
      const newIndex = prev.historyIndex + 1;
      return {
        ...prev,
        sections: prev.history[newIndex],
        historyIndex: newIndex,
      };
    });
  }, []);

  // Can undo/redo checks
  const canUndo = state.historyIndex > 0;
  const canRedo = state.historyIndex < state.history.length - 1;

  // Select section(s)
  const selectSection = useCallback((id: string, multiSelect = false) => {
    setState(prev => {
      if (multiSelect) {
        const isSelected = prev.selectedIds.includes(id);
        return {
          ...prev,
          selectedIds: isSelected
            ? prev.selectedIds.filter(sid => sid !== id)
            : [...prev.selectedIds, id],
        };
      }
      return {
        ...prev,
        selectedIds: [id],
      };
    });
  }, []);

  // Clear selection
  const clearSelection = useCallback(() => {
    setState(prev => ({ ...prev, selectedIds: [] }));
  }, []);

  // Reorder sections (drag and drop)
  const reorderSections = useCallback((oldIndex: number, newIndex: number) => {
    setState(prev => {
      const newSections = [...prev.sections];
      const [moved] = newSections.splice(oldIndex, 1);
      newSections.splice(newIndex, 0, moved);
      
      // Update display_order for all sections
      const updatedSections = newSections.map((s, i) => ({
        ...s,
        display_order: i + 1,
      }));
      
      return prev;
    });
    
    // Apply with history
    setState(prev => {
      const newSections = [...prev.sections];
      const [moved] = newSections.splice(oldIndex, 1);
      newSections.splice(newIndex, 0, moved);
      
      const updatedSections = newSections.map((s, i) => ({
        ...s,
        display_order: i + 1,
      }));
      
      pushHistory(updatedSections);
      return { ...prev, sections: updatedSections };
    });
  }, [pushHistory]);

  // Update section property
  const updateSection = useCallback((id: string, updates: Partial<HomepageSection>) => {
    const newSections = state.sections.map(s => 
      s.id === id ? { ...s, ...updates } : s
    );
    pushHistory(newSections);
  }, [state.sections, pushHistory]);

  // Toggle visibility
  const toggleVisibility = useCallback((id: string) => {
    const section = state.sections.find(s => s.id === id);
    if (section) {
      updateSection(id, { is_visible: !section.is_visible });
    }
  }, [state.sections, updateSection]);

  // Lock section (prevent editing)
  const toggleLock = useCallback((id: string) => {
    const section = state.sections.find((s) => s.id === id);
    if (!section) return;

    const current =
      section.custom_content &&
      typeof section.custom_content === "object" &&
      !Array.isArray(section.custom_content)
        ? (section.custom_content as Record<string, unknown>)
        : {};

    updateSection(id, {
      custom_content: {
        ...current,
        locked: !(current as any).locked,
      } as any,
    });
  }, [state.sections, updateSection]);

  // Duplicate section
  const duplicateSection = useCallback(async (id: string) => {
    const section = state.sections.find(s => s.id === id);
    if (!section) return;
    
    const coreSections = ['service_cards', 'featured_labs', 'featured_doctors', 'featured_nurses', 'surgeries', 'consult_specialists', 'search_by_condition'];
    if (coreSections.includes(section.section_key)) {
      toast.error("Cannot duplicate core sections");
      return;
    }

    try {
      const payload: any = {
        section_key: `${section.section_key}_copy_${Date.now()}`,
        title: `${section.title} (Copy)`,
        subtitle: section.subtitle,
        display_order: state.sections.length + 1,
        is_visible: section.is_visible,
        section_type: section.section_type,
        columns_desktop: section.columns_desktop,
        columns_tablet: section.columns_tablet,
        columns_mobile: section.columns_mobile,
        items_gap: section.items_gap,
        section_padding_x: section.section_padding_x,
        section_padding_y: section.section_padding_y,
        max_items: section.max_items,
        card_height: section.card_height,
        card_border_radius: section.card_border_radius,
        card_shadow: section.card_shadow,
        image_height: section.image_height,
        image_fit: section.image_fit,
        image_border_radius: section.image_border_radius,
        background_color: section.background_color,
        background_gradient: section.background_gradient,
        text_color: section.text_color,
        accent_color: section.accent_color,
        custom_content: section.custom_content as any,
        icon_container_size: section.icon_container_size,
        icon_size: section.icon_size,
        show_labels: section.show_labels,
        justify_content: section.justify_content,
        layout_mode: section.layout_mode,
      };

      const { data, error } = await supabase
        .from("homepage_sections")
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      
      const newSections = [...state.sections, data as HomepageSection];
      pushHistory(newSections);
      toast.success("Section duplicated!");
    } catch (error) {
      console.error("Error duplicating section:", error);
      toast.error("Failed to duplicate section");
    }
  }, [state.sections, pushHistory]);

  // Delete section
  const deleteSection = useCallback(async (id: string) => {
    const section = state.sections.find(s => s.id === id);
    if (!section) return;
    
    const coreSections = ['service_cards', 'featured_labs', 'featured_doctors', 'featured_nurses', 'surgeries', 'consult_specialists', 'search_by_condition'];
    if (coreSections.includes(section.section_key)) {
      toast.error("Cannot delete core sections. You can hide them instead.");
      return;
    }

    try {
      const { error } = await supabase
        .from("homepage_sections")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      const newSections = state.sections.filter(s => s.id !== id);
      pushHistory(newSections);
      toast.success("Section deleted!");
    } catch (error) {
      console.error("Error deleting section:", error);
      toast.error("Failed to delete section");
    }
  }, [state.sections, pushHistory]);

  // Add new section
  const addSection = useCallback(async () => {
    try {
      const newOrder = state.sections.length + 1;
      const payload: any = {
        section_key: `custom_section_${Date.now()}`,
        title: "New Section",
        subtitle: "Add your content here",
        display_order: newOrder,
        section_type: "grid",
        is_visible: true,
        columns_desktop: 4,
        columns_tablet: 2,
        columns_mobile: 1,
        items_gap: 16,
        section_padding_x: 0,
        section_padding_y: 24,
        max_items: 8,
        card_height: 200,
        card_border_radius: 12,
        card_shadow: "md",
        image_height: 120,
        image_fit: "cover",
        image_border_radius: 8,
        background_color: "transparent",
        custom_content: null,
      };

      const { data, error } = await supabase
        .from("homepage_sections")
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      
      const newSections = [...state.sections, data as HomepageSection];
      pushHistory(newSections);
      toast.success("New section added!");
    } catch (error) {
      console.error("Error adding section:", error);
      toast.error("Failed to add section");
    }
  }, [state.sections, pushHistory]);

  // Copy to clipboard
  const copyToClipboard = useCallback(() => {
    const selected = state.sections.filter(s => state.selectedIds.includes(s.id));
    setState(prev => ({ ...prev, clipboard: selected }));
    if (selected.length > 0) {
      toast.success(`${selected.length} section(s) copied`);
    }
  }, [state.sections, state.selectedIds]);

  // Set device preview
  const setDevicePreview = useCallback((device: "desktop" | "tablet" | "mobile") => {
    setState(prev => ({ ...prev, devicePreview: device }));
  }, []);

  // Toggle grid snap
  const toggleGridSnap = useCallback(() => {
    setState(prev => ({ ...prev, gridSnap: !prev.gridSnap }));
  }, []);

  // Set dragging state
  const setIsDragging = useCallback((isDragging: boolean) => {
    setState(prev => ({ ...prev, isDragging }));
  }, []);

  // Save all changes to database
  const saveChanges = useCallback(async () => {
    setSaving(true);
    try {
      for (const section of state.sections) {
        const payload: any = {
          title: section.title,
          subtitle: section.subtitle,
          is_visible: section.is_visible,
          display_order: section.display_order,
          columns_desktop: section.columns_desktop,
          columns_tablet: section.columns_tablet,
          columns_mobile: section.columns_mobile,
          section_padding_x: section.section_padding_x,
          section_padding_y: section.section_padding_y,
          items_gap: section.items_gap,
          max_items: section.max_items,
          card_width: section.card_width,
          card_height: section.card_height,
          card_border_radius: section.card_border_radius,
          card_shadow: section.card_shadow,
          image_height: section.image_height,
          image_width: section.image_width,
          image_position_x: section.image_position_x,
          image_position_y: section.image_position_y,
          image_fit: section.image_fit,
          image_border_radius: section.image_border_radius,
          background_color: section.background_color,
          background_gradient: section.background_gradient,
          text_color: section.text_color,
          accent_color: section.accent_color,
          section_type: section.section_type,
          custom_content: section.custom_content as any,
          icon_container_size: section.icon_container_size,
          icon_size: section.icon_size,
          show_labels: section.show_labels,
          justify_content: section.justify_content,
          layout_mode: section.layout_mode,
        };

        const { error } = await supabase
          .from("homepage_sections")
          .update(payload)
          .eq("id", section.id);

        if (error) throw error;
      }
      toast.success("Layout saved! Changes are now live.");
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  }, [state.sections]);

  return {
    ...state,
    loading,
    saving,
    canUndo,
    canRedo,
    fetchSections,
    undo,
    redo,
    selectSection,
    clearSelection,
    reorderSections,
    updateSection,
    toggleVisibility,
    toggleLock,
    duplicateSection,
    deleteSection,
    addSection,
    copyToClipboard,
    setDevicePreview,
    toggleGridSnap,
    setIsDragging,
    saveChanges,
  };
};
