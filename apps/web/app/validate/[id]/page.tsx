'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://validation-production.up.railway.app';

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
  const [processingAgents, setProcessingAgents] = useState<Set<string>>(new Set());
  const [completedAgents, setCompletedAgents] = useState<Set<string>>(new Set());

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

      const data = await response.json();

      // Track which agents have completed
      if (data.agentReports) {
        const completed = new Set<string>(data.agentReports.map((r: AgentReport) => r.agentId));
        setCompletedAgents(completed);
      }

      return data;
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
  const getFindingColor = (t: string) => ({ strength: 'border-emerald-500/30 bg-emerald-500/10', weakness: 'border-red-500/30 bg-red-500/10', opportunity: 'border-blue-500/30 bg-blue-500/10', threat: 'border-orange-500/30 bg-orange-500/10', neutral: 'border-slate-500/30 bg-slate-500/10' }[t] || 'border-slate-500/30 bg-slate-500/10');

  // Calculate progress
  const completedCount = validation?.agentReports?.length || 0;
  const progressPercent = Math.round((completedCount / AGENTS.length) * 100);
  const isProcessing = validation?.status === 'PROCESSING' || validation?.status === 'QUEUED';

  // Helper to safely format evidence (handles both string arrays and object arrays)
  const formatEvidence = (evidence: any[] | undefined): string => {
    if (!evidence || evidence.length === 0) return '';
    return evidence.map((e: any) => {
      if (typeof e === 'string') return e;
      if (e && typeof e === 'object') return e.source || e.claim || e.title || JSON.stringify(e);
      return String(e);
    }).join(', ');
  };

  const downloadPDF = () => {
    if (!validation) return;

    // Create PDF content
    let content = `VALIDATION COUNCIL REPORT\n`;
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
          content += `  ${i + 1}. ${f.title}\n`;
          content += `     ${f.description}\n`;
          const evidenceStr = formatEvidence(f.evidence);
          if (evidenceStr) {
            content += `     Evidence: ${evidenceStr}\n`;
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
    content += `Generated by The Validation Council\n`;
    content += `Report ID: ${validation.id}\n`;
    content += `Generated: ${new Date().toISOString()}\n`;

    // Download as text file (can be converted to PDF with proper library)
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `validation-report-${validation.id}.txt`;
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
        <div className="max-w-6xl mx-auto">
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
              <span>Download Report</span>
            </button>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{validation.title}</h1>
            <p className="text-slate-400 font-mono text-sm">ID: {validationId}</p>
            <p className="text-slate-500 text-sm mt-1">Created: {new Date(validation.createdAt).toLocaleDateString()}</p>
          </div>

          {/* Overall Score Card */}
          <div className={`rounded-lg p-6 mb-8 border ${isProcessing ? 'bg-blue-900/20 border-blue-500/50' : 'bg-slate-800/50 border-slate-700'}`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                {isProcessing ? (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-xl font-semibold">Analyzing Your Startup</h2>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    </div>
                    <p className="text-slate-400 text-sm">{completedCount} of {AGENTS.length} agents have completed their analysis</p>
                  </>
                ) : (
                  <>
                    <h2 className="text-xl font-semibold mb-1">Analysis Complete</h2>
                    <p className="text-slate-400 text-sm">All 12 AI agents have completed their analysis</p>
                  </>
                )}
              </div>
              {isProcessing ? (
                <div className="text-right px-4 py-2 rounded-lg border border-blue-500/50 bg-blue-500/10">
                  <span className="text-4xl font-bold text-blue-400 animate-pulse">{progressPercent}%</span>
                  <p className="text-xs text-slate-400 mt-1">Processing</p>
                </div>
              ) : (
                <div className={`text-right px-4 py-2 rounded-lg border ${getScoreBg(validation.overallScore || 0)}`}>
                  <span className={`text-4xl font-bold ${getScoreColor(validation.overallScore || 0)}`}>
                    {validation.overallScore}
                  </span>
                  <span className="text-slate-400 text-lg">/100</span>
                </div>
              )}
            </div>

            {/* Progress Bar (during processing) */}
            {isProcessing && (
              <div className="mb-4">
                <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Verdict (only show when complete) */}
            {!isProcessing && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <p className="text-slate-400 text-xs uppercase mb-1">Verdict</p>
                <p className={`text-lg font-semibold ${validation.verdict === 'PROCEED' ? 'text-emerald-400' : validation.verdict === 'PROCEED_WITH_CAUTION' ? 'text-yellow-400' : 'text-red-400'}`}>
                  {validation.verdict?.replace(/_/g, ' ')}
                </p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4">
                <p className="text-slate-400 text-xs uppercase mb-1">Confidence</p>
                <p className="text-lg font-semibold text-white">{validation.overallConfidence}%</p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4">
                <p className="text-slate-400 text-xs uppercase mb-1">Recommendation</p>
                <p className={`text-lg font-semibold ${validation.recommendation === 'GREEN' ? 'text-emerald-400' : validation.recommendation === 'YELLOW' ? 'text-yellow-400' : 'text-red-400'}`}>
                  {validation.recommendation}
                </p>
              </div>
            </div>
            )}

            {/* Executive Summary */}
            {validation.executiveSummary && (
              <div className="bg-slate-700/30 rounded-lg p-4">
                <p className="text-slate-400 text-xs uppercase mb-2">Executive Summary</p>
                <p className="text-slate-300">{validation.executiveSummary}</p>
              </div>
            )}
          </div>

          {/* Agent Grid */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">AI Agent Council (12 Agents)</h2>
              {isProcessing && (
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="text-sm text-slate-400">{completedCount}/{AGENTS.length}</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {AGENTS.map((agent) => {
                const report = getAgentReport(agent.id);
                const isAnalyzing = isProcessing && !report;

                return (
                  <div
                    key={agent.id}
                    onClick={() => report && setExpandedAgent(expandedAgent === agent.id ? null : agent.id)}
                    className={`rounded-lg p-4 border transition-all ${report ? 'cursor-pointer hover:border-emerald-500/60' : ''} ${
                      expandedAgent === agent.id ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-slate-800' :
                      report ? `${getScoreBg(report.score)} border` :
                      isAnalyzing ? 'bg-slate-800/50 border-blue-500/50 animate-pulse' : 'bg-slate-800/50 border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{agent.icon}</span>
                        <div>
                          <h3 className="font-semibold">{agent.name}</h3>
                          <p className="text-xs text-slate-400">{agent.role}</p>
                        </div>
                      </div>
                      {report ? (
                        <div className="text-right">
                          <span className={`text-xl font-bold ${getScoreColor(report.score)}`}>{report.score}</span>
                          <p className="text-xs text-slate-500">{report.confidence}% conf</p>
                        </div>
                      ) : isAnalyzing ? (
                        <div className="text-right">
                          <span className="text-sm text-blue-400 animate-pulse">Analyzing...</span>
                        </div>
                      ) : (
                        <div className="text-right">
                          <span className="text-sm text-slate-500">Pending</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{agent.description}</p>
                    {report && <p className="text-xs text-emerald-400 mt-2">Click to view details</p>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Expanded Agent Detail Modal */}
          {expandedAgent && selectedReport && selectedAgent && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setExpandedAgent(null)}>
              <div className="bg-slate-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-700" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{selectedAgent.icon}</span>
                    <div>
                      <h3 className="text-xl font-bold">{selectedAgent.name}</h3>
                      <p className="text-slate-400">{selectedAgent.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`px-4 py-2 rounded-lg border ${getScoreBg(selectedReport.score)}`}>
                      <span className={`text-2xl font-bold ${getScoreColor(selectedReport.score)}`}>{selectedReport.score}</span>
                      <span className="text-slate-400">/100</span>
                    </div>
                    <button onClick={() => setExpandedAgent(null)} className="text-slate-400 hover:text-white text-2xl">&times;</button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Findings */}
                  {selectedReport.findings?.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold mb-3 text-emerald-400">Key Findings</h4>
                      <div className="space-y-3">
                        {selectedReport.findings.map((finding, idx) => (
                          <div key={idx} className={`p-4 rounded-lg border ${getFindingColor(finding.type)}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs uppercase px-2 py-0.5 rounded bg-slate-700 text-slate-300">{finding.type}</span>
                              <span className="text-xs uppercase px-2 py-0.5 rounded bg-slate-700 text-slate-400">{finding.severity}</span>
                            </div>
                            <h5 className="font-semibold">{finding.title}</h5>
                            <p className="text-slate-300 text-sm mt-1">{finding.description}</p>
                            {finding.evidence && finding.evidence.length > 0 && (
                              <p className="text-xs text-slate-500 mt-2">Evidence: {formatEvidence(finding.evidence)}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Risks */}
                  {selectedReport.risks?.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold mb-3 text-orange-400">Risks Identified</h4>
                      <div className="space-y-3">
                        {selectedReport.risks.map((risk, idx) => (
                          <div key={idx} className="p-4 rounded-lg border border-orange-500/30 bg-orange-500/10">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs uppercase px-2 py-0.5 rounded bg-orange-600/30 text-orange-300">{risk.probability} prob</span>
                              <span className="text-xs uppercase px-2 py-0.5 rounded bg-orange-600/30 text-orange-300">{risk.impact} impact</span>
                            </div>
                            <h5 className="font-semibold">{risk.title}</h5>
                            <p className="text-slate-300 text-sm mt-1">{risk.description}</p>
                            {risk.mitigations && risk.mitigations.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs text-slate-400">Mitigations:</p>
                                <ul className="text-xs text-slate-300 list-disc list-inside">
                                  {risk.mitigations.map((m, i) => <li key={i}>{m}</li>)}
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
                      <h4 className="text-lg font-semibold mb-3 text-blue-400">Recommendations</h4>
                      <div className="space-y-3">
                        {selectedReport.recommendations.map((rec, idx) => (
                          <div key={idx} className="p-4 rounded-lg border border-blue-500/30 bg-blue-500/10">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs uppercase px-2 py-0.5 rounded bg-blue-600/30 text-blue-300">{rec.priority}</span>
                              <span className="text-xs uppercase px-2 py-0.5 rounded bg-blue-600/30 text-blue-300">{rec.timeframe}</span>
                            </div>
                            <h5 className="font-semibold">{rec.title}</h5>
                            <p className="text-slate-300 text-sm mt-1">{rec.description}</p>
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
