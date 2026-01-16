'use client';

import { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface Finding {
  type: string;
  severity?: string;
  title?: string;
  description?: string;
}

interface SWOTChartProps {
  findings: Finding[];
  showDetails?: boolean;
}

const SWOT_COLORS = {
  strength: { primary: '#10b981', secondary: '#059669', bg: 'rgba(16, 185, 129, 0.1)' },
  weakness: { primary: '#ef4444', secondary: '#dc2626', bg: 'rgba(239, 68, 68, 0.1)' },
  opportunity: { primary: '#3b82f6', secondary: '#2563eb', bg: 'rgba(59, 130, 246, 0.1)' },
  threat: { primary: '#f97316', secondary: '#ea580c', bg: 'rgba(249, 115, 22, 0.1)' },
};

const SEVERITY_COLORS = {
  critical: '#dc2626',
  major: '#f97316',
  minor: '#eab308',
  info: '#64748b',
};

export function SWOTAnalysisChart({ findings, showDetails = true }: SWOTChartProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);

  // Count by type
  const strengths = findings.filter(f => f.type === 'strength').length;
  const weaknesses = findings.filter(f => f.type === 'weakness').length;
  const opportunities = findings.filter(f => f.type === 'opportunity').length;
  const threats = findings.filter(f => f.type === 'threat').length;

  const swotData = [
    { name: 'Strengths', value: strengths, color: SWOT_COLORS.strength.primary, type: 'strength' },
    { name: 'Weaknesses', value: weaknesses, color: SWOT_COLORS.weakness.primary, type: 'weakness' },
    { name: 'Opportunities', value: opportunities, color: SWOT_COLORS.opportunity.primary, type: 'opportunity' },
    { name: 'Threats', value: threats, color: SWOT_COLORS.threat.primary, type: 'threat' },
  ].filter(d => d.value > 0);

  // Count by severity
  const severityData = [
    { name: 'Critical', value: findings.filter(f => f.severity === 'critical').length, color: SEVERITY_COLORS.critical },
    { name: 'Major', value: findings.filter(f => f.severity === 'major').length, color: SEVERITY_COLORS.major },
    { name: 'Minor', value: findings.filter(f => f.severity === 'minor').length, color: SEVERITY_COLORS.minor },
    { name: 'Info', value: findings.filter(f => f.severity === 'info' || !f.severity).length, color: SEVERITY_COLORS.info },
  ].filter(d => d.value > 0);

  const total = findings.length;

  // Get findings for selected type
  const selectedFindings = selectedType
    ? findings.filter(f => f.type === selectedType)
    : [];

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center">
              <span className="text-xl">🔍</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">SWOT Analysis</h3>
              <p className="text-sm text-slate-400">{total} findings analyzed</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-white">{total}</div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* SWOT Donut */}
          <div>
            <h4 className="text-sm font-medium text-slate-400 mb-4 text-center">By Type (SWOT)</h4>
            <div className="h-[250px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={swotData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    onClick={(data) => setSelectedType(data.type === selectedType ? null : data.type)}
                  >
                    {swotData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        style={{
                          cursor: 'pointer',
                          opacity: selectedType && selectedType !== entry.type ? 0.4 : 1,
                          transition: 'opacity 0.3s',
                        }}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 shadow-xl">
                            <p className="font-medium text-white">{data.name}</p>
                            <p className="text-sm text-slate-400">{data.value} findings</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              {swotData.map((item) => (
                <button
                  key={item.name}
                  onClick={() => setSelectedType(item.type === selectedType ? null : item.type)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                    selectedType === item.type
                      ? 'bg-slate-700 ring-2 ring-offset-2 ring-offset-slate-800'
                      : 'hover:bg-slate-700/50'
                  }`}
                  style={{
                    borderColor: item.color,
                    ...(selectedType === item.type ? { ringColor: item.color } : {})
                  }}
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-slate-300">{item.name}</span>
                  <span className="text-sm font-bold ml-auto" style={{ color: item.color }}>{item.value}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Severity Donut */}
          <div>
            <h4 className="text-sm font-medium text-slate-400 mb-4 text-center">By Severity</h4>
            <div className="h-[250px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    animationDuration={800}
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 shadow-xl">
                            <p className="font-medium text-white">{data.name}</p>
                            <p className="text-sm text-slate-400">{data.value} findings</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Severity Legend */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              {severityData.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700/30"
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-slate-300">{item.name}</span>
                  <span className="text-sm font-bold ml-auto" style={{ color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-700">
          {[
            { label: 'Strengths', value: strengths, color: SWOT_COLORS.strength.primary, icon: '💪' },
            { label: 'Weaknesses', value: weaknesses, color: SWOT_COLORS.weakness.primary, icon: '⚠️' },
            { label: 'Opportunities', value: opportunities, color: SWOT_COLORS.opportunity.primary, icon: '🚀' },
            { label: 'Threats', value: threats, color: SWOT_COLORS.threat.primary, icon: '🔥' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
              <div className="text-xs text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Selected Findings Detail */}
        {showDetails && selectedType && selectedFindings.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-700">
            <h4 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
              <span>📋</span>
              {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Details
              <span className="bg-slate-700 px-2 py-0.5 rounded text-xs">{selectedFindings.length}</span>
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {selectedFindings.slice(0, 5).map((finding, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg border-l-4 bg-slate-900/50"
                  style={{ borderLeftColor: SWOT_COLORS[selectedType as keyof typeof SWOT_COLORS]?.primary }}
                >
                  <div className="flex items-center gap-2">
                    {finding.severity && (
                      <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: `${SEVERITY_COLORS[finding.severity as keyof typeof SEVERITY_COLORS]}20`,
                          color: SEVERITY_COLORS[finding.severity as keyof typeof SEVERITY_COLORS],
                        }}
                      >
                        {finding.severity}
                      </span>
                    )}
                    <span className="text-sm text-white font-medium">{finding.title || `Finding ${i + 1}`}</span>
                  </div>
                  {finding.description && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{finding.description}</p>
                  )}
                </div>
              ))}
              {selectedFindings.length > 5 && (
                <p className="text-xs text-slate-500 text-center py-2">
                  +{selectedFindings.length - 5} more findings
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Compact SWOT Summary bars
export function SWOTSummaryBars({ findings }: { findings: Finding[] }) {
  const strengths = findings.filter(f => f.type === 'strength').length;
  const weaknesses = findings.filter(f => f.type === 'weakness').length;
  const opportunities = findings.filter(f => f.type === 'opportunity').length;
  const threats = findings.filter(f => f.type === 'threat').length;
  const total = findings.length || 1;

  const data = [
    { label: 'Strengths', value: strengths, color: SWOT_COLORS.strength.primary, icon: '💪' },
    { label: 'Weaknesses', value: weaknesses, color: SWOT_COLORS.weakness.primary, icon: '⚠️' },
    { label: 'Opportunities', value: opportunities, color: SWOT_COLORS.opportunity.primary, icon: '🚀' },
    { label: 'Threats', value: threats, color: SWOT_COLORS.threat.primary, icon: '🔥' },
  ];

  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">🔍</span>
        <div>
          <h3 className="font-semibold text-white">Findings</h3>
          <p className="text-xs text-slate-400">{findings.length} total findings</p>
        </div>
        <div className="ml-auto text-3xl font-bold text-white">{findings.length}</div>
      </div>

      <div className="space-y-4">
        {data.map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span>{item.icon}</span>
                <span className="text-sm" style={{ color: item.color }}>{item.label}</span>
              </div>
              <span className="text-sm font-bold text-white">{item.value}</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
