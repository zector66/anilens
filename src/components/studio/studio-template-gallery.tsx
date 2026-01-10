"use client";

import React from "react";
import { X, Layout, Sparkles } from "lucide-react";
import { BUILT_IN_TEMPLATES, EXPORT_PRESETS } from "@/types/studio";

interface StudioTemplateGalleryProps {
  onSelect: (templateId: string) => void;
  onClose: () => void;
}

const ACCENT_COLORS: Record<string, string> = {
  "#8b5cf6": "from-purple-500 to-purple-700",
  "#3b82f6": "from-blue-500 to-blue-700",
  "#10b981": "from-emerald-500 to-emerald-700",
  "#f59e0b": "from-amber-500 to-amber-700",
  "#ef4444": "from-red-500 to-red-700",
};

export function StudioTemplateGallery({ onSelect, onClose }: StudioTemplateGalleryProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-4xl max-h-[80vh] bg-gray-900 rounded-xl border border-gray-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Layout className="w-5 h-5 text-purple-400" />
            Choose a Template
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Blank Template */}
            <button
              onClick={() => {
                onSelect("blank");
                onClose();
              }}
              className="group relative aspect-video rounded-xl border-2 border-dashed border-gray-700 hover:border-purple-500 transition-colors bg-gray-800/30 flex flex-col items-center justify-center gap-2"
            >
              <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                <Sparkles className="w-6 h-6 text-gray-400 group-hover:text-purple-400" />
              </div>
              <span className="text-sm font-medium text-gray-300">Start from Scratch</span>
              <span className="text-xs text-gray-500">Create your own layout</span>
            </button>

            {/* Built-in Templates */}
            {BUILT_IN_TEMPLATES.map((template) => {
              const preset = EXPORT_PRESETS[template.exportPreset];
              const gradientClass = ACCENT_COLORS[template.theme.accent] || ACCENT_COLORS["#8b5cf6"];

              return (
                <button
                  key={template.id}
                  onClick={() => onSelect(template.id)}
                  className="group relative overflow-hidden rounded-xl border border-gray-700 hover:border-purple-500 transition-all hover:shadow-xl hover:shadow-purple-500/10"
                >
                  {/* Preview */}
                  <div
                    className="aspect-video relative"
                    style={{
                      backgroundColor: template.theme.mode === "dark" ? "#111827" : "#f9fafb",
                    }}
                  >
                    {/* Gradient accent bar */}
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-linear-to-r ${gradientClass}`} />

                    {/* Mock layout preview */}
                    <div className="absolute inset-0 p-3 flex flex-col">
                      {/* Header mock */}
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-6 h-6 rounded-full"
                          style={{ backgroundColor: template.theme.accent + "40" }}
                        />
                        <div className="h-2 w-20 rounded bg-gray-600/50" />
                      </div>

                      {/* Content mock based on preset */}
                      {template.exportPreset === "banner" && (
                        <div className="flex-1 grid grid-cols-4 gap-1">
                          <div className="col-span-1 bg-gray-700/30 rounded" />
                          <div className="col-span-1 bg-gray-700/30 rounded" />
                          <div className="col-span-1 bg-gray-700/30 rounded" />
                          <div className="col-span-1 bg-gray-700/30 rounded" />
                        </div>
                      )}
                      {template.exportPreset === "story" && (
                        <div className="flex-1 flex flex-col gap-1">
                          <div className="flex-1 bg-gray-700/30 rounded" />
                          <div className="h-4 bg-gray-700/30 rounded" />
                          <div className="h-4 bg-gray-700/30 rounded" />
                        </div>
                      )}
                      {template.exportPreset === "square" && (
                        <div className="flex-1 grid grid-cols-2 gap-1">
                          <div className="bg-gray-700/30 rounded" />
                          <div className="bg-gray-700/30 rounded" />
                        </div>
                      )}
                      {template.exportPreset === "post" && (
                        <div className="flex-1 flex flex-col gap-1">
                          <div className="flex-2 bg-gray-700/30 rounded" />
                          <div className="flex-1 grid grid-cols-2 gap-1">
                            <div className="bg-gray-700/30 rounded" />
                            <div className="bg-gray-700/30 rounded" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-purple-500/0 group-hover:bg-purple-500/10 transition-colors flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium text-white bg-purple-600 px-4 py-2 rounded-lg">
                        Use Template
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3 bg-gray-800/50">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-medium text-white">{template.name}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
                        {preset.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{template.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Custom templates section (future) */}
          <div className="mt-8 pt-6 border-t border-gray-800">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Your Saved Templates</h3>
            <p className="text-xs text-gray-500">
              Saved templates will appear here. Save your current project as a template to reuse it later.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
