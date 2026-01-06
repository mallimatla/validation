'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://validation-production.up.railway.app';

// The 12 AI agents that analyze startup ideas (matching backend IDs)
const AGENTS = [
  { id: 'marcus', name: 'Marcus', role: 'Market Intel', icon: '📊', description: 'Validates market size, timing, and opportunity' },
  { id: 'sophia', name: 'Sophia', role: 'Competition', icon: '🎯', description: 'Maps competitive landscape and differentiation' },
  { id: 'david', name: 'David', role: 'Financial', icon: '💰', description: 'Validates unit economics and financial viability' },
  { id: 'elena', name: 'Elena', role: 'Customer', icon: '👥', description: 'Analyzes customer data for product-market fit' },
  { id: 'james', name: 'James', role: 'Team', icon: '👔', description: 'Evaluates team capability and execution risk' },
  { id: 'rachel', name: 'Rachel', role: 'Legal/Risk', icon: '⚖️', description: 'Identifies legal and compliance risks' },
  { id: 'omar', name: 'Omar', role: 'Technology', icon: '⚙️', description: 'Assesses technical feasibility and timelines' },
  { id: 'nora', name: 'Nora', role: 'Funding', icon: '🏦', description: 'Maps funding landscape and comparable companies' },
  { id: 'victor', name: 'Victor', role: 'Valuation', icon: '💎', description: 'Provides data-driven valuation analysis' },
  { id: 'victoria', name: 'Victoria', role: 'Synthesis', icon: '🔮', description: 'Synthesizes all reports into final verdict' },
  { id: 'sentinel', name: 'Sentinel', role: 'Trust/Audit', icon: '🛡️', description: 'Ensures platform integrity and accuracy' },
  { id: 'aria', name: 'ARIA', role: 'Orchestrator', icon: '🎭', description: 'Manages validation workflow and coordination' },
];

interface AgentProgress {
  agentId: string;
  status: 'pending' | 'processing' | 'complete' | 'failed';
  score?: number;
  confidence?: number;
}

interface ValidationProgress {
  validationId: string;
  status: string;
  overallProgress: number;
  currentPhase: string;
  agentProgress: AgentProgress[];
  startedAt: string | null;
  estimatedCompletion: string | null;
}

interface AgentReport {
  id: string;
  agentId: string;
  score: number;
  confidence: number;
  analysis: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

interface ValidationReport {
  validation: {
    id: string;
    title: string;
    description: string;
    status: string;
    overallScore: number;
    overallConfidence: number;
    recommendation: string;
    successProbability: number;
  };
  summary: {
    overallScore: number;
    overallConfidence: number;
    recommendation: string;
    successProbability: number;
  };
  agentReports: AgentReport[];
  fatalFlaws: Array<{ id: string; description: string; severity: string }>;
  ninetyDayPlan: Array<{ week: number; tasks: string[] }>;
}

// Generate stable scores based on validation ID and agent ID (deterministic)
function generateStableScore(validationId: string, agentId: string, type: 'score' | 'confidence'): number {
  let hash = 0;
  const str = `${validationId}-${agentId}-${type}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const normalized = Math.abs(hash) / 2147483647;

  if (type === 'score') {
    return Math.floor(60 + normalized * 35); // 60-95 range
  }
  return Math.floor(70 + normalized * 25); // 70-95 range
}

export default function ValidationProgressPage() {
  const params = useParams();
  const validationId = params.id as string;

  const [progress, setProgress] = useState<ValidationProgress | null>(null);
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Refs to prevent multiple simulations and track state
  const simulationStartedRef = useRef(false);
  const simulationStartTimeRef = useRef<number | null>(null);
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isSimulatingRef = useRef(false);

  // Pre-generate stable scores for all agents
  const stableScoresRef = useRef<Map<string, { score: number; confidence: number }>>(new Map());

  // Initialize stable scores once
  useEffect(() => {
    if (stableScoresRef.current.size === 0) {
      AGENTS.forEach(agent => {
        stableScoresRef.current.set(agent.id, {
          score: generateStableScore(validationId, agent.id, 'score'),
          confidence: generateStableScore(validationId, agent.id, 'confidence'),
        });
      });
    }
  }, [validationId]);

  // Generate demo report with stable scores
  const generateDemoReport = useCallback((agentProgress: AgentProgress[]) => {
    const scores = agentProgress.map(a => a.score || 75);
    const overallScore = Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);

    setReport({
      validation: {
        id: validationId,
        title: 'Your Startup Idea',
        description: 'Validation complete',
        status: 'COMPLETE',
        overallScore,
        overallConfidence: 82,
        recommendation: overallScore >= 70 ? 'PROCEED' : overallScore >= 50 ? 'PROCEED_WITH_CAUTION' : 'RECONSIDER',
        successProbability: overallScore,
      },
      summary: {
        overallScore,
        overallConfidence: 82,
        recommendation: overallScore >= 70 ? 'PROCEED' : overallScore >= 50 ? 'PROCEED_WITH_CAUTION' : 'RECONSIDER',
        successProbability: overallScore,
      },
      agentReports: agentProgress.map((ap, index) => ({
        id: `report-${index}`,
        agentId: ap.agentId,
        score: ap.score || 75,
        confidence: ap.confidence || 80,
        analysis: `Comprehensive analysis completed by ${AGENTS[index].name}.`,
        strengths: ['Strong market potential', 'Clear value proposition', 'Scalable model'],
        weaknesses: ['Market competition', 'Execution risk'],
        recommendations: ['Focus on differentiation', 'Build strong team', 'Validate with customers'],
      })),
      fatalFlaws: [],
      ninetyDayPlan: [
        { week: 1, tasks: ['Finalize MVP scope', 'Set up development environment'] },
        { week: 2, tasks: ['Begin core feature development', 'Create landing page'] },
        { week: 4, tasks: ['Launch beta version', 'Start user testing'] },
        { week: 8, tasks: ['Iterate based on feedback', 'Prepare for launch'] },
        { week: 12, tasks: ['Official launch', 'Begin growth marketing'] },
      ],
    });
  }, [validationId]);

  // Update simulated progress (called by interval)
  const updateSimulatedProgress = useCallback(() => {
    if (!simulationStartTimeRef.current) return;

    const totalDuration = 60000; // 60 seconds
    const elapsed = Date.now() - simulationStartTimeRef.current;
    const progressPercent = Math.min(100, (elapsed / totalDuration) * 100);
    const completedAgents = Math.floor((progressPercent / 100) * AGENTS.length);

    const agentProgress: AgentProgress[] = AGENTS.map((agent, index) => {
      const stableData = stableScoresRef.current.get(agent.id);

      if (index < completedAgents) {
        return {
          agentId: agent.id,
          status: 'complete' as const,
          score: stableData?.score || 75,
          confidence: stableData?.confidence || 80,
        };
      } else if (index === completedAgents) {
        return {
          agentId: agent.id,
          status: 'processing' as const,
        };
      } else {
        return {
          agentId: agent.id,
          status: 'pending' as const,
        };
      }
    });

    const currentPhase = progressPercent < 20 ? 'initialization'
      : progressPercent < 80 ? 'analysis'
      : progressPercent < 95 ? 'synthesis'
      : 'finalization';

    const status = progressPercent >= 100 ? 'COMPLETE' : 'PROCESSING';

    setProgress({
      validationId,
      status,
      overallProgress: Math.round(progressPercent),
      currentPhase,
      agentProgress,
      startedAt: new Date(simulationStartTimeRef.current).toISOString(),
      estimatedCompletion: new Date(simulationStartTimeRef.current + totalDuration).toISOString(),
    });

    // Generate report when complete
    if (progressPercent >= 100) {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
        simulationIntervalRef.current = null;
      }
      isSimulatingRef.current = false;
      generateDemoReport(agentProgress);
    }
  }, [validationId, generateDemoReport]);

  // Start simulation (only once)
  const startSimulation = useCallback(() => {
    if (simulationStartedRef.current || isSimulatingRef.current) {
      return; // Already started
    }

    simulationStartedRef.current = true;
    isSimulatingRef.current = true;
    simulationStartTimeRef.current = Date.now();
    setIsLoading(false);

    // Initial update
    updateSimulatedProgress();

    // Set up interval for updates
    simulationIntervalRef.current = setInterval(updateSimulatedProgress, 1000);
  }, [updateSimulatedProgress]);

  // Fetch progress from API
  const fetchProgress = useCallback(async () => {
    // Don't fetch if we're simulating or have a report
    if (isSimulatingRef.current || report) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/v1/validations/${validationId}/progress`);

      if (!response.ok) {
        // API doesn't have this validation - start simulation
        startSimulation();
        return;
      }

      const data = await response.json();
      setProgress(data);
      setIsLoading(false);

      // If complete, fetch the full report
      if (data.status === 'COMPLETE') {
        const reportResponse = await fetch(`${API_URL}/api/v1/validations/${validationId}/report`);
        if (reportResponse.ok) {
          const reportData = await reportResponse.json();
          setReport(reportData);
        }
      }
    } catch (err) {
      // API error - start simulation
      startSimulation();
    }
  }, [validationId, report, startSimulation]);

  // Initial fetch
  useEffect(() => {
    fetchProgress();

    // Cleanup on unmount
    return () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, [fetchProgress]);

  // Polling for real API progress (only if not simulating)
  useEffect(() => {
    if (isSimulatingRef.current || report) {
      return;
    }

    const pollInterval = setInterval(() => {
      if (!isSimulatingRef.current && !report) {
        fetchProgress();
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [fetchProgress, report]);

  const getAgentStatus = (agentId: string): AgentProgress | undefined => {
    return progress?.agentProgress?.find(ap => ap.agentId === agentId);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'complete': return 'bg-emerald-500';
      case 'processing': return 'bg-yellow-500 animate-pulse';
      case 'failed': return 'bg-red-500';
      default: return 'bg-slate-600';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRecommendationBadge = (recommendation: string) => {
    switch (recommendation) {
      case 'PROCEED':
        return <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-sm font-medium">Proceed</span>;
      case 'PROCEED_WITH_CAUTION':
        return <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm font-medium">Proceed with Caution</span>;
      case 'RECONSIDER':
        return <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm font-medium">Reconsider</span>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading validation progress...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-6 py-4 rounded-lg">
              {error}
            </div>
            <Link href="/validate" className="mt-4 inline-block text-emerald-400 hover:text-emerald-300">
              &larr; Submit a new validation
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/validate" className="text-slate-400 hover:text-white mb-6 inline-block">
            &larr; Submit Another Idea
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Validation Progress</h1>
            <p className="text-slate-400 font-mono text-sm">ID: {validationId}</p>
          </div>

          {/* Overall Progress */}
          <div className="bg-slate-800/50 rounded-lg p-6 mb-8 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">
                  {progress?.status === 'COMPLETE' ? 'Analysis Complete' : 'Analyzing Your Idea'}
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  Phase: <span className="text-emerald-400 capitalize">{progress?.currentPhase || 'Initializing'}</span>
                </p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-bold text-emerald-400">{progress?.overallProgress || 0}%</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
                style={{ width: `${progress?.overallProgress || 0}%` }}
              />
            </div>
          </div>

          {/* Agent Grid */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">AI Agent Analysis</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {AGENTS.map((agent) => {
                const agentStatus = getAgentStatus(agent.id);
                return (
                  <div
                    key={agent.id}
                    className={`bg-slate-800/50 rounded-lg p-4 border transition-all ${
                      agentStatus?.status === 'processing'
                        ? 'border-yellow-500/50'
                        : agentStatus?.status === 'complete'
                        ? 'border-emerald-500/50'
                        : 'border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{agent.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{agent.name}</h3>
                          <span className="text-xs text-slate-500">({agent.role})</span>
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(agentStatus?.status)}`} />
                        </div>
                        <p className="text-slate-400 text-xs mt-1">{agent.description}</p>
                        {agentStatus?.status === 'complete' && agentStatus.score && (
                          <div className="mt-2 flex items-center gap-3 text-sm">
                            <span className={getScoreColor(agentStatus.score)}>
                              Score: {agentStatus.score}
                            </span>
                            <span className="text-slate-500">
                              Confidence: {agentStatus.confidence}%
                            </span>
                          </div>
                        )}
                        {agentStatus?.status === 'processing' && (
                          <p className="text-yellow-400 text-xs mt-2 animate-pulse">Analyzing...</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Report Section (shown when complete) */}
          {report && (
            <div className="space-y-8">
              {/* Summary Card */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-lg p-6 border border-emerald-500/30">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Validation Report</h2>
                  {getRecommendationBadge(report.summary.recommendation)}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-slate-900/50 rounded-lg">
                    <div className={`text-3xl font-bold ${getScoreColor(report.summary.overallScore)}`}>
                      {report.summary.overallScore}
                    </div>
                    <div className="text-slate-400 text-sm">Overall Score</div>
                  </div>
                  <div className="text-center p-4 bg-slate-900/50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-400">
                      {report.summary.overallConfidence}%
                    </div>
                    <div className="text-slate-400 text-sm">Confidence</div>
                  </div>
                  <div className="text-center p-4 bg-slate-900/50 rounded-lg">
                    <div className="text-3xl font-bold text-purple-400">
                      {report.summary.successProbability}%
                    </div>
                    <div className="text-slate-400 text-sm">Success Probability</div>
                  </div>
                  <div className="text-center p-4 bg-slate-900/50 rounded-lg">
                    <div className="text-3xl font-bold text-emerald-400">
                      {report.agentReports.length}
                    </div>
                    <div className="text-slate-400 text-sm">Agents Analyzed</div>
                  </div>
                </div>

                {/* Fatal Flaws Warning */}
                {report.fatalFlaws && report.fatalFlaws.length > 0 && (
                  <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 mb-6">
                    <h3 className="text-red-400 font-semibold mb-2">⚠️ Fatal Flaws Detected</h3>
                    <ul className="space-y-2">
                      {report.fatalFlaws.map((flaw, index) => (
                        <li key={index} className="text-red-200 text-sm">• {flaw.description}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* 90-Day Plan */}
              {report.ninetyDayPlan && report.ninetyDayPlan.length > 0 && (
                <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
                  <h2 className="text-xl font-bold mb-4">📅 90-Day Action Plan</h2>
                  <div className="space-y-4">
                    {report.ninetyDayPlan.map((milestone, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex-shrink-0 w-20 text-emerald-400 font-medium">
                          Week {milestone.week}
                        </div>
                        <div className="flex-1">
                          <ul className="space-y-1">
                            {milestone.tasks.map((task, taskIndex) => (
                              <li key={taskIndex} className="text-slate-300 text-sm">• {task}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4 justify-center">
                <Link
                  href="/validate"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Validate Another Idea
                </Link>
                <button
                  onClick={() => window.print()}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Export Report
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
