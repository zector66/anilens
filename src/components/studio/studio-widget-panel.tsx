"use client";

import React from "react";
import {
  Star,
  BarChart3,
  TrendingUp,
  Hash,
  Flame,
  Trophy,
  Swords,
  Heart,
  Activity,
  Zap,
  User,
  PieChart,
} from "lucide-react";
import { WidgetType } from "@/types/studio";

interface StudioWidgetPanelProps {
  onAddWidget: (type: WidgetType) => void;
}

const WIDGET_OPTIONS: Array<{
  type: WidgetType;
  label: string;
  description: string;
  icon: React.ElementType;
}> = [
  {
    type: "header",
    label: "Header",
    description: "Profile banner and username",
    icon: User,
  },
  {
    type: "topMedia",
    label: "Top Media",
    description: "Your top anime or manga",
    icon: Star,
  },
  {
    type: "stats",
    label: "Stats",
    description: "Watch/read statistics",
    icon: BarChart3,
  },
  {
    type: "percentiles",
    label: "Indices",
    description: "Niche, mainstream, diversity",
    icon: TrendingUp,
  },
  {
    type: "tags",
    label: "Top Tags",
    description: "Your favorite content tags",
    icon: Hash,
  },
  {
    type: "genreRadar",
    label: "Genre Radar",
    description: "Genre affinity visualization",
    icon: PieChart,
  },
  {
    type: "activity",
    label: "Activity",
    description: "Monthly activity chart",
    icon: Activity,
  },
  {
    type: "hottestTake",
    label: "Hottest Take",
    description: "Your most controversial opinion",
    icon: Flame,
  },
  {
    type: "gamesRank",
    label: "Games Rank",
    description: "Your AniLens games rank",
    icon: Trophy,
  },
  {
    type: "fingerprint",
    label: "Taste DNA",
    description: "Unique taste fingerprint",
    icon: Swords,
  },
  {
    type: "emotional",
    label: "Emotional",
    description: "Emotional profile radar",
    icon: Heart,
  },
  {
    type: "contradiction",
    label: "Contradiction",
    description: "Taste contradictions",
    icon: Zap,
  },
];

export function StudioWidgetPanel({ onAddWidget }: StudioWidgetPanelProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400 mb-3">
        Click to add a widget to your canvas
      </p>
      {WIDGET_OPTIONS.map((option) => (
        <button
          key={option.type}
          onClick={() => onAddWidget(option.type)}
          className="w-full flex items-start gap-3 p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors text-left group"
        >
          <div
            className="p-2 rounded-lg bg-gray-700 group-hover:bg-purple-500/20 transition-colors"
          >
            <option.icon className="w-4 h-4 text-gray-400 group-hover:text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-200">{option.label}</div>
            <div className="text-xs text-gray-500 truncate">{option.description}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
