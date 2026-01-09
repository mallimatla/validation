'use client';

import React, { useState } from 'react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

interface Competitor {
  name: string;
  description: string;
  website?: string;
  fundingRaised?: number;
  valuation?: number | null;
  stage?: string;
  employees?: string;
  relevanceScore?: number;
  metrics?: Record<string, number>;
}

interface CompetitorAnalysisProps {
  competitors: Competitor[];
  yourCompany?: string;
  yourMetrics?: Record<string, number>;
  onDrillDown?: (competitor: Competitor) => void;
}

function formatCurrency(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function CompetitorAnalysis({
  competitors,
  yourCompany = 'Your Company',
  yourMetrics,
  onDrillDown,
}: CompetitorAnalysisProps) {
  const [selectedCompetitor, setSelectedCompetitor] = useState<Competitor | null>(null);
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);

  // Create radar chart data from metrics
  const defaultMetrics = ['Market Share', 'Product', 'Technology', 'Team', 'Funding', 'Traction'];
  const radarData = defaultMetrics.map((metric) => {
    const dataPoint: Record<string, number | string> = { metric };

    // Add your company's metrics
    if (yourMetrics) {
      dataPoint[yourCompany] = yourMetrics[metric] || 5;
    }

    // Add selected competitors
    competitors
      .filter(c => selectedForComparison.includes(c.name))
      .forEach((comp) => {
        dataPoint[comp.name] = comp.metrics?.[metric] || Math.floor(Math.random() * 4) + 5;
      });

    return dataPoint;
  });

  const toggleComparison = (name: string) => {
    setSelectedForComparison(prev =>
      prev.includes(name)
        ? prev.filter(n => n !== name)
        : prev.length < 3 ? [...prev, name] : prev
    );
  };

  // Sort competitors by relevance/funding
  const sortedCompetitors = [...competitors].sort((a, b) => {
    if (a.relevanceScore && b.relevanceScore) {
      return b.relevanceScore - a.relevanceScore;
    }
    return (b.fundingRaised || 0) - (a.fundingRaised || 0);
  });

  return (
    <div className="space-y-4">
      {/* Competitor Cards */}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {sortedCompetitors.slice(0, 5).map((competitor, index) => (
          <div
            key={competitor.name}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
              selectedCompetitor?.name === competitor.name
                ? 'border-white bg-slate-700/50'
                : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
            }`}
            onClick={() => { setSelectedCompetitor(competitor); onDrillDown?.(competitor); }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            >
              {competitor.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-white font-medium truncate">{competitor.name}</p>
                {competitor.relevanceScore && (
                  <span className="text-xs bg-slate-700 px-2 py-0.5 rounded text-slate-400">
                    {competitor.relevanceScore}/10 relevance
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 truncate">{competitor.description}</p>
            </div>
            <div className="text-right">
              {competitor.fundingRaised && (
                <p className="text-sm font-medium text-white">
                  {formatCurrency(competitor.fundingRaised)}
                </p>
              )}
              <p className="text-xs text-slate-500">{competitor.stage || 'Unknown'}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); toggleComparison(competitor.name); }}
              className={`px-2 py-1 text-xs rounded border transition-all ${
                selectedForComparison.includes(competitor.name)
                  ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                  : 'border-slate-600 text-slate-400 hover:border-slate-500'
              }`}
            >
              {selectedForComparison.includes(competitor.name) ? '✓ Compare' : 'Compare'}
            </button>
          </div>
        ))}
      </div>

      {/* Radar Comparison Chart */}
      {selectedForComparison.length > 0 && (
        <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700">
          <h4 className="text-sm font-medium text-slate-400 mb-2">Competitive Comparison</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis
                  dataKey="metric"
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 10]}
                  tick={{ fill: '#64748b', fontSize: 8 }}
                />
                {yourMetrics && (
                  <Radar
                    name={yourCompany}
                    dataKey={yourCompany}
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.3}
                  />
                )}
                {selectedForComparison.map((name, index) => (
                  <Radar
                    key={name}
                    name={name}
                    dataKey={name}
                    stroke={COLORS[(index + 1) % COLORS.length]}
                    fill={COLORS[(index + 1) % COLORS.length]}
                    fillOpacity={0.2}
                  />
                ))}
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span className="text-slate-300 text-xs">{value}</span>
                  )}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Drill-Down Panel */}
      {selectedCompetitor && (
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: COLORS[0] }}
              >
                {selectedCompetitor.name.charAt(0)}
              </div>
              <h4 className="font-semibold text-white">{selectedCompetitor.name}</h4>
            </div>
            <button
              onClick={() => setSelectedCompetitor(null)}
              className="text-slate-400 hover:text-white text-sm"
            >
              ✕ Close
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <p className="text-slate-400 text-xs">Description</p>
              <p className="text-sm text-slate-300 mt-1">{selectedCompetitor.description}</p>
            </div>
            {selectedCompetitor.fundingRaised && (
              <div>
                <p className="text-slate-400 text-xs">Funding Raised</p>
                <p className="text-lg font-bold text-white">
                  {formatCurrency(selectedCompetitor.fundingRaised)}
                </p>
              </div>
            )}
            {selectedCompetitor.valuation && (
              <div>
                <p className="text-slate-400 text-xs">Valuation</p>
                <p className="text-lg font-bold text-white">
                  {formatCurrency(selectedCompetitor.valuation)}
                </p>
              </div>
            )}
            {selectedCompetitor.stage && (
              <div>
                <p className="text-slate-400 text-xs">Stage</p>
                <p className="text-sm text-white">{selectedCompetitor.stage}</p>
              </div>
            )}
            {selectedCompetitor.employees && (
              <div>
                <p className="text-slate-400 text-xs">Employees</p>
                <p className="text-sm text-white">{selectedCompetitor.employees}</p>
              </div>
            )}
            {selectedCompetitor.website && (
              <div className="col-span-2">
                <a
                  href={selectedCompetitor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 hover:underline"
                >
                  {selectedCompetitor.website} →
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-slate-800/30 rounded-lg p-2">
          <p className="text-xs text-slate-400">Total Competitors</p>
          <p className="text-lg font-bold text-white">{competitors.length}</p>
        </div>
        <div className="bg-slate-800/30 rounded-lg p-2">
          <p className="text-xs text-slate-400">Total Funding</p>
          <p className="text-lg font-bold text-white">
            {formatCurrency(competitors.reduce((sum, c) => sum + (c.fundingRaised || 0), 0))}
          </p>
        </div>
        <div className="bg-slate-800/30 rounded-lg p-2">
          <p className="text-xs text-slate-400">Avg Relevance</p>
          <p className="text-lg font-bold text-white">
            {(competitors.reduce((sum, c) => sum + (c.relevanceScore || 5), 0) / competitors.length).toFixed(1)}
          </p>
        </div>
      </div>
    </div>
  );
}
