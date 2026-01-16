import { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import AdminLayout from "@/components/admin/AdminLayout";
import { useHomepageBuilder } from "@/hooks/useHomepageBuilder";
import { BuilderToolbar } from "@/components/admin/homepage-builder/BuilderToolbar";
import { SectionCard } from "@/components/admin/homepage-builder/SectionCard";
import { SectionSettingsSheet } from "@/components/admin/homepage-builder/SectionSettingsSheet";
import { LivePreviewPane } from "@/components/admin/homepage-builder/LivePreviewPane";
import { Loader2 } from "lucide-react";
import { HomepageSection } from "@/hooks/useHomepageSections";

const HomepageBuilder = () => {
  const {
    sections,
    selectedIds,
    devicePreview,
    gridSnap,
    loading,
    saving,
    canUndo,
    canRedo,
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
    setDevicePreview,
    toggleGridSnap,
    saveChanges,
    historyIndex,
  } = useHomepageBuilder();

  const [settingsSection, setSettingsSection] = useState<HomepageSection | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        redo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        saveChanges();
      }
      if (e.key === "Escape") {
        clearSelection();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, saveChanges, clearSelection]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const oldIndex = sections.findIndex((s) => s.id === active.id);
        const newIndex = sections.findIndex((s) => s.id === over.id);
        reorderSections(oldIndex, newIndex);
      }
    },
    [sections, reorderSections]
  );

  const handleOpenSettings = (section: HomepageSection) => {
    setSettingsSection(section);
    setSettingsOpen(true);
  };

  const handleUpdateSettings = (updates: Partial<HomepageSection>) => {
    if (settingsSection) {
      updateSection(settingsSection.id, updates);
      setSettingsSection({ ...settingsSection, ...updates });
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="h-[calc(100vh-80px)] flex flex-col">
        <BuilderToolbar
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={undo}
          onRedo={redo}
          onAddSection={addSection}
          onSave={saveChanges}
          onPreview={() => window.open("/", "_blank")}
          devicePreview={devicePreview}
          onDeviceChange={setDevicePreview}
          gridSnap={gridSnap}
          onToggleGridSnap={toggleGridSnap}
          saving={saving}
          hasChanges={historyIndex > 0}
        />

        <div className="flex-1 flex overflow-hidden">
          {/* Sections List */}
          <div className="w-[400px] border-r bg-background overflow-auto p-4">
            <h2 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wide">
              Sections ({sections.length})
            </h2>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sections.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {sections.map((section) => (
                    <SectionCard
                      key={section.id}
                      section={section}
                      isSelected={selectedIds.includes(section.id)}
                      onSelect={(multi) => selectSection(section.id, multi)}
                      onToggleVisibility={() => toggleVisibility(section.id)}
                      onToggleLock={() => toggleLock(section.id)}
                      onDuplicate={() => duplicateSection(section.id)}
                      onDelete={() => deleteSection(section.id)}
                      onOpenSettings={() => handleOpenSettings(section)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          {/* Live Preview */}
          <LivePreviewPane
            sections={sections}
            devicePreview={devicePreview}
            selectedIds={selectedIds}
            onSelectSection={selectSection}
          />
        </div>
      </div>

      <SectionSettingsSheet
        section={settingsSection}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onUpdate={handleUpdateSettings}
        onSave={() => setSettingsOpen(false)}
      />
    </AdminLayout>
  );
};

export default HomepageBuilder;
