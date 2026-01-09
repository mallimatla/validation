'use client';

import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';

interface ScenarioCase {
  probability: number;
  multiplier?: number;
  description: string;
  keyAssumptions: string[];
  triggers?: string[];
  value?: number;
}

interface ScenarioData {
  bull: ScenarioCase;
  base: ScenarioCase;
  bear: ScenarioCase;
  expectedValue?: number;
}

interface ScenarioComparisonProps {
  data: ScenarioData;
  metric: string;
  baseValue: number;
  formatValue?: (value: number) => string;
  onDrillDown?: (scenario: 'bull' | 'base' | 'bear') => void;
}

function formatCurrency(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

export function ScenarioComparison({
  data,
  metric,
  baseValue,
  formatValue = formatCurrency,
  onDrillDown,
}: ScenarioComparisonProps) {
  const [selectedScenario, setSelectedScenario] = useState<'bull' | 'base' | 'bear' | null>(null);

  const scenarios = [
    {
      id: 'bull' as const,
      name: 'Bull',
      icon: '🐂',
      ...data.bull,
      value: data.bull.value || baseValue * (data.bull.multiplier || 1.5),
      color: '#10b981',
    },
    {
      id: 'base' as const,
      name: 'Base',
      icon: '📊',
      ...data.base,
      value: data.base.value || baseValue * (data.base.multiplier || 1),
      color: '#3b82f6',
    },
    {
      id: 'bear' as const,
      name: 'Bear',
      icon: '🐻',
      ...data.bear,
      value: data.bear.value || baseValue * (data.bear.multiplier || 0.5),
      color: '#ef4444',
    },
  ];

  const chartData = scenarios.map(s => ({
    ...s,
  }));

  // Calculate expected value
  const expectedValue = data.expectedValue ||
    scenarios.reduce((sum, s) => sum + s.value * s.probability, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-xl max-w-xs">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{item.icon}</span>
            <span className="text-white font-semibold">{item.name} Case</span>
            <span className="text-slate-400 text-sm">({(item.probability * 100).toFixed(0)}%)</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatValue(item.value)}</p>
          <p className="text-sm text-slate-400 mt-2">{item.description}</p>
          <p className="text-xs text-blue-400 mt-2">Click for details →</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-slate-400">{metric} Scenarios</h4>
        <div className="text-right">
          <span className="text-xs text-slate-500">Expected Value</span>
          <p className="text-lg font-bold text-white">{formatValue(expectedValue)}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 12 }}
            />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="value"
              radius={[4, 4, 0, 0]}
              onClick={(data) => { setSelectedScenario(data.id); onDrillDown?.(data.id); }}
              cursor="pointer"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  opacity={selectedScenario === entry.id ? 1 : 0.7}
                />
              ))}
              <LabelList
                dataKey="value"
                position="top"
                formatter={formatValue}
                style={{ fill: '#fff', fontSize: 11, fontWeight: 'bold' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Probability Breakdown */}
      <div className="flex items-center gap-1 h-2">
        {scenarios.map((scenario) => (
          <div
            key={scenario.id}
            className="h-full rounded transition-all cursor-pointer hover:opacity-80"
            style={{
              width: `${scenario.probability * 100}%`,
              backgroundColor: scenario.color,
              opacity: selectedScenario === scenario.id ? 1 : 0.6,
            }}
            onClick={() => { setSelectedScenario(scenario.id); onDrillDown?.(scenario.id); }}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs text-slate-500">
        {scenarios.map((s) => (
          <span key={s.id}>{s.icon} {(s.probability * 100).toFixed(0)}%</span>
        ))}
      </div>

      {/* Drill-Down Panel */}
      {selectedScenario && (
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">{scenarios.find(s => s.id === selectedScenario)?.icon}</span>
              <h4 className="font-semibold text-white">
                {scenarios.find(s => s.id === selectedScenario)?.name} Case Details
              </h4>
            </div>
            <button
              onClick={() => setSelectedScenario(null)}
              className="text-slate-400 hover:text-white text-sm"
            >
              ✕ Close
            </button>
          </div>
          {(() => {
            const scenario = scenarios.find(s => s.id === selectedScenario);
            if (!scenario) return null;
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-400 text-xs">Projected Value</p>
                    <p className="text-xl font-bold" style={{ color: scenario.color }}>
                      {formatValue(scenario.value)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">Probability</p>
                    <p className="text-xl font-bold text-white">
                      {(scenario.probability * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-slate-400 text-xs mb-1">Description</p>
                  <p className="text-sm text-slate-300">{scenario.description}</p>
                </div>

                <div>
                  <p className="text-slate-400 text-xs mb-2">Key Assumptions</p>
                  <ul className="space-y-1">
                    {scenario.keyAssumptions.map((assumption, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <span className="text-slate-500">•</span>
                        {assumption}
                      </li>
                    ))}
                  </ul>
                </div>

                {scenario.triggers && scenario.triggers.length > 0 && (
                  <div>
                    <p className="text-slate-400 text-xs mb-2">Trigger Events</p>
                    <ul className="space-y-1">
                      {scenario.triggers.map((trigger, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                          <span className="text-amber-500">⚡</span>
                          {trigger}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
