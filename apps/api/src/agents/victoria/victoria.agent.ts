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

interface SynthesisOutput {
  overallScore: number;
  scoreBreakdown: Record<string, number>;
  verdict: 'strong_proceed' | 'proceed_with_caution' | 'pivot_recommended' | 'do_not_proceed';
  verdictRationale: string;
  keyStrengths: string[];
  keyWeaknesses: string[];
  criticalRisks: string[];
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
    agentReports: AgentReport[]
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

    // Step 4: Generate 90-day action plan
    const ninetyDayPlan = this.generateNinetyDayPlan(agentReports, verdict);

    // Step 5: Write executive summary
    const executiveSummary = this.writeExecutiveSummary(
      overallScore,
      verdict,
      keyStrengths,
      keyWeaknesses,
      criticalRisks
    );

    const output: SynthesisOutput = {
      overallScore,
      scoreBreakdown,
      verdict,
      verdictRationale,
      keyStrengths,
      keyWeaknesses,
      criticalRisks,
      ninetyDayPlan,
      executiveSummary,
    };

    // Save synthesis to database
    await this.saveSynthesis(validationId, output);

    this.logger.log(`Synthesis complete: verdict=${verdict}, score=${overallScore}`);
    return output;
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
    criticalRisks: string[]
  ): string {
    const verdictText: Record<string, string> = {
      strong_proceed: 'STRONG PROCEED - This venture shows strong fundamentals',
      proceed_with_caution: 'PROCEED WITH CAUTION - Viable but has notable risks',
      pivot_recommended: 'PIVOT RECOMMENDED - Core assumptions need revision',
      do_not_proceed: 'DO NOT PROCEED - Critical blockers identified',
    };

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
    if (output.ninetyDayPlan) {
      await this.prisma.ninetyDayPlan.upsert({
        where: { validationId },
        create: {
          validationId,
          phases: output.ninetyDayPlan.phases as any || [],
          milestones: output.ninetyDayPlan.milestones as any || [],
          validationGates: output.ninetyDayPlan.validationGates as any || [],
          estimatedCost: output.ninetyDayPlan.estimatedCost || 0,
          criticalPath: output.ninetyDayPlan.criticalPath || [],
        },
        update: {
          phases: output.ninetyDayPlan.phases as any || [],
          milestones: output.ninetyDayPlan.milestones as any || [],
          validationGates: output.ninetyDayPlan.validationGates as any || [],
          estimatedCost: output.ninetyDayPlan.estimatedCost || 0,
          criticalPath: output.ninetyDayPlan.criticalPath || [],
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
