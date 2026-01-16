'use client';

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

interface AgentScore {
  agentId: string;
  agentName: string;
  score: number;
  confidence: number;
  role: string;
}

interface AgentRadarChartProps {
  agents: AgentScore[];
  showConfidence?: boolean;
}

const AGENT_COLORS: Record<string, string> = {
  marcus: '#10b981',   // emerald
  sophia: '#6366f1',   // indigo
  david: '#f59e0b',    // amber
  elena: '#ec4899',    // pink
  james: '#8b5cf6',    // violet
  rachel: '#14b8a6',   // teal
  omar: '#f97316',     // orange
  nora: '#06b6d4',     // cyan
  victor: '#84cc16',   // lime
  victoria: '#a855f7', // purple
  sentinel: '#ef4444', // red
  aria: '#3b82f6',     // blue
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

export function AgentRadarChart({ agents, showConfidence = true }: AgentRadarChartProps) {
  const data = agents.map((agent) => ({
    subject: `${AGENT_ICONS[agent.agentId] || '🔷'} ${agent.agentName}`,
    score: agent.score,
    confidence: agent.confidence,
    fullMark: 100,
  }));

  return (
    <div className="w-full h-[400px] bg-slate-800/50 rounded-xl p-4 border border-slate-700">
      <h3 className="text-lg font-semibold text-white mb-4 text-center">
        AI Council Agent Analysis
      </h3>
      <ResponsiveContainer width="100%" height="90%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#475569" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            tickLine={{ stroke: '#475569' }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: '#64748b', fontSize: 10 }}
            tickCount={5}
            axisLine={{ stroke: '#475569' }}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.4}
            strokeWidth={2}
          />
          {showConfidence && (
            <Radar
              name="Confidence"
              dataKey="confidence"
              stroke="#6366f1"
              fill="#6366f1"
              fillOpacity={0.2}
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          )}
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
              color: '#f8fafc',
            }}
            formatter={(value) => [
              `${value}%`,
              '',
            ]}
          />
          <Legend
            wrapperStyle={{ paddingTop: '10px' }}
            formatter={(value) => (
              <span style={{ color: '#94a3b8' }}>{value}</span>
            )}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Mini version for cards
export function AgentRadarMini({ agents }: { agents: AgentScore[] }) {
  const data = agents.slice(0, 6).map((agent) => ({
    subject: agent.agentName.substring(0, 3),
    score: agent.score,
    fullMark: 100,
  }));

  return (
    <div className="w-full h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#475569" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
          <Radar
            dataKey="score"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.5}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
