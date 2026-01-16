'use client';

import React, { useState } from 'react';
import { 
  Camera, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  TrendingUp, 
  TrendingDown,
  Minus,
  Plus,
  Clock,
  GitCompare
} from 'lucide-react';
import { TasteSnapshot, SnapshotComparison } from '@/types/snapshot';

interface SnapshotPanelProps {
  snapshots: TasteSnapshot[];
  canSave: boolean;
  onSave: (label?: string) => void;
  onDelete: (id: string) => void;
  onUpdateLabel: (id: string, label: string) => void;
  onCompare: (olderId: string, newerId: string) => void;
  comparison: SnapshotComparison | null;
  onClearComparison: () => void;
}

export function SnapshotPanel({
  snapshots,
  canSave,
  onSave,
  onDelete,
  onUpdateLabel,
  onCompare,
  comparison,
  onClearComparison,
}: SnapshotPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [compareMode, setCompareMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleStartEdit = (snapshot: TasteSnapshot) => {
    setEditingId(snapshot.id);
    setEditLabel(snapshot.label || '');
  };

  const handleSaveEdit = (id: string) => {
    onUpdateLabel(id, editLabel);
    setEditingId(null);
  };

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else if (selectedIds.length < 2) {
      const newSelected = [...selectedIds, id];
      setSelectedIds(newSelected);
      
      // Auto-compare when 2 selected
      if (newSelected.length === 2) {
        const [first, second] = newSelected;
        const firstSnap = snapshots.find(s => s.id === first);
        const secondSnap = snapshots.find(s => s.id === second);
        
        if (firstSnap && secondSnap) {
          const older = new Date(firstSnap.createdAt) < new Date(secondSnap.createdAt) ? first : second;
          const newer = older === first ? second : first;
          onCompare(older, newer);
        }
      }
    }
  };

  const handleExitCompare = () => {
    setCompareMode(false);
    setSelectedIds([]);
    onClearComparison();
  };

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-purple-400" />
          Taste Snapshots
          <span className="text-xs text-gray-500">({snapshots.length}/10)</span>
        </h3>
        
        {!compareMode && snapshots.length >= 2 && (
          <button
            onClick={() => setCompareMode(true)}
            className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
          >
            <GitCompare className="w-3 h-3" />
            Compare
          </button>
        )}
        
        {compareMode && (
          <button
            onClick={handleExitCompare}
            className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Cancel
          </button>
        )}
      </div>

      {/* Save New Snapshot */}
      {!compareMode && (
        <button
          onClick={() => onSave()}
          disabled={!canSave}
          className="w-full px-3 py-2.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed border border-purple-500/30 transition-all flex items-center justify-center gap-2 text-sm text-purple-300"
        >
          <Camera className="w-4 h-4" />
          Save Current Snapshot
        </button>
      )}

      {/* Compare Mode Instructions */}
      {compareMode && !comparison && (
        <div className="text-xs text-gray-400 text-center py-2 bg-gray-800/50 rounded-lg">
          Select 2 snapshots to compare
          {selectedIds.length > 0 && ` (${selectedIds.length}/2 selected)`}
        </div>
      )}

      {/* Comparison View */}
      {comparison && (
        <ComparisonView comparison={comparison} onClose={handleExitCompare} />
      )}

      {/* Snapshot List */}
      {!comparison && (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {snapshots.length === 0 ? (
            <div className="text-center py-6 text-gray-500 text-sm">
              No snapshots yet. Save your first one!
            </div>
          ) : (
            snapshots.map(snapshot => (
              <div
                key={snapshot.id}
                className={`p-3 rounded-lg border transition-all ${
                  compareMode 
                    ? selectedIds.includes(snapshot.id)
                      ? 'bg-purple-500/20 border-purple-500/50'
                      : 'bg-gray-800/30 border-gray-700/50 hover:border-purple-500/30 cursor-pointer'
                    : 'bg-gray-800/30 border-gray-700/50'
                }`}
                onClick={() => compareMode && handleToggleSelect(snapshot.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {editingId === snapshot.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveEdit(snapshot.id)}
                          className="p-1 text-green-400 hover:text-green-300"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1 text-gray-400 hover:text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white truncate">
                            {snapshot.label}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-700 text-gray-400">
                            {snapshot.mode}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {formatDate(snapshot.createdAt)} • {snapshot.stats.totalTitles} titles
                        </div>
                      </>
                    )}
                  </div>
                  
                  {!compareMode && editingId !== snapshot.id && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEdit(snapshot)}
                        className="p-1 text-gray-500 hover:text-white transition-colors"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => onDelete(snapshot.id)}
                        className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  
                  {compareMode && (
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedIds.includes(snapshot.id)
                        ? 'border-purple-500 bg-purple-500'
                        : 'border-gray-600'
                    }`}>
                      {selectedIds.includes(snapshot.id) && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Comparison View Component
function ComparisonView({ 
  comparison, 
  onClose 
}: { 
  comparison: SnapshotComparison; 
  onClose: () => void;
}) {
  const { older, newer, statsDiff, genreShifts, metricChanges } = comparison;

  const formatChange = (value: number, isPercent = false) => {
    const formatted = isPercent ? `${(value * 100).toFixed(1)}%` : value.toFixed(1);
    if (value > 0) return `+${formatted}`;
    return formatted;
  };

  const getChangeIcon = (value: number) => {
    if (value > 0.01) return <TrendingUp className="w-3 h-3 text-green-400" />;
    if (value < -0.01) return <TrendingDown className="w-3 h-3 text-red-400" />;
    return <Minus className="w-3 h-3 text-gray-500" />;
  };

  const getChangeColor = (value: number) => {
    if (value > 0.01) return 'text-green-400';
    if (value < -0.01) return 'text-red-400';
    return 'text-gray-500';
  };

  return (
    <div className="space-y-4 bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-white font-medium">
          {older.label} → {newer.label}
        </div>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Stats Changes */}
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-2 bg-gray-900/50 rounded-lg">
          <div className="text-[10px] text-gray-500 uppercase">Titles</div>
          <div className={`text-sm font-bold ${getChangeColor(statsDiff.totalTitles)}`}>
            {statsDiff.totalTitles > 0 ? '+' : ''}{statsDiff.totalTitles}
          </div>
        </div>
        <div className="text-center p-2 bg-gray-900/50 rounded-lg">
          <div className="text-[10px] text-gray-500 uppercase">Score</div>
          <div className={`text-sm font-bold ${getChangeColor(statsDiff.meanScore)}`}>
            {formatChange(statsDiff.meanScore)}
          </div>
        </div>
        <div className="text-center p-2 bg-gray-900/50 rounded-lg">
          <div className="text-[10px] text-gray-500 uppercase">Complete</div>
          <div className={`text-sm font-bold ${getChangeColor(statsDiff.completionRate)}`}>
            {formatChange(statsDiff.completionRate, true)}
          </div>
        </div>
      </div>

      {/* Metric Changes */}
      <div className="space-y-1">
        <div className="text-xs text-gray-400 font-medium mb-2">Taste Metrics</div>
        {[
          { label: 'Diversity', value: metricChanges.diversityIndex },
          { label: 'Niche', value: metricChanges.nicheIndex },
          { label: 'Mainstream', value: metricChanges.mainstreamIndex },
        ].map(metric => (
          <div key={metric.label} className="flex items-center justify-between text-xs">
            <span className="text-gray-500">{metric.label}</span>
            <div className="flex items-center gap-1">
              {getChangeIcon(metric.value)}
              <span className={getChangeColor(metric.value)}>
                {formatChange(metric.value * 100)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Top Genre Shifts */}
      <div className="space-y-1">
        <div className="text-xs text-gray-400 font-medium mb-2">Top Genre Shifts</div>
        {genreShifts.slice(0, 5).map(shift => (
          <div key={shift.name} className="flex items-center justify-between text-xs">
            <span className="text-gray-300">{shift.name}</span>
            <div className="flex items-center gap-1">
              {shift.direction === 'new' && <Plus className="w-3 h-3 text-blue-400" />}
              {shift.direction === 'dropped' && <Minus className="w-3 h-3 text-orange-400" />}
              {shift.direction === 'up' && <TrendingUp className="w-3 h-3 text-green-400" />}
              {shift.direction === 'down' && <TrendingDown className="w-3 h-3 text-red-400" />}
              {shift.direction === 'stable' && <Minus className="w-3 h-3 text-gray-500" />}
              <span className={
                shift.direction === 'new' ? 'text-blue-400' :
                shift.direction === 'dropped' ? 'text-orange-400' :
                shift.direction === 'up' ? 'text-green-400' :
                shift.direction === 'down' ? 'text-red-400' :
                'text-gray-500'
              }>
                {shift.direction === 'new' ? 'New' :
                 shift.direction === 'dropped' ? 'Gone' :
                 `${((shift.newStrength - shift.oldStrength) * 100).toFixed(0)}%`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SnapshotPanel;
