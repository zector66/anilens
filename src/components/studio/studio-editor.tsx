"use client";

import React, { useState, useCallback, useMemo, useRef } from "react";
import { toPng, toJpeg } from "html-to-image";
import {
  Download,
  Save,
  Plus,
  Settings,
  Grid3X3,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Copy,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Layers,
  LayoutTemplate,
} from "lucide-react";
import {
  StudioConfig,
  StudioProject,
  StudioWidget,
  WidgetType,
  ExportConfig,
  ExportPreset,
  EXPORT_PRESETS,
  DEFAULT_WIDGET_SIZES,
  BUILT_IN_TEMPLATES,
  CanvasState,
  PosterData,
} from "@/types/studio";
import { StudioCanvas } from "./studio-canvas";
import { StudioWidgetPanel } from "./studio-widget-panel";
import { StudioExportModal } from "./studio-export-modal";
import { StudioTemplateGallery } from "./studio-template-gallery";

interface StudioEditorProps {
  posterData: PosterData | null;
}

const DEFAULT_CONFIG: StudioConfig = {
  media: "both",
  timeWindow: "all",
  statuses: ["COMPLETED", "CURRENT", "DROPPED", "PAUSED", "PLANNING", "REPEATING"],
  template: "poster",
  tone: "neutral",
  theme: { mode: "dark", accent: "#8b5cf6" },
  privacy: {},
  modules: [
    { id: "topAnime", enabled: true, settings: { count: 5 } },
    { id: "topManga", enabled: true, settings: { count: 5 } },
    { id: "animeStats", enabled: true },
    { id: "mangaStats", enabled: true },
    { id: "percentiles", enabled: true },
    { id: "topTags", enabled: true, settings: { count: 12 } },
    { id: "genreRadar", enabled: true },
    { id: "monthlyActivity", enabled: true },
    { id: "hottestTake", enabled: true },
    { id: "gamesRank", enabled: false },
    { id: "tasteFingerprint", enabled: true },
    { id: "contradiction", enabled: true },
  ],
};

const DEFAULT_EXPORT_CONFIG: ExportConfig = {
  preset: "banner",
  width: 1920,
  height: 1080,
  scale: 2,
  format: "png",
  quality: 95,
};

const DEFAULT_CANVAS_STATE: CanvasState = {
  zoom: 1,
  panX: 0,
  panY: 0,
  gridSize: 20,
  snapToGrid: true,
  showGrid: true,
  selectedWidgetId: null,
};

// Generate default widgets for a template
function generateDefaultWidgets(preset: ExportPreset): StudioWidget[] {
  const widgets: StudioWidget[] = [];
  let id = 0;

  // Header is always first
  widgets.push({
    id: `widget-${id++}`,
    type: "header",
    position: { x: 0, y: 0, width: 12, height: 2, zIndex: 1 },
    settings: {},
    visible: true,
    locked: false,
  });

  if (preset === "banner") {
    // 16:9 layout - horizontal arrangement
    widgets.push(
      {
        id: `widget-${id++}`,
        type: "topMedia",
        position: { x: 0, y: 2, width: 3, height: 5, zIndex: 2 },
        settings: { mediaType: "anime", count: 5 },
        visible: true,
        locked: false,
      },
      {
        id: `widget-${id++}`,
        type: "stats",
        position: { x: 3, y: 2, width: 3, height: 3, zIndex: 2 },
        settings: { showAnime: true, showManga: true },
        visible: true,
        locked: false,
      },
      {
        id: `widget-${id++}`,
        type: "tags",
        position: { x: 6, y: 2, width: 3, height: 3, zIndex: 2 },
        settings: { count: 12 },
        visible: true,
        locked: false,
      },
      {
        id: `widget-${id++}`,
        type: "percentiles",
        position: { x: 9, y: 2, width: 3, height: 3, zIndex: 2 },
        settings: {},
        visible: true,
        locked: false,
      },
      {
        id: `widget-${id++}`,
        type: "fingerprint",
        position: { x: 3, y: 5, width: 3, height: 2, zIndex: 2 },
        settings: {},
        visible: true,
        locked: false,
      },
      {
        id: `widget-${id++}`,
        type: "hottestTake",
        position: { x: 6, y: 5, width: 6, height: 2, zIndex: 2 },
        settings: {},
        visible: true,
        locked: false,
      }
    );
  } else if (preset === "story") {
    // 9:16 layout - vertical arrangement
    widgets.push(
      {
        id: `widget-${id++}`,
        type: "topMedia",
        position: { x: 0, y: 2, width: 12, height: 4, zIndex: 2 },
        settings: { mediaType: "anime", count: 5, layout: "horizontal" },
        visible: true,
        locked: false,
      },
      {
        id: `widget-${id++}`,
        type: "stats",
        position: { x: 0, y: 6, width: 12, height: 3, zIndex: 2 },
        settings: { showAnime: true, showManga: true },
        visible: true,
        locked: false,
      },
      {
        id: `widget-${id++}`,
        type: "tags",
        position: { x: 0, y: 9, width: 12, height: 3, zIndex: 2 },
        settings: { count: 15 },
        visible: true,
        locked: false,
      },
      {
        id: `widget-${id++}`,
        type: "percentiles",
        position: { x: 0, y: 12, width: 12, height: 3, zIndex: 2 },
        settings: {},
        visible: true,
        locked: false,
      },
      {
        id: `widget-${id++}`,
        type: "fingerprint",
        position: { x: 0, y: 15, width: 12, height: 2, zIndex: 2 },
        settings: {},
        visible: true,
        locked: false,
      }
    );
  } else if (preset === "square") {
    // 1:1 layout - compact grid
    widgets.push(
      {
        id: `widget-${id++}`,
        type: "topMedia",
        position: { x: 0, y: 2, width: 6, height: 5, zIndex: 2 },
        settings: { mediaType: "anime", count: 5 },
        visible: true,
        locked: false,
      },
      {
        id: `widget-${id++}`,
        type: "stats",
        position: { x: 6, y: 2, width: 6, height: 3, zIndex: 2 },
        settings: { showAnime: true, showManga: false },
        visible: true,
        locked: false,
      },
      {
        id: `widget-${id++}`,
        type: "tags",
        position: { x: 6, y: 5, width: 6, height: 2, zIndex: 2 },
        settings: { count: 8 },
        visible: true,
        locked: false,
      },
      {
        id: `widget-${id++}`,
        type: "fingerprint",
        position: { x: 0, y: 7, width: 12, height: 2, zIndex: 2 },
        settings: {},
        visible: true,
        locked: false,
      }
    );
  } else {
    // post (4:5) - balanced layout
    widgets.push(
      {
        id: `widget-${id++}`,
        type: "topMedia",
        position: { x: 0, y: 2, width: 12, height: 5, zIndex: 2 },
        settings: { mediaType: "anime", count: 5, layout: "featured" },
        visible: true,
        locked: false,
      },
      {
        id: `widget-${id++}`,
        type: "stats",
        position: { x: 0, y: 7, width: 6, height: 3, zIndex: 2 },
        settings: { showAnime: true, showManga: true },
        visible: true,
        locked: false,
      },
      {
        id: `widget-${id++}`,
        type: "tags",
        position: { x: 6, y: 7, width: 6, height: 3, zIndex: 2 },
        settings: { count: 10 },
        visible: true,
        locked: false,
      },
      {
        id: `widget-${id++}`,
        type: "percentiles",
        position: { x: 0, y: 10, width: 6, height: 2, zIndex: 2 },
        settings: {},
        visible: true,
        locked: false,
      },
      {
        id: `widget-${id++}`,
        type: "fingerprint",
        position: { x: 6, y: 10, width: 6, height: 2, zIndex: 2 },
        settings: {},
        visible: true,
        locked: false,
      }
    );
  }

  return widgets;
}

export function StudioEditor({ posterData }: StudioEditorProps) {
  // Project state
  const [project, setProject] = useState<StudioProject>(() => ({
    id: `project-${Date.now()}`,
    name: "Untitled Project",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    exportConfig: DEFAULT_EXPORT_CONFIG,
    theme: { mode: "dark", accent: "#8b5cf6" },
    widgets: generateDefaultWidgets("banner"),
    config: DEFAULT_CONFIG,
  }));

  // UI state
  const [canvasState, setCanvasState] = useState<CanvasState>(DEFAULT_CANVAS_STATE);
  const [activePanel, setActivePanel] = useState<"widgets" | "settings" | "templates" | null>("widgets");
  const [showExportModal, setShowExportModal] = useState(false);
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);

  // Widget management
  const addWidget = useCallback((type: WidgetType) => {
    const defaultSize = DEFAULT_WIDGET_SIZES[type];
    const newWidget: StudioWidget = {
      id: `widget-${Date.now()}`,
      type,
      position: {
        x: 0,
        y: 0,
        width: defaultSize.width,
        height: defaultSize.height,
        zIndex: project.widgets.length + 1,
      },
      settings: {},
      visible: true,
      locked: false,
    };

    setProject((prev) => ({
      ...prev,
      widgets: [...prev.widgets, newWidget],
      updatedAt: new Date().toISOString(),
    }));

    setCanvasState((prev) => ({ ...prev, selectedWidgetId: newWidget.id }));
  }, [project.widgets.length]);

  const updateWidget = useCallback((widgetId: string, updates: Partial<StudioWidget>) => {
    setProject((prev) => ({
      ...prev,
      widgets: prev.widgets.map((w) =>
        w.id === widgetId ? { ...w, ...updates } : w
      ),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const deleteWidget = useCallback((widgetId: string) => {
    setProject((prev) => ({
      ...prev,
      widgets: prev.widgets.filter((w) => w.id !== widgetId),
      updatedAt: new Date().toISOString(),
    }));
    setCanvasState((prev) => ({
      ...prev,
      selectedWidgetId: prev.selectedWidgetId === widgetId ? null : prev.selectedWidgetId,
    }));
  }, []);

  const duplicateWidget = useCallback((widgetId: string) => {
    const widget = project.widgets.find((w) => w.id === widgetId);
    if (!widget) return;

    const newWidget: StudioWidget = {
      ...widget,
      id: `widget-${Date.now()}`,
      position: {
        ...widget.position,
        x: widget.position.x + 1,
        y: widget.position.y + 1,
        zIndex: project.widgets.length + 1,
      },
    };

    setProject((prev) => ({
      ...prev,
      widgets: [...prev.widgets, newWidget],
      updatedAt: new Date().toISOString(),
    }));
  }, [project.widgets]);

  // Export preset change
  const changeExportPreset = useCallback((preset: ExportPreset) => {
    const presetConfig = EXPORT_PRESETS[preset];
    setProject((prev) => ({
      ...prev,
      exportConfig: {
        ...prev.exportConfig,
        preset,
        width: presetConfig.width,
        height: presetConfig.height,
      },
      widgets: generateDefaultWidgets(preset),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  // Theme change
  const updateTheme = useCallback((updates: Partial<typeof project.theme>) => {
    setProject((prev) => ({
      ...prev,
      theme: { ...prev.theme, ...updates },
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  // Canvas controls
  const zoomIn = () => setCanvasState((prev) => ({ ...prev, zoom: Math.min(prev.zoom + 0.1, 2) }));
  const zoomOut = () => setCanvasState((prev) => ({ ...prev, zoom: Math.max(prev.zoom - 0.1, 0.25) }));
  const resetZoom = () => setCanvasState((prev) => ({ ...prev, zoom: 1, panX: 0, panY: 0 }));
  const toggleGrid = () => setCanvasState((prev) => ({ ...prev, showGrid: !prev.showGrid }));
  // Toggle snap to grid (can be exposed in toolbar later)
  const _toggleSnap = () => setCanvasState((prev) => ({ ...prev, snapToGrid: !prev.snapToGrid }));

  // Export function
  const handleExport = useCallback(async () => {
    const exportElement = document.getElementById("studio-export-canvas");
    if (!exportElement) return;

    try {
      const { format, quality, scale } = project.exportConfig;
      const options = {
        pixelRatio: scale,
        quality: quality / 100,
        backgroundColor: project.theme.mode === "dark" ? "#111827" : "#ffffff",
      };

      let dataUrl: string;
      if (format === "jpeg") {
        dataUrl = await toJpeg(exportElement, options);
      } else {
        dataUrl = await toPng(exportElement, options);
      }

      // Download
      const link = document.createElement("a");
      link.download = `${project.name.replace(/\s+/g, "-").toLowerCase()}.${format}`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Export failed:", error);
    }
  }, [project.exportConfig, project.name, project.theme.mode]);

  // Save to localStorage
  const saveProject = useCallback(() => {
    setIsSaving(true);
    try {
      const savedProjects = JSON.parse(localStorage.getItem("studio-projects") || "[]");
      const existingIndex = savedProjects.findIndex((p: StudioProject) => p.id === project.id);

      if (existingIndex >= 0) {
        savedProjects[existingIndex] = project;
      } else {
        savedProjects.push(project);
      }

      localStorage.setItem("studio-projects", JSON.stringify(savedProjects));
    } catch (error) {
      console.error("Failed to save project:", error);
    }
    setTimeout(() => setIsSaving(false), 500);
  }, [project]);

  // Load from localStorage (used by project picker, to be added)
  const _loadProject = useCallback((projectId: string) => {
    try {
      const savedProjects = JSON.parse(localStorage.getItem("studio-projects") || "[]");
      const loadedProject = savedProjects.find((p: StudioProject) => p.id === projectId);
      if (loadedProject) {
        setProject(loadedProject);
      }
    } catch (error) {
      console.error("Failed to load project:", error);
    }
  }, []);

  // Apply template
  const applyTemplate = useCallback((templateId: string) => {
    const template = BUILT_IN_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;

    const presetConfig = EXPORT_PRESETS[template.exportPreset];
    setProject((prev) => ({
      ...prev,
      templateId,
      theme: template.theme,
      exportConfig: {
        ...prev.exportConfig,
        preset: template.exportPreset,
        width: presetConfig.width,
        height: presetConfig.height,
      },
      widgets: generateDefaultWidgets(template.exportPreset),
      updatedAt: new Date().toISOString(),
    }));
    setShowTemplateGallery(false);
  }, []);

  const selectedWidget = useMemo(
    () => project.widgets.find((w) => w.id === canvasState.selectedWidgetId),
    [project.widgets, canvasState.selectedWidgetId]
  );

  if (!posterData) {
    return (
      <div className="flex items-center justify-center h-[700px] bg-linear-to-br from-gray-900 to-gray-950 rounded-2xl border border-gray-800/50 shadow-2xl">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-linear-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center animate-pulse">
              <Layers className="w-10 h-10 text-purple-400" />
            </div>
            <div className="absolute -inset-4 bg-purple-500/10 rounded-full blur-2xl animate-pulse" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Loading Studio</h3>
          <p className="text-gray-400 text-sm">Preparing your creative workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[700px] bg-linear-to-br from-gray-900 to-gray-950 rounded-2xl overflow-hidden border border-gray-800/50 shadow-2xl">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900/80 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTemplateGallery(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm transition-colors"
          >
            <LayoutTemplate className="w-4 h-4" />
            Templates
          </button>

          <div className="h-6 w-px bg-gray-700 mx-2" />

          {/* Export Preset Selector */}
          <select
            value={project.exportConfig.preset}
            onChange={(e) => changeExportPreset(e.target.value as ExportPreset)}
            className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {Object.entries(EXPORT_PRESETS).map(([key, preset]) => (
              <option key={key} value={key}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          {/* Canvas Controls */}
          <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
            <button
              onClick={zoomOut}
              className="p-1.5 rounded hover:bg-gray-700 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 text-sm tabular-nums">{Math.round(canvasState.zoom * 100)}%</span>
            <button
              onClick={zoomIn}
              className="p-1.5 rounded hover:bg-gray-700 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={resetZoom}
              className="p-1.5 rounded hover:bg-gray-700 transition-colors"
              title="Reset View"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={toggleGrid}
            className={`p-2 rounded-lg transition-colors ${
              canvasState.showGrid ? "bg-purple-500/20 text-purple-400" : "bg-gray-800 hover:bg-gray-700"
            }`}
            title="Toggle Grid"
          >
            <Grid3X3 className="w-4 h-4" />
          </button>

          <div className="h-6 w-px bg-gray-700 mx-2" />

          <button
            onClick={saveProject}
            disabled={isSaving}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save"}
          </button>

          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Widget Panel */}
        <div className="w-64 bg-gray-900/50 border-r border-gray-800 flex flex-col">
          <div className="flex border-b border-gray-800">
            <button
              onClick={() => setActivePanel("widgets")}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                activePanel === "widgets"
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Plus className="w-4 h-4 inline mr-1" />
              Add
            </button>
            <button
              onClick={() => setActivePanel("settings")}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                activePanel === "settings"
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Settings className="w-4 h-4 inline mr-1" />
              Settings
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {activePanel === "widgets" && (
              <StudioWidgetPanel onAddWidget={addWidget} />
            )}

            {activePanel === "settings" && (
              <div className="space-y-4">
                {/* Data Filters */}
                <div>
                  <h3 className="text-sm font-medium text-gray-300 mb-2">Time Range</h3>
                  <div className="space-y-1">
                    {[
                      { value: "all", label: "All Time" },
                      { value: "year", label: "This Year" },
                      { value: "last12m", label: "Last 12 Months" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setProject((prev) => ({
                          ...prev,
                          config: { ...prev.config, timeWindow: option.value as "all" | "year" | "last12m" },
                          updatedAt: new Date().toISOString(),
                        }))}
                        className={`w-full px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                          project.config.timeWindow === option.value
                            ? "bg-purple-500/20 text-purple-300 border border-purple-500/50"
                            : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Media Type Filter */}
                <div>
                  <h3 className="text-sm font-medium text-gray-300 mb-2">Media Type</h3>
                  <div className="flex gap-2">
                    {[
                      { value: "both", label: "Both" },
                      { value: "anime", label: "Anime" },
                      { value: "manga", label: "Manga" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setProject((prev) => ({
                          ...prev,
                          config: { ...prev.config, media: option.value as "both" | "anime" | "manga" },
                          updatedAt: new Date().toISOString(),
                        }))}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                          project.config.media === option.value
                            ? "bg-purple-500/20 text-purple-300 border border-purple-500/50"
                            : "bg-gray-800 text-gray-400 hover:text-white"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Theme Settings */}
                <div>
                  <h3 className="text-sm font-medium text-gray-300 mb-2">Theme</h3>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateTheme({ mode: "dark" })}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                          project.theme.mode === "dark"
                            ? "bg-gray-700 text-white"
                            : "bg-gray-800 text-gray-400 hover:text-white"
                        }`}
                      >
                        Dark
                      </button>
                      <button
                        onClick={() => updateTheme({ mode: "light" })}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                          project.theme.mode === "light"
                            ? "bg-gray-700 text-white"
                            : "bg-gray-800 text-gray-400 hover:text-white"
                        }`}
                      >
                        Light
                      </button>
                    </div>

                    {/* Accent Colors */}
                    <div className="flex gap-2">
                      {["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"].map((color) => (
                        <button
                          key={color}
                          onClick={() => updateTheme({ accent: color })}
                          className={`w-8 h-8 rounded-full transition-transform ${
                            project.theme.accent === color ? "ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-110" : ""
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Selected Widget Settings */}
                {selectedWidget && (
                  <div className="pt-4 border-t border-gray-800">
                    <h3 className="text-sm font-medium text-gray-300 mb-2">
                      Selected: {selectedWidget.type}
                    </h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => updateWidget(selectedWidget.id, { visible: !selectedWidget.visible })}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm"
                      >
                        {selectedWidget.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        {selectedWidget.visible ? "Hide" : "Show"}
                      </button>
                      <button
                        onClick={() => updateWidget(selectedWidget.id, { locked: !selectedWidget.locked })}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm"
                      >
                        {selectedWidget.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        {selectedWidget.locked ? "Unlock" : "Lock"}
                      </button>
                      <button
                        onClick={() => duplicateWidget(selectedWidget.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm"
                      >
                        <Copy className="w-4 h-4" />
                        Duplicate
                      </button>
                      <button
                        onClick={() => deleteWidget(selectedWidget.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 overflow-auto bg-gray-950 p-8">
          <StudioCanvas
            ref={canvasRef}
            project={project}
            posterData={posterData}
            canvasState={canvasState}
            onCanvasStateChange={setCanvasState}
            onWidgetUpdate={updateWidget}
            onWidgetSelect={(id: string | null) => setCanvasState((prev) => ({ ...prev, selectedWidgetId: id }))}
          />
        </div>

        {/* Right Sidebar - Layers */}
        <div className="w-56 bg-gray-900/50 border-l border-gray-800">
          <div className="px-4 py-2 border-b border-gray-800">
            <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Layers
            </h3>
          </div>
          <div className="p-2 space-y-1">
            {[...project.widgets].reverse().map((widget) => (
              <button
                key={widget.id}
                onClick={() => setCanvasState((prev) => ({ ...prev, selectedWidgetId: widget.id }))}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  canvasState.selectedWidgetId === widget.id
                    ? "bg-purple-500/20 text-purple-300"
                    : "hover:bg-gray-800 text-gray-400"
                }`}
              >
                {widget.visible ? (
                  <Eye className="w-3 h-3 opacity-50" />
                ) : (
                  <EyeOff className="w-3 h-3 opacity-50" />
                )}
                <span className="flex-1 text-left truncate capitalize">{widget.type}</span>
                {widget.locked && <Lock className="w-3 h-3 opacity-50" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Template Gallery Modal */}
      {showTemplateGallery && (
        <StudioTemplateGallery
          onSelect={applyTemplate}
          onClose={() => setShowTemplateGallery(false)}
        />
      )}

      {/* Export Modal */}
      {showExportModal && (
        <StudioExportModal
          project={project}
          onExport={handleExport}
          onClose={() => setShowExportModal(false)}
          onConfigChange={(config: ExportConfig) => setProject((prev) => ({ ...prev, exportConfig: config }))}
        />
      )}
    </div>
  );
}
