'use client';

import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';

interface ScenarioData {
  month: number;
  bull: number;
  base: number;
  bear: number;
}

interface RevenueProjectionsProps {
  projections?: {
    revenueMonth12?: { low: number; mid: number; high: number };
    revenueMonth24?: { low: number; mid: number; high: number };
    breakEvenMonths?: { low: number; mid: number; high: number };
  };
  currentRevenue?: number;
  onDrillDown?: (scenario: 'bull' | 'base' | 'bear') => void;
}

function formatCurrency(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

export function RevenueProjections({ projections, currentRevenue = 0, onDrillDown }: RevenueProjectionsProps) {
  const [selectedScenario, setSelectedScenario] = useState<'bull' | 'base' | 'bear' | null>(null);

  // Generate projection data for 24 months
  const generateProjectionData = (): ScenarioData[] => {
    const data: ScenarioData[] = [];
    const base12 = projections?.revenueMonth12?.mid || currentRevenue * 12;
    const base24 = projections?.revenueMonth24?.mid || base12 * 3;

    // Calculate monthly growth rates
    const baseGrowthMonthly = base12 > 0 ? Math.pow(base24 / base12, 1/12) : 1.1;
    const bullGrowthMonthly = baseGrowthMonthly * 1.15;
    const bearGrowthMonthly = baseGrowthMonthly * 0.7;

    for (let month = 0; month <= 24; month++) {
      const baseFactor = month <= 12 ? month / 12 : 1 + (month - 12) / 12;
      data.push({
        month,
        bull: currentRevenue + (base24 * 1.5 * baseFactor * Math.pow(bullGrowthMonthly, month / 24)),
        base: currentRevenue + (base24 * baseFactor * Math.pow(baseGrowthMonthly, month / 24)),
        bear: currentRevenue + (base24 * 0.5 * baseFactor * Math.pow(bearGrowthMonthly, month / 24)),
      });
    }
    return data;
  };

  const data = generateProjectionData();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-xl">
          <p className="text-white font-semibold mb-2">Month {label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-slate-400 capitalize">{entry.name}:</span>
              <span className="text-white font-medium">{formatCurrency(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const scenarios = [
    {
      id: 'bull' as const,
      name: 'Bull Case',
      color: '#10b981',
      probability: 25,
      revenue24: data[24]?.bull || 0,
      description: 'Optimistic scenario with faster adoption',
    },
    {
      id: 'base' as const,
      name: 'Base Case',
      color: '#3b82f6',
      probability: 50,
      revenue24: data[24]?.base || 0,
      description: 'Expected scenario based on current trajectory',
    },
    {
      id: 'bear' as const,
      name: 'Bear Case',
      color: '#ef4444',
      probability: 25,
      revenue24: data[24]?.bear || 0,
      description: 'Conservative scenario with slower growth',
    },
  ];

  const breakEvenMonth = projections?.breakEvenMonths?.mid || 18;

  return (
    <div className="space-y-4">
      {/* Main Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="bullGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="baseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="bearGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickFormatter={(value) => `M${value}`}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickFormatter={(value) => formatCurrency(value)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={36}
              formatter={(value) => <span className="text-slate-300 text-sm capitalize">{value}</span>}
            />
            {breakEvenMonth <= 24 && (
              <ReferenceLine
                x={breakEvenMonth}
                stroke="#f59e0b"
                strokeDasharray="3 3"
                label={{
                  value: 'Break-even',
                  position: 'top',
                  fill: '#f59e0b',
                  fontSize: 10,
                }}
              />
            )}
            <Area
              type="monotone"
              dataKey="bull"
              stroke="#10b981"
              fill="url(#bullGradient)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              onClick={() => { setSelectedScenario('bull'); onDrillDown?.('bull'); }}
              style={{ cursor: 'pointer' }}
            />
            <Area
              type="monotone"
              dataKey="base"
              stroke="#3b82f6"
              fill="url(#baseGradient)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              onClick={() => { setSelectedScenario('base'); onDrillDown?.('base'); }}
              style={{ cursor: 'pointer' }}
            />
            <Area
              type="monotone"
              dataKey="bear"
              stroke="#ef4444"
              fill="url(#bearGradient)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              onClick={() => { setSelectedScenario('bear'); onDrillDown?.('bear'); }}
              style={{ cursor: 'pointer' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Scenario Cards */}
      <div className="grid grid-cols-3 gap-2">
        {scenarios.map((scenario) => (
          <button
            key={scenario.id}
            onClick={() => { setSelectedScenario(scenario.id); onDrillDown?.(scenario.id); }}
            className={`p-3 rounded-lg border transition-all ${
              selectedScenario === scenario.id
                ? 'border-white bg-slate-700/50'
                : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: scenario.color }}
              />
              <span className="text-xs text-slate-400">{scenario.name}</span>
            </div>
            <p className="text-lg font-bold text-white">{formatCurrency(scenario.revenue24)}</p>
            <p className="text-xs text-slate-500">{scenario.probability}% probability</p>
          </button>
        ))}
      </div>

      {/* Drill-Down Panel */}
      {selectedScenario && (
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-white">
              {scenarios.find(s => s.id === selectedScenario)?.name} Analysis
            </h4>
            <button
              onClick={() => setSelectedScenario(null)}
              className="text-slate-400 hover:text-white text-sm"
            >
              ✕ Close
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-400 text-xs">24-Month Revenue</p>
              <p className="text-xl font-bold text-white">
                {formatCurrency(scenarios.find(s => s.id === selectedScenario)?.revenue24 || 0)}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Probability</p>
              <p className="text-xl font-bold text-white">
                {scenarios.find(s => s.id === selectedScenario)?.probability}%
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-slate-400 text-xs">Description</p>
              <p className="text-slate-300">
                {scenarios.find(s => s.id === selectedScenario)?.description}
              </p>
            </div>
            {projections?.breakEvenMonths && (
              <div className="col-span-2">
                <p className="text-slate-400 text-xs">Break-even Timeline</p>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-sm text-slate-500">
                    {projections.breakEvenMonths.low} mo
                  </span>
                  <div className="flex-1 h-2 bg-slate-700 rounded-full">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{
                        width: `${Math.min(100, (projections.breakEvenMonths.mid / 24) * 100)}%`
                      }}
                    />
                  </div>
                  <span className="text-sm text-slate-500">
                    {projections.breakEvenMonths.high} mo
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
