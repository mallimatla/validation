'use client';

import { useState } from 'react';

interface Risk {
  title: string;
  description: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'minor' | 'moderate' | 'major' | 'critical';
  category?: string;
  mitigations?: string[];
}

interface RiskHeatmapProps {
  risks: Risk[];
  onRiskClick?: (risk: Risk) => void;
}

const PROBABILITY_ORDER = ['low', 'medium', 'high'] as const;
const IMPACT_ORDER = ['minor', 'moderate', 'major', 'critical'] as const;

const CELL_COLORS: Record<string, string> = {
  'low-minor': '#10b981',      // Green
  'low-moderate': '#84cc16',   // Lime
  'low-major': '#eab308',      // Yellow
  'low-critical': '#f97316',   // Orange
  'medium-minor': '#84cc16',   // Lime
  'medium-moderate': '#eab308', // Yellow
  'medium-major': '#f97316',   // Orange
  'medium-critical': '#ef4444', // Red
  'high-minor': '#eab308',     // Yellow
  'high-moderate': '#f97316',  // Orange
  'high-major': '#ef4444',     // Red
  'high-critical': '#dc2626',  // Dark Red
};

export function RiskHeatmap({ risks, onRiskClick }: RiskHeatmapProps) {
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);

  // Group risks by probability and impact
  const riskMatrix: Record<string, Risk[]> = {};

  risks.forEach((risk) => {
    const key = `${risk.probability}-${risk.impact}`;
    if (!riskMatrix[key]) riskMatrix[key] = [];
    riskMatrix[key].push(risk);
  });

  const handleCellClick = (cellRisks: Risk[]) => {
    if (cellRisks.length === 1) {
      setSelectedRisk(cellRisks[0]);
      onRiskClick?.(cellRisks[0]);
    } else if (cellRisks.length > 1) {
      setSelectedRisk(cellRisks[0]);
    }
  };

  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <span>🔥</span> Risk Heatmap
      </h3>

      <div className="flex gap-6">
        {/* Heatmap grid */}
        <div className="flex-1">
          <div className="grid grid-cols-5 gap-1">
            {/* Header row */}
            <div className="h-10" /> {/* Empty corner */}
            {IMPACT_ORDER.map((impact) => (
              <div
                key={impact}
                className="h-10 flex items-center justify-center text-xs font-medium text-slate-400 capitalize"
              >
                {impact}
              </div>
            ))}

            {/* Data rows */}
            {[...PROBABILITY_ORDER].reverse().map((prob) => (
              <>
                <div
                  key={`label-${prob}`}
                  className="h-16 flex items-center justify-center text-xs font-medium text-slate-400 capitalize"
                >
                  {prob}
                </div>
                {IMPACT_ORDER.map((impact) => {
                  const key = `${prob}-${impact}`;
                  const cellRisks = riskMatrix[key] || [];
                  const color = CELL_COLORS[key];

                  return (
                    <div
                      key={key}
                      className={`h-16 rounded-lg flex items-center justify-center text-lg font-bold cursor-pointer transition-all hover:scale-105 hover:ring-2 hover:ring-white/30 ${
                        cellRisks.length > 0 ? 'animate-pulse' : ''
                      }`}
                      style={{
                        backgroundColor: cellRisks.length > 0 ? color : `${color}20`,
                        color: cellRisks.length > 0 ? 'white' : color,
                      }}
                      onClick={() => cellRisks.length > 0 && handleCellClick(cellRisks)}
                      title={cellRisks.map((r) => r.title).join(', ')}
                    >
                      {cellRisks.length > 0 ? cellRisks.length : ''}
                    </div>
                  );
                })}
              </>
            ))}
          </div>

          {/* Axis labels */}
          <div className="flex justify-between mt-4 text-sm text-slate-500">
            <span>← Lower Impact</span>
            <span className="font-medium">Impact</span>
            <span>Higher Impact →</span>
          </div>
          <div className="text-center text-sm text-slate-500 mt-2">
            <span className="rotate-90 inline-block">Probability</span>
          </div>
        </div>

        {/* Risk detail panel */}
        {selectedRisk && (
          <div className="w-80 bg-slate-900/50 rounded-lg p-4 border border-slate-700">
            <div className="flex justify-between items-start mb-3">
              <h4 className="font-semibold text-white">{selectedRisk.title}</h4>
              <button
                onClick={() => setSelectedRisk(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-slate-300 mb-4">{selectedRisk.description}</p>

            <div className="flex gap-2 mb-4">
              <span
                className="px-2 py-1 rounded text-xs font-medium capitalize"
                style={{
                  backgroundColor: `${CELL_COLORS[`${selectedRisk.probability}-${selectedRisk.impact}`]}30`,
                  color: CELL_COLORS[`${selectedRisk.probability}-${selectedRisk.impact}`],
                }}
              >
                {selectedRisk.probability} probability
              </span>
              <span
                className="px-2 py-1 rounded text-xs font-medium capitalize"
                style={{
                  backgroundColor: `${CELL_COLORS[`${selectedRisk.probability}-${selectedRisk.impact}`]}30`,
                  color: CELL_COLORS[`${selectedRisk.probability}-${selectedRisk.impact}`],
                }}
              >
                {selectedRisk.impact} impact
              </span>
            </div>

            {selectedRisk.mitigations && selectedRisk.mitigations.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-slate-400 mb-2">Mitigations:</h5>
                <ul className="space-y-1">
                  {selectedRisk.mitigations.map((m, i) => (
                    <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                      <span className="text-emerald-500">→</span>
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-emerald-500" />
          <span className="text-xs text-slate-400">Low Risk</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-500" />
          <span className="text-xs text-slate-400">Medium Risk</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-orange-500" />
          <span className="text-xs text-slate-400">High Risk</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500" />
          <span className="text-xs text-slate-400">Critical Risk</span>
        </div>
      </div>
    </div>
  );
}

// Compact risk list for summary view
export function RiskList({ risks, maxItems = 5 }: { risks: Risk[]; maxItems?: number }) {
  const sortedRisks = [...risks].sort((a, b) => {
    const severityOrder = { critical: 4, major: 3, moderate: 2, minor: 1 };
    const probOrder = { high: 3, medium: 2, low: 1 };
    const aScore = severityOrder[a.impact] * probOrder[a.probability];
    const bScore = severityOrder[b.impact] * probOrder[b.probability];
    return bScore - aScore;
  });

  return (
    <div className="space-y-2">
      {sortedRisks.slice(0, maxItems).map((risk, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700"
        >
          <div
            className="w-2 h-8 rounded-full"
            style={{ backgroundColor: CELL_COLORS[`${risk.probability}-${risk.impact}`] }}
          />
          <div className="flex-1">
            <div className="text-sm font-medium text-white">{risk.title}</div>
            <div className="text-xs text-slate-400 capitalize">
              {risk.probability} probability • {risk.impact} impact
            </div>
          </div>
        </div>
      ))}
      {risks.length > maxItems && (
        <div className="text-center text-sm text-slate-500">
          +{risks.length - maxItems} more risks
        </div>
      )}
    </div>
  );
}
