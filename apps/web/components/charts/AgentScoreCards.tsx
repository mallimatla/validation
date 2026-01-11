'use client';

import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { ScoreBadge } from './ScoreGauge';

interface Finding {
  title: string;
  description: string;
  type: 'strength' | 'weakness' | 'neutral';
  severity: 'critical' | 'major' | 'minor' | 'info';
}

interface Recommendation {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  timeframe: string;
}

interface AgentReport {
  agentId: string;
  agentName: string;
  role: string;
  score: number;
  confidence: number;
  findings: Finding[];
  risks: any[];
  recommendations: Recommendation[];
  killSignals?: any[];
}

interface AgentScoreCardsProps {
  agents: AgentReport[];
  onAgentClick?: (agent: AgentReport) => void;
}

const AGENT_CONFIG: Record<string, { icon: string; color: string; gradient: string }> = {
  marcus: { icon: '📊', color: '#10b981', gradient: 'from-emerald-500 to-emerald-700' },
  sophia: { icon: '💡', color: '#6366f1', gradient: 'from-indigo-500 to-indigo-700' },
  david: { icon: '🏆', color: '#f59e0b', gradient: 'from-amber-500 to-amber-700' },
  elena: { icon: '🎯', color: '#ec4899', gradient: 'from-pink-500 to-pink-700' },
  james: { icon: '👥', color: '#8b5cf6', gradient: 'from-violet-500 to-violet-700' },
  rachel: { icon: '💰', color: '#14b8a6', gradient: 'from-teal-500 to-teal-700' },
  omar: { icon: '⚙️', color: '#f97316', gradient: 'from-orange-500 to-orange-700' },
  nora: { icon: '📢', color: '#06b6d4', gradient: 'from-cyan-500 to-cyan-700' },
  victor: { icon: '💵', color: '#84cc16', gradient: 'from-lime-500 to-lime-700' },
  victoria: { icon: '🔮', color: '#a855f7', gradient: 'from-purple-500 to-purple-700' },
  sentinel: { icon: '🛡️', color: '#ef4444', gradient: 'from-red-500 to-red-700' },
  aria: { icon: '🤖', color: '#3b82f6', gradient: 'from-blue-500 to-blue-700' },
};

const AGENT_ROLES: Record<string, string> = {
  marcus: 'Market Intelligence',
  sophia: 'Innovation & Disruption',
  david: 'Competitive Strategy',
  elena: 'Customer & PMF',
  james: 'Team & Talent',
  rachel: 'Financial Viability',
  omar: 'Technical Assessment',
  nora: 'GTM Strategy',
  victor: 'Valuation Expert',
  victoria: 'Contrarian Analysis',
  sentinel: 'Risk & Kill Signals',
  aria: 'AI Orchestrator',
};

export function AgentScoreCards({ agents, onAgentClick }: AgentScoreCardsProps) {
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  const handleAgentClick = (agent: AgentReport) => {
    setExpandedAgent(expandedAgent === agent.agentId ? null : agent.agentId);
    onAgentClick?.(agent);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {agents.map((agent) => {
        const config = AGENT_CONFIG[agent.agentId] || { icon: '🔷', color: '#6b7280', gradient: 'from-gray-500 to-gray-700' };
        const isExpanded = expandedAgent === agent.agentId;
        const strengths = agent.findings.filter((f) => f.type === 'strength').length;
        const weaknesses = agent.findings.filter((f) => f.type === 'weakness').length;
        const hasKillSignals = agent.killSignals && agent.killSignals.length > 0;

        return (
          <div
            key={agent.agentId}
            className={`bg-slate-800/70 rounded-xl border transition-all duration-300 cursor-pointer hover:scale-[1.02] ${
              isExpanded ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-700 hover:border-slate-600'
            } ${hasKillSignals ? 'ring-2 ring-red-500/30' : ''}`}
            onClick={() => handleAgentClick(agent)}
          >
            {/* Header with gradient */}
            <div className={`h-2 rounded-t-xl bg-gradient-to-r ${config.gradient}`} />

            <div className="p-4">
              {/* Agent info */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{config.icon}</span>
                  <div>
                    <h4 className="font-semibold text-white">{agent.agentName}</h4>
                    <p className="text-xs text-slate-400">
                      {AGENT_ROLES[agent.agentId] || agent.role}
                    </p>
                  </div>
                </div>
                <ScoreBadge score={agent.score} size="md" />
              </div>

              {/* Confidence bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Confidence</span>
                  <span>{agent.confidence}%</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${agent.confidence}%`,
                      backgroundColor: config.color,
                    }}
                  />
                </div>
              </div>

              {/* Quick stats */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-emerald-400">
                  <span>✓</span>
                  <span>{strengths} strengths</span>
                </div>
                <div className="flex items-center gap-1 text-amber-400">
                  <span>⚠</span>
                  <span>{weaknesses} concerns</span>
                </div>
                {hasKillSignals && (
                  <div className="flex items-center gap-1 text-red-400">
                    <span>🚨</span>
                    <span>Kill signal</span>
                  </div>
                )}
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-slate-700 space-y-4">
                  {/* Top findings */}
                  {agent.findings.slice(0, 3).map((finding, i) => (
                    <div
                      key={i}
                      className={`text-xs p-2 rounded ${
                        finding.type === 'strength'
                          ? 'bg-emerald-500/10 text-emerald-300'
                          : finding.type === 'weakness'
                          ? 'bg-red-500/10 text-red-300'
                          : 'bg-slate-700/50 text-slate-300'
                      }`}
                    >
                      <span className="font-medium">{finding.title}:</span>{' '}
                      {finding.description.slice(0, 100)}...
                    </div>
                  ))}

                  {/* Top recommendation */}
                  {agent.recommendations[0] && (
                    <div className="text-xs p-2 rounded bg-blue-500/10 text-blue-300">
                      <span className="font-medium">💡 {agent.recommendations[0].title}:</span>{' '}
                      {agent.recommendations[0].description.slice(0, 80)}...
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Horizontal bar chart comparison
export function AgentComparisonChart({ agents }: { agents: AgentReport[] }) {
  const data = agents
    .map((agent) => ({
      name: `${AGENT_CONFIG[agent.agentId]?.icon || '🔷'} ${agent.agentName}`,
      score: agent.score,
      confidence: agent.confidence,
      agentId: agent.agentId,
    }))
    .sort((a, b) => b.score - a.score);

  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
      <h3 className="text-lg font-semibold text-white mb-4">Agent Score Comparison</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} layout="vertical" margin={{ left: 100, right: 20 }}>
          <XAxis type="number" domain={[0, 100]} tick={{ fill: '#94a3b8' }} />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            width={100}
          />
          <Bar dataKey="score" radius={[0, 8, 8, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={AGENT_CONFIG[entry.agentId]?.color || '#6b7280'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Summary stat cards
export function AgentSummaryStats({ agents }: { agents: AgentReport[] }) {
  const avgScore = Math.round(agents.reduce((sum, a) => sum + a.score, 0) / agents.length);
  const avgConfidence = Math.round(agents.reduce((sum, a) => sum + a.confidence, 0) / agents.length);
  const totalStrengths = agents.reduce(
    (sum, a) => sum + a.findings.filter((f) => f.type === 'strength').length,
    0
  );
  const totalWeaknesses = agents.reduce(
    (sum, a) => sum + a.findings.filter((f) => f.type === 'weakness').length,
    0
  );
  const totalKillSignals = agents.reduce(
    (sum, a) => sum + (a.killSignals?.length || 0),
    0
  );

  const stats = [
    { label: 'Avg. Score', value: avgScore, suffix: '%', color: avgScore >= 70 ? 'emerald' : avgScore >= 50 ? 'amber' : 'red' },
    { label: 'Confidence', value: avgConfidence, suffix: '%', color: 'blue' },
    { label: 'Strengths', value: totalStrengths, color: 'emerald' },
    { label: 'Concerns', value: totalWeaknesses, color: 'amber' },
    { label: 'Kill Signals', value: totalKillSignals, color: totalKillSignals > 0 ? 'red' : 'slate' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 text-center"
        >
          <div className={`text-3xl font-bold text-${stat.color}-400`}>
            {stat.value}
            {stat.suffix}
          </div>
          <div className="text-sm text-slate-400 mt-1">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
