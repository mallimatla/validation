'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';

interface AgentScore {
  agentId: string;
  agentName: string;
  score: number;
  confidence: number;
  icon?: string;
}

interface HorizontalBarChartProps {
  data: AgentScore[];
  title?: string;
  showConfidence?: boolean;
  height?: number;
}

const AGENT_COLORS: Record<string, string> = {
  marcus: '#10b981',
  sophia: '#6366f1',
  david: '#f59e0b',
  elena: '#ec4899',
  james: '#8b5cf6',
  rachel: '#14b8a6',
  omar: '#f97316',
  nora: '#06b6d4',
  victor: '#84cc16',
  victoria: '#a855f7',
  sentinel: '#ef4444',
  aria: '#3b82f6',
};

const AGENT_ICONS: Record<string, string> = {
  marcus: '📊',
  sophia: '💡',
  david: '🏆',
  elena: '🎯',
  james: '👥',
  rachel: '💰',
  omar: '⚙️',
  nora: '📢',
  victor: '💵',
  victoria: '🔮',
  sentinel: '🛡️',
  aria: '🤖',
};

export function HorizontalAgentChart({ data, title, height = 400 }: HorizontalBarChartProps) {
  const sortedData = [...data]
    .sort((a, b) => b.score - a.score)
    .map((d) => ({
      ...d,
      displayName: `${AGENT_ICONS[d.agentId] || '🔷'} ${d.agentName}`,
      color: AGENT_COLORS[d.agentId] || '#6b7280',
    }));

  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
      {title && (
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span>📊</span> {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={sortedData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            axisLine={{ stroke: '#475569' }}
            tickFormatter={(value) => `${value}%`}
          />
          <YAxis
            type="category"
            dataKey="displayName"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={100}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
              color: '#f8fafc',
            }}
            formatter={(value) => [`${value}%`, 'Score']}
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
          />
          <Bar
            dataKey="score"
            radius={[0, 8, 8, 0]}
            animationDuration={1000}
            animationEasing="ease-out"
          >
            {sortedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
            <LabelList
              dataKey="score"
              position="right"
              fill="#94a3b8"
              fontSize={12}
              formatter={(value) => `${value}%`}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Vertical bar chart for comparison
export function VerticalBarChart({
  data,
  title,
  height = 300,
}: {
  data: { label: string; value: number; color?: string }[];
  title?: string;
  height?: number;
}) {
  const getColor = (value: number): string => {
    if (value >= 70) return '#10b981';
    if (value >= 50) return '#eab308';
    return '#ef4444';
  };

  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
      {title && (
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={{ stroke: '#475569' }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
              color: '#f8fafc',
            }}
            formatter={(value) => [`${value}%`, 'Score']}
          />
          <Bar dataKey="value" radius={[8, 8, 0, 0]} animationDuration={800}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || getColor(entry.value)} />
            ))}
            <LabelList
              dataKey="value"
              position="top"
              fill="#94a3b8"
              fontSize={11}
              formatter={(value) => `${value}%`}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Grouped bar for comparing multiple metrics
export function GroupedBarChart({
  data,
  title,
  keys,
  colors,
  height = 300,
}: {
  data: any[];
  title?: string;
  keys: string[];
  colors: string[];
  height?: number;
}) {
  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
      {title && (
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={{ stroke: '#475569' }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            axisLine={false}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
              color: '#f8fafc',
            }}
          />
          {keys.map((key, index) => (
            <Bar
              key={key}
              dataKey={key}
              fill={colors[index]}
              radius={[4, 4, 0, 0]}
              animationDuration={800}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4">
        {keys.map((key, index) => (
          <div key={key} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: colors[index] }} />
            <span className="text-sm text-slate-400 capitalize">{key}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
