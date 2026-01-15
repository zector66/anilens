"use client";

import React, { forwardRef, useCallback } from "react";
import Image from "next/image";
import {
  DndContext,
  DragEndEvent,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import {
  StudioProject,
  StudioWidget,
  CanvasState,
  EXPORT_PRESETS,
  PosterData,
} from "@/types/studio";
import {
  Star,
  BarChart3,
  TrendingUp,
  Flame,
  Trophy,
  Swords,
  Hash,
  Heart,
  Activity,
  Zap,
} from "lucide-react";

interface StudioCanvasProps {
  project: StudioProject;
  posterData: PosterData;
  canvasState: CanvasState;
  onCanvasStateChange: (state: CanvasState) => void;
  onWidgetUpdate: (widgetId: string, updates: Partial<StudioWidget>) => void;
  onWidgetSelect: (widgetId: string | null) => void;
}

// Draggable Widget Wrapper with polish
function DraggableWidget({
  widget,
  isSelected,
  gridSize,
  onClick,
  children,
}: {
  widget: StudioWidget;
  isSelected: boolean;
  gridSize: number;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: widget.id,
    disabled: widget.locked,
  });

  const style: React.CSSProperties = {
    position: "absolute",
    left: widget.position.x * gridSize,
    top: widget.position.y * gridSize,
    width: widget.position.width * gridSize,
    height: widget.position.height * gridSize,
    zIndex: isDragging ? 1000 : widget.position.zIndex,
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${isDragging ? 1.02 : 1})`
      : undefined,
    opacity: isDragging ? 0.9 : widget.visible ? 1 : 0.4,
    cursor: widget.locked ? "not-allowed" : isDragging ? "grabbing" : "grab",
    transition: isDragging ? "none" : "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`group relative rounded-xl overflow-hidden ${
        isSelected
          ? "ring-2 ring-purple-500 ring-offset-2 ring-offset-gray-900 shadow-lg shadow-purple-500/20"
          : "hover:ring-2 hover:ring-purple-400/40 hover:shadow-md"
      } ${isDragging ? "shadow-2xl shadow-purple-500/30" : ""} ${
        widget.locked ? "cursor-not-allowed" : ""
      }`}
    >
      {children}
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute inset-0 pointer-events-none border-2 border-purple-500/50 rounded-xl" />
      )}
      {/* Lock indicator */}
      {widget.locked && (
        <div className="absolute top-1 right-1 w-5 h-5 bg-gray-900/80 rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  );
}

// Individual Widget Renderers
function HeaderWidget({ data, theme }: { data: PosterData; theme: StudioProject["theme"] }) {
  return (
    <div
      className="relative w-full h-full rounded-lg overflow-hidden"
      style={{ backgroundColor: theme.mode === "dark" ? "#1f2937" : "#f3f4f6" }}
    >
      {data.header.banner && (
        <div className="absolute inset-0">
          <Image
            src={data.header.banner}
            alt="Banner"
            fill
            className="object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent" />
        </div>
      )}
      <div className="relative z-10 flex items-center h-full p-4">
        {data.header.avatar && (
          <div
            className="w-12 h-12 rounded-full overflow-hidden border-2 mr-3 shrink-0"
            style={{ borderColor: theme.accent }}
          >
            <Image
              src={data.header.avatar}
              alt="Avatar"
              width={48}
              height={48}
              className="object-cover"
            />
          </div>
        )}
        <div>
          <h1 className="text-lg font-bold text-white">{data.header.username}</h1>
          <p className="text-xs text-gray-300">{data.header.subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function TopMediaWidget({
  data,
  settings,
  theme,
}: {
  data: PosterData;
  settings: Record<string, unknown>;
  theme: StudioProject["theme"];
}) {
  const mediaType = (settings.mediaType as string) || "anime";
  const topData = mediaType === "manga" ? data.topManga : data.topAnime;

  return (
    <div
      className="w-full h-full rounded-lg p-3 overflow-hidden"
      style={{ backgroundColor: theme.mode === "dark" ? "#1f2937" : "#f3f4f6" }}
    >
      <h3 className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: theme.accent }}>
        <Star className="w-3 h-3" />
        Top {mediaType === "manga" ? "Manga" : "Anime"}
      </h3>
      <div className="flex gap-2 h-[calc(100%-24px)]">
        {/* Primary */}
        <div className="relative flex-1 rounded overflow-hidden">
          <Image
            src={topData.primary.cover || "/placeholder.png"}
            alt={topData.primary.title}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-2">
            <p className="text-[10px] font-medium text-white truncate">{topData.primary.title}</p>
            {topData.primary.score && (
              <p className="text-[9px] text-yellow-400">★ {topData.primary.score}</p>
            )}
          </div>
        </div>
        {/* Secondary */}
        <div className="flex flex-col gap-1 w-1/3">
          {topData.secondary.slice(0, 4).map((item) => (
            <div key={item.id} className="relative flex-1 rounded overflow-hidden">
              <Image src={item.cover || "/placeholder.png"} alt={item.title} fill className="object-cover" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatsWidget({
  data,
  settings,
  theme,
}: {
  data: PosterData;
  settings: Record<string, unknown>;
  theme: StudioProject["theme"];
}) {
  const showAnime = settings.showAnime !== false;
  const showManga = settings.showManga === true;

  return (
    <div
      className="w-full h-full rounded-lg p-3"
      style={{ backgroundColor: theme.mode === "dark" ? "#1f2937" : "#f3f4f6" }}
    >
      <h3 className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: theme.accent }}>
        <BarChart3 className="w-3 h-3" />
        Stats
      </h3>
      <div className="space-y-2 text-xs">
        {showAnime && (
          <>
            <div className="flex justify-between text-gray-300">
              <span>Episodes</span>
              <span className="font-medium text-white">{data.animeStats.episodesWatched.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>Completed</span>
              <span className="font-medium text-white">{data.animeStats.completed}</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>Mean Score</span>
              <span className="font-medium text-white">{data.animeStats.meanScore.toFixed(1)}</span>
            </div>
          </>
        )}
        {showManga && (
          <>
            <div className="flex justify-between text-gray-300">
              <span>Chapters</span>
              <span className="font-medium text-white">{data.mangaStats.chaptersRead.toLocaleString()}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PercentilesWidget({ data, theme }: { data: PosterData; theme: StudioProject["theme"] }) {
  return (
    <div
      className="w-full h-full rounded-lg p-3"
      style={{ backgroundColor: theme.mode === "dark" ? "#1f2937" : "#f3f4f6" }}
    >
      <h3 className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: theme.accent }}>
        <TrendingUp className="w-3 h-3" />
        Indices
      </h3>
      <div className="space-y-2">
        {Object.values(data.percentiles).map((p) => (
          <div key={p.label} className="space-y-1">
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>{p.label}</span>
              <span className="text-white font-medium">{p.value.toFixed(1)}</span>
            </div>
            <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.min(100, p.value * 10)}%`, backgroundColor: theme.accent }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TagsWidget({
  data,
  settings,
  theme,
}: {
  data: PosterData;
  settings: Record<string, unknown>;
  theme: StudioProject["theme"];
}) {
  const count = (settings.count as number) || 12;

  return (
    <div
      className="w-full h-full rounded-lg p-3"
      style={{ backgroundColor: theme.mode === "dark" ? "#1f2937" : "#f3f4f6" }}
    >
      <h3 className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: theme.accent }}>
        <Hash className="w-3 h-3" />
        Top Tags
      </h3>
      <div className="flex flex-wrap gap-1">
        {data.topTags.slice(0, count).map((tag) => (
          <span
            key={tag.tag}
            className="px-1.5 py-0.5 rounded text-[9px] bg-gray-700/50 text-gray-300"
            style={{ opacity: 0.6 + tag.weight * 0.4 }}
          >
            {tag.tag}
          </span>
        ))}
      </div>
    </div>
  );
}

function HottestTakeWidget({ data, theme }: { data: PosterData; theme: StudioProject["theme"] }) {
  return (
    <div
      className="w-full h-full rounded-lg p-3"
      style={{ backgroundColor: theme.mode === "dark" ? "#1f2937" : "#f3f4f6" }}
    >
      <h3 className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: theme.accent }}>
        <Flame className="w-3 h-3" />
        Hottest Take
      </h3>
      <p className="text-[10px] text-gray-300 italic leading-relaxed">{data.hottestTake.content}</p>
    </div>
  );
}

function GamesRankWidget({ data, theme }: { data: PosterData; theme: StudioProject["theme"] }) {
  return (
    <div
      className="w-full h-full rounded-lg p-3"
      style={{ backgroundColor: theme.mode === "dark" ? "#1f2937" : "#f3f4f6" }}
    >
      <h3 className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: theme.accent }}>
        <Trophy className="w-3 h-3" />
        Games Rank
      </h3>
      <div className="text-center">
        <div className="text-2xl mb-1">{data.gamesRank.rankIcon}</div>
        <div className="text-sm font-bold text-white">{data.gamesRank.rank}</div>
        <div className="text-[10px] text-gray-400">{data.gamesRank.mmr} MMR</div>
      </div>
    </div>
  );
}

function FingerprintWidget({ data, theme }: { data: PosterData; theme: StudioProject["theme"] }) {
  return (
    <div
      className="w-full h-full rounded-lg p-3"
      style={{ backgroundColor: theme.mode === "dark" ? "#1f2937" : "#f3f4f6" }}
    >
      <h3 className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: theme.accent }}>
        <Swords className="w-3 h-3" />
        Taste DNA
      </h3>
      <div className="font-mono text-[10px] text-gray-300 break-all">{data.fingerprint}</div>
      <div className="text-[9px] text-gray-500 mt-1">Confidence: {data.confidence}</div>
    </div>
  );
}

function EmotionalWidget({ theme }: { theme: StudioProject["theme"] }) {
  return (
    <div
      className="w-full h-full rounded-lg p-3"
      style={{ backgroundColor: theme.mode === "dark" ? "#1f2937" : "#f3f4f6" }}
    >
      <h3 className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: theme.accent }}>
        <Heart className="w-3 h-3" />
        Emotional Profile
      </h3>
      <div className="text-[10px] text-gray-400 text-center py-4">Coming soon</div>
    </div>
  );
}

function ActivityWidget({ data, theme }: { data: PosterData; theme: StudioProject["theme"] }) {
  const maxCount = Math.max(...data.monthlyActivity.map((m) => m.count), 1);

  return (
    <div
      className="w-full h-full rounded-lg p-3"
      style={{ backgroundColor: theme.mode === "dark" ? "#1f2937" : "#f3f4f6" }}
    >
      <h3 className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: theme.accent }}>
        <Activity className="w-3 h-3" />
        Activity
      </h3>
      <div className="flex items-end gap-1 h-[calc(100%-24px)]">
        {data.monthlyActivity.slice(-12).map((month) => (
          <div key={month.month} className="flex-1 flex flex-col items-center">
            <div
              className="w-full rounded-t"
              style={{
                height: `${(month.count / maxCount) * 100}%`,
                backgroundColor: theme.accent,
                minHeight: month.count > 0 ? 4 : 0,
              }}
            />
            <span className="text-[8px] text-gray-500 mt-1">
              {month.month.split("-")[1]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContradictionWidget({ data, theme }: { data: PosterData; theme: StudioProject["theme"] }) {
  return (
    <div
      className="w-full h-full rounded-lg p-3"
      style={{ backgroundColor: theme.mode === "dark" ? "#1f2937" : "#f3f4f6" }}
    >
      <h3 className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: theme.accent }}>
        <Zap className="w-3 h-3" />
        Contradiction
      </h3>
      <p className="text-[10px] text-gray-300 italic">
        {data.tasteContradiction || "Your taste is remarkably consistent"}
      </p>
    </div>
  );
}

function GenreRadarWidget({ data, theme }: { data: PosterData; theme: StudioProject["theme"] }) {
  const maxAffinity = Math.max(...data.genreRadar.map((g) => g.affinity), 1);

  return (
    <div
      className="w-full h-full rounded-lg p-3"
      style={{ backgroundColor: theme.mode === "dark" ? "#1f2937" : "#f3f4f6" }}
    >
      <h3 className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: theme.accent }}>
        <TrendingUp className="w-3 h-3" />
        Genre Affinity
      </h3>
      <div className="space-y-1">
        {data.genreRadar.slice(0, 6).map((genre) => (
          <div key={genre.genre} className="space-y-0.5">
            <div className="flex justify-between text-[9px]">
              <span className="text-gray-400 truncate">{genre.genre}</span>
              <span className="text-gray-300">{(genre.affinity * 100).toFixed(0)}%</span>
            </div>
            <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(genre.affinity / maxAffinity) * 100}%`,
                  backgroundColor: theme.accent,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Widget Renderer Factory
function renderWidget(
  widget: StudioWidget,
  posterData: PosterData,
  theme: StudioProject["theme"]
) {
  switch (widget.type) {
    case "header":
      return <HeaderWidget data={posterData} theme={theme} />;
    case "topMedia":
      return <TopMediaWidget data={posterData} settings={widget.settings} theme={theme} />;
    case "stats":
      return <StatsWidget data={posterData} settings={widget.settings} theme={theme} />;
    case "percentiles":
      return <PercentilesWidget data={posterData} theme={theme} />;
    case "tags":
      return <TagsWidget data={posterData} settings={widget.settings} theme={theme} />;
    case "genreRadar":
      return <GenreRadarWidget data={posterData} theme={theme} />;
    case "hottestTake":
      return <HottestTakeWidget data={posterData} theme={theme} />;
    case "gamesRank":
      return <GamesRankWidget data={posterData} theme={theme} />;
    case "fingerprint":
      return <FingerprintWidget data={posterData} theme={theme} />;
    case "emotional":
      return <EmotionalWidget theme={theme} />;
    case "activity":
      return <ActivityWidget data={posterData} theme={theme} />;
    case "contradiction":
      return <ContradictionWidget data={posterData} theme={theme} />;
    default:
      return (
        <div className="w-full h-full rounded-lg bg-gray-800 flex items-center justify-center">
          <span className="text-xs text-gray-500">Unknown widget</span>
        </div>
      );
  }
}

export const StudioCanvas = forwardRef<HTMLDivElement, StudioCanvasProps>(
  function StudioCanvas(
    { project, posterData, canvasState, onWidgetUpdate, onWidgetSelect },
    ref
  ) {
    const { setNodeRef } = useDroppable({ id: "canvas" });

    const presetConfig = EXPORT_PRESETS[project.exportConfig.preset];
    const canvasWidth = presetConfig.width / 10; // Scale down for preview
    const canvasHeight = presetConfig.height / 10;

    const handleDragEnd = useCallback(
      (event: DragEndEvent) => {
        const { active, delta } = event;
        const widgetId = active.id as string;
        const widget = project.widgets.find((w) => w.id === widgetId);

        if (!widget || widget.locked) return;

        let newX = widget.position.x + Math.round(delta.x / canvasState.gridSize);
        let newY = widget.position.y + Math.round(delta.y / canvasState.gridSize);

        // Snap to grid
        if (canvasState.snapToGrid) {
          newX = Math.round(newX);
          newY = Math.round(newY);
        }

        // Clamp to canvas bounds (using grid units, 12-column grid)
        newX = Math.max(0, Math.min(12 - widget.position.width, newX));
        newY = Math.max(0, newY);

        onWidgetUpdate(widgetId, {
          position: { ...widget.position, x: newX, y: newY },
        });
      },
      [project.widgets, canvasState.gridSize, canvasState.snapToGrid, onWidgetUpdate]
    );

    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <DndContext onDragEnd={handleDragEnd}>
          <div
            ref={(node) => {
              setNodeRef(node);
              if (typeof ref === "function") ref(node);
              else if (ref) ref.current = node;
            }}
            id="studio-export-canvas"
            className="relative rounded-lg overflow-hidden shadow-2xl"
            style={{
              width: canvasWidth * canvasState.zoom,
              height: canvasHeight * canvasState.zoom,
              backgroundColor: project.theme.mode === "dark" ? "#111827" : "#ffffff",
              transform: `scale(${canvasState.zoom})`,
              transformOrigin: "center center",
            }}
            onClick={() => onWidgetSelect(null)}
          >
            {/* Grid overlay */}
            {canvasState.showGrid && (
              <div
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, ${project.theme.accent}22 1px, transparent 1px),
                    linear-gradient(to bottom, ${project.theme.accent}22 1px, transparent 1px)
                  `,
                  backgroundSize: `${canvasState.gridSize}px ${canvasState.gridSize}px`,
                }}
              />
            )}

            {/* Widgets */}
            {project.widgets.map((widget) => (
              <DraggableWidget
                key={widget.id}
                widget={widget}
                isSelected={canvasState.selectedWidgetId === widget.id}
                gridSize={canvasState.gridSize}
                onClick={() => onWidgetSelect(widget.id)}
              >
                {renderWidget(widget, posterData, project.theme)}
              </DraggableWidget>
            ))}

            {/* Watermark */}
            <div className="absolute bottom-2 right-2 text-[8px] text-gray-500 opacity-50">
              {posterData.header.watermark}
            </div>
          </div>
        </DndContext>
      </div>
    );
  }
);
