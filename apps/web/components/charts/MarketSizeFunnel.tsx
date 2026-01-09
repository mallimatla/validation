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

interface MarketSizeData {
  tam: number;
  tamRange?: { low: number; mid: number; high: number; confidence: number };
  sam: number;
  samRange?: { low: number; mid: number; high: number; confidence: number };
  som: number;
  somRange?: { low: number; mid: number; high: number; confidence: number };
  growthRate?: number;
}

interface MarketSizeFunnelProps {
  data: MarketSizeData;
  onDrillDown?: (segment: 'tam' | 'sam' | 'som') => void;
}

function formatCurrency(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

export function MarketSizeFunnel({ data, onDrillDown }: MarketSizeFunnelProps) {
  const [selectedSegment, setSelectedSegment] = useState<'tam' | 'sam' | 'som' | null>(null);

  const chartData = [
    {
      name: 'TAM',
      fullName: 'Total Addressable Market',
      value: data.tam,
      range: data.tamRange,
      color: '#3b82f6',
      description: 'Total market demand for the product/service',
    },
    {
      name: 'SAM',
      fullName: 'Serviceable Addressable Market',
      value: data.sam,
      range: data.samRange,
      color: '#8b5cf6',
      description: 'Segment of TAM you can target',
    },
    {
      name: 'SOM',
      fullName: 'Serviceable Obtainable Market',
      value: data.som,
      range: data.somRange,
      color: '#10b981',
      description: 'Realistic market capture (5-year)',
    },
  ];

  const handleClick = (entry: typeof chartData[0]) => {
    const segment = entry.name.toLowerCase() as 'tam' | 'sam' | 'som';
    setSelectedSegment(segment);
    onDrillDown?.(segment);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-xl">
          <p className="text-white font-semibold">{item.fullName}</p>
          <p className="text-2xl font-bold text-white mt-1">{formatCurrency(item.value)}</p>
          {item.range && (
            <div className="mt-2 text-xs text-slate-400">
              <p>Range: {formatCurrency(item.range.low)} - {formatCurrency(item.range.high)}</p>
              <p>Confidence: {(item.range.confidence * 100).toFixed(0)}%</p>
            </div>
          )}
          <p className="text-xs text-slate-400 mt-2">{item.description}</p>
          <p className="text-xs text-blue-400 mt-2">Click for details →</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Main Chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{ top: 10, right: 30, left: 60, bottom: 10 }}
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
              onClick={(data) => handleClick(data)}
              cursor="pointer"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  opacity={selectedSegment === entry.name.toLowerCase() ? 1 : 0.8}
                />
              ))}
              <LabelList
                dataKey="value"
                position="right"
                formatter={(value: number) => formatCurrency(value)}
                style={{ fill: '#fff', fontSize: 12, fontWeight: 'bold' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Drill-Down Panel */}
      {selectedSegment && (
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-white">
              {selectedSegment.toUpperCase()} Details
            </h4>
            <button
              onClick={() => setSelectedSegment(null)}
              className="text-slate-400 hover:text-white text-sm"
            >
              ✕ Close
            </button>
          </div>
          {(() => {
            const segment = chartData.find(d => d.name.toLowerCase() === selectedSegment);
            if (!segment) return null;
            return (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400 text-xs">Value</p>
                  <p className="text-xl font-bold text-white">{formatCurrency(segment.value)}</p>
                </div>
                {segment.range && (
                  <>
                    <div>
                      <p className="text-slate-400 text-xs">Confidence</p>
                      <p className="text-xl font-bold text-emerald-400">
                        {(segment.range.confidence * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-slate-400 text-xs mb-2">Confidence Range</p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-400">Low</span>
                        <div className="flex-1 h-2 bg-slate-700 rounded-full relative">
                          <div
                            className="absolute h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full"
                            style={{ width: '100%' }}
                          />
                          <div
                            className="absolute w-2 h-4 bg-white rounded -top-1"
                            style={{
                              left: `${((segment.value - segment.range.low) / (segment.range.high - segment.range.low)) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm text-slate-400">High</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>{formatCurrency(segment.range.low)}</span>
                        <span>{formatCurrency(segment.range.high)}</span>
                      </div>
                    </div>
                  </>
                )}
                <div className="col-span-2">
                  <p className="text-slate-400 text-xs">Description</p>
                  <p className="text-sm text-slate-300">{segment.description}</p>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Growth Rate */}
      {data.growthRate && (
        <div className="flex items-center justify-between bg-slate-800/30 rounded-lg px-4 py-2">
          <span className="text-slate-400 text-sm">Market CAGR</span>
          <span className={`text-lg font-bold ${data.growthRate > 0.15 ? 'text-emerald-400' : data.growthRate > 0.08 ? 'text-yellow-400' : 'text-red-400'}`}>
            {(data.growthRate * 100).toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
}
