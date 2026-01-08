'use client';

import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';

interface AgentScore {
  agentId: string;
  name: string;
  score: number;
  confidence: number;
}

interface AgentRadarChartProps {
  agents: AgentScore[];
}

const AGENT_CONFIG: Record<string, { name: string; icon: string; color: string }> = {
  marcus: { name: 'Market', icon: '📊', color: '#3b82f6' },
  sophia: { name: 'Competition', icon: '🎯', color: '#8b5cf6' },
  david: { name: 'Financial', icon: '💰', color: '#10b981' },
  elena: { name: 'Customer', icon: '👥', color: '#f59e0b' },
  james: { name: 'Team', icon: '👔', color: '#ef4444' },
  rachel: { name: 'Legal/Risk', icon: '⚖️', color: '#ec4899' },
  omar: { name: 'Technology', icon: '⚙️', color: '#06b6d4' },
  nora: { name: 'Funding', icon: '🏦', color: '#84cc16' },
  victor: { name: 'Valuation', icon: '💎', color: '#a855f7' },
  victoria: { name: 'Synthesis', icon: '🔮', color: '#f97316' },
  sentinel: { name: 'Audit', icon: '🛡️', color: '#64748b' },
  aria: { name: 'Orchestrator', icon: '🎭', color: '#78716c' },
};

export function AgentRadarChart({ agents }: AgentRadarChartProps) {
  const data = agents.map(agent => ({
    subject: AGENT_CONFIG[agent.agentId]?.name || agent.name,
    score: agent.score,
    confidence: agent.confidence,
    fullMark: 100,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-lg">
          <p className="text-white font-semibold">{payload[0].payload.subject}</p>
          <p className="text-emerald-400">Score: {payload[0].value}</p>
          <p className="text-blue-400">Confidence: {payload[0].payload.confidence}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[350px]">
      <ResponsiveContainer>
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#475569" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: '#64748b', fontSize: 10 }}
            tickCount={5}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
