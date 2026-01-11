'use client';

import { useState, useEffect } from 'react';
import { useUser, useAuth, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Dynamic imports for chart components (avoid SSR issues with recharts)
const AgentRadarChart = dynamic(
  () => import('../../components/charts/AgentRadarChart').then((mod) => mod.AgentRadarChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
const ScoreGauge = dynamic(
  () => import('../../components/charts/ScoreGauge').then((mod) => mod.ScoreGauge),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
const RiskList = dynamic(
  () => import('../../components/charts/RiskHeatmap').then((mod) => mod.RiskList),
  { ssr: false }
);
const AgentRadarMini = dynamic(
  () => import('../../components/charts/AgentRadarChart').then((mod) => mod.AgentRadarMini),
  { ssr: false }
);
const ScoreBadge = dynamic(
  () => import('../../components/charts/ScoreGauge').then((mod) => mod.ScoreBadge),
  { ssr: false }
);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://validation-production.up.railway.app';

interface AgentReport {
  agentId: string;
  score: number;
  confidence: number;
  findings: any[];
  risks: any[];
  recommendations: any[];
}

interface Validation {
  id: string;
  title: string;
  description: string;
  status: string;
  overallScore: number | null;
  overallConfidence: number | null;
  recommendation: string;
  verdict: string;
  executiveSummary: string;
  createdAt: string;
  completedAt: string | null;
  agentReports?: AgentReport[];
}

const AGENT_NAMES: Record<string, string> = {
  marcus: 'Marcus', sophia: 'Sophia', david: 'David', elena: 'Elena',
  james: 'James', rachel: 'Rachel', omar: 'Omar', nora: 'Nora',
  victor: 'Victor', victoria: 'Victoria', sentinel: 'Sentinel', aria: 'ARIA',
};

const AGENT_ROLES: Record<string, string> = {
  marcus: 'Market Intelligence', sophia: 'Innovation & Disruption', david: 'Competitive Strategy',
  elena: 'Customer & PMF', james: 'Team & Talent', rachel: 'Financial Viability',
  omar: 'Technical Assessment', nora: 'GTM Strategy', victor: 'Valuation Expert',
  victoria: 'Contrarian Analysis', sentinel: 'Risk & Kill Signals', aria: 'AI Orchestrator',
};

function ChartSkeleton() {
  return (
    <div className="w-full h-[300px] bg-slate-800/50 rounded-xl animate-pulse flex items-center justify-center">
      <div className="w-24 h-24 border-4 border-slate-600 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  );
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [validations, setValidations] = useState<Validation[]>([]);
  const [selectedValidation, setSelectedValidation] = useState<Validation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'validations' | 'analytics'>('overview');

  useEffect(() => {
    if (isLoaded && user) {
      fetchValidations();
    } else if (isLoaded && !user) {
      setIsLoading(false);
    }
  }, [isLoaded, user]);

  const fetchValidations = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/v1/validations`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const validationsData = data.data || [];
        setValidations(validationsData);

        // Auto-select latest completed validation for the overview
        const latestCompleted = validationsData.find((v: Validation) => v.status === 'COMPLETE');
        if (latestCompleted) {
          await fetchValidationDetails(latestCompleted.id, token!);
        }
      }
    } catch (error) {
      console.error('Failed to fetch validations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchValidationDetails = async (id: string, token: string) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/validations/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedValidation(data);
      }
    } catch (error) {
      console.error('Failed to fetch validation details:', error);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string; text: string; icon: string }> = {
      PENDING: { bg: 'bg-slate-500/20', text: 'text-slate-400', icon: '⏳' },
      QUEUED: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: '📋' },
      PROCESSING: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: '🔄' },
      COMPLETE: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', icon: '✅' },
      FAILED: { bg: 'bg-red-500/20', text: 'text-red-400', icon: '❌' },
    };
    return configs[status] || configs.PENDING;
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-slate-500';
    if (score >= 70) return 'text-emerald-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Calculate aggregated stats
  const completedValidations = validations.filter((v) => v.status === 'COMPLETE');
  const avgScore = completedValidations.length > 0
    ? Math.round(completedValidations.reduce((sum, v) => sum + (v.overallScore || 0), 0) / completedValidations.length)
    : 0;
  const highScoreCount = validations.filter((v) => v.overallScore && v.overallScore >= 70).length;

  // Get all risks from selected validation
  const allRisks = selectedValidation?.agentReports?.flatMap((r) => r.risks || []) || [];
  const allRecommendations = selectedValidation?.agentReports?.flatMap((r) => r.recommendations || []) || [];

  // Transform agent reports for radar chart
  const agentScores = selectedValidation?.agentReports?.map((r) => ({
    agentId: r.agentId,
    agentName: AGENT_NAMES[r.agentId] || r.agentId,
    score: r.score,
    confidence: r.confidence,
    role: AGENT_ROLES[r.agentId] || '',
  })) || [];

  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
          <p className="text-slate-400 mb-6">You need to be signed in to view your dashboard.</p>
          <Link
            href="/sign-in"
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Sign In
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-xl">
              🚀
            </div>
            <span className="font-bold text-xl">Validation Council</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/validate"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
            >
              + New Validation
            </Link>
            <Link href="/pricing" className="text-slate-400 hover:text-white text-sm">
              Upgrade
            </Link>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {user.firstName || 'Founder'}! 👋
            </h1>
            <p className="text-slate-400">Your startup validation dashboard with AI-powered insights.</p>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-slate-800/50 rounded-lg p-1">
            {(['overview', 'validations', 'analytics'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                  activeTab === tab
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Cards - Always visible */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 rounded-xl p-6 border border-emerald-500/20">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">📊</span>
              <span className="text-slate-400 text-sm">Total Validations</span>
            </div>
            <div className="text-4xl font-bold text-emerald-400">{validations.length}</div>
          </div>
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-xl p-6 border border-blue-500/20">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🔄</span>
              <span className="text-slate-400 text-sm">In Progress</span>
            </div>
            <div className="text-4xl font-bold text-blue-400">
              {validations.filter((v) => v.status === 'PROCESSING').length}
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-xl p-6 border border-purple-500/20">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">⭐</span>
              <span className="text-slate-400 text-sm">Avg. Score</span>
            </div>
            <div className={`text-4xl font-bold ${getScoreColor(avgScore)}`}>{avgScore || '—'}</div>
          </div>
          <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 rounded-xl p-6 border border-amber-500/20">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🏆</span>
              <span className="text-slate-400 text-sm">High Scores</span>
            </div>
            <div className="text-4xl font-bold text-amber-400">{highScoreCount}</div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-emerald-500 mx-auto mb-6"></div>
              <p className="text-slate-400 text-lg">Loading your dashboard...</p>
            </div>
          </div>
        ) : validations.length === 0 ? (
          /* Empty State */
          <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-12 text-center">
            <div className="text-8xl mb-6">🚀</div>
            <h2 className="text-3xl font-bold mb-4">Start Your Validation Journey</h2>
            <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
              Get your startup idea analyzed by our AI Council of 12 expert agents.
              Receive comprehensive insights on market fit, competition, team, and more.
            </p>
            <Link
              href="/validate"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:scale-105 shadow-lg shadow-emerald-500/25"
            >
              <span>Validate Your Idea</span>
              <span>→</span>
            </Link>
          </div>
        ) : (
          /* Main Content */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Score Overview */}
            <div className="lg:col-span-1 space-y-6">
              {selectedValidation && (
                <>
                  {/* Overall Score Gauge */}
                  <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <span>🎯</span> Latest Validation Score
                    </h3>
                    <div className="flex justify-center">
                      <ScoreGauge
                        score={selectedValidation.overallScore || 0}
                        verdict={selectedValidation.verdict as any}
                        size="lg"
                      />
                    </div>
                    <p className="text-sm text-slate-400 mt-4 text-center">
                      {selectedValidation.title}
                    </p>
                  </div>

                  {/* Quick Risks */}
                  <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <span>⚠️</span> Top Risks
                    </h3>
                    {allRisks.length > 0 ? (
                      <RiskList risks={allRisks} maxItems={4} />
                    ) : (
                      <p className="text-slate-400 text-sm text-center py-4">No critical risks identified</p>
                    )}
                  </div>

                  {/* Quick Recommendations */}
                  <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <span>💡</span> Top Recommendations
                    </h3>
                    <div className="space-y-3">
                      {allRecommendations.slice(0, 4).map((rec, i) => (
                        <div
                          key={i}
                          className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/50"
                        >
                          <div className="flex items-start gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              rec.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                              rec.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-slate-500/20 text-slate-400'
                            }`}>
                              {rec.priority}
                            </span>
                            <span className="text-sm text-slate-300">{rec.title}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Right Column - Radar Chart & Validations List */}
            <div className="lg:col-span-2 space-y-6">
              {/* Agent Radar Chart */}
              {selectedValidation && agentScores.length > 0 && (
                <AgentRadarChart agents={agentScores} />
              )}

              {/* Recent Validations */}
              <div className="bg-slate-800/50 rounded-xl border border-slate-700">
                <div className="p-6 border-b border-slate-700 flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <span>📋</span> Your Validations
                  </h3>
                  <Link
                    href="/validate"
                    className="text-emerald-400 hover:text-emerald-300 text-sm font-medium"
                  >
                    + Add New
                  </Link>
                </div>

                <div className="divide-y divide-slate-700/50">
                  {validations.slice(0, 5).map((validation) => {
                    const statusConfig = getStatusConfig(validation.status);
                    return (
                      <Link
                        key={validation.id}
                        href={`/validate/${validation.id}`}
                        className="block p-6 hover:bg-slate-700/30 transition-all group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-lg group-hover:text-emerald-400 transition-colors">
                                {validation.title}
                              </h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusConfig.bg} ${statusConfig.text}`}>
                                <span>{statusConfig.icon}</span>
                                <span>{validation.status}</span>
                              </span>
                            </div>
                            <p className="text-slate-400 text-sm line-clamp-1 mb-2">
                              {validation.description}
                            </p>
                            <p className="text-slate-500 text-xs">
                              {new Date(validation.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                          {validation.overallScore !== null && (
                            <div className="ml-4">
                              <ScoreBadge score={validation.overallScore} size="lg" />
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {validations.length > 5 && (
                  <div className="p-4 border-t border-slate-700 text-center">
                    <button className="text-emerald-400 hover:text-emerald-300 text-sm font-medium">
                      View All {validations.length} Validations →
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Investor Interest CTA */}
        <div className="mt-8 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10 rounded-2xl border border-purple-500/20 p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold mb-2 flex items-center gap-3">
                <span>🤝</span> Connect with Investors
              </h3>
              <p className="text-slate-400 max-w-xl">
                Make your validation visible to our network of investors.
                Get discovered by VCs and angels looking for validated startups.
              </p>
            </div>
            <Link
              href="/settings/visibility"
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all hover:scale-105"
            >
              Enable Investor Discovery
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
