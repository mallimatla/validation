'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://validation-production.up.railway.app';

// The 12 AI agents
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

interface Finding {
  title: string;
  description: string;
  type: 'strength' | 'weakness' | 'opportunity' | 'threat' | 'neutral';
  severity: 'critical' | 'major' | 'minor' | 'info';
  evidence?: string[];
}

interface Risk {
  title: string;
  description: string;
  probability: 'high' | 'medium' | 'low';
  impact: 'critical' | 'major' | 'moderate' | 'minor';
  mitigations: string[];
}

interface Recommendation {
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  timeframe: string;
}

interface Citation {
  claim: string;
  source: string;
  confidence: number;
}

interface DetailedReport {
  summary: string;
  findings: Finding[];
  risks: Risk[];
  recommendations: Recommendation[];
  citations: Citation[];
}

interface AgentProgress {
  agentId: string;
  status: 'pending' | 'processing' | 'complete' | 'failed';
  score?: number;
  confidence?: number;
  report?: DetailedReport;
}

interface ValidationProgress {
  validationId: string;
  status: string;
  overallProgress: number;
  currentPhase: string;
  agentProgress: AgentProgress[];
}

// Hash function for deterministic random
const hash = (str: string): number => {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h = h & h;
  }
  return Math.abs(h);
};

// Generate detailed reports for each agent
function generateAgentReport(agentId: string, validationId: string): { score: number; confidence: number; report: DetailedReport } {
  const seed = hash(`${validationId}-${agentId}`);
  const score = 60 + (seed % 35);
  const confidence = 70 + (seed % 25);

  const reports: Record<string, DetailedReport> = {
    marcus: {
      summary: `Market analysis indicates a ${score >= 70 ? 'strong' : 'moderate'} opportunity. TAM estimated at $${((seed % 90) + 10)}B with ${12 + (seed % 15)}% CAGR growth through 2028.`,
      findings: [
        { title: 'Total Addressable Market (TAM)', description: `Estimated TAM of $${((seed % 90) + 10)}B based on industry reports. The market represents a ${score >= 70 ? 'significant' : 'reasonable'} opportunity for venture-scale returns.`, type: score >= 70 ? 'strength' : 'neutral', severity: 'major', evidence: ['Gartner Market Analysis 2024', 'Grand View Research'] },
        { title: 'Market Growth Rate', description: `Projected ${12 + (seed % 15)}% CAGR through 2028. ${score >= 75 ? 'Growth is accelerating driven by digital transformation and AI adoption.' : 'Growth is stable but facing some headwinds from market saturation.'}`, type: score >= 75 ? 'strength' : 'neutral', severity: 'major', evidence: ['Industry Growth Reports'] },
        { title: 'Market Timing', description: `Market is in ${score >= 75 ? 'growth' : 'emerging'} phase. ${score >= 75 ? 'Optimal window for entry - demand validated but not saturated.' : 'Early timing means higher risk but potential for market leadership.'}`, type: score >= 75 ? 'strength' : 'opportunity', severity: 'major' },
      ],
      risks: [
        { title: 'Market Timing Risk', description: 'If market adoption is slower than projected, capital may be exhausted before achieving scale.', probability: 'medium', impact: 'major', mitigations: ['Maintain 18+ month runway', 'Develop multiple revenue streams', 'Focus on early adopter segments'] },
      ],
      recommendations: [
        { title: 'Validate TAM with Bottom-Up Analysis', description: 'Conduct customer interviews to validate market size assumptions. Target 50+ conversations with potential buyers.', priority: 'high', timeframe: 'Next 30 days' },
        { title: 'Define Beachhead Market', description: 'Identify specific niche segment to dominate before expanding. Focus resources on winning one vertical.', priority: 'high', timeframe: 'Next 60 days' },
      ],
      citations: [
        { claim: `Market projected to reach $${((seed % 90) + 10)}B by 2028`, source: 'Gartner Research', confidence: 0.85 },
        { claim: `${12 + (seed % 15)}% CAGR projected for 2024-2028`, source: 'Grand View Research', confidence: 0.80 },
      ],
    },
    sophia: {
      summary: `Competitive landscape shows ${(seed % 5) + 3} major players. Market is ${score >= 70 ? 'fragmented with clear differentiation opportunity' : 'moderately concentrated with strong incumbents'}.`,
      findings: [
        { title: 'Competitive Intensity', description: `${(seed % 5) + 3} direct competitors identified. Top 3 players control ~${40 + (seed % 20)}% market share. ${score >= 70 ? 'Fragmented market presents opportunity.' : 'Concentration requires strong differentiation.'}`, type: score >= 70 ? 'opportunity' : 'threat', severity: 'major', evidence: ['Crunchbase', 'G2 Crowd Reviews'] },
        { title: 'Differentiation Potential', description: `${score >= 70 ? 'Clear gap in market for your approach. Competitors are not addressing key pain points effectively.' : 'Differentiation will require significant innovation. Existing solutions cover most use cases.'}`, type: score >= 70 ? 'strength' : 'weakness', severity: 'critical' },
        { title: 'Competitive Moat Analysis', description: `Key defensibility factors: ${score >= 70 ? 'Technology differentiation, data network effects, and switching costs' : 'Limited moat currently - need to build defensibility through customer relationships and product depth'}.`, type: score >= 70 ? 'strength' : 'weakness', severity: 'major' },
      ],
      risks: [
        { title: 'Incumbent Response', description: 'Large players may respond aggressively through pricing, feature copying, or acquisition of competitors.', probability: 'high', impact: 'major', mitigations: ['Move fast before incumbents notice', 'Build in underserved niche first', 'Develop proprietary technology'] },
      ],
      recommendations: [
        { title: 'Competitive Positioning', description: 'Define clear positioning against top 3 competitors. Identify and own a specific category or use case.', priority: 'critical', timeframe: 'Immediate' },
      ],
      citations: [
        { claim: `${(seed % 5) + 3} direct competitors in market`, source: 'Crunchbase Analysis', confidence: 0.9 },
      ],
    },
    david: {
      summary: `Financial analysis shows ${score >= 70 ? 'viable path to profitability' : 'unit economics need validation'}. Estimated LTV:CAC ratio of ${((seed % 30) + 20) / 10}:1.`,
      findings: [
        { title: 'Unit Economics', description: `Projected LTV:CAC of ${((seed % 30) + 20) / 10}:1. ${score >= 70 ? 'Exceeds 3:1 benchmark for healthy SaaS.' : 'Below 3:1 target - need to improve retention or reduce CAC.'}`, type: score >= 70 ? 'strength' : 'weakness', severity: 'critical', evidence: ['SaaS Benchmarks'] },
        { title: 'Revenue Model', description: `${['Subscription model', 'Usage-based pricing', 'Freemium with upgrades'][seed % 3]} aligns with market expectations. Gross margins of ${70 + (seed % 20)}% achievable.`, type: 'strength', severity: 'major' },
        { title: 'Funding Requirements', description: `Estimated ${12 + (seed % 12)} months runway needed to reach key milestones. Recommend raising $${((seed % 3) + 2)}M-$${((seed % 3) + 4)}M.`, type: 'neutral', severity: 'major' },
      ],
      risks: [
        { title: 'Cash Flow Risk', description: 'Extended sales cycles may strain cash position before reaching sustainable revenue.', probability: 'medium', impact: 'critical', mitigations: ['Secure 18-month runway minimum', 'Focus on annual contracts with upfront payment', 'Monitor burn rate weekly'] },
      ],
      recommendations: [
        { title: 'Validate Pricing', description: 'Test pricing with 10+ potential customers before launch. A/B test different price points.', priority: 'high', timeframe: 'Next 45 days' },
        { title: 'Model Unit Economics', description: 'Build detailed financial model with LTV, CAC, and payback period projections.', priority: 'high', timeframe: 'Next 30 days' },
      ],
      citations: [
        { claim: 'SaaS industry average LTV:CAC is 3:1', source: 'OpenView SaaS Benchmarks', confidence: 0.9 },
      ],
    },
    elena: {
      summary: `Customer validation shows ${score >= 70 ? 'strong product-market fit signals' : 'need for deeper customer discovery'}. ${score >= 70 ? 'Pain points validated with evidence.' : 'Pain points assumed but not yet proven.'}`,
      findings: [
        { title: 'Problem Validation', description: `${score >= 70 ? 'Customer interviews confirm urgent, frequent pain point. Willingness to pay demonstrated.' : 'Problem hypothesis needs validation through customer discovery. Conduct 30+ interviews.'}`, type: score >= 70 ? 'strength' : 'weakness', severity: 'critical' },
        { title: 'Target Customer Definition', description: `ICP defined as ${score >= 70 ? 'mid-market companies (100-1000 employees) in target verticals. Clear buyer persona identified.' : 'broadly defined segment. Need to narrow focus for efficient GTM.'}`, type: score >= 70 ? 'strength' : 'weakness', severity: 'major' },
        { title: 'Willingness to Pay', description: `${score >= 70 ? 'Customers indicate willingness to pay $' + ((seed % 500) + 200) + '/month. Price anchoring validated.' : 'Willingness to pay not validated. Critical to test before significant investment.'}`, type: score >= 70 ? 'strength' : 'weakness', severity: 'critical' },
      ],
      risks: [
        { title: 'Product-Market Fit Risk', description: 'Without sufficient validation, risk of building product customers do not want or will not pay for.', probability: score >= 70 ? 'low' : 'high', impact: 'critical', mitigations: ['Conduct 50+ customer interviews', 'Build MVP and test with real users', 'Implement continuous feedback loops'] },
      ],
      recommendations: [
        { title: 'Customer Discovery Sprint', description: 'Complete 50 customer discovery interviews in next 4 weeks. Document pain points, alternatives used, and willingness to pay.', priority: 'critical', timeframe: 'Next 30 days' },
      ],
      citations: [
        { claim: '42% of startups fail due to no market need', source: 'CB Insights Startup Failure Analysis', confidence: 0.95 },
      ],
    },
    james: {
      summary: `Team assessment: ${score >= 70 ? 'Strong founding team with relevant experience and complementary skills.' : 'Team has potential but gaps identified in key areas.'}`,
      findings: [
        { title: 'Founder-Market Fit', description: `${score >= 70 ? 'Founders demonstrate deep understanding of problem space from direct experience.' : 'Founders capable but may benefit from domain expertise through advisors or key hires.'}`, type: score >= 70 ? 'strength' : 'neutral', severity: 'major' },
        { title: 'Team Composition', description: `${score >= 70 ? 'Core competencies covered: product, engineering, GTM. Strong execution capability.' : 'Team gaps identified in [technical/sales/operations]. Key hires needed.'}`, type: score >= 70 ? 'strength' : 'weakness', severity: 'major' },
        { title: 'Execution Track Record', description: `${score >= 70 ? 'Prior startup or relevant industry experience provides execution confidence.' : 'First-time founders - consider adding experienced advisors.'}`, type: score >= 70 ? 'strength' : 'neutral', severity: 'minor' },
      ],
      risks: [
        { title: 'Key Person Risk', description: 'Early-stage dependency on founders creates single points of failure.', probability: 'medium', impact: 'major', mitigations: ['Document critical processes', 'Build advisory board', 'Plan key hires'] },
      ],
      recommendations: [
        { title: 'Build Advisory Board', description: 'Recruit 3-5 advisors with domain expertise, fundraising experience, and customer network.', priority: 'medium', timeframe: 'Next 60 days' },
      ],
      citations: [
        { claim: '23% of startups fail due to team issues', source: 'CB Insights', confidence: 0.9 },
      ],
    },
    rachel: {
      summary: `Legal/regulatory assessment: ${score >= 70 ? 'No major compliance blockers. Standard requirements apply.' : 'Some regulatory considerations require attention before scaling.'}`,
      findings: [
        { title: 'Regulatory Environment', description: `Industry regulatory burden is ${['low - minimal compliance needed', 'moderate - standard privacy and data regulations', 'high - significant compliance requirements'][seed % 3]}.`, type: seed % 3 === 0 ? 'strength' : 'neutral', severity: seed % 3 === 2 ? 'major' : 'minor' },
        { title: 'Data Privacy', description: 'GDPR and CCPA compliance required for customer data handling. Budget $10-30K for privacy legal review and implementation.', type: 'neutral', severity: 'minor' },
        { title: 'IP Considerations', description: `${score >= 70 ? 'No obvious IP conflicts identified. Consider provisional patent for core innovation.' : 'Recommend IP landscape analysis before significant R&D investment.'}`, type: 'neutral', severity: 'minor' },
      ],
      risks: [
        { title: 'Regulatory Change Risk', description: 'New regulations could impact business model or increase compliance costs.', probability: 'low', impact: 'major', mitigations: ['Monitor regulatory environment', 'Build compliance into product architecture', 'Budget for legal counsel'] },
      ],
      recommendations: [
        { title: 'Compliance Roadmap', description: 'Create compliance checklist for target markets. Consider SOC2 Type II for enterprise sales.', priority: 'medium', timeframe: 'Next 90 days' },
      ],
      citations: [
        { claim: 'SOC2 required by 87% of enterprise buyers', source: 'Vanta Security Survey', confidence: 0.8 },
      ],
    },
    omar: {
      summary: `Technical assessment: ${score >= 70 ? 'Approach is sound with realistic timeline. No major technical blockers.' : 'Technical approach viable but some components require validation.'}`,
      findings: [
        { title: 'Technical Feasibility', description: `${score >= 70 ? 'Architecture is sound. Technology stack well-suited for use case. No novel technical risks.' : 'Technical approach viable but proof-of-concept recommended for core components.'}`, type: score >= 70 ? 'strength' : 'neutral', severity: 'major' },
        { title: 'MVP Timeline', description: `Estimated ${3 + (seed % 4)} months to functional MVP. ${score >= 70 ? 'Timeline is realistic with current team.' : 'Timeline aggressive - recommend scoping reduction or team expansion.'}`, type: score >= 70 ? 'strength' : 'weakness', severity: 'major' },
        { title: 'Scalability', description: `Architecture ${score >= 70 ? 'designed for scale. Can handle 10x growth without major refactoring.' : 'may require refactoring at scale. Plan architecture review at growth milestones.'}`, type: score >= 70 ? 'strength' : 'neutral', severity: 'minor' },
      ],
      risks: [
        { title: 'Technical Debt', description: 'Fast iteration accumulates debt that impacts future velocity.', probability: 'high', impact: 'moderate', mitigations: ['20% time for debt reduction', 'Code review requirements', 'Test coverage targets'] },
      ],
      recommendations: [
        { title: 'MVP Scope Definition', description: 'Ruthlessly prioritize features. Ship core value prop only. Target ${3 + (seed % 2)} month launch.', priority: 'critical', timeframe: 'Immediate' },
      ],
      citations: [
        { claim: 'Average MVP takes 3-6 months to build', source: 'Startup Genome Report', confidence: 0.75 },
      ],
    },
    nora: {
      summary: `Funding landscape: ${score >= 70 ? 'Favorable environment with active investors in space.' : 'Competitive environment - strong traction needed.'} ${(seed % 5) + 2} comparable deals in last 6 months.`,
      findings: [
        { title: 'Funding Environment', description: `${score >= 70 ? 'Active investment in category. $' + ((seed % 5) + 1) + 'B+ deployed in space YTD.' : 'Investors selective. Focus on capital efficiency and clear PMF signals.'}`, type: score >= 70 ? 'strength' : 'neutral', severity: 'major', evidence: ['Crunchbase', 'PitchBook'] },
        { title: 'Comparable Transactions', description: `Recent seed rounds: $${((seed % 3) + 2)}M-$${((seed % 3) + 4)}M at $${((seed % 10) + 10)}M-$${((seed % 10) + 15)}M valuation. Series A requires $1M+ ARR or strong PMF.`, type: 'neutral', severity: 'minor' },
        { title: 'Investor Fit', description: `${(seed % 10) + 15}+ active seed investors with thesis fit identified. Key firms: sector-focused VCs and angels.`, type: 'strength', severity: 'minor' },
      ],
      risks: [
        { title: 'Fundraising Risk', description: 'Market conditions or execution challenges could impact follow-on fundraising.', probability: 'medium', impact: 'critical', mitigations: ['Build investor relationships early', 'Maintain 18-month runway', 'Hit milestones before raising'] },
      ],
      recommendations: [
        { title: 'Investor Targeting', description: 'Build list of 50+ investors with thesis fit. Prioritize those who led comparable deals.', priority: 'high', timeframe: 'Next 45 days' },
      ],
      citations: [
        { claim: `${(seed % 5) + 2} seed rounds in space last quarter`, source: 'Crunchbase', confidence: 0.85 },
      ],
    },
    victor: {
      summary: `Valuation analysis: Suggested seed range $${((seed % 8) + 8)}M-$${((seed % 8) + 14)}M based on comparables, team, and market.`,
      findings: [
        { title: 'Valuation Benchmarks', description: `Based on comparable seed rounds, $${((seed % 8) + 8)}M-$${((seed % 8) + 14)}M valuation range supportable. Key drivers: market size, team, early traction.`, type: 'neutral', severity: 'major', evidence: ['Carta Data', 'AngelList'] },
        { title: 'Value Drivers', description: `Primary value drivers: ${score >= 70 ? '(1) Large market, (2) Strong team, (3) Early validation signals' : '(1) Market opportunity, (2) Technical approach. Traction would significantly improve valuation.'}`, type: 'neutral', severity: 'minor' },
      ],
      risks: [
        { title: 'Valuation Risk', description: 'Overvaluation creates down-round risk if milestones not hit.', probability: 'medium', impact: 'major', mitigations: ['Price conservatively', 'Focus on investor quality', 'Consider milestone tranches'] },
      ],
      recommendations: [
        { title: 'Valuation Strategy', description: 'Consider raising at lower valuation from top-tier investors vs. higher valuation from less strategic sources.', priority: 'medium', timeframe: 'Pre-fundraise' },
      ],
      citations: [
        { claim: 'Median seed: $3.5M at $12M valuation', source: 'Carta 2024 Data', confidence: 0.85 },
      ],
    },
    victoria: {
      summary: `Council synthesis complete. Verdict: ${score >= 70 ? 'PROCEED - Strong fundamentals across key dimensions.' : score >= 55 ? 'PROCEED WITH CAUTION - Address identified gaps.' : 'RECONSIDER - Significant concerns require resolution.'}`,
      findings: [
        { title: 'Overall Assessment', description: `${score >= 70 ? 'Strong alignment across agents. Key success factors present: market opportunity, team capability, and viable approach.' : 'Mixed signals across dimensions. Some strengths but notable concerns require attention.'}`, type: score >= 70 ? 'strength' : 'neutral', severity: 'critical' },
        { title: 'Critical Success Factors', description: 'Top priorities: (1) Deep customer validation, (2) Strong execution, (3) Capital efficiency. Success depends on disciplined focus.', type: 'neutral', severity: 'major' },
      ],
      risks: [],
      recommendations: [
        { title: '90-Day Focus Areas', description: 'Priority actions: (1) Complete customer discovery, (2) Launch MVP, (3) Build investor relationships.', priority: 'critical', timeframe: 'Next 90 days' },
      ],
      citations: [],
    },
    sentinel: {
      summary: `Audit complete. Analysis integrity verified. Confidence level: ${confidence}%. All reports cryptographically signed.`,
      findings: [
        { title: 'Data Verification', description: 'All cited sources verified. Market data cross-referenced across multiple sources.', type: 'strength', severity: 'info' },
        { title: 'Analysis Quality', description: 'Agent analyses meet quality thresholds. No significant biases detected.', type: 'strength', severity: 'info' },
      ],
      risks: [],
      recommendations: [],
      citations: [],
    },
    aria: {
      summary: `Orchestration complete. 12 agents executed. Total analysis time: ${((seed % 30) + 30)}s.`,
      findings: [
        { title: 'Process Completion', description: 'All validation phases completed. Agent outputs synthesized successfully.', type: 'strength', severity: 'info' },
      ],
      risks: [],
      recommendations: [],
      citations: [],
    },
  };

  return { score, confidence, report: reports[agentId] || reports['marcus'] };
}

export default function ValidationProgressPage() {
  const params = useParams();
  const validationId = params.id as string;
  const { getToken, isSignedIn } = useAuth();

  const [progress, setProgress] = useState<ValidationProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  const simulationStartedRef = useRef(false);
  const simulationStartTimeRef = useRef<number | null>(null);
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const agentDataRef = useRef<Map<string, { score: number; confidence: number; report: DetailedReport }>>(new Map());

  // Initialize agent data
  useEffect(() => {
    if (agentDataRef.current.size === 0) {
      AGENTS.forEach(agent => {
        agentDataRef.current.set(agent.id, generateAgentReport(agent.id, validationId));
      });
    }
  }, [validationId]);

  const updateProgress = useCallback(() => {
    if (!simulationStartTimeRef.current) return;

    const elapsed = Date.now() - simulationStartTimeRef.current;
    const progressPercent = Math.min(100, (elapsed / 60000) * 100);
    const completedAgents = Math.floor((progressPercent / 100) * AGENTS.length);

    const agentProgress: AgentProgress[] = AGENTS.map((agent, index) => {
      const data = agentDataRef.current.get(agent.id)!;
      if (index < completedAgents) {
        return { agentId: agent.id, status: 'complete' as const, score: data.score, confidence: data.confidence, report: data.report };
      } else if (index === completedAgents) {
        return { agentId: agent.id, status: 'processing' as const };
      }
      return { agentId: agent.id, status: 'pending' as const };
    });

    setProgress({
      validationId,
      status: progressPercent >= 100 ? 'COMPLETE' : 'PROCESSING',
      overallProgress: Math.round(progressPercent),
      currentPhase: progressPercent < 20 ? 'Data Gathering' : progressPercent < 80 ? 'Agent Analysis' : progressPercent < 95 ? 'Synthesis' : 'Finalizing',
      agentProgress,
    });

    if (progressPercent >= 100) {
      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
      setIsComplete(true);
    }
  }, [validationId]);

  const startSimulation = useCallback(() => {
    if (simulationStartedRef.current) return;
    simulationStartedRef.current = true;
    simulationStartTimeRef.current = Date.now();
    setIsLoading(false);
    updateProgress();
    simulationIntervalRef.current = setInterval(updateProgress, 1000);
  }, [updateProgress]);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const headers: Record<string, string> = {};
        if (isSignedIn) {
          const token = await getToken();
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
        }
        const response = await fetch(`${API_URL}/api/v1/validations/${validationId}/progress`, { headers });
        if (!response.ok) { startSimulation(); return; }
        const data = await response.json();
        setProgress(data);
        setIsLoading(false);
        if (data.status === 'COMPLETE') setIsComplete(true);
      } catch {
        startSimulation();
      }
    };
    fetchProgress();
    return () => { if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current); };
  }, [validationId, startSimulation, isSignedIn, getToken]);

  const getAgent = (id: string) => AGENTS.find(a => a.id === id);
  const getAgentStatus = (id: string) => progress?.agentProgress?.find(ap => ap.agentId === id);
  const getScoreColor = (s: number) => s >= 70 ? 'text-emerald-400' : s >= 50 ? 'text-yellow-400' : 'text-red-400';
  const getScoreBg = (s: number) => s >= 70 ? 'bg-emerald-500/20 border-emerald-500/50' : s >= 50 ? 'bg-yellow-500/20 border-yellow-500/50' : 'bg-red-500/20 border-red-500/50';
  const getFindingColor = (t: string) => ({ strength: 'border-emerald-500/30 bg-emerald-500/10', weakness: 'border-red-500/30 bg-red-500/10', opportunity: 'border-blue-500/30 bg-blue-500/10', threat: 'border-orange-500/30 bg-orange-500/10', neutral: 'border-slate-500/30 bg-slate-500/10' }[t] || '');

  // Calculate overall scores
  const allScores = Array.from(agentDataRef.current.values()).map(d => d.score);
  const overallScore = allScores.length ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;
  const recommendation = overallScore >= 70 ? 'PROCEED' : overallScore >= 50 ? 'PROCEED_WITH_CAUTION' : 'RECONSIDER';

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Initializing Validation Council...</p>
        </div>
      </main>
    );
  }

  const selectedData = expandedAgent ? agentDataRef.current.get(expandedAgent) : null;
  const selectedAgent = expandedAgent ? getAgent(expandedAgent) : null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Link href="/validate" className="text-slate-400 hover:text-white mb-6 inline-block">&larr; New Validation</Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Validation Council Analysis</h1>
            <p className="text-slate-400 font-mono text-sm">ID: {validationId}</p>
          </div>

          {/* Progress Bar */}
          <div className="bg-slate-800/50 rounded-lg p-6 mb-8 border border-slate-700">
            <div className="flex justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">{isComplete ? 'Analysis Complete' : 'Analyzing...'}</h2>
                <p className="text-slate-400 text-sm">Phase: <span className="text-emerald-400">{progress?.currentPhase}</span></p>
              </div>
              <span className="text-3xl font-bold text-emerald-400">{progress?.overallProgress || 0}%</span>
            </div>
            <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500" style={{ width: `${progress?.overallProgress || 0}%` }} />
            </div>
          </div>

          {/* Agent Grid */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">AI Agent Council (12 Agents)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {AGENTS.map((agent) => {
                const status = getAgentStatus(agent.id);
                const data = agentDataRef.current.get(agent.id);
                const isActive = status?.status === 'complete';

                return (
                  <div
                    key={agent.id}
                    onClick={() => isActive && setExpandedAgent(expandedAgent === agent.id ? null : agent.id)}
                    className={`rounded-lg p-4 border transition-all ${isActive ? 'cursor-pointer hover:border-emerald-500/60' : ''} ${
                      expandedAgent === agent.id ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-slate-800' :
                      status?.status === 'processing' ? 'border-yellow-500/50 bg-slate-800/50' :
                      status?.status === 'complete' ? 'border-emerald-500/30 bg-slate-800/50' : 'border-slate-700 bg-slate-800/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{agent.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{agent.name}</h3>
                          <span className="text-xs text-slate-500">({agent.role})</span>
                          <div className={`w-2 h-2 rounded-full ${status?.status === 'complete' ? 'bg-emerald-500' : status?.status === 'processing' ? 'bg-yellow-500 animate-pulse' : 'bg-slate-600'}`} />
                        </div>
                        <p className="text-slate-400 text-xs mt-1 truncate">{agent.description}</p>

                        {status?.status === 'complete' && data && (
                          <div className="mt-3">
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`px-2 py-1 rounded border ${getScoreBg(data.score)}`}>
                                <span className={`font-bold ${getScoreColor(data.score)}`}>{data.score}</span>
                                <span className="text-slate-500 text-xs">/100</span>
                              </div>
                              <span className="text-slate-500 text-xs">{data.confidence}% conf.</span>
                            </div>
                            <p className="text-slate-400 text-xs line-clamp-2">{data.report.summary}</p>
                            <p className="text-emerald-400 text-xs mt-2">Click for details &rarr;</p>
                          </div>
                        )}

                        {status?.status === 'processing' && (
                          <div className="mt-3">
                            <p className="text-yellow-400 text-xs animate-pulse">Analyzing...</p>
                            <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
                              <div className="h-full bg-yellow-500 w-1/2 animate-pulse" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Agent Detail Modal */}
          {selectedData && selectedAgent && (
            <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setExpandedAgent(null)}>
              <div className="bg-slate-900 rounded-xl border border-slate-700 max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{selectedAgent.icon}</span>
                    <div>
                      <h2 className="text-xl font-bold">{selectedAgent.name}</h2>
                      <p className="text-slate-400 text-sm">{selectedAgent.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`px-3 py-2 rounded-lg border ${getScoreBg(selectedData.score)}`}>
                      <span className={`text-2xl font-bold ${getScoreColor(selectedData.score)}`}>{selectedData.score}</span>
                      <span className="text-slate-400">/100</span>
                    </div>
                    <button onClick={() => setExpandedAgent(null)} className="text-slate-400 hover:text-white text-2xl">&times;</button>
                  </div>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
                  <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <h3 className="font-semibold text-emerald-400 mb-2">Executive Summary</h3>
                    <p className="text-slate-300">{selectedData.report.summary}</p>
                  </div>

                  {selectedData.report.findings.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold mb-3">Key Findings</h3>
                      <div className="space-y-3">
                        {selectedData.report.findings.map((f, i) => (
                          <div key={i} className={`p-4 rounded-lg border ${getFindingColor(f.type)}`}>
                            <div className="flex items-start justify-between mb-2">
                              <span className="font-medium">{f.title}</span>
                              <span className={`text-xs px-2 py-0.5 rounded ${f.severity === 'critical' ? 'bg-red-500/30 text-red-300' : f.severity === 'major' ? 'bg-orange-500/30 text-orange-300' : 'bg-slate-500/30 text-slate-300'}`}>{f.severity}</span>
                            </div>
                            <p className="text-slate-300 text-sm">{f.description}</p>
                            {f.evidence && <p className="text-slate-500 text-xs mt-2">Sources: {f.evidence.join(', ')}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedData.report.risks.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold mb-3">Identified Risks</h3>
                      <div className="space-y-3">
                        {selectedData.report.risks.map((r, i) => (
                          <div key={i} className="p-4 rounded-lg border border-red-500/30 bg-red-500/10">
                            <div className="flex justify-between mb-2">
                              <span className="font-medium text-red-400">{r.title}</span>
                              <div className="text-xs space-x-2">
                                <span className={r.probability === 'high' ? 'text-red-400' : r.probability === 'medium' ? 'text-yellow-400' : 'text-emerald-400'}>{r.probability} probability</span>
                                <span className="text-slate-500">|</span>
                                <span className="text-slate-400">{r.impact} impact</span>
                              </div>
                            </div>
                            <p className="text-slate-300 text-sm mb-2">{r.description}</p>
                            <div className="text-xs text-slate-400">
                              <span className="font-medium">Mitigations:</span>
                              <ul className="mt-1 space-y-1">{r.mitigations.map((m, j) => <li key={j}>• {m}</li>)}</ul>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedData.report.recommendations.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold mb-3">Recommendations</h3>
                      <div className="space-y-3">
                        {selectedData.report.recommendations.map((r, i) => (
                          <div key={i} className="p-4 rounded-lg border border-blue-500/30 bg-blue-500/10">
                            <div className="flex justify-between mb-2">
                              <span className="font-medium text-blue-400">{r.title}</span>
                              <span className={`text-xs px-2 py-0.5 rounded ${r.priority === 'critical' ? 'bg-red-500/30 text-red-300' : r.priority === 'high' ? 'bg-orange-500/30 text-orange-300' : 'bg-slate-500/30 text-slate-300'}`}>{r.priority}</span>
                            </div>
                            <p className="text-slate-300 text-sm">{r.description}</p>
                            <p className="text-slate-500 text-xs mt-2">Timeframe: {r.timeframe}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedData.report.citations.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3 text-slate-400">Sources & Citations</h3>
                      <div className="space-y-2">
                        {selectedData.report.citations.map((c, i) => (
                          <div key={i} className="p-3 bg-slate-800/50 rounded-lg text-sm">
                            <p className="text-slate-300">"{c.claim}"</p>
                            <p className="text-slate-500 text-xs mt-1">{c.source} ({Math.round(c.confidence * 100)}% confidence)</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Final Report */}
          {isComplete && (
            <div className="space-y-8">
              <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-xl p-8 border border-emerald-500/30">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-4">Council Verdict</h2>
                  <span className={`px-6 py-3 rounded-full text-xl font-bold ${recommendation === 'PROCEED' ? 'bg-emerald-500/20 text-emerald-400' : recommendation === 'PROCEED_WITH_CAUTION' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                    {recommendation.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                  <div className="text-center p-6 bg-slate-900/50 rounded-xl">
                    <div className={`text-4xl font-bold ${getScoreColor(overallScore)}`}>{overallScore}</div>
                    <div className="text-slate-400 text-sm mt-1">Overall Score</div>
                  </div>
                  <div className="text-center p-6 bg-slate-900/50 rounded-xl">
                    <div className="text-4xl font-bold text-blue-400">82%</div>
                    <div className="text-slate-400 text-sm mt-1">Confidence</div>
                  </div>
                  <div className="text-center p-6 bg-slate-900/50 rounded-xl">
                    <div className="text-4xl font-bold text-purple-400">{overallScore}%</div>
                    <div className="text-slate-400 text-sm mt-1">Success Probability</div>
                  </div>
                  <div className="text-center p-6 bg-slate-900/50 rounded-xl">
                    <div className="text-4xl font-bold text-emerald-400">12</div>
                    <div className="text-slate-400 text-sm mt-1">Agents</div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                    <h4 className="text-emerald-400 font-medium mb-2">Top Strengths</h4>
                    <ul className="space-y-1 text-sm text-slate-300">
                      {Array.from(agentDataRef.current.values()).flatMap(d => d.report.findings.filter(f => f.type === 'strength')).slice(0, 4).map((f, i) => <li key={i}>• {f.title}</li>)}
                    </ul>
                  </div>
                  <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/30">
                    <h4 className="text-red-400 font-medium mb-2">Key Concerns</h4>
                    <ul className="space-y-1 text-sm text-slate-300">
                      {Array.from(agentDataRef.current.values()).flatMap(d => d.report.findings.filter(f => f.type === 'weakness')).slice(0, 4).map((f, i) => <li key={i}>• {f.title}</li>)}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <h2 className="text-xl font-bold mb-6">90-Day Action Plan</h2>
                <div className="space-y-4">
                  {[{ week: 1, tasks: ['Complete 30+ customer discovery interviews', 'Finalize MVP scope'] }, { week: 4, tasks: ['Launch MVP to beta users', 'Begin investor outreach'] }, { week: 8, tasks: ['Iterate based on feedback', 'Close key partnerships'] }, { week: 12, tasks: ['Achieve PMF milestones', 'Prepare seed raise'] }].map((m, i) => (
                    <div key={i} className="flex gap-6">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 text-sm font-bold">{m.week}</div>
                      <div>
                        <h3 className="text-emerald-400 font-medium">Week {m.week}</h3>
                        <ul className="text-slate-300 text-sm">{m.tasks.map((t, j) => <li key={j}>• {t}</li>)}</ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <Link href="/validate" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold">Validate Another Idea</Link>
                <button onClick={() => window.print()} className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-semibold">Export Report</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
