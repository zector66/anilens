"use client";

import React, { useState } from "react";
import { StudioConfig, STUDIO_MODULES, StudioModuleId } from "@/types/studio";
import { Settings, Filter, Palette, Share, Download, Eye, EyeOff } from "lucide-react";

interface StudioControlsProps {
  config: StudioConfig;
  onConfigChange: (config: Partial<StudioConfig>) => void;
  onModuleToggle: (moduleId: StudioModuleId, enabled: boolean) => void;
  onModuleSettings: (moduleId: StudioModuleId, settings: Record<string, string | number | boolean>) => void;
  onExport: () => void;
  onShare: () => void;
}

export function StudioControls({
  config,
  onConfigChange,
  onModuleToggle,
  onModuleSettings,
  onExport,
  onShare
}: StudioControlsProps) {
  const [activeTab, setActiveTab] = useState<"scope" | "content" | "style">("scope");

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <h2 className="text-xl font-bold text-white mb-2">Studio Controls</h2>
        <p className="text-sm text-gray-400">Customize your taste poster</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        <button
          onClick={() => setActiveTab("scope")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "scope"
              ? "text-purple-400 border-b-2 border-purple-400"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Filter className="w-4 h-4 inline mr-2" />
          Scope
        </button>
        <button
          onClick={() => setActiveTab("content")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "content"
              ? "text-purple-400 border-b-2 border-purple-400"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Settings className="w-4 h-4 inline mr-2" />
          Content
        </button>
        <button
          onClick={() => setActiveTab("style")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "style"
              ? "text-purple-400 border-b-2 border-purple-400"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Palette className="w-4 h-4 inline mr-2" />
          Style
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === "scope" && <ScopeTab config={config} onConfigChange={onConfigChange} />}
        {activeTab === "content" && (
          <ContentTab
            config={config}
            onModuleToggle={onModuleToggle}
            onModuleSettings={onModuleSettings}
          />
        )}
        {activeTab === "style" && <StyleTab config={config} onConfigChange={onConfigChange} />}
      </div>

      {/* Actions */}
      <div className="p-6 border-t border-gray-800 space-y-3">
        <button
          onClick={onExport}
          className="w-full px-4 py-3 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export PNG
        </button>
        <button
          onClick={onShare}
          className="w-full px-4 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Share className="w-4 h-4" />
          Copy Share Text
        </button>
      </div>
    </div>
  );
}

function ScopeTab({ config, onConfigChange }: { config: StudioConfig; onConfigChange: (config: Partial<StudioConfig>) => void }) {
  return (
    <div className="space-y-6">
      {/* Media Type */}
      <div>
        <label className="block text-sm font-medium text-white mb-3">Media Type</label>
        <div className="space-y-2">
          {[
            { value: "both", label: "Anime & Manga" },
            { value: "anime", label: "Anime Only" },
            { value: "manga", label: "Manga Only" }
          ].map(option => (
            <label key={option.value} className="flex items-center">
              <input
                type="radio"
                name="media"
                value={option.value}
                checked={config.media === option.value}
                onChange={(e) => onConfigChange({ media: e.target.value as StudioConfig["media"] })}
                className="mr-3 text-purple-500 focus:ring-purple-500"
              />
              <span className="text-gray-300">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Time Window */}
      <div>
        <label className="block text-sm font-medium text-white mb-3">Time Window</label>
        <div className="space-y-2">
          {[
            { value: "all", label: "All-time" },
            { value: "last12m", label: "Last 12 months" },
            { value: "year", label: "This year" }
          ].map(option => (
            <label key={option.value} className="flex items-center">
              <input
                type="radio"
                name="timeWindow"
                value={option.value}
                checked={config.timeWindow === option.value}
                onChange={(e) => onConfigChange({ timeWindow: e.target.value as StudioConfig["timeWindow"] })}
                className="mr-3 text-purple-500 focus:ring-purple-500"
              />
              <span className="text-gray-300">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Status Filter */}
      <div>
        <label className="block text-sm font-medium text-white mb-3">Include Status</label>
        <div className="space-y-2">
          {[
            { value: "COMPLETED", label: "Completed" },
            { value: "CURRENT", label: "Currently Watching/Reading" },
            { value: "REPEATING", label: "Rewatching/Rereading" },
            { value: "PAUSED", label: "Paused" },
            { value: "DROPPED", label: "Dropped" }
          ].map(status => (
            <label key={status.value} className="flex items-center">
              <input
                type="checkbox"
                checked={config.statuses.includes(status.value as any)}
                onChange={(e) => {
                  const newStatuses = e.target.checked
                    ? [...config.statuses, status.value as any]
                    : config.statuses.filter(s => s !== status.value);
                  onConfigChange({ statuses: newStatuses });
                }}
                className="mr-3 text-purple-500 focus:ring-purple-500"
              />
              <span className="text-gray-300">{status.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function ContentTab({
  config,
  onModuleToggle,
  onModuleSettings
}: {
  config: StudioConfig;
  onModuleToggle: (moduleId: StudioModuleId, enabled: boolean) => void;
  onModuleSettings: (moduleId: StudioModuleId, settings: Record<string, string | number | boolean>) => void;
}) {
  const [draggedModule, setDraggedModule] = useState<StudioModuleId | null>(null);

  const modules = Object.values(STUDIO_MODULES);
  const enabledModules = config.modules.filter(m => m.enabled).map(m => m.id as StudioModuleId);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-white mb-3">Modules</h3>
        <div className="space-y-2">
          {modules.map(module => {
            const moduleConfig = config.modules.find(m => m.id === module.id);
            const isEnabled = moduleConfig?.enabled || false;

            return (
              <div key={module.id} className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={(e) => onModuleToggle(module.id as StudioModuleId, e.target.checked)}
                      className="mr-3 text-purple-500 focus:ring-purple-500"
                    />
                    <span className="text-white font-medium">{module.name}</span>
                  </label>
                </div>

                {/* Module-specific settings */}
                {isEnabled && (module.id === "topAnime" || module.id === "topManga") && (
                  <div className="mt-3 pl-7">
                    <label className="block text-xs text-gray-400 mb-1">Count</label>
                    <select
                      value={(moduleConfig?.settings?.count as number) || 5}
                      onChange={(e) => onModuleSettings(module.id as StudioModuleId, { count: parseInt(e.target.value) })}
                      className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                    >
                      <option value={3}>3</option>
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={15}>15</option>
                    </select>
                  </div>
                )}

                {isEnabled && module.id === "topTags" && (
                  <div className="mt-3 pl-7">
                    <label className="block text-xs text-gray-400 mb-1">Tag Count</label>
                    <select
                      value={(moduleConfig?.settings?.count as number) || 20}
                      onChange={(e) => onModuleSettings(module.id as StudioModuleId, { count: parseInt(e.target.value) })}
                      className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={35}>35</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                )}

                {isEnabled && module.id === "hottestTake" && (
                  <div className="mt-3 pl-7">
                    <label className="block text-xs text-gray-400 mb-1">Take Type</label>
                    <select
                      value={(moduleConfig?.settings?.source as string) || "underrated"}
                      onChange={(e) => onModuleSettings(module.id as StudioModuleId, { source: e.target.value })}
                      className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                    >
                      <option value="underrated">Most Underrated</option>
                      <option value="overrated">Most Overrated</option>
                      <option value="dropped">Most Dropped</option>
                    </select>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StyleTab({ config, onConfigChange }: { config: StudioConfig; onConfigChange: (config: Partial<StudioConfig>) => void }) {
  return (
    <div className="space-y-6">
      {/* Template */}
      <div>
        <label className="block text-sm font-medium text-white mb-3">Template</label>
        <div className="space-y-2">
          {[
            { value: "compact", label: "Compact" },
            { value: "poster", label: "Poster" },
            { value: "ultra", label: "Ultra (Dense)" }
          ].map(option => (
            <label key={option.value} className="flex items-center">
              <input
                type="radio"
                name="template"
                value={option.value}
                checked={config.template === option.value}
                onChange={(e) => onConfigChange({ template: e.target.value as StudioConfig["template"] })}
                className="mr-3 text-purple-500 focus:ring-purple-500"
              />
              <span className="text-gray-300">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Theme */}
      <div>
        <label className="block text-sm font-medium text-white mb-3">Theme</label>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-2">Mode</label>
            <div className="space-y-2">
              {[
                { value: "dark", label: "Dark" },
                { value: "light", label: "Light" }
              ].map(option => (
                <label key={option.value} className="flex items-center">
                  <input
                    type="radio"
                    name="themeMode"
                    value={option.value}
                    checked={config.theme.mode === option.value}
                    onChange={(e) => onConfigChange({ 
                      theme: { ...config.theme, mode: e.target.value as "dark" | "light" }
                    })}
                    className="mr-3 text-purple-500 focus:ring-purple-500"
                  />
                  <span className="text-gray-300">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-2">Accent Color</label>
            <div className="flex gap-2">
              {[
                { value: "#8b5cf6", label: "Purple" },
                { value: "#3b82f6", label: "Blue" },
                { value: "#10b981", label: "Green" },
                { value: "#f59e0b", label: "Amber" },
                { value: "#ef4444", label: "Red" }
              ].map(color => (
                <button
                  key={color.value}
                  onClick={() => onConfigChange({ 
                    theme: { ...config.theme, accent: color.value }
                  })}
                  className={`w-8 h-8 rounded-full border-2 ${
                    config.theme.accent === color.value 
                      ? "border-white" 
                      : "border-gray-600"
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.label}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tone */}
      <div>
        <label className="block text-sm font-medium text-white mb-3">Tone</label>
        <div className="space-y-2">
          {[
            { value: "neutral", label: "Neutral" },
            { value: "spicy", label: "Spicy" }
          ].map(option => (
            <label key={option.value} className="flex items-center">
              <input
                type="radio"
                name="tone"
                value={option.value}
                checked={config.tone === option.value}
                onChange={(e) => onConfigChange({ tone: e.target.value as StudioConfig["tone"] })}
                className="mr-3 text-purple-500 focus:ring-purple-500"
              />
              <span className="text-gray-300">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Privacy */}
      <div>
        <label className="block text-sm font-medium text-white mb-3">Privacy</label>
        <div className="space-y-2">
          {[
            { key: "hideUsername", label: "Hide Username" },
            { key: "hideCounts", label: "Hide Counts" },
            { key: "hideScores", label: "Hide Mean Scores" },
            { key: "hideAvatar", label: "Hide Avatar" }
          ].map(option => (
            <label key={option.key} className="flex items-center">
              <input
                type="checkbox"
                checked={config.privacy[option.key as keyof typeof config.privacy] || false}
                onChange={(e) => onConfigChange({
                  privacy: { ...config.privacy, [option.key]: e.target.checked }
                })}
                className="mr-3 text-purple-500 focus:ring-purple-500"
              />
              <span className="text-gray-300">{option.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
