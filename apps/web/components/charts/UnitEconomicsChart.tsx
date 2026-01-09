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
  ReferenceLine,
} from 'recharts';

interface UnitEconomicsData {
  cac?: { low: number; mid: number; high: number; confidence: number };
  ltv?: { low: number; mid: number; high: number; confidence: number };
  ltvCacRatio?: { low: number; mid: number; high: number };
  grossMargin?: { low: number; mid: number; high: number };
  paybackMonths?: { low: number; mid: number; high: number };
  churnRate?: { low: number; mid: number; high: number };
  arpu?: { low: number; mid: number; high: number };
}

interface Benchmark {
  ltvCacRatio: { median: number; top25: number };
  grossMargin: { median: number; top25: number };
  churnRate: { median: number; top25: number };
  paybackMonths: { median: number; top25: number };
}

interface UnitEconomicsChartProps {
  data: UnitEconomicsData;
  benchmark?: Benchmark;
  onDrillDown?: (metric: string) => void;
}

function formatCurrency(value: number): string {
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function UnitEconomicsChart({ data, benchmark, onDrillDown }: UnitEconomicsChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  // LTV vs CAC comparison
  const ltvCacData = [
    {
      name: 'CAC',
      value: data.cac?.mid || 0,
      range: data.cac,
      color: '#ef4444',
      description: 'Customer Acquisition Cost',
    },
    {
      name: 'LTV',
      value: data.ltv?.mid || 0,
      range: data.ltv,
      color: '#10b981',
      description: 'Customer Lifetime Value',
    },
  ];

  const ltvCacRatio = data.ltvCacRatio?.mid || (data.ltv?.mid || 0) / (data.cac?.mid || 1);
  const isHealthy = ltvCacRatio >= 3;

  const metrics = [
    {
      id: 'ltvCacRatio',
      label: 'LTV:CAC Ratio',
      value: ltvCacRatio,
      format: (v: number) => `${v.toFixed(1)}:1`,
      benchmark: benchmark?.ltvCacRatio.median || 3,
      top25: benchmark?.ltvCacRatio.top25 || 5,
      color: ltvCacRatio >= 3 ? '#10b981' : ltvCacRatio >= 2 ? '#f59e0b' : '#ef4444',
      good: '> 3:1',
      description: 'Healthy ratio is 3:1 or higher',
    },
    {
      id: 'grossMargin',
      label: 'Gross Margin',
      value: data.grossMargin?.mid || 0.7,
      format: formatPercent,
      benchmark: benchmark?.grossMargin.median || 0.7,
      top25: benchmark?.grossMargin.top25 || 0.8,
      color: (data.grossMargin?.mid || 0.7) >= 0.7 ? '#10b981' : '#f59e0b',
      good: '> 70%',
      description: 'Revenue after direct costs',
    },
    {
      id: 'paybackMonths',
      label: 'CAC Payback',
      value: data.paybackMonths?.mid || 12,
      format: (v: number) => `${v.toFixed(0)} mo`,
      benchmark: benchmark?.paybackMonths.median || 12,
      top25: benchmark?.paybackMonths.top25 || 6,
      color: (data.paybackMonths?.mid || 12) <= 12 ? '#10b981' : '#f59e0b',
      good: '< 12 mo',
      description: 'Months to recover CAC',
      inverted: true,
    },
    {
      id: 'churnRate',
      label: 'Monthly Churn',
      value: data.churnRate?.mid || 0.05,
      format: formatPercent,
      benchmark: benchmark?.churnRate.median || 0.05,
      top25: benchmark?.churnRate.top25 || 0.02,
      color: (data.churnRate?.mid || 0.05) <= 0.05 ? '#10b981' : '#ef4444',
      good: '< 5%',
      description: 'Monthly customer churn rate',
      inverted: true,
    },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-xl">
          <p className="text-white font-semibold">{item.description}</p>
          <p className="text-2xl font-bold text-white mt-1">{formatCurrency(item.value)}</p>
          {item.range && (
            <div className="mt-2 text-xs text-slate-400">
              <p>Range: {formatCurrency(item.range.low)} - {formatCurrency(item.range.high)}</p>
              <p>Confidence: {(item.range.confidence * 100).toFixed(0)}%</p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* LTV vs CAC Bar Chart */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-slate-400">LTV vs CAC</h4>
          <span className={`text-sm font-bold ${isHealthy ? 'text-emerald-400' : 'text-amber-400'}`}>
            {ltvCacRatio.toFixed(1)}:1 ratio
          </span>
        </div>
        <div className="h-24">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={ltvCacData}
              margin={{ top: 0, right: 60, left: 40, bottom: 0 }}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="value"
                radius={[0, 4, 4, 0]}
                onClick={(data) => { setSelectedMetric(data.name.toLowerCase()); onDrillDown?.(data.name.toLowerCase()); }}
                cursor="pointer"
              >
                {ltvCacData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-2">
        {metrics.map((metric) => (
          <button
            key={metric.id}
            onClick={() => { setSelectedMetric(metric.id); onDrillDown?.(metric.id); }}
            className={`p-3 rounded-lg border text-left transition-all ${
              selectedMetric === metric.id
                ? 'border-white bg-slate-700/50'
                : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400">{metric.label}</span>
              <span className="text-xs text-slate-500">{metric.good}</span>
            </div>
            <p className="text-lg font-bold" style={{ color: metric.color }}>
              {metric.format(metric.value)}
            </p>
            {/* Progress bar vs benchmark */}
            <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  backgroundColor: metric.color,
                  width: `${Math.min(100, metric.inverted
                    ? (metric.benchmark / metric.value) * 100
                    : (metric.value / metric.top25) * 100
                  )}%`
                }}
              />
            </div>
          </button>
        ))}
      </div>

      {/* Drill-Down Panel */}
      {selectedMetric && (
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-white">
              {metrics.find(m => m.id === selectedMetric)?.label || selectedMetric} Analysis
            </h4>
            <button
              onClick={() => setSelectedMetric(null)}
              className="text-slate-400 hover:text-white text-sm"
            >
              ✕ Close
            </button>
          </div>
          {(() => {
            const metric = metrics.find(m => m.id === selectedMetric);
            if (!metric) return null;
            return (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-slate-400 text-xs">Your Value</p>
                  <p className="text-xl font-bold" style={{ color: metric.color }}>
                    {metric.format(metric.value)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Benchmark</p>
                  <p className="text-xl font-bold text-slate-300">
                    {metric.format(metric.benchmark)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Top 25%</p>
                  <p className="text-xl font-bold text-blue-400">
                    {metric.format(metric.top25)}
                  </p>
                </div>
                <div className="col-span-3">
                  <p className="text-slate-400 text-xs mb-1">Performance vs Industry</p>
                  <div className="h-3 bg-slate-700 rounded-full relative">
                    {/* Industry range indicator */}
                    <div className="absolute inset-y-0 left-1/4 right-1/4 bg-slate-600 rounded-full" />
                    {/* Top 25% indicator */}
                    <div
                      className="absolute inset-y-0 w-1 bg-blue-500 rounded-full"
                      style={{ left: '75%' }}
                    />
                    {/* Your position */}
                    <div
                      className="absolute w-3 h-3 rounded-full border-2 border-white"
                      style={{
                        backgroundColor: metric.color,
                        left: `${Math.min(95, Math.max(5, metric.inverted
                          ? 100 - (metric.value / (metric.benchmark * 2)) * 100
                          : (metric.value / metric.top25) * 75
                        ))}%`,
                        transform: 'translateX(-50%)',
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>Below avg</span>
                    <span>Average</span>
                    <span>Top 25%</span>
                  </div>
                </div>
                <div className="col-span-3">
                  <p className="text-slate-400 text-xs">What this means</p>
                  <p className="text-sm text-slate-300 mt-1">{metric.description}</p>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
