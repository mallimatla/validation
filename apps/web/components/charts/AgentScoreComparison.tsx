'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

interface AgentScore {
  agentId: string;
  name: string;
  score: number;
  confidence: number;
  icon: string;
}

interface AgentScoreComparisonProps {
  agents: AgentScore[];
  averageScore?: number;
}

const getBarColor = (score: number) => {
  if (score >= 70) return '#10b981';
  if (score >= 50) return '#eab308';
  return '#ef4444';
};

export function AgentScoreComparison({ agents, averageScore }: AgentScoreComparisonProps) {
  const sortedAgents = [...agents].sort((a, b) => b.score - a.score);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-lg">
          <p className="text-white font-semibold flex items-center gap-2">
            <span>{data.icon}</span> {data.name}
          </p>
          <p className="text-emerald-400 mt-1">Score: {data.score}/100</p>
          <p className="text-blue-400">Confidence: {data.confidence}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span>📊</span> Agent Score Breakdown
      </h3>
      <div className="h-[300px]">
        <ResponsiveContainer>
          <BarChart
            data={sortedAgents}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickLine={{ stroke: '#475569' }}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={55}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1e293b' }} />
            {averageScore && (
              <ReferenceLine
                x={averageScore}
                stroke="#f59e0b"
                strokeDasharray="5 5"
                label={{ value: 'Avg', fill: '#f59e0b', fontSize: 10, position: 'top' }}
              />
            )}
            <Bar dataKey="score" radius={[0, 4, 4, 0]} maxBarSize={25}>
              {sortedAgents.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.score)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-emerald-500"></div>
          <span className="text-slate-300">Strong (70+)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-yellow-500"></div>
          <span className="text-slate-300">Moderate (50-69)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-500"></div>
          <span className="text-slate-300">Weak (&lt;50)</span>
        </div>
      </div>
    </div>
  );
}
