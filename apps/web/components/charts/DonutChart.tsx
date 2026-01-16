'use client';

import { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

interface DonutDataItem {
  name: string;
  value: number;
  color: string;
  icon?: string;
  [key: string]: string | number | undefined;
}

interface DonutChartProps {
  data: DonutDataItem[];
  title?: string;
  centerLabel?: string;
  centerValue?: string | number;
  size?: 'sm' | 'md' | 'lg';
  showLegend?: boolean;
}

export function DonutChart({
  data,
  title,
  centerLabel,
  centerValue,
  size = 'md',
  showLegend = true,
}: DonutChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const sizeConfig = {
    sm: { outer: 60, inner: 40, height: 150 },
    md: { outer: 80, inner: 55, height: 220 },
    lg: { outer: 110, inner: 75, height: 300 },
  };

  const config = sizeConfig[size];
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
      {title && (
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      )}
      <div className="flex items-center gap-6">
        <div className="relative" style={{ width: config.height, height: config.height }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={config.inner}
                outerRadius={config.outer}
                paddingAngle={3}
                dataKey="value"
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                animationDuration={800}
                animationEasing="ease-out"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke="transparent"
                    style={{
                      filter: activeIndex === index ? 'brightness(1.2)' : 'none',
                      transform: activeIndex === index ? 'scale(1.05)' : 'scale(1)',
                      transformOrigin: 'center',
                      transition: 'all 0.2s ease',
                    }}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  color: '#f8fafc',
                }}
                formatter={(value, name) => [
                  `${value} (${Math.round(((value as number) / total) * 100)}%)`,
                  name as string,
                ]}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Center content */}
          {(centerLabel || centerValue) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {centerValue && (
                <span className="text-2xl font-bold text-white">{centerValue}</span>
              )}
              {centerLabel && (
                <span className="text-xs text-slate-400">{centerLabel}</span>
              )}
            </div>
          )}
        </div>

        {/* Legend */}
        {showLegend && (
          <div className="flex-1 space-y-2">
            {data.map((item, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-2 rounded-lg transition-all ${
                  activeIndex === index ? 'bg-slate-700/50' : ''
                }`}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-slate-300">
                    {item.icon} {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{item.value}</span>
                  <span className="text-xs text-slate-500">
                    ({Math.round((item.value / total) * 100)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Findings breakdown preset
export function FindingsBreakdown({ findings }: { findings: any[] }) {
  const strengths = findings.filter((f) => f.type === 'strength').length;
  const weaknesses = findings.filter((f) => f.type === 'weakness').length;
  const neutral = findings.filter((f) => f.type === 'neutral').length;

  const data: DonutDataItem[] = [
    { name: 'Strengths', value: strengths, color: '#10b981', icon: '✓' },
    { name: 'Concerns', value: weaknesses, color: '#f59e0b', icon: '⚠' },
    { name: 'Neutral', value: neutral, color: '#6b7280', icon: '•' },
  ].filter((d) => d.value > 0);

  return (
    <DonutChart
      data={data}
      title="Findings Breakdown"
      centerValue={findings.length}
      centerLabel="Total Findings"
      size="md"
    />
  );
}

// Risk severity breakdown
export function RiskSeverityChart({ risks }: { risks: any[] }) {
  const critical = risks.filter((r) => r.impact === 'critical').length;
  const major = risks.filter((r) => r.impact === 'major').length;
  const moderate = risks.filter((r) => r.impact === 'moderate').length;
  const minor = risks.filter((r) => r.impact === 'minor').length;

  const data: DonutDataItem[] = [
    { name: 'Critical', value: critical, color: '#dc2626', icon: '🔴' },
    { name: 'Major', value: major, color: '#f97316', icon: '🟠' },
    { name: 'Moderate', value: moderate, color: '#eab308', icon: '🟡' },
    { name: 'Minor', value: minor, color: '#22c55e', icon: '🟢' },
  ].filter((d) => d.value > 0);

  return (
    <DonutChart
      data={data}
      title="Risk Severity Distribution"
      centerValue={risks.length}
      centerLabel="Total Risks"
      size="md"
    />
  );
}
