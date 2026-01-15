"use client";

import React from "react";
import { X, Download, Image as ImageIcon, FileImage, Heart } from "lucide-react";
import { StudioProject, ExportConfig, EXPORT_PRESETS, ExportPreset } from "@/types/studio";

interface StudioExportModalProps {
  project: StudioProject;
  onExport: () => void;
  onClose: () => void;
  onConfigChange: (config: ExportConfig) => void;
}

export function StudioExportModal({
  project,
  onExport,
  onClose,
  onConfigChange,
}: StudioExportModalProps) {
  const { exportConfig } = project;

  const updateConfig = (updates: Partial<ExportConfig>) => {
    onConfigChange({ ...exportConfig, ...updates });
  };

  const handlePresetChange = (preset: ExportPreset) => {
    const presetConfig = EXPORT_PRESETS[preset];
    updateConfig({
      preset,
      width: presetConfig.width,
      height: presetConfig.height,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md bg-gray-900 rounded-xl border border-gray-800 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Download className="w-5 h-5 text-purple-400" />
            Export Image
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Preset Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Size Preset
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(EXPORT_PRESETS) as [ExportPreset, typeof EXPORT_PRESETS[ExportPreset]][]).map(
                ([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => handlePresetChange(key)}
                    className={`px-4 py-3 rounded-lg text-sm text-left transition-colors ${
                      exportConfig.preset === key
                        ? "bg-purple-500/20 border border-purple-500 text-purple-300"
                        : "bg-gray-800 border border-gray-700 text-gray-300 hover:border-gray-600"
                    }`}
                  >
                    <div className="font-medium">{preset.label}</div>
                    <div className="text-xs opacity-75">
                      {preset.width} × {preset.height}
                    </div>
                  </button>
                )
              )}
            </div>
          </div>

          {/* Custom Size (only for custom preset) */}
          {exportConfig.preset === "custom" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Width
                </label>
                <input
                  type="number"
                  value={exportConfig.width}
                  onChange={(e) => updateConfig({ width: parseInt(e.target.value) || 1200 })}
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Height
                </label>
                <input
                  type="number"
                  value={exportConfig.height}
                  onChange={(e) => updateConfig({ height: parseInt(e.target.value) || 800 })}
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          )}

          {/* Format */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Format
            </label>
            <div className="flex gap-2">
              {(["png", "jpeg", "webp"] as const).map((format) => (
                <button
                  key={format}
                  onClick={() => updateConfig({ format })}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                    exportConfig.format === format
                      ? "bg-purple-500/20 border border-purple-500 text-purple-300"
                      : "bg-gray-800 border border-gray-700 text-gray-300 hover:border-gray-600"
                  }`}
                >
                  {format === "png" ? (
                    <ImageIcon className="w-4 h-4" />
                  ) : (
                    <FileImage className="w-4 h-4" />
                  )}
                  {format.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Scale */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Resolution Scale
            </label>
            <div className="flex gap-2">
              {[1, 2, 3].map((scale) => (
                <button
                  key={scale}
                  onClick={() => updateConfig({ scale })}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm transition-colors ${
                    exportConfig.scale === scale
                      ? "bg-purple-500/20 border border-purple-500 text-purple-300"
                      : "bg-gray-800 border border-gray-700 text-gray-300 hover:border-gray-600"
                  }`}
                >
                  {scale}x
                  <span className="text-xs opacity-75 block">
                    {exportConfig.width * scale} × {exportConfig.height * scale}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Quality (for jpeg/webp) */}
          {(exportConfig.format === "jpeg" || exportConfig.format === "webp") && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Quality: {exportConfig.quality}%
              </label>
              <input
                type="range"
                min="50"
                max="100"
                value={exportConfig.quality}
                onChange={(e) => updateConfig({ quality: parseInt(e.target.value) })}
                className="w-full accent-purple-500"
              />
            </div>
          )}

          {/* Info */}
          <div className="p-3 rounded-lg bg-gray-800/50 text-xs text-gray-400">
            <p>
              Final size:{" "}
              <span className="text-white font-medium">
                {exportConfig.width * exportConfig.scale} × {exportConfig.height * exportConfig.scale}
              </span>{" "}
              pixels
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Generated with AniLens</span>
            <a
              href="/support"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 transition-colors border border-pink-500/20"
            >
              <Heart className="w-3.5 h-3.5" />
              <span className="font-medium">Support</span>
            </a>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onExport();
                onClose();
              }}
              className="px-6 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
