'use client';

import { useState } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  LabelList,
} from 'recharts';

interface AgentReport {
  agentId: string;
  score: number;
  confidence: number;
  findings?: any[];
  risks?: any[];
  recommendations?: any[];
}

interface AgentGridProps {
  agents: AgentReport[];
  onAgentClick?: (agentId: string) => void;
}

const AGENT_CONFIG: Record<string, { name: string; role: string; icon: string; color: string }> = {
  marcus: { name: 'Marcus', role: 'Market Intel', icon: '📊', color: '#10b981' },
  sophia: { name: 'Sophia', role: 'Innovation', icon: '💡', color: '#8b5cf6' },
  david: { name: 'David', role: 'Competition', icon: '🏆', color: '#f59e0b' },
  elena: { name: 'Elena', role: 'Customer/PMF', icon: '🎯', color: '#ec4899' },
  james: { name: 'James', role: 'Team', icon: '👥', color: '#3b82f6' },
  rachel: { name: 'Rachel', role: 'Financial', icon: '💰', color: '#22c55e' },
  omar: { name: 'Omar', role: 'Technology', icon: '⚙️', color: '#6366f1' },
  nora: { name: 'Nora', role: 'GTM Strategy', icon: '📢', color: '#14b8a6' },
  victor: { name: 'Victor', role: 'Valuation', icon: '💵', color: '#84cc16' },
  victoria: { name: 'Victoria', role: 'Contrarian', icon: '🔮', color: '#a855f7' },
  sentinel: { name: 'Sentinel', role: 'Risk/Audit', icon: '🛡️', color: '#ef4444' },
  aria: { name: 'ARIA', role: 'Orchestrator', icon: '🤖', color: '#06b6d4' },
};

const getScoreColor = (score: number) => {
  if (score >= 7) return '#10b981';
  if (score >= 5) return '#eab308';
  return '#ef4444';
};

// Agent Performance Grid
export function AgentPerformanceGrid({ agents, onAgentClick }: AgentGridProps) {
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);

  // Normalize scores to 1-10 if they're in 0-100 range
  const normalizedAgents = agents.map(a => ({
    ...a,
    normalizedScore: a.score > 10 ? a.score / 10 : a.score,
  }));

  const avgScore = normalizedAgents.reduce((sum, a) => sum + a.normalizedScore, 0) / normalizedAgents.length;

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
              <span className="text-xl">🤖</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">AI Council Analysis</h3>
              <p className="text-sm text-slate-400">{agents.length} agents evaluated</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold" style={{ color: getScoreColor(avgScore) }}>
              {avgScore.toFixed(1)}
            </div>
            <div className="text-xs text-slate-400">Avg Score</div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {normalizedAgents.map((agent) => {
            const config = AGENT_CONFIG[agent.agentId] || {
              name: agent.agentId,
              role: 'Agent',
              icon: '🔷',
              color: '#64748b',
            };
            const scoreColor = getScoreColor(agent.normalizedScore);
            const isHovered = hoveredAgent === agent.agentId;

            return (
              <div
                key={agent.agentId}
                className={`relative p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                  isHovered
                    ? 'bg-slate-700/80 border-slate-500 scale-105 shadow-lg'
                    : 'bg-slate-900/50 border-slate-700/50 hover:border-slate-600'
                }`}
                onMouseEnter={() => setHoveredAgent(agent.agentId)}
                onMouseLeave={() => setHoveredAgent(null)}
                onClick={() => onAgentClick?.(agent.agentId)}
              >
                {/* Score indicator bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
                  style={{ backgroundColor: scoreColor }}
                />

                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                    style={{ backgroundColor: `${config.color}20` }}
                  >
                    {config.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white truncate">{config.name}</div>
                    <div className="text-xs text-slate-400 truncate">{config.role}</div>
                  </div>
                </div>

                {/* Score display */}
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-3xl font-bold" style={{ color: scoreColor }}>
                      {agent.normalizedScore.toFixed(1)}
                    </div>
                    <div className="text-xs text-slate-500">Score</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-blue-400">{agent.confidence}%</div>
                    <div className="text-xs text-slate-500">Confidence</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(agent.normalizedScore / 10) * 100}%`,
                      backgroundColor: scoreColor,
                    }}
                  />
                </div>

                {/* Hover details */}
                {isHovered && (
                  <div className="mt-3 pt-3 border-t border-slate-700 text-xs text-slate-400">
                    <div className="flex justify-between">
                      <span>Findings:</span>
                      <span className="text-white">{agent.findings?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Risks:</span>
                      <span className="text-white">{agent.risks?.length || 0}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Agent Comparison Bar Chart
export function AgentComparisonChart({ agents }: { agents: AgentReport[] }) {
  const chartData = agents
    .map((a) => {
      const config = AGENT_CONFIG[a.agentId];
      return {
        name: config?.name || a.agentId,
        score: a.score > 10 ? a.score / 10 : a.score,
        confidence: a.confidence,
        color: config?.color || '#64748b',
        icon: config?.icon || '🔷',
      };
    })
    .sort((a, b) => b.score - a.score);

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">📊</span>
        <div>
          <h3 className="font-semibold text-white">Agent Score Ranking</h3>
          <p className="text-xs text-slate-400">Comparison of all agent assessments</p>
        </div>
      </div>

      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 80, right: 40 }}>
            <XAxis type="number" domain={[0, 10]} tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              width={70}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '8px',
              }}
              formatter={(value) => [`${value}/10`, 'Score']}
            />
            <Bar dataKey="score" radius={[0, 8, 8, 0]} animationDuration={1000}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
              <LabelList
                dataKey="score"
                position="right"
                formatter={(value) => typeof value === 'number' ? value.toFixed(1) : String(value)}
                fill="#fff"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Enhanced Radar Chart
export function EnhancedAgentRadar({ agents }: { agents: AgentReport[] }) {
  const radarData = agents.map((a) => {
    const config = AGENT_CONFIG[a.agentId];
    return {
      agent: config?.name || a.agentId,
      score: a.score > 10 ? a.score / 10 : a.score,
      confidence: a.confidence / 10,
      fullMark: 10,
    };
  });

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">🎯</span>
        <div>
          <h3 className="font-semibold text-white">Agent Analysis Radar</h3>
          <p className="text-xs text-slate-400">Multi-dimensional assessment view</p>
        </div>
      </div>

      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData}>
            <PolarGrid stroke="#334155" />
            <PolarAngleAxis dataKey="agent" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <PolarRadiusAxis
              domain={[0, 10]}
              tick={{ fill: '#64748b', fontSize: 10 }}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '8px',
              }}
            />
            <Radar
              name="Score"
              dataKey="score"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.3}
              strokeWidth={2}
              animationDuration={1000}
            />
            <Radar
              name="Confidence"
              dataKey="confidence"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.2}
              strokeWidth={2}
              strokeDasharray="5 5"
              animationDuration={1200}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-emerald-500/30 border-2 border-emerald-500" />
          <span className="text-sm text-slate-400">Score</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-500/20 border-2 border-blue-500 border-dashed" />
          <span className="text-sm text-slate-400">Confidence</span>
        </div>
      </div>
    </div>
  );
}

// Agent Summary Strip
export function AgentSummaryStrip({ agents }: { agents: AgentReport[] }) {
  const topPerformers = [...agents]
    .sort((a, b) => (b.score > 10 ? b.score / 10 : b.score) - (a.score > 10 ? a.score / 10 : a.score))
    .slice(0, 3);

  const bottomPerformers = [...agents]
    .sort((a, b) => (a.score > 10 ? a.score / 10 : a.score) - (b.score > 10 ? b.score / 10 : b.score))
    .slice(0, 3);

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Top Performers */}
      <div className="bg-emerald-500/10 rounded-xl border border-emerald-500/30 p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🏆</span>
          <span className="text-sm font-medium text-emerald-400">Top Performers</span>
        </div>
        <div className="space-y-2">
          {topPerformers.map((agent, i) => {
            const config = AGENT_CONFIG[agent.agentId];
            const score = agent.score > 10 ? agent.score / 10 : agent.score;
            return (
              <div key={agent.agentId} className="flex items-center gap-2">
                <span className="text-xs text-slate-500">#{i + 1}</span>
                <span>{config?.icon || '🔷'}</span>
                <span className="text-sm text-white flex-1">{config?.name || agent.agentId}</span>
                <span className="text-sm font-bold text-emerald-400">{score.toFixed(1)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Areas for Improvement */}
      <div className="bg-amber-500/10 rounded-xl border border-amber-500/30 p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">⚠️</span>
          <span className="text-sm font-medium text-amber-400">Needs Attention</span>
        </div>
        <div className="space-y-2">
          {bottomPerformers.map((agent, i) => {
            const config = AGENT_CONFIG[agent.agentId];
            const score = agent.score > 10 ? agent.score / 10 : agent.score;
            return (
              <div key={agent.agentId} className="flex items-center gap-2">
                <span className="text-xs text-slate-500">#{agents.length - i}</span>
                <span>{config?.icon || '🔷'}</span>
                <span className="text-sm text-white flex-1">{config?.name || agent.agentId}</span>
                <span className="text-sm font-bold text-amber-400">{score.toFixed(1)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
