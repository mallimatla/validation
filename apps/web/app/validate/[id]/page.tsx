'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { API_URL } from '../../../lib/config';

// Dynamically import chart components (client-side only for recharts)
const ScoreGauge = dynamic(() => import('../../../components/charts/ScoreGauge').then(mod => ({ default: mod.ScoreGauge })), { ssr: false });
const AgentRadarChart = dynamic(() => import('../../../components/charts/AgentRadarChart').then(mod => ({ default: mod.AgentRadarChart })), { ssr: false });
const AgentScoreComparison = dynamic(() => import('../../../components/charts/AgentScoreComparison').then(mod => ({ default: mod.AgentScoreComparison })), { ssr: false });
const RiskHeatmap = dynamic(() => import('../../../components/charts/RiskHeatmap').then(mod => ({ default: mod.RiskHeatmap })), { ssr: false });
const FindingsBreakdown = dynamic(() => import('../../../components/charts/FindingsBreakdown').then(mod => ({ default: mod.FindingsBreakdown })), { ssr: false });
const RecommendationTimeline = dynamic(() => import('../../../components/charts/RecommendationTimeline').then(mod => ({ default: mod.RecommendationTimeline })), { ssr: false });
const ConfidenceIndicator = dynamic(() => import('../../../components/charts/ConfidenceIndicator').then(mod => ({ default: mod.ConfidenceIndicator })), { ssr: false });
import { EvidenceCard } from '../../../components/charts/EvidenceCard';

// The 12 AI agents with their investor-grade status
const AGENTS = [
  { id: 'marcus', name: 'Marcus', role: 'Market Intel', icon: '📊', description: 'Validates market size, timing, and opportunity', investorGrade: true },
  { id: 'sophia', name: 'Sophia', role: 'Competition', icon: '🎯', description: 'Maps competitive landscape and differentiation', investorGrade: true },
  { id: 'david', name: 'David', role: 'Financial', icon: '💰', description: 'Validates unit economics and financial viability', investorGrade: true },
  { id: 'elena', name: 'Elena', role: 'Customer', icon: '👥', description: 'Analyzes customer data for product-market fit', investorGrade: false },
  { id: 'james', name: 'James', role: 'Team', icon: '👔', description: 'Evaluates team capability and execution risk', investorGrade: true },
  { id: 'rachel', name: 'Rachel', role: 'Legal/Risk', icon: '⚖️', description: 'Identifies legal and compliance risks', investorGrade: true },
  { id: 'omar', name: 'Omar', role: 'Technology', icon: '⚙️', description: 'Assesses technical feasibility and timelines', investorGrade: true },
  { id: 'nora', name: 'Nora', role: 'Funding', icon: '🏦', description: 'Maps funding landscape and comparable companies', investorGrade: true },
  { id: 'victor', name: 'Victor', role: 'Valuation', icon: '💎', description: 'Provides data-driven valuation analysis', investorGrade: true },
  { id: 'victoria', name: 'Victoria', role: 'Synthesis', icon: '🔮', description: 'Synthesizes all reports into final verdict', investorGrade: false },
  { id: 'sentinel', name: 'Sentinel', role: 'Trust/Audit', icon: '🛡️', description: 'Ensures platform integrity and accuracy', investorGrade: false },
  { id: 'aria', name: 'ARIA', role: 'Orchestrator', icon: '🎭', description: 'Manages validation workflow and coordination', investorGrade: false },
];

interface Finding {
  title: string;
  description: string;
  type: string;
  severity: string;
  evidence?: string[];
}

interface Risk {
  title: string;
  description: string;
  probability: string;
  impact: string;
  mitigations: string[];
}

interface Recommendation {
  title: string;
  description: string;
  priority: string;
  timeframe: string;
}

interface AgentReport {
  id: string;
  agentId: string;
  score: number;
  confidence: number;
  findings: Finding[];
  risks: Risk[];
  recommendations: Recommendation[];
}

interface ValidationData {
  id: string;
  title: string;
  description: string;
  status: string;
  overallScore: number | null;
  overallConfidence: number | null;
  recommendation: string | null;
  verdict: string | null;
  executiveSummary: string | null;
  agentReports: AgentReport[];
  createdAt: string;
  completedAt: string | null;
}

export default function ValidationProgressPage() {
  const params = useParams();
  const validationId = params.id as string;
  const { getToken, isSignedIn } = useAuth();

  const [validation, setValidation] = useState<ValidationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'agents' | 'risks' | 'actions'>('overview');

  // Fetch validation data
  const fetchValidation = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      if (isSignedIn) {
        const token = await getToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      const response = await fetch(`${API_URL}/api/v1/validations/${validationId}`, { headers });
      if (!response.ok) {
        throw new Error('Failed to fetch validation');
      }

      return await response.json();
    } catch (err) {
      throw err;
    }
  }, [validationId, isSignedIn, getToken]);

  // Initial load and polling
  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;

    const loadData = async () => {
      try {
        const data = await fetchValidation();
        setValidation(data);
        setIsLoading(false);

        // Poll while processing
        if (data.status === 'PROCESSING' || data.status === 'QUEUED') {
          pollInterval = setInterval(async () => {
            try {
              const updated = await fetchValidation();
              setValidation(updated);
              if (updated.status === 'COMPLETE' || updated.status === 'FAILED') {
                if (pollInterval) clearInterval(pollInterval);
              }
            } catch (e) {
              console.error('Polling error:', e);
            }
          }, 2000);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load validation');
        setIsLoading(false);
      }
    };

    loadData();

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [fetchValidation]);

  const getAgent = (id: string) => AGENTS.find(a => a.id === id);
  const getAgentReport = (id: string) => validation?.agentReports?.find(r => r.agentId === id);
  const getScoreColor = (s: number) => s >= 70 ? 'text-emerald-400' : s >= 50 ? 'text-yellow-400' : 'text-red-400';
  const getScoreBg = (s: number) => s >= 70 ? 'bg-emerald-500/20 border-emerald-500/50' : s >= 50 ? 'bg-yellow-500/20 border-yellow-500/50' : 'bg-red-500/20 border-red-500/50';

  // Calculate progress
  const completedCount = validation?.agentReports?.length || 0;
  const progressPercent = Math.round((completedCount / AGENTS.length) * 100);
  const isProcessing = validation?.status === 'PROCESSING' || validation?.status === 'QUEUED';

  // Aggregate data for charts
  const allFindings = validation?.agentReports?.flatMap(r => r.findings || []) || [];
  const allRisks = validation?.agentReports?.flatMap(r => r.risks || []) || [];
  const allRecommendations = validation?.agentReports?.flatMap(r => r.recommendations || []) || [];

  const agentScoresForChart = validation?.agentReports?.map(r => {
    const agent = getAgent(r.agentId);
    return {
      agentId: r.agentId,
      name: agent?.name || r.agentId,
      score: r.score,
      confidence: r.confidence,
      icon: agent?.icon || '📋',
    };
  }) || [];

  const downloadPDF = () => {
    if (!validation) return;

    let content = `STARTUP VERDICT REPORT\n`;
    content += `${'='.repeat(50)}\n\n`;
    content += `Title: ${validation.title}\n`;
    content += `Date: ${new Date(validation.createdAt).toLocaleDateString()}\n`;
    content += `Status: ${validation.status}\n\n`;

    content += `EXECUTIVE SUMMARY\n`;
    content += `${'-'.repeat(30)}\n`;
    content += `Overall Score: ${validation.overallScore}/100\n`;
    content += `Confidence: ${validation.overallConfidence}%\n`;
    content += `Verdict: ${validation.verdict}\n`;
    content += `Recommendation: ${validation.recommendation}\n\n`;
    content += `${validation.executiveSummary || ''}\n\n`;

    content += `AGENT REPORTS\n`;
    content += `${'='.repeat(50)}\n\n`;

    validation.agentReports?.forEach(report => {
      const agent = getAgent(report.agentId);
      content += `\n${agent?.name} - ${agent?.role}\n`;
      content += `${'-'.repeat(30)}\n`;
      content += `Score: ${report.score}/100 | Confidence: ${report.confidence}%\n\n`;

      if (report.findings?.length) {
        content += `Key Findings:\n`;
        report.findings.forEach((f, i) => {
          content += `  ${i + 1}. [${f.type.toUpperCase()}] ${f.title}\n`;
          content += `     ${f.description}\n`;
          if (f.evidence?.length) {
            content += `     Evidence: ${f.evidence.slice(0, 3).join('; ')}\n`;
          }
        });
        content += `\n`;
      }

      if (report.risks?.length) {
        content += `Risks Identified:\n`;
        report.risks.forEach((r, i) => {
          content += `  ${i + 1}. ${r.title} (${r.probability} probability, ${r.impact} impact)\n`;
          content += `     ${r.description}\n`;
          if (r.mitigations?.length) {
            content += `     Mitigations: ${r.mitigations.join('; ')}\n`;
          }
        });
        content += `\n`;
      }

      if (report.recommendations?.length) {
        content += `Recommendations:\n`;
        report.recommendations.forEach((rec, i) => {
          content += `  ${i + 1}. ${rec.title} [${rec.priority} priority, ${rec.timeframe}]\n`;
          content += `     ${rec.description}\n`;
        });
        content += `\n`;
      }
    });

    content += `\n${'='.repeat(50)}\n`;
    content += `Generated by Startup Verdict (startupverdict.com)\n`;
    content += `Report ID: ${validation.id}\n`;
    content += `Generated: ${new Date().toISOString()}\n`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `startup-verdict-report-${validation.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading validation results...</p>
        </div>
      </main>
    );
  }

  if (error || !validation) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Validation not found'}</p>
          <Link href="/dashboard" className="text-emerald-400 hover:underline">Back to Dashboard</Link>
        </div>
      </main>
    );
  }

  const selectedReport = expandedAgent ? getAgentReport(expandedAgent) : null;
  const selectedAgent = expandedAgent ? getAgent(expandedAgent) : null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-slate-400 hover:text-white">&larr; Dashboard</Link>
              <span className="text-slate-600">|</span>
              <Link href="/validate" className="text-slate-400 hover:text-white">+ New Validation</Link>
            </div>
            <button
              onClick={downloadPDF}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              📥 Download Report
            </button>
          </div>

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">{validation.title}</h1>
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <span>ID: {validationId.slice(0, 8)}...</span>
              <span>•</span>
              <span>Created: {new Date(validation.createdAt).toLocaleDateString()}</span>
              {validation.completedAt && (
                <>
                  <span>•</span>
                  <span>Completed: {new Date(validation.completedAt).toLocaleDateString()}</span>
                </>
              )}
            </div>
          </div>

          {/* Processing State */}
          {isProcessing && (
            <div className="bg-blue-900/20 border border-blue-500/50 rounded-xl p-6 mb-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Analyzing Your Startup</h2>
                  <p className="text-slate-400 text-sm">{completedCount} of {AGENTS.length} agents have completed their analysis</p>
                </div>
                <div className="ml-auto text-right">
                  <span className="text-4xl font-bold text-blue-400">{progressPercent}%</span>
                </div>
              </div>
              <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Executive Dashboard - Only show when complete */}
          {!isProcessing && (
            <>
              {/* Score Overview Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                {/* Main Score Gauge */}
                <div className="lg:col-span-1 bg-slate-800/50 rounded-xl border border-slate-700 p-6 flex flex-col items-center justify-center">
                  <ScoreGauge
                    score={validation.overallScore || 0}
                    size="lg"
                    showVerdict={true}
                    verdict={validation.verdict || undefined}
                  />
                  <div className="mt-4 w-full">
                    <ConfidenceIndicator
                      confidence={validation.overallConfidence || 0}
                      label="Analysis Confidence"
                    />
                  </div>
                </div>

                {/* Enhanced Quick Stats */}
                <div className="lg:col-span-3 grid grid-cols-2 gap-4">
                  {/* Findings Card */}
                  <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🔍</span>
                        <span className="text-slate-400 text-sm font-medium">Findings</span>
                      </div>
                      <div className="text-2xl font-bold text-white">{allFindings.length}</div>
                    </div>
                    {/* Breakdown bars */}
                    <div className="space-y-2">
                      {[
                        { label: 'Strengths', count: allFindings.filter(f => f.type === 'strength').length, color: 'bg-emerald-500', textColor: 'text-emerald-400' },
                        { label: 'Weaknesses', count: allFindings.filter(f => f.type === 'weakness').length, color: 'bg-red-500', textColor: 'text-red-400' },
                        { label: 'Opportunities', count: allFindings.filter(f => f.type === 'opportunity').length, color: 'bg-blue-500', textColor: 'text-blue-400' },
                        { label: 'Threats', count: allFindings.filter(f => f.type === 'threat').length, color: 'bg-orange-500', textColor: 'text-orange-400' },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-2">
                          <span className={`text-xs ${item.textColor} w-20`}>{item.label}</span>
                          <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${item.color} rounded-full transition-all`}
                              style={{ width: `${allFindings.length > 0 ? (item.count / allFindings.length) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-400 w-6 text-right">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Risks Card */}
                  <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">⚠️</span>
                        <span className="text-slate-400 text-sm font-medium">Risks</span>
                      </div>
                      <div className="text-2xl font-bold text-white">{allRisks.length}</div>
                    </div>
                    {/* Risk severity breakdown */}
                    <div className="space-y-2">
                      {[
                        { label: 'High', count: allRisks.filter(r => r.probability === 'high').length, color: 'bg-red-500', textColor: 'text-red-400', icon: '🔴' },
                        { label: 'Medium', count: allRisks.filter(r => r.probability === 'medium').length, color: 'bg-yellow-500', textColor: 'text-yellow-400', icon: '🟡' },
                        { label: 'Low', count: allRisks.filter(r => r.probability === 'low').length, color: 'bg-emerald-500', textColor: 'text-emerald-400', icon: '🟢' },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-2">
                          <span className="text-xs">{item.icon}</span>
                          <span className={`text-xs ${item.textColor} w-14`}>{item.label}</span>
                          <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${item.color} rounded-full transition-all`}
                              style={{ width: `${allRisks.length > 0 ? (item.count / allRisks.length) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-400 w-6 text-right">{item.count}</span>
                        </div>
                      ))}
                    </div>
                    {/* Risk alert */}
                    {allRisks.filter(r => r.probability === 'high').length > 0 && (
                      <div className="mt-3 pt-2 border-t border-slate-700">
                        <span className="text-xs text-red-400">
                          ⚡ {allRisks.filter(r => r.probability === 'high').length} high-priority risks need attention
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions Card */}
                  <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">📋</span>
                        <span className="text-slate-400 text-sm font-medium">Actions</span>
                      </div>
                      <div className="text-2xl font-bold text-white">{allRecommendations.length}</div>
                    </div>
                    {/* Priority breakdown */}
                    <div className="space-y-2">
                      {[
                        { label: 'Critical', count: allRecommendations.filter(r => r.priority === 'critical').length, color: 'bg-red-500', textColor: 'text-red-400' },
                        { label: 'High', count: allRecommendations.filter(r => r.priority === 'high').length, color: 'bg-orange-500', textColor: 'text-orange-400' },
                        { label: 'Medium', count: allRecommendations.filter(r => r.priority === 'medium').length, color: 'bg-yellow-500', textColor: 'text-yellow-400' },
                        { label: 'Low', count: allRecommendations.filter(r => r.priority === 'low').length, color: 'bg-slate-500', textColor: 'text-slate-400' },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-2">
                          <span className={`text-xs ${item.textColor} w-14`}>{item.label}</span>
                          <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${item.color} rounded-full transition-all`}
                              style={{ width: `${allRecommendations.length > 0 ? (item.count / allRecommendations.length) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-400 w-6 text-right">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Agents Card */}
                  <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🤖</span>
                        <span className="text-slate-400 text-sm font-medium">Agents</span>
                      </div>
                      <div className="text-2xl font-bold text-white">{completedCount}/{AGENTS.length}</div>
                    </div>
                    {/* Agent completion list */}
                    <div className="space-y-1.5">
                      {AGENTS.slice(0, 4).map((agent) => {
                        const result = validation.agentResults?.[agent.id];
                        const isComplete = !!result;
                        return (
                          <div key={agent.id} className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${isComplete ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                            <span className={`text-xs flex-1 truncate ${isComplete ? 'text-slate-300' : 'text-slate-500'}`}>
                              {agent.name}
                            </span>
                            <span className="text-xs">
                              {isComplete ? '✓' : '○'}
                            </span>
                          </div>
                        );
                      })}
                      {AGENTS.length > 4 && (
                        <div className="text-xs text-slate-500 pl-4">
                          +{AGENTS.length - 4} more agents
                        </div>
                      )}
                    </div>
                    {/* Overall progress */}
                    <div className="mt-3 pt-2 border-t border-slate-700">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{ width: `${(completedCount / AGENTS.length) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-emerald-400">{Math.round((completedCount / AGENTS.length) * 100)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Executive Summary */}
              {validation.executiveSummary && (
                <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/50 rounded-xl border border-slate-600 p-6 mb-8">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span>📝</span> Executive Summary
                  </h3>
                  <p className="text-slate-300 leading-relaxed">{validation.executiveSummary}</p>
                </div>
              )}

              {/* Tab Navigation */}
              <div className="flex gap-2 mb-6 border-b border-slate-700 overflow-x-auto">
                {[
                  { id: 'overview', label: 'Overview', icon: '📊' },
                  { id: 'agents', label: 'Agent Reports', icon: '🤖' },
                  { id: 'risks', label: 'Risk Analysis', icon: '⚠️' },
                  { id: 'actions', label: 'Action Plan', icon: '📋' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 -mb-[2px] whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'text-emerald-400 border-emerald-400'
                        : 'text-slate-400 border-transparent hover:text-white'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Agent Radar Chart */}
                  <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <span>🎯</span> Agent Score Radar
                    </h3>
                    {agentScoresForChart.length > 0 && (
                      <AgentRadarChart agents={agentScoresForChart} />
                    )}
                  </div>

                  {/* Findings Breakdown */}
                  {allFindings.length > 0 && (
                    <FindingsBreakdown findings={allFindings} />
                  )}

                  {/* Agent Score Comparison */}
                  {agentScoresForChart.length > 0 && (
                    <AgentScoreComparison
                      agents={agentScoresForChart}
                      averageScore={validation.overallScore || undefined}
                    />
                  )}

                  {/* Risk Heatmap */}
                  {allRisks.length > 0 && (
                    <RiskHeatmap risks={allRisks} />
                  )}
                </div>
              )}

              {activeTab === 'agents' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {AGENTS.map((agent) => {
                    const report = getAgentReport(agent.id);
                    if (!report) return null;

                    return (
                      <div
                        key={agent.id}
                        onClick={() => setExpandedAgent(agent.id)}
                        className={`rounded-xl p-5 border cursor-pointer transition-all hover:scale-[1.02] ${getScoreBg(report.score)}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{agent.icon}</span>
                            <div>
                              <h3 className="font-semibold text-lg">{agent.name}</h3>
                              <p className="text-sm text-slate-400">{agent.role}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`text-2xl font-bold ${getScoreColor(report.score)}`}>{report.score}</span>
                            <p className="text-xs text-slate-500">{report.confidence}% conf</p>
                          </div>
                        </div>

                        {/* Mini stats */}
                        <div className="flex gap-3 text-xs mt-3 pt-3 border-t border-slate-700/50">
                          <span className="text-slate-400">
                            <span className="text-emerald-400">{report.findings?.filter(f => f.type === 'strength').length || 0}</span> strengths
                          </span>
                          <span className="text-slate-400">
                            <span className="text-red-400">{report.findings?.filter(f => f.type === 'weakness').length || 0}</span> weaknesses
                          </span>
                          <span className="text-slate-400">
                            <span className="text-orange-400">{report.risks?.length || 0}</span> risks
                          </span>
                        </div>

                        <p className="text-xs text-emerald-400 mt-3">Click to view full report →</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTab === 'risks' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <RiskHeatmap risks={allRisks} />

                  <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <span>📋</span> All Risks ({allRisks.length})
                    </h3>
                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                      {allRisks
                        .sort((a, b) => {
                          const probOrder = { high: 0, medium: 1, low: 2 };
                          return (probOrder[a.probability as keyof typeof probOrder] || 2) - (probOrder[b.probability as keyof typeof probOrder] || 2);
                        })
                        .map((risk, idx) => (
                          <div key={idx} className="p-3 rounded-lg border border-orange-500/30 bg-orange-500/10">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                risk.probability === 'high' ? 'bg-red-500/30 text-red-300' :
                                risk.probability === 'medium' ? 'bg-yellow-500/30 text-yellow-300' :
                                'bg-green-500/30 text-green-300'
                              }`}>
                                {risk.probability}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                risk.impact === 'critical' ? 'bg-red-500/30 text-red-300' :
                                risk.impact === 'major' ? 'bg-orange-500/30 text-orange-300' :
                                'bg-yellow-500/30 text-yellow-300'
                              }`}>
                                {risk.impact}
                              </span>
                            </div>
                            <h4 className="font-medium text-white">{risk.title}</h4>
                            <p className="text-sm text-slate-400 mt-1">{risk.description}</p>
                            {risk.mitigations?.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-slate-700">
                                <p className="text-xs text-slate-500 mb-1">Mitigations:</p>
                                <ul className="text-xs text-slate-400 space-y-1">
                                  {risk.mitigations.map((m, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                      <span className="text-emerald-400">✓</span>
                                      <span>{m}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'actions' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <RecommendationTimeline recommendations={allRecommendations} />

                  <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <span>🎯</span> Priority Actions ({allRecommendations.length})
                    </h3>
                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                      {allRecommendations
                        .sort((a, b) => {
                          const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
                          return (priorityOrder[a.priority as keyof typeof priorityOrder] || 3) - (priorityOrder[b.priority as keyof typeof priorityOrder] || 3);
                        })
                        .map((rec, idx) => (
                          <div key={idx} className={`p-3 rounded-lg border ${
                            rec.priority === 'critical' ? 'border-red-500/30 bg-red-500/10' :
                            rec.priority === 'high' ? 'border-orange-500/30 bg-orange-500/10' :
                            rec.priority === 'medium' ? 'border-yellow-500/30 bg-yellow-500/10' :
                            'border-slate-500/30 bg-slate-500/10'
                          }`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                                rec.priority === 'critical' ? 'bg-red-500 text-white' :
                                rec.priority === 'high' ? 'bg-orange-500 text-white' :
                                rec.priority === 'medium' ? 'bg-yellow-500 text-black' :
                                'bg-slate-500 text-white'
                              }`}>
                                {rec.priority}
                              </span>
                              <span className="text-xs text-slate-400">{rec.timeframe}</span>
                            </div>
                            <h4 className="font-medium text-white">{rec.title}</h4>
                            <p className="text-sm text-slate-400 mt-1">{rec.description}</p>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Agent Detail Modal */}
          {expandedAgent && selectedReport && selectedAgent && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setExpandedAgent(null)}>
              <div className="bg-slate-800 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden border border-slate-700 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-3xl ${getScoreBg(selectedReport.score)}`}>
                      {selectedAgent.icon}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">{selectedAgent.name}</h3>
                      <p className="text-slate-400">{selectedAgent.role}</p>
                      <p className="text-slate-500 text-sm">{selectedAgent.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className={`text-4xl font-bold ${getScoreColor(selectedReport.score)}`}>
                        {selectedReport.score}
                      </div>
                      <p className="text-xs text-slate-400">{selectedReport.confidence}% confidence</p>
                    </div>
                    <button onClick={() => setExpandedAgent(null)} className="text-slate-400 hover:text-white text-3xl p-2 hover:bg-slate-700 rounded-lg transition-colors">
                      ×
                    </button>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                  {/* Key Findings */}
                  {selectedReport.findings?.length > 0 && (
                    <div className="mb-8">
                      <h4 className="text-xl font-semibold mb-4 flex items-center gap-2 text-emerald-400">
                        <span>🔍</span> Key Findings ({selectedReport.findings.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedReport.findings.map((finding, idx) => (
                          <EvidenceCard
                            key={idx}
                            title={finding.title}
                            description={finding.description}
                            type={finding.type}
                            severity={finding.severity}
                            evidence={finding.evidence}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Risks */}
                  {selectedReport.risks?.length > 0 && (
                    <div className="mb-8">
                      <h4 className="text-xl font-semibold mb-4 flex items-center gap-2 text-orange-400">
                        <span>⚠️</span> Risks Identified ({selectedReport.risks.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedReport.risks.map((risk, idx) => (
                          <div key={idx} className="p-4 rounded-xl border border-orange-500/30 bg-orange-500/10">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                risk.probability === 'high' ? 'bg-red-500 text-white' :
                                risk.probability === 'medium' ? 'bg-yellow-500 text-black' :
                                'bg-green-500 text-white'
                              }`}>
                                {risk.probability} probability
                              </span>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                risk.impact === 'critical' ? 'bg-red-500 text-white' :
                                risk.impact === 'major' ? 'bg-orange-500 text-white' :
                                'bg-yellow-500 text-black'
                              }`}>
                                {risk.impact} impact
                              </span>
                            </div>
                            <h5 className="font-semibold text-white text-lg mb-2">{risk.title}</h5>
                            <p className="text-slate-300 mb-3">{risk.description}</p>
                            {risk.mitigations?.length > 0 && (
                              <div className="pt-3 border-t border-orange-500/20">
                                <p className="text-xs text-orange-300 font-medium mb-2">Mitigations:</p>
                                <ul className="space-y-1">
                                  {risk.mitigations.map((m, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                      <span className="text-emerald-400 mt-0.5">✓</span>
                                      <span>{m}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {selectedReport.recommendations?.length > 0 && (
                    <div>
                      <h4 className="text-xl font-semibold mb-4 flex items-center gap-2 text-blue-400">
                        <span>📋</span> Recommendations ({selectedReport.recommendations.length})
                      </h4>
                      <div className="grid grid-cols-1 gap-3">
                        {selectedReport.recommendations.map((rec, idx) => (
                          <div key={idx} className={`p-4 rounded-xl border ${
                            rec.priority === 'critical' ? 'border-red-500/30 bg-red-500/10' :
                            rec.priority === 'high' ? 'border-orange-500/30 bg-orange-500/10' :
                            rec.priority === 'medium' ? 'border-yellow-500/30 bg-yellow-500/10' :
                            'border-blue-500/30 bg-blue-500/10'
                          }`}>
                            <div className="flex items-center gap-3 mb-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                rec.priority === 'critical' ? 'bg-red-500 text-white' :
                                rec.priority === 'high' ? 'bg-orange-500 text-white' :
                                rec.priority === 'medium' ? 'bg-yellow-500 text-black' :
                                'bg-blue-500 text-white'
                              }`}>
                                {rec.priority.toUpperCase()}
                              </span>
                              <span className="text-sm text-slate-400 flex items-center gap-1">
                                <span>⏱️</span> {rec.timeframe}
                              </span>
                            </div>
                            <h5 className="font-semibold text-white text-lg">{rec.title}</h5>
                            <p className="text-slate-300 mt-1">{rec.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
