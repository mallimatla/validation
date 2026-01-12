'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
// jsPDF removed - using server-side PDF generation now
import dynamic from 'next/dynamic';

// Dynamic imports for chart components
const ScoreGauge = dynamic(() => import('../../../components/charts/ScoreGauge').then(m => m.ScoreGauge), { ssr: false });
const ScoreBadge = dynamic(() => import('../../../components/charts/ScoreGauge').then(m => m.ScoreBadge), { ssr: false });
const AgentRadarChart = dynamic(() => import('../../../components/charts/AgentRadarChart').then(m => m.AgentRadarChart), { ssr: false });
const HorizontalAgentChart = dynamic(() => import('../../../components/charts/BarCharts').then(m => m.HorizontalAgentChart), { ssr: false });
const FindingsBreakdown = dynamic(() => import('../../../components/charts/DonutChart').then(m => m.FindingsBreakdown), { ssr: false });
const RiskSeverityChart = dynamic(() => import('../../../components/charts/DonutChart').then(m => m.RiskSeverityChart), { ssr: false });
const RiskHeatmap = dynamic(() => import('../../../components/charts/RiskHeatmap').then(m => m.RiskHeatmap), { ssr: false });
const ProgressRing = dynamic(() => import('../../../components/charts/MetricCards').then(m => m.ProgressRing), { ssr: false });
const ProgressBar = dynamic(() => import('../../../components/charts/MetricCards').then(m => m.ProgressBar), { ssr: false });
const MetricCard = dynamic(() => import('../../../components/charts/MetricCards').then(m => m.MetricCard), { ssr: false });

// New enhanced chart components
const SWOTAnalysisChart = dynamic(() => import('../../../components/charts/SWOTChart').then(m => m.SWOTAnalysisChart), { ssr: false });
const SWOTSummaryBars = dynamic(() => import('../../../components/charts/SWOTChart').then(m => m.SWOTSummaryBars), { ssr: false });
const ScoreWithConfidence = dynamic(() => import('../../../components/charts/EnhancedStats').then(m => m.ScoreWithConfidence), { ssr: false });
const ActionsBreakdownCard = dynamic(() => import('../../../components/charts/EnhancedStats').then(m => m.ActionsBreakdownCard), { ssr: false });
const RisksBreakdownCard = dynamic(() => import('../../../components/charts/EnhancedStats').then(m => m.RisksBreakdownCard), { ssr: false });
const AgentPerformanceGrid = dynamic(() => import('../../../components/charts/AgentGrid').then(m => m.AgentPerformanceGrid), { ssr: false });
const EnhancedAgentRadar = dynamic(() => import('../../../components/charts/AgentGrid').then(m => m.EnhancedAgentRadar), { ssr: false });
const AgentSummaryStrip = dynamic(() => import('../../../components/charts/AgentGrid').then(m => m.AgentSummaryStrip), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://validation-production.up.railway.app';

// The 12 AI agents
const AGENTS = [
  { id: 'marcus', name: 'Marcus', role: 'Market Intel', icon: '📊', description: 'Validates market size, timing, and opportunity' },
  { id: 'sophia', name: 'Sophia', role: 'Innovation', icon: '💡', description: 'Analyzes disruption potential and innovation' },
  { id: 'david', name: 'David', role: 'Competition', icon: '🏆', description: 'Maps competitive landscape and differentiation' },
  { id: 'elena', name: 'Elena', role: 'Customer/PMF', icon: '🎯', description: 'Analyzes customer data for product-market fit' },
  { id: 'james', name: 'James', role: 'Team', icon: '👥', description: 'Evaluates team capability and execution risk' },
  { id: 'rachel', name: 'Rachel', role: 'Financial', icon: '💰', description: 'Validates unit economics and financial viability' },
  { id: 'omar', name: 'Omar', role: 'Technology', icon: '⚙️', description: 'Assesses technical feasibility and timelines' },
  { id: 'nora', name: 'Nora', role: 'GTM Strategy', icon: '📢', description: 'Evaluates go-to-market strategy' },
  { id: 'victor', name: 'Victor', role: 'Valuation', icon: '💵', description: 'Provides data-driven valuation analysis' },
  { id: 'victoria', name: 'Victoria', role: 'Contrarian', icon: '🔮', description: 'Provides contrarian perspective' },
  { id: 'sentinel', name: 'Sentinel', role: 'Risk/Audit', icon: '🛡️', description: 'Identifies kill signals and risks' },
  { id: 'aria', name: 'ARIA', role: 'Orchestrator', icon: '🤖', description: 'AI orchestration and synthesis' },
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

export default function ValidationResultsPage() {
  const params = useParams();
  const validationId = params.id as string;
  const { getToken, isSignedIn } = useAuth();

  const [validation, setValidation] = useState<ValidationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'agents' | 'risks' | 'recommendations'>('overview');
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showDownloadMenu && !target.closest('.download-menu-container')) {
        setShowDownloadMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDownloadMenu]);

  useEffect(() => {
    const fetchValidation = async () => {
      try {
        const headers: Record<string, string> = {};
        if (isSignedIn) {
          const token = await getToken();
          if (token) headers['Authorization'] = `Bearer ${token}`;
        }
        const response = await fetch(`${API_URL}/api/v1/validations/${validationId}`, { headers });
        if (!response.ok) throw new Error('Failed to fetch validation');
        const data = await response.json();
        setValidation(data);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load validation');
        setIsLoading(false);
      }
    };
    fetchValidation();
  }, [validationId, isSignedIn, getToken]);

  const getAgent = (id: string) => AGENTS.find(a => a.id === id);
  const getAgentReport = (id: string) => validation?.agentReports?.find(r => r.agentId === id);
  const getScoreColor = (s: number) => s >= 70 ? 'text-emerald-400' : s >= 50 ? 'text-yellow-400' : 'text-red-400';
  const getScoreBg = (s: number) => s >= 70 ? 'bg-emerald-500/20 border-emerald-500/50' : s >= 50 ? 'bg-yellow-500/20 border-yellow-500/50' : 'bg-red-500/20 border-red-500/50';

  // Aggregate data for charts
  const allFindings = validation?.agentReports?.flatMap(r => r.findings || []) || [];
  const rawRisks = validation?.agentReports?.flatMap(r => r.risks || []) || [];

  // Transform risks to have proper types for RiskHeatmap
  const allRisks = rawRisks.map(risk => ({
    ...risk,
    probability: (['low', 'medium', 'high'].includes(risk.probability?.toLowerCase())
      ? risk.probability.toLowerCase()
      : 'medium') as 'low' | 'medium' | 'high',
    impact: (['minor', 'moderate', 'major', 'critical'].includes(risk.impact?.toLowerCase())
      ? risk.impact.toLowerCase()
      : 'moderate') as 'minor' | 'moderate' | 'major' | 'critical',
  }));

  const allRecommendations = validation?.agentReports?.flatMap(r => r.recommendations || []) || [];

  const agentScores = validation?.agentReports?.map(r => {
    const agent = getAgent(r.agentId);
    return {
      agentId: r.agentId,
      agentName: agent?.name || r.agentId,
      score: r.score,
      confidence: r.confidence,
      role: agent?.role || '',
    };
  }) || [];

  const strengths = allFindings.filter(f => f.type === 'strength').length;
  const weaknesses = allFindings.filter(f => f.type === 'weakness').length;

  // Download PDF from server (professional quality)
  const downloadPDF = async (template: string = 'executive') => {
    if (!validation) return;
    setIsDownloading(true);
    setShowDownloadMenu(false);

    try {
      const token = await getToken();
      const response = await fetch(
        `${API_URL}/api/v1/pdf/validation/${validationId}?template=${template}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error('Failed to generate PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `validation-report-${validationId}-${template}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('PDF download error:', err);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Download PPTX from server
  const downloadPPTX = async (template: string = 'marketing') => {
    if (!validation) return;
    setIsDownloading(true);
    setShowDownloadMenu(false);

    try {
      const token = await getToken();
      const response = await fetch(
        `${API_URL}/api/v1/pptx/validation/${validationId}?template=${template}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error('Failed to generate PPTX');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `validation-report-${validationId}-${template}.pptx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('PPTX download error:', err);
      alert('Failed to download PPTX. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-emerald-500 mx-auto mb-6"></div>
          <p className="text-slate-400 text-lg">Loading validation results...</p>
        </div>
      </main>
    );
  }

  if (error || !validation) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-xl mb-4">{error || 'Validation not found'}</p>
          <Link href="/dashboard" className="text-emerald-400 hover:underline">Return to Dashboard</Link>
        </div>
      </main>
    );
  }

  const selectedReport = expandedAgent ? getAgentReport(expandedAgent) : null;
  const selectedAgent = expandedAgent ? getAgent(expandedAgent) : null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors">← Dashboard</Link>
            <span className="text-slate-600">|</span>
            <Link href="/validate" className="text-slate-400 hover:text-white transition-colors">+ New Validation</Link>
          </div>
          <div className="relative download-menu-container">
            <button
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
              disabled={isDownloading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              {isDownloading ? 'Generating...' : 'Download Report ▼'}
            </button>
            {showDownloadMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 z-50 overflow-hidden">
                {/* PDF Section */}
                <div className="px-3 py-2 bg-slate-700/50 border-b border-slate-700">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">PDF Reports</span>
                </div>
                <button onClick={() => downloadPDF('executive')} className="w-full text-left px-4 py-3 hover:bg-slate-700/50 flex items-start gap-3 border-b border-slate-700/50">
                  <span className="text-lg">📄</span>
                  <div>
                    <span className="font-medium text-white block">Executive Summary</span>
                    <span className="text-xs text-slate-400">Perfect for WhatsApp sharing</span>
                  </div>
                </button>
                <button onClick={() => downloadPDF('detailed')} className="w-full text-left px-4 py-3 hover:bg-slate-700/50 flex items-start gap-3 border-b border-slate-700/50">
                  <span className="text-lg">📋</span>
                  <div>
                    <span className="font-medium text-white block">Full Detailed Report</span>
                    <span className="text-xs text-slate-400">Complete analysis with all agents</span>
                  </div>
                </button>
                <button onClick={() => downloadPDF('summary')} className="w-full text-left px-4 py-3 hover:bg-slate-700/50 flex items-start gap-3 border-b border-slate-700">
                  <span className="text-lg">📊</span>
                  <div>
                    <span className="font-medium text-white block">One-Page Summary</span>
                    <span className="text-xs text-slate-400">Quick overview with metrics</span>
                  </div>
                </button>

                {/* PPTX Section */}
                <div className="px-3 py-2 bg-slate-700/50 border-b border-slate-700">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">PowerPoint Presentations</span>
                </div>
                <button onClick={() => downloadPPTX('marketing')} className="w-full text-left px-4 py-3 hover:bg-slate-700/50 flex items-start gap-3 border-b border-slate-700/50">
                  <span className="text-lg">🎯</span>
                  <div>
                    <span className="font-medium text-white block">Marketing Deck</span>
                    <span className="text-xs text-slate-400">High-impact visuals for sharing</span>
                  </div>
                </button>
                <button onClick={() => downloadPPTX('investor')} className="w-full text-left px-4 py-3 hover:bg-slate-700/50 flex items-start gap-3 border-b border-slate-700/50">
                  <span className="text-lg">💼</span>
                  <div>
                    <span className="font-medium text-white block">Investor Pitch</span>
                    <span className="text-xs text-slate-400">Professional pitch deck format</span>
                  </div>
                </button>
                <button onClick={() => downloadPPTX('professional')} className="w-full text-left px-4 py-3 hover:bg-slate-700/50 flex items-start gap-3 border-b border-slate-700/50">
                  <span className="text-lg">🏢</span>
                  <div>
                    <span className="font-medium text-white block">Corporate Style</span>
                    <span className="text-xs text-slate-400">Professional dark blue theme</span>
                  </div>
                </button>
                <button onClick={() => downloadPPTX('modern')} className="w-full text-left px-4 py-3 hover:bg-slate-700/50 flex items-start gap-3 rounded-b-xl">
                  <span className="text-lg">✨</span>
                  <div>
                    <span className="font-medium text-white block">Modern Gradient</span>
                    <span className="text-xs text-slate-400">Vibrant contemporary design</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Title Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{validation.title}</h1>
          <p className="text-slate-400 text-sm">{validation.description}</p>
          <p className="text-slate-500 text-xs mt-2">Created: {new Date(validation.createdAt).toLocaleDateString()}</p>
        </div>

        {/* Main Score Section with Gauge */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Large Score Gauge */}
          <div className="lg:col-span-1 bg-slate-800/50 rounded-xl p-6 border border-slate-700 flex flex-col items-center justify-center">
            <ScoreGauge
              score={validation.overallScore || 0}
              label="Overall Score"
              size="lg"
              verdict={validation.verdict as any}
              showVerdict={true}
            />
          </div>

          {/* Key Metrics */}
          <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              label="Confidence"
              value={validation.overallConfidence || 0}
              suffix="%"
              icon="🎯"
              color="blue"
              size="md"
            />
            <MetricCard
              label="Strengths"
              value={strengths}
              icon="✓"
              color="emerald"
              size="md"
            />
            <MetricCard
              label="Concerns"
              value={weaknesses}
              icon="⚠"
              color="amber"
              size="md"
            />
            <MetricCard
              label="Risks"
              value={allRisks.length}
              icon="🔥"
              color={allRisks.length > 5 ? 'red' : 'slate'}
              size="md"
            />

            {/* Executive Summary */}
            <div className="col-span-2 md:col-span-4 bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <h3 className="text-sm font-medium text-slate-400 mb-2">Executive Summary</h3>
              <p className="text-slate-200 text-sm leading-relaxed">
                {validation.executiveSummary || 'Analysis complete. Review detailed findings below.'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mb-6 bg-slate-800/30 p-1 rounded-lg w-fit">
          {(['overview', 'agents', 'risks', 'recommendations'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                activeTab === tab ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Top Row - Score & Key Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Enhanced Score Display */}
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 flex flex-col items-center justify-center">
                <ScoreWithConfidence
                  score={validation.overallScore || 0}
                  confidence={validation.overallConfidence || 0}
                  verdict={validation.verdict || undefined}
                  size="lg"
                />
              </div>

              {/* SWOT Summary */}
              {allFindings.length > 0 && (
                <SWOTSummaryBars findings={allFindings} />
              )}

              {/* Actions & Risks Summary */}
              <div className="space-y-4">
                {allRecommendations.length > 0 && (
                  <ActionsBreakdownCard actions={allRecommendations} />
                )}
              </div>
            </div>

            {/* Second Row - Agent Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Enhanced Radar Chart */}
              {validation?.agentReports && validation.agentReports.length > 0 && (
                <EnhancedAgentRadar agents={validation.agentReports} />
              )}

              {/* Agent Bar Comparison */}
              {agentScores.length > 0 && (
                <HorizontalAgentChart data={agentScores} title="Agent Score Ranking" height={400} />
              )}
            </div>

            {/* Third Row - SWOT & Risks */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Full SWOT Analysis */}
              {allFindings.length > 0 && (
                <SWOTAnalysisChart findings={allFindings} showDetails={true} />
              )}

              {/* Risks Breakdown */}
              <div className="space-y-6">
                {allRisks.length > 0 && (
                  <RisksBreakdownCard risks={allRisks} />
                )}

                {/* Risk Heatmap */}
                {allRisks.length > 0 && (
                  <RiskHeatmap risks={allRisks} />
                )}
              </div>
            </div>

            {/* Agent Summary Strip */}
            {validation?.agentReports && validation.agentReports.length > 0 && (
              <AgentSummaryStrip agents={validation.agentReports} />
            )}
          </div>
        )}

        {activeTab === 'agents' && (
          <div className="space-y-6">
            {/* Agent Grid with Progress Rings */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {AGENTS.map(agent => {
                const report = getAgentReport(agent.id);
                return (
                  <div
                    key={agent.id}
                    onClick={() => report && setExpandedAgent(agent.id)}
                    className={`bg-slate-800/50 rounded-xl p-4 border transition-all cursor-pointer hover:border-emerald-500/50 ${
                      report ? 'border-slate-700' : 'border-slate-700/50 opacity-50'
                    }`}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="mb-2">
                        {report ? (
                          <ProgressRing
                            progress={report.score}
                            size={80}
                            strokeWidth={6}
                            color={report.score >= 70 ? '#10b981' : report.score >= 50 ? '#eab308' : '#ef4444'}
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-slate-700/50 flex items-center justify-center text-3xl">
                            {agent.icon}
                          </div>
                        )}
                      </div>
                      <h4 className="font-semibold text-sm">{agent.name}</h4>
                      <p className="text-xs text-slate-400">{agent.role}</p>
                      {report && (
                        <p className="text-xs text-slate-500 mt-1">{report.confidence}% conf</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Agent Details Table */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
              <div className="p-4 border-b border-slate-700">
                <h3 className="text-lg font-semibold">Agent Analysis Details</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-900/50">
                    <tr>
                      <th className="text-left p-4 text-sm text-slate-400">Agent</th>
                      <th className="text-center p-4 text-sm text-slate-400">Score</th>
                      <th className="text-center p-4 text-sm text-slate-400">Confidence</th>
                      <th className="text-center p-4 text-sm text-slate-400">Findings</th>
                      <th className="text-center p-4 text-sm text-slate-400">Risks</th>
                      <th className="text-center p-4 text-sm text-slate-400">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {AGENTS.map(agent => {
                      const report = getAgentReport(agent.id);
                      if (!report) return null;
                      return (
                        <tr key={agent.id} className="hover:bg-slate-700/30">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{agent.icon}</span>
                              <div>
                                <p className="font-medium">{agent.name}</p>
                                <p className="text-xs text-slate-400">{agent.role}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <ScoreBadge score={report.score} size="sm" />
                          </td>
                          <td className="p-4 text-center">
                            <span className="text-slate-300">{report.confidence}%</span>
                          </td>
                          <td className="p-4 text-center">
                            <span className="text-emerald-400">{report.findings?.filter(f => f.type === 'strength').length || 0}</span>
                            <span className="text-slate-500 mx-1">/</span>
                            <span className="text-amber-400">{report.findings?.filter(f => f.type === 'weakness').length || 0}</span>
                          </td>
                          <td className="p-4 text-center">
                            <span className={report.risks?.length > 2 ? 'text-red-400' : 'text-slate-400'}>
                              {report.risks?.length || 0}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => setExpandedAgent(agent.id)}
                              className="text-emerald-400 hover:text-emerald-300 text-sm"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'risks' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {allRisks.length > 0 && <RiskSeverityChart risks={allRisks} />}
              <div className="lg:col-span-2">
                {allRisks.length > 0 && <RiskHeatmap risks={allRisks} />}
              </div>
            </div>

            {/* Risk Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allRisks.map((risk, i) => (
                <div key={i} className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-white">{risk.title}</h4>
                    <div className="flex gap-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        risk.probability === 'high' ? 'bg-red-500/20 text-red-400' :
                        risk.probability === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>
                        {risk.probability}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        risk.impact === 'critical' ? 'bg-red-500/20 text-red-400' :
                        risk.impact === 'major' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>
                        {risk.impact}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-300 mb-3">{risk.description}</p>
                  {risk.mitigations?.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Mitigations:</p>
                      <ul className="text-xs text-slate-300 space-y-1">
                        {risk.mitigations.map((m, j) => (
                          <li key={j} className="flex items-start gap-2">
                            <span className="text-emerald-400">→</span> {m}
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

        {activeTab === 'recommendations' && (
          <div className="space-y-4">
            {/* Priority sections */}
            {['high', 'medium', 'low'].map(priority => {
              const recs = allRecommendations.filter(r => r.priority === priority);
              if (recs.length === 0) return null;
              return (
                <div key={priority}>
                  <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                    priority === 'high' ? 'text-red-400' :
                    priority === 'medium' ? 'text-amber-400' : 'text-slate-400'
                  }`}>
                    <span>{priority === 'high' ? '🔴' : priority === 'medium' ? '🟡' : '🟢'}</span>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recs.map((rec, i) => (
                      <div key={i} className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-white">{rec.title}</h4>
                          <span className="text-xs text-slate-400">{rec.timeframe}</span>
                        </div>
                        <p className="text-sm text-slate-300">{rec.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Agent Detail Modal */}
        {expandedAgent && selectedReport && selectedAgent && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setExpandedAgent(null)}>
            <div className="bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-700" onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-3xl">
                    {selectedAgent.icon}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{selectedAgent.name}</h3>
                    <p className="text-slate-400">{selectedAgent.role} • {selectedAgent.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <ScoreBadge score={selectedReport.score} size="lg" />
                  <button onClick={() => setExpandedAgent(null)} className="text-slate-400 hover:text-white text-3xl">×</button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Score & Confidence */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900/50 rounded-xl p-4 text-center">
                    <ProgressRing progress={selectedReport.score} size={100} strokeWidth={8} />
                    <p className="text-sm text-slate-400 mt-2">Analysis Score</p>
                  </div>
                  <div className="bg-slate-900/50 rounded-xl p-4 text-center">
                    <ProgressRing progress={selectedReport.confidence} size={100} strokeWidth={8} color="#6366f1" />
                    <p className="text-sm text-slate-400 mt-2">Confidence Level</p>
                  </div>
                </div>

                {/* Findings */}
                {selectedReport.findings?.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold mb-4 text-emerald-400">Key Findings ({selectedReport.findings.length})</h4>
                    <div className="space-y-3">
                      {selectedReport.findings.map((finding, idx) => (
                        <div key={idx} className={`p-4 rounded-xl border ${
                          finding.type === 'strength' ? 'border-emerald-500/30 bg-emerald-500/10' :
                          finding.type === 'weakness' ? 'border-amber-500/30 bg-amber-500/10' :
                          'border-slate-700 bg-slate-900/30'
                        }`}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs px-2 py-1 rounded capitalize ${
                              finding.type === 'strength' ? 'bg-emerald-600/30 text-emerald-300' :
                              finding.type === 'weakness' ? 'bg-amber-600/30 text-amber-300' :
                              'bg-slate-600/30 text-slate-300'
                            }`}>{finding.type}</span>
                            <span className="text-xs px-2 py-1 rounded bg-slate-600/30 text-slate-300">{finding.severity}</span>
                          </div>
                          <h5 className="font-semibold mb-1">{finding.title}</h5>
                          <p className="text-sm text-slate-300">{finding.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Risks */}
                {selectedReport.risks?.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold mb-4 text-orange-400">Risks Identified ({selectedReport.risks.length})</h4>
                    <div className="space-y-3">
                      {selectedReport.risks.map((risk, idx) => (
                        <div key={idx} className="p-4 rounded-xl border border-orange-500/30 bg-orange-500/10">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs px-2 py-1 rounded bg-orange-600/30 text-orange-300">{risk.probability} prob</span>
                            <span className="text-xs px-2 py-1 rounded bg-orange-600/30 text-orange-300">{risk.impact} impact</span>
                          </div>
                          <h5 className="font-semibold mb-1">{risk.title}</h5>
                          <p className="text-sm text-slate-300 mb-2">{risk.description}</p>
                          {risk.mitigations?.length > 0 && (
                            <div className="text-xs text-emerald-300">
                              <strong>Mitigations:</strong> {risk.mitigations.join(' • ')}
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
                    <h4 className="text-lg font-semibold mb-4 text-blue-400">Recommendations ({selectedReport.recommendations.length})</h4>
                    <div className="space-y-3">
                      {selectedReport.recommendations.map((rec, idx) => (
                        <div key={idx} className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/10">
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs px-2 py-1 rounded ${
                              rec.priority === 'high' ? 'bg-red-600/30 text-red-300' :
                              rec.priority === 'medium' ? 'bg-amber-600/30 text-amber-300' :
                              'bg-slate-600/30 text-slate-300'
                            }`}>{rec.priority} priority</span>
                            <span className="text-xs text-slate-400">{rec.timeframe}</span>
                          </div>
                          <h5 className="font-semibold mb-1">{rec.title}</h5>
                          <p className="text-sm text-slate-300">{rec.description}</p>
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
    </main>
  );
}
