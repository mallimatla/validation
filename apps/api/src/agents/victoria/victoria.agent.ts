/**
 * Victoria - Chief Synthesis Officer
 *
 * Purpose: Synthesizes all agent outputs into a cohesive final report and 90-day action plan.
 * Personality: Big-picture thinker, integrative, balanced perspective.
 * Scoring Weight: 0 (synthesis agent, does not contribute to validation score)
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  FALSE_POSITIVE_PATTERNS,
  CONTRARIAN_SUCCESS_PATTERNS,
  CB_INSIGHTS_FAILURE_CAUSES,
  FAMOUS_REJECTIONS,
} from '../validation-framework.constants';

interface AgentReport {
  agentId: string;
  agentName: string;
  score: number;
  weight: number;
  findings: Finding[];
  risks: Risk[];
  recommendations: Recommendation[];
  rawAnalysis: string;
}

interface Finding {
  title: string;
  description: string;
  type: 'strength' | 'weakness' | 'neutral';
  severity: 'critical' | 'major' | 'minor' | 'info';
  confidence: number;
}

interface Risk {
  title: string;
  description: string;
  category: string;
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

interface NinetyDayAction {
  week: number;
  title: string;
  description: string;
  category: 'validation' | 'product' | 'market' | 'team' | 'funding' | 'legal';
  priority: 'critical' | 'high' | 'medium' | 'low';
  dependencies: string[];
  successMetric: string;
}

interface PatternAnomaly {
  type: 'false_positive_warning' | 'contrarian_opportunity' | 'famous_rejection_parallel';
  pattern: string;
  evidence: string;
  recommendation: string;
}

interface SynthesisOutput {
  overallScore: number;
  scoreBreakdown: Record<string, number>;
  verdict: 'strong_proceed' | 'proceed_with_caution' | 'pivot_recommended' | 'do_not_proceed';
  verdictRationale: string;
  keyStrengths: string[];
  keyWeaknesses: string[];
  criticalRisks: string[];
  patternAnomalies: PatternAnomaly[];
  ninetyDayPlan: NinetyDayAction[];
  executiveSummary: string;
}

@Injectable()
export class VictoriaAgent {
  private readonly logger = new Logger(VictoriaAgent.name);

  readonly agentId = 'victoria';
  readonly agentName = 'Victoria';
  readonly agentVersion = '1.0.0';
  readonly scoringWeight = 0; // Synthesis agent doesn't contribute to score

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async synthesize(
    validationId: string,
    agentReports: AgentReport[],
    ideaContext?: { description?: string; industry?: string; title?: string }
  ): Promise<SynthesisOutput> {
    this.logger.log(`Starting synthesis for validation ${validationId}`);

    // Step 1: Calculate weighted overall score
    const { overallScore, scoreBreakdown } = this.calculateOverallScore(agentReports);

    // Step 2: Determine verdict
    const { verdict, verdictRationale } = this.determineVerdict(agentReports, overallScore);

    // Step 3: Extract key insights
    const keyStrengths = this.extractKeyStrengths(agentReports);
    const keyWeaknesses = this.extractKeyWeaknesses(agentReports);
    const criticalRisks = this.extractCriticalRisks(agentReports);

    // Step 4: Detect pattern anomalies (false positives, contrarian opportunities)
    const patternAnomalies = this.detectPatternAnomalies(agentReports, ideaContext);

    // Step 5: Generate 90-day action plan
    const ninetyDayPlan = this.generateNinetyDayPlan(agentReports, verdict);

    // Step 6: Write executive summary
    const executiveSummary = this.writeExecutiveSummary(
      overallScore,
      verdict,
      keyStrengths,
      keyWeaknesses,
      criticalRisks,
      patternAnomalies
    );

    const output: SynthesisOutput = {
      overallScore,
      scoreBreakdown,
      verdict,
      verdictRationale,
      keyStrengths,
      keyWeaknesses,
      criticalRisks,
      patternAnomalies,
      ninetyDayPlan,
      executiveSummary,
    };

    // Save synthesis to database
    await this.saveSynthesis(validationId, output);

    this.logger.log(`Synthesis complete: verdict=${verdict}, score=${overallScore}, anomalies=${patternAnomalies.length}`);
    return output;
  }

  /**
   * Detect pattern anomalies: false positive warnings and contrarian opportunities
   * Based on: Theranos/FTX/WeWork patterns, Airbnb/Uber/Stripe early rejections
   */
  private detectPatternAnomalies(
    agentReports: AgentReport[],
    ideaContext?: { description?: string; industry?: string; title?: string }
  ): PatternAnomaly[] {
    const anomalies: PatternAnomaly[] = [];
    const desc = (ideaContext?.description || '').toLowerCase();
    const industry = (ideaContext?.industry || '').toLowerCase();

    // Check for FALSE POSITIVE PATTERNS (high scores that mask real issues)
    // These are Theranos/FTX/WeWork warning signs

    // Pattern 1: Charismatic storytelling with weak substance
    const hasCharismaticPattern = this.checkCharismaticPattern(agentReports);
    if (hasCharismaticPattern) {
      anomalies.push({
        type: 'false_positive_warning',
        pattern: FALSE_POSITIVE_PATTERNS.theranos.pattern,
        evidence: 'High presentation scores with weak technical validation. Theranos pattern detected.',
        recommendation: 'Require independent technical verification. Insist on live product demos, not presentations.',
      });
    }

    // Pattern 2: Metrics that don't tie to revenue
    const hasVanityMetrics = this.checkVanityMetrics(agentReports);
    if (hasVanityMetrics) {
      anomalies.push({
        type: 'false_positive_warning',
        pattern: FALSE_POSITIVE_PATTERNS.wework.pattern,
        evidence: 'Growth metrics don\'t correlate with path to profitability. WeWork pattern detected.',
        recommendation: 'Ask: How does each metric contribute to unit economics? Demand clear revenue causation.',
      });
    }

    // Pattern 3: Complexity masking simple fraud
    const hasComplexityPattern = this.checkComplexityPattern(agentReports, industry);
    if (hasComplexityPattern) {
      anomalies.push({
        type: 'false_positive_warning',
        pattern: FALSE_POSITIVE_PATTERNS.ftx.pattern,
        evidence: 'Business model complexity makes verification difficult. FTX/Enron pattern detected.',
        recommendation: 'Require simplified explanation. If it can\'t be explained simply, it may be hiding problems.',
      });
    }

    // Check for CONTRARIAN OPPORTUNITIES (low scores that might miss real potential)
    // These are Airbnb/Uber/Stripe early rejection patterns

    // Pattern 1: "Strangers won't do X" (Airbnb pattern)
    if (desc.includes('share') || desc.includes('peer') || desc.includes('trust')) {
      const lowMarketScore = agentReports.find(r => r.agentId === 'marcus' && r.score < 5);
      if (lowMarketScore) {
        anomalies.push({
          type: 'famous_rejection_parallel',
          pattern: `Similar to ${FAMOUS_REJECTIONS.airbnb.company}`,
          evidence: `VCs rejected Airbnb saying "${FAMOUS_REJECTIONS.airbnb.rejection_reason}". Current TAM: ${FAMOUS_REJECTIONS.airbnb.current_outcome}.`,
          recommendation: 'Consider: Are we underestimating behavior change potential? Look at early adopter enthusiasm.',
        });
      }
    }

    // Pattern 2: "Illegal/regulated" concerns (Uber pattern)
    if (industry.includes('transport') || industry.includes('mobility') || desc.includes('regulated')) {
      const lowLegalScore = agentReports.find(r => r.agentId === 'rachel' && r.score < 5);
      if (lowLegalScore) {
        anomalies.push({
          type: 'famous_rejection_parallel',
          pattern: `Similar to ${FAMOUS_REJECTIONS.uber.company}`,
          evidence: `VCs rejected Uber saying "${FAMOUS_REJECTIONS.uber.rejection_reason}". Current TAM: ${FAMOUS_REJECTIONS.uber.current_outcome}.`,
          recommendation: 'Consider: Is this "illegal" or just "not yet regulated"? Regulatory can follow demand.',
        });
      }
    }

    // Pattern 3: "Market too small/niche" (Stripe pattern)
    const lowMarket = agentReports.find(r => r.agentId === 'marcus' && r.score < 5);
    if (lowMarket && (desc.includes('developer') || desc.includes('api') || industry.includes('fintech'))) {
      anomalies.push({
        type: 'famous_rejection_parallel',
        pattern: `Similar to ${FAMOUS_REJECTIONS.stripe.company}`,
        evidence: `Many VCs rejected Stripe. ${FAMOUS_REJECTIONS.stripe.rejection_reason}. Current TAM: ${FAMOUS_REJECTIONS.stripe.current_outcome}.`,
        recommendation: 'Consider: Is the "small market" actually a gateway to a much larger one?',
      });
    }

    // CONTRARIAN SUCCESS PATTERNS
    // Check for positive contrarian signals

    // Pattern 1: Market timing skepticism but strong founder
    const strongFounder = agentReports.find(r => r.agentId === 'james' && r.score >= 7);
    const marketSkepticism = agentReports.find(r => r.agentId === 'marcus' && r.score < 5);
    if (strongFounder && marketSkepticism) {
      anomalies.push({
        type: 'contrarian_opportunity',
        pattern: CONTRARIAN_SUCCESS_PATTERNS.market_timing_contrarian,
        evidence: 'Strong founder with market timing doubts. Many unicorns were "too early" - Airbnb launched 2008 recession.',
        recommendation: 'Assess if founder can survive long enough for market to catch up. Patient capital may be appropriate.',
      });
    }

    // Pattern 2: Expert dismissal but user love
    const strongPMF = agentReports.find(r => r.agentId === 'elena' && r.score >= 7);
    const expertSkepticism = agentReports.filter(r => r.score < 5).length >= 2;
    if (strongPMF && expertSkepticism) {
      anomalies.push({
        type: 'contrarian_opportunity',
        pattern: CONTRARIAN_SUCCESS_PATTERNS.expert_dismissal,
        evidence: 'Users love it but experts are skeptical. This is a classic early-stage pattern for category creators.',
        recommendation: 'Trust user behavior over expert opinion. Double down on user acquisition data.',
      });
    }

    return anomalies;
  }

  private checkCharismaticPattern(agentReports: AgentReport[]): boolean {
    // Look for high team score but weak technical/financial validation
    const teamScore = agentReports.find(r => r.agentId === 'james')?.score || 0;
    const techScore = agentReports.find(r => r.agentId === 'omar')?.score || 5;
    const finScore = agentReports.find(r => r.agentId === 'david')?.score || 5;

    return teamScore >= 8 && (techScore < 4 || finScore < 4);
  }

  private checkVanityMetrics(agentReports: AgentReport[]): boolean {
    // High market/growth claims but weak unit economics
    const marketScore = agentReports.find(r => r.agentId === 'marcus')?.score || 0;
    const finScore = agentReports.find(r => r.agentId === 'david')?.score || 5;
    const pmfScore = agentReports.find(r => r.agentId === 'elena')?.score || 5;

    return marketScore >= 7 && finScore < 4 && pmfScore < 5;
  }

  private checkComplexityPattern(agentReports: AgentReport[], industry: string): boolean {
    // High complexity industries with inconsistent agent scores
    const complexIndustries = ['crypto', 'defi', 'trading', 'derivatives', 'structured'];
    const isComplex = complexIndustries.some(c => industry.includes(c));

    if (!isComplex) return false;

    // Check for high variance in agent scores (sign of confusion)
    const scores = agentReports.filter(r => r.weight > 0).map(r => r.score);
    if (scores.length < 3) return false;

    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;

    return variance > 6; // High variance suggests agents can't agree on fundamentals
  }

  private calculateOverallScore(agentReports: AgentReport[]): {
    overallScore: number;
    scoreBreakdown: Record<string, number>;
  } {
    const scoreBreakdown: Record<string, number> = {};
    let totalWeight = 0;
    let weightedSum = 0;

    for (const report of agentReports) {
      if (report.weight > 0) {
        scoreBreakdown[report.agentId] = report.score;
        weightedSum += report.score * report.weight;
        totalWeight += report.weight;
      }
    }

    const overallScore = totalWeight > 0
      ? Math.round((weightedSum / totalWeight) * 10) / 10
      : 5;

    return { overallScore, scoreBreakdown };
  }

  private determineVerdict(
    agentReports: AgentReport[],
    overallScore: number
  ): { verdict: SynthesisOutput['verdict']; verdictRationale: string } {
    // Count critical issues
    const criticalFindings = agentReports.flatMap(r =>
      r.findings.filter(f => f.type === 'weakness' && f.severity === 'critical')
    );
    const criticalRisks = agentReports.flatMap(r =>
      r.risks.filter(risk => risk.impact === 'critical' && risk.probability === 'high')
    );

    // Check for deal breakers
    const hasDealBreakers = criticalFindings.length >= 2 || criticalRisks.length >= 2;

    // Check Elena's PMF assessment (highest weight)
    const elenaReport = agentReports.find(r => r.agentId === 'elena');
    const lowPMF = elenaReport && elenaReport.score < 5;

    // Check for funding concerns
    const davidReport = agentReports.find(r => r.agentId === 'david');
    const fundingConcern = davidReport && davidReport.score < 4;

    let verdict: SynthesisOutput['verdict'];
    let verdictRationale: string;

    if (hasDealBreakers || (lowPMF && fundingConcern)) {
      verdict = 'do_not_proceed';
      verdictRationale = 'Multiple critical risks identified that pose existential threat to venture success.';
    } else if (overallScore < 4 || criticalFindings.length >= 1) {
      verdict = 'pivot_recommended';
      verdictRationale = 'Core assumptions need to be revised before proceeding. Consider pivoting approach.';
    } else if (overallScore < 6.5 || criticalRisks.length >= 1) {
      verdict = 'proceed_with_caution';
      verdictRationale = 'Viable opportunity with notable risks. Proceed while addressing key concerns.';
    } else {
      verdict = 'strong_proceed';
      verdictRationale = 'Strong fundamentals across all dimensions. Proceed with confidence.';
    }

    return { verdict, verdictRationale };
  }

  private extractKeyStrengths(agentReports: AgentReport[]): string[] {
    const strengths: { text: string; confidence: number }[] = [];

    for (const report of agentReports) {
      for (const finding of report.findings) {
        if (finding.type === 'strength' && finding.severity !== 'info') {
          strengths.push({
            text: `${finding.title}: ${finding.description}`,
            confidence: finding.confidence,
          });
        }
      }
    }

    // Sort by confidence and take top 5
    return strengths
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5)
      .map(s => s.text);
  }

  private extractKeyWeaknesses(agentReports: AgentReport[]): string[] {
    const weaknesses: { text: string; severity: number; confidence: number }[] = [];

    const severityScore: Record<string, number> = {
      critical: 4,
      major: 3,
      minor: 2,
      info: 1,
    };

    for (const report of agentReports) {
      for (const finding of report.findings) {
        if (finding.type === 'weakness') {
          weaknesses.push({
            text: `${finding.title}: ${finding.description}`,
            severity: severityScore[finding.severity] || 1,
            confidence: finding.confidence,
          });
        }
      }
    }

    // Sort by severity * confidence and take top 5
    return weaknesses
      .sort((a, b) => (b.severity * b.confidence) - (a.severity * a.confidence))
      .slice(0, 5)
      .map(w => w.text);
  }

  private extractCriticalRisks(agentReports: AgentReport[]): string[] {
    const criticalRisks: string[] = [];

    for (const report of agentReports) {
      for (const risk of report.risks) {
        if (risk.impact === 'critical' || risk.probability === 'high') {
          criticalRisks.push(`${risk.title}: ${risk.description}`);
        }
      }
    }

    return criticalRisks.slice(0, 7);
  }

  private generateNinetyDayPlan(
    agentReports: AgentReport[],
    verdict: SynthesisOutput['verdict']
  ): NinetyDayAction[] {
    const plan: NinetyDayAction[] = [];
    let week = 1;

    // Collect all recommendations with priorities
    const allRecommendations: Array<Recommendation & { agentId: string }> = [];
    for (const report of agentReports) {
      for (const rec of report.recommendations) {
        allRecommendations.push({ ...rec, agentId: report.agentId });
      }
    }

    // Week 1-2: Critical validation (if needed)
    if (verdict === 'pivot_recommended' || verdict === 'proceed_with_caution') {
      plan.push({
        week: 1,
        title: 'Validate Critical Assumptions',
        description: 'Test the most critical assumptions before investing further',
        category: 'validation',
        priority: 'critical',
        dependencies: [],
        successMetric: 'Clear go/no-go decision on core assumptions',
      });
    }

    // Week 1-2: Customer validation (always important)
    plan.push({
      week: 1,
      title: 'Customer Discovery Interviews',
      description: 'Conduct 10+ customer discovery interviews',
      category: 'validation',
      priority: 'critical',
      dependencies: [],
      successMetric: '10 interviews completed with documented insights',
    });

    // Week 2-3: MVP planning
    plan.push({
      week: 2,
      title: 'Define MVP Scope',
      description: 'Define minimum viable product with core features only',
      category: 'product',
      priority: 'high',
      dependencies: ['Customer Discovery Interviews'],
      successMetric: 'MVP spec document approved',
    });

    // Week 3-6: Build MVP
    plan.push({
      week: 3,
      title: 'Build MVP',
      description: 'Develop minimum viable product for testing',
      category: 'product',
      priority: 'high',
      dependencies: ['Define MVP Scope'],
      successMetric: 'Functional MVP ready for user testing',
    });

    // Week 4-6: Market positioning
    plan.push({
      week: 4,
      title: 'Market Positioning',
      description: 'Define clear positioning and messaging',
      category: 'market',
      priority: 'high',
      dependencies: ['Customer Discovery Interviews'],
      successMetric: 'Positioning document and one-liner completed',
    });

    // Week 5-8: Beta testing
    plan.push({
      week: 5,
      title: 'Beta User Testing',
      description: 'Test MVP with 10-20 beta users',
      category: 'validation',
      priority: 'high',
      dependencies: ['Build MVP'],
      successMetric: 'Beta feedback collected and NPS measured',
    });

    // Week 6-8: Team building (if needed)
    const jamesReport = agentReports.find(r => r.agentId === 'james');
    if (jamesReport && jamesReport.score < 6) {
      plan.push({
        week: 6,
        title: 'Address Team Gaps',
        description: 'Recruit for critical skill gaps or find co-founder',
        category: 'team',
        priority: 'high',
        dependencies: [],
        successMetric: 'Key hire or co-founder identified',
      });
    }

    // Week 7-9: Legal setup
    const rachelReport = agentReports.find(r => r.agentId === 'rachel');
    if (rachelReport) {
      plan.push({
        week: 7,
        title: 'Legal Foundation',
        description: 'Complete incorporation, IP protection, and compliance setup',
        category: 'legal',
        priority: 'medium',
        dependencies: [],
        successMetric: 'Legal entity formed and IP protected',
      });
    }

    // Week 8-10: Iterate based on feedback
    plan.push({
      week: 8,
      title: 'Iterate on Feedback',
      description: 'Incorporate beta user feedback into product',
      category: 'product',
      priority: 'high',
      dependencies: ['Beta User Testing'],
      successMetric: 'Top 3 user requests implemented',
    });

    // Week 9-11: Early revenue or metrics
    plan.push({
      week: 9,
      title: 'Generate Traction Metrics',
      description: 'Focus on metrics that demonstrate product-market fit',
      category: 'market',
      priority: 'high',
      dependencies: ['Iterate on Feedback'],
      successMetric: 'Key metrics showing growth trend',
    });

    // Week 10-12: Funding preparation (if applicable)
    const noraReport = agentReports.find(r => r.agentId === 'nora');
    if (noraReport) {
      plan.push({
        week: 10,
        title: 'Prepare Funding Materials',
        description: 'Create pitch deck and financial model',
        category: 'funding',
        priority: 'medium',
        dependencies: ['Generate Traction Metrics'],
        successMetric: 'Investor-ready deck completed',
      });
    }

    // Week 11-13: Launch preparation
    plan.push({
      week: 11,
      title: 'Launch Preparation',
      description: 'Prepare for public launch with marketing and PR',
      category: 'market',
      priority: 'high',
      dependencies: ['Iterate on Feedback'],
      successMetric: 'Launch plan finalized',
    });

    // Week 12-13: Launch
    plan.push({
      week: 12,
      title: 'Public Launch',
      description: 'Execute public launch strategy',
      category: 'market',
      priority: 'critical',
      dependencies: ['Launch Preparation'],
      successMetric: 'Successful launch with target users acquired',
    });

    return plan;
  }

  private writeExecutiveSummary(
    overallScore: number,
    verdict: SynthesisOutput['verdict'],
    keyStrengths: string[],
    keyWeaknesses: string[],
    criticalRisks: string[],
    patternAnomalies: PatternAnomaly[] = []
  ): string {
    const verdictText: Record<string, string> = {
      strong_proceed: 'STRONG PROCEED - This venture shows strong fundamentals',
      proceed_with_caution: 'PROCEED WITH CAUTION - Viable but has notable risks',
      pivot_recommended: 'PIVOT RECOMMENDED - Core assumptions need revision',
      do_not_proceed: 'DO NOT PROCEED - Critical blockers identified',
    };

    // Add pattern anomaly sections
    const falsePositiveWarnings = patternAnomalies.filter(a => a.type === 'false_positive_warning');
    const contrarianOpportunities = patternAnomalies.filter(a => a.type === 'contrarian_opportunity' || a.type === 'famous_rejection_parallel');

    let patternSection = '';

    if (falsePositiveWarnings.length > 0) {
      patternSection += `\n### ⚠️ False Positive Warnings
${falsePositiveWarnings.map((w, i) => `${i + 1}. **${w.pattern}**: ${w.evidence}\n   → ${w.recommendation}`).join('\n\n')}
`;
    }

    if (contrarianOpportunities.length > 0) {
      patternSection += `\n### 🔍 Contrarian Analysis
${contrarianOpportunities.map((o, i) => `${i + 1}. **${o.pattern}**: ${o.evidence}\n   → ${o.recommendation}`).join('\n\n')}
`;
    }

    return `
## Executive Summary

**Overall Score: ${overallScore}/10**
**Verdict: ${verdictText[verdict]}**

### Key Strengths
${keyStrengths.map((s, i) => `${i + 1}. ${s}`).join('\n')}

### Key Concerns
${keyWeaknesses.map((w, i) => `${i + 1}. ${w}`).join('\n')}

### Critical Risks
${criticalRisks.map((r, i) => `${i + 1}. ${r}`).join('\n')}
${patternSection}
### Context: Top Startup Failure Causes (CB Insights)
1. No market need (${(CB_INSIGHTS_FAILURE_CAUSES.no_market_need.percentage * 100).toFixed(0)}%)
2. Ran out of cash (${(CB_INSIGHTS_FAILURE_CAUSES.ran_out_of_cash.percentage * 100).toFixed(0)}%)
3. Not the right team (${(CB_INSIGHTS_FAILURE_CAUSES.not_right_team.percentage * 100).toFixed(0)}%)
4. Got outcompeted (${(CB_INSIGHTS_FAILURE_CAUSES.got_outcompeted.percentage * 100).toFixed(0)}%)
5. Pricing/cost issues (${(CB_INSIGHTS_FAILURE_CAUSES.pricing_cost_issues.percentage * 100).toFixed(0)}%)

### Next Steps
Follow the 90-day action plan to systematically validate assumptions, build product, and achieve traction milestones.
    `.trim();
  }

  private async saveSynthesis(validationId: string, output: SynthesisOutput): Promise<void> {
    await this.prisma.validation.update({
      where: { id: validationId },
      data: {
        overallScore: output.overallScore,
        verdict: output.verdict,
        verdictRationale: output.verdictRationale,
        executiveSummary: output.executiveSummary,
        status: 'COMPLETE',
        completedAt: new Date(),
      },
    });

    // Store ninety day plan in the related model if provided
    if (output.ninetyDayPlan && output.ninetyDayPlan.length > 0) {
      // Convert NinetyDayAction[] array to structured plan format
      const planData = {
        phases: output.ninetyDayPlan as unknown as Record<string, unknown>[],
        milestones: [] as Record<string, unknown>[],
        validationGates: [] as Record<string, unknown>[],
        estimatedCost: 0,
        criticalPath: output.ninetyDayPlan
          .filter(action => action.priority === 'critical')
          .map(action => action.title),
      };

      await this.prisma.ninetyDayPlan.upsert({
        where: { validationId },
        create: {
          validationId,
          phases: planData.phases as any,
          milestones: planData.milestones as any,
          validationGates: planData.validationGates as any,
          estimatedCost: planData.estimatedCost,
          criticalPath: planData.criticalPath,
        },
        update: {
          phases: planData.phases as any,
          milestones: planData.milestones as any,
          validationGates: planData.validationGates as any,
          estimatedCost: planData.estimatedCost,
          criticalPath: planData.criticalPath,
        },
      });
    }

    this.eventEmitter.emit('validation.synthesized', {
      validationId,
      overallScore: output.overallScore,
      verdict: output.verdict,
    });
  }
}
