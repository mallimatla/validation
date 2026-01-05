/**
 * Elena - Chief Customer Validation Officer
 *
 * Purpose: Analyzes real customer data to determine product-market fit signals.
 * Personality: Empathetic but ruthlessly honest, can smell BS from founders.
 * Scoring Weight: 2.0x (HIGHEST - most predictive of success)
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BaseAnalysisAgent, AnalysisInput, Citation } from '../base/base-analysis.agent';

interface CustomerSignal {
  type: 'strong' | 'weak' | 'negative';
  source: string;
  description: string;
  confidence: number;
}

interface PMFMetrics {
  interviewCount: number;
  strongInterestRate: number;
  preorderCount: number;
  waitlistSize: number;
  npsScore: number | null;
  pmfScore: number;
}

@Injectable()
export class ElenaAgent extends BaseAnalysisAgent {
  protected readonly agentId = 'elena';
  protected readonly agentName = 'Elena';
  protected readonly agentVersion = '1.0.0';
  protected readonly scoringWeight = 2.0;

  private pmfMetrics: PMFMetrics | null = null;
  private signals: CustomerSignal[] = [];

  constructor(prisma: PrismaService, eventEmitter: EventEmitter2) {
    super(prisma, eventEmitter);
  }

  protected async performAnalysis(input: AnalysisInput): Promise<void> {
    this.logger.log('Starting customer validation analysis');

    // Step 1: Analyze interview data
    await this.analyzeInterviews(input);

    // Step 2: Detect strong vs weak signals
    await this.detectSignals(input);

    // Step 3: Analyze landing page / pre-order data
    await this.analyzeConversionData(input);

    // Step 4: Assess pain intensity
    await this.assessPainIntensity(input);

    // Step 5: Analyze willingness to pay
    await this.analyzeWillingnessToPay(input);

    // Step 6: Calculate PMF score
    await this.calculatePMFScore(input);

    this.buildRawAnalysis();
  }

  private async analyzeInterviews(input: AnalysisInput): Promise<void> {
    const founderData = input.founderData || {};
    const interviewCount = founderData.interviewCount || 0;

    const citation = this.addCitation({
      claim: `${interviewCount} customer interviews conducted`,
      source: 'Interview Analysis',
      sourceUrl: 'internal://elena/interview-analysis',
      confidence: interviewCount > 0 ? 0.85 : 0.3,
      dataType: interviewCount > 0 ? 'primary' : 'computed',
    });

    if (interviewCount >= 20) {
      this.addFinding({
        title: 'Strong Customer Research',
        description: `${interviewCount} interviews provides solid foundation for customer understanding`,
        type: 'strength',
        severity: 'major',
        evidence: [citation],
        confidence: 8,
      });
    } else if (interviewCount >= 10) {
      this.addFinding({
        title: 'Adequate Customer Research',
        description: `${interviewCount} interviews is a good start but more validation recommended`,
        type: 'neutral',
        severity: 'minor',
        evidence: [citation],
        confidence: 7,
      });
    } else if (interviewCount < 5) {
      this.addFinding({
        title: 'Insufficient Customer Research',
        description: `Only ${interviewCount} interviews - high risk of building wrong product`,
        type: 'weakness',
        severity: 'critical',
        evidence: [citation],
        confidence: 8,
      });

      this.addRecommendation({
        title: 'Conduct More Interviews',
        description: 'Complete at least 20 customer discovery interviews before building',
        priority: 'critical',
        timeframe: 'immediate',
        effort: 'medium',
        impact: 'high',
      });
    }

    if (!this.pmfMetrics) {
      this.pmfMetrics = {
        interviewCount,
        strongInterestRate: 0,
        preorderCount: 0,
        waitlistSize: 0,
        npsScore: null,
        pmfScore: 0,
      };
    } else {
      this.pmfMetrics.interviewCount = interviewCount;
    }
  }

  private async detectSignals(input: AnalysisInput): Promise<void> {
    const founderData = input.founderData || {};
    const strongInterestRate = founderData.strongInterestRate || this.estimateInterestRate(input);

    // Analyze for strong buying signals
    const strongSignals = [
      'asked when they can buy',
      'offered to pay for beta',
      'introduced to others',
      'followed up multiple times',
      'shared contact info unprompted',
    ];

    const weakSignals = [
      'sounds interesting',
      'I might use it',
      'let me know when it\'s ready',
      'good luck with that',
    ];

    // Detect signals from problem statement
    const problemText = (input.idea.problemStatement || input.idea.description).toLowerCase();
    const hasUrgency = ['urgent', 'critical', 'pain', 'frustrated', 'hate', 'desperate'].some(w => problemText.includes(w));

    if (hasUrgency) {
      this.signals.push({
        type: 'strong',
        source: 'Problem Statement',
        description: 'Problem described with urgency and emotional language',
        confidence: 7,
      });
    }

    const citation = this.addCitation({
      claim: `Estimated strong interest rate: ${(strongInterestRate * 100).toFixed(0)}%`,
      source: 'Signal Detection',
      sourceUrl: 'internal://elena/signal-detection',
      confidence: founderData.strongInterestRate ? 0.8 : 0.5,
      dataType: founderData.strongInterestRate ? 'primary' : 'computed',
    });

    if (strongInterestRate >= 0.4) {
      this.addFinding({
        title: 'Strong Customer Interest',
        description: `${(strongInterestRate * 100).toFixed(0)}% of prospects show strong buying signals`,
        type: 'strength',
        severity: 'major',
        evidence: [citation],
        confidence: 8,
      });
    } else if (strongInterestRate < 0.15) {
      this.addFinding({
        title: 'Weak Customer Interest',
        description: `Only ${(strongInterestRate * 100).toFixed(0)}% show strong interest - polite rejections likely`,
        type: 'weakness',
        severity: 'critical',
        evidence: [citation],
        confidence: 7,
      });

      this.addRisk({
        title: 'Product-Market Fit Risk',
        description: 'Low strong interest rate suggests problem may not be urgent enough',
        category: 'market',
        probability: 'high',
        impact: 'critical',
        mitigations: [
          'Refocus on most engaged segment',
          'Intensify the pain point addressed',
          'Consider pivot to adjacent problem',
        ],
        evidence: [citation],
      });
    }

    if (this.pmfMetrics) {
      this.pmfMetrics.strongInterestRate = strongInterestRate;
    }
  }

  private async analyzeConversionData(input: AnalysisInput): Promise<void> {
    const founderData = input.founderData || {};
    const preorderCount = founderData.preorders || founderData.preorderCount || 0;
    const waitlistSize = founderData.waitlistSize || 0;

    if (preorderCount > 0) {
      const citation = this.addCitation({
        claim: `${preorderCount} pre-orders received`,
        source: 'Pre-order Analysis',
        sourceUrl: 'internal://elena/preorder-analysis',
        confidence: 0.9,
        dataType: 'primary',
      });

      if (preorderCount >= 10) {
        this.addFinding({
          title: 'Strong Pre-order Validation',
          description: `${preorderCount} customers paid before product exists - strong demand signal`,
          type: 'strength',
          severity: 'critical',
          evidence: [citation],
          confidence: 9,
        });
      } else {
        this.addFinding({
          title: 'Early Pre-order Traction',
          description: `${preorderCount} pre-orders show initial demand validation`,
          type: 'strength',
          severity: 'minor',
          evidence: [citation],
          confidence: 8,
        });
      }
    }

    if (waitlistSize > 0) {
      const citation = this.addCitation({
        claim: `Waitlist of ${waitlistSize} potential customers`,
        source: 'Waitlist Analysis',
        sourceUrl: 'internal://elena/waitlist-analysis',
        confidence: 0.7,
        dataType: 'primary',
      });

      this.addFinding({
        title: 'Waitlist Interest',
        description: `${waitlistSize} people waiting - but waitlist != purchase intent`,
        type: waitlistSize > 100 ? 'strength' : 'neutral',
        severity: 'minor',
        evidence: [citation],
        confidence: 6,
      });
    }

    if (this.pmfMetrics) {
      this.pmfMetrics.preorderCount = preorderCount;
      this.pmfMetrics.waitlistSize = waitlistSize;
    }
  }

  private async assessPainIntensity(input: AnalysisInput): Promise<void> {
    const problem = input.idea.problemStatement || input.idea.description;
    const painIndicators = ['waste', 'lose', 'cost', 'hours', 'days', 'frustrated', 'impossible', 'broken'];
    const painScore = painIndicators.filter(i => problem.toLowerCase().includes(i)).length;

    const citation = this.addCitation({
      claim: `Pain intensity score: ${painScore}/10`,
      source: 'Pain Analysis',
      sourceUrl: 'internal://elena/pain-analysis',
      confidence: 0.6,
      dataType: 'computed',
    });

    if (painScore >= 4) {
      this.addFinding({
        title: 'High Pain Problem',
        description: 'Problem description indicates significant customer pain',
        type: 'strength',
        severity: 'major',
        evidence: [citation],
        confidence: 6,
      });
    } else if (painScore <= 1) {
      this.addFinding({
        title: 'Nice-to-Have Problem',
        description: 'Problem may not be painful enough to drive purchase behavior',
        type: 'weakness',
        severity: 'major',
        evidence: [citation],
        confidence: 5,
      });
    }
  }

  private async analyzeWillingnessToPay(input: AnalysisInput): Promise<void> {
    const founderData = input.founderData || {};
    const hasWTPData = founderData.priceValidation || founderData.willingnessToPay;

    if (hasWTPData) {
      this.addFinding({
        title: 'Price Validation Conducted',
        description: 'Founder has tested willingness to pay with target customers',
        type: 'strength',
        severity: 'minor',
        evidence: [],
        confidence: 7,
      });
    } else {
      this.addRecommendation({
        title: 'Test Pricing',
        description: 'Conduct Van Westendorp or similar pricing research with prospects',
        priority: 'high',
        timeframe: 'short-term',
        effort: 'low',
        impact: 'high',
      });
    }
  }

  private async calculatePMFScore(input: AnalysisInput): Promise<void> {
    if (!this.pmfMetrics) return;

    let pmfScore = 0;

    // Interview contribution (max 2 points)
    pmfScore += Math.min(2, this.pmfMetrics.interviewCount / 10);

    // Strong interest rate (max 3 points)
    pmfScore += this.pmfMetrics.strongInterestRate * 3;

    // Pre-orders (max 3 points)
    pmfScore += Math.min(3, this.pmfMetrics.preorderCount / 5);

    // Waitlist bonus (max 1 point)
    pmfScore += Math.min(1, this.pmfMetrics.waitlistSize / 500);

    // Signal quality bonus
    const strongSignalCount = this.signals.filter(s => s.type === 'strong').length;
    pmfScore += Math.min(1, strongSignalCount * 0.3);

    this.pmfMetrics.pmfScore = Math.min(10, pmfScore);

    const citation = this.addCitation({
      claim: `Product-Market Fit score: ${this.pmfMetrics.pmfScore.toFixed(1)}/10`,
      source: 'PMF Calculation',
      sourceUrl: 'internal://elena/pmf-score',
      confidence: 0.7,
      dataType: 'computed',
    });

    if (this.pmfMetrics.pmfScore >= 7) {
      this.addFinding({
        title: 'Strong PMF Indicators',
        description: 'Multiple signals suggest product-market fit potential',
        type: 'strength',
        severity: 'critical',
        evidence: [citation],
        confidence: 8,
      });
    } else if (this.pmfMetrics.pmfScore < 4) {
      this.addFinding({
        title: 'Weak PMF Indicators',
        description: 'Limited evidence of product-market fit - more validation needed',
        type: 'weakness',
        severity: 'critical',
        evidence: [citation],
        confidence: 7,
      });
    }
  }

  private buildRawAnalysis(): void {
    const p = this.pmfMetrics;
    this.rawAnalysis = `
# Elena - Customer Validation Report

## Product-Market Fit Metrics
- **Interview Count**: ${p?.interviewCount || 0}
- **Strong Interest Rate**: ${p ? (p.strongInterestRate * 100).toFixed(0) : 0}%
- **Pre-orders**: ${p?.preorderCount || 0}
- **Waitlist Size**: ${p?.waitlistSize || 0}
- **PMF Score**: ${p?.pmfScore.toFixed(1) || 'N/A'}/10

## Customer Signals
${this.signals.map(s => `- **${s.type.toUpperCase()}** [${s.source}]: ${s.description}`).join('\n') || 'No signals detected'}

## Key Findings
${this.findings.map(f => `- **${f.title}**: ${f.description}`).join('\n')}

## Risks
${this.risks.map(r => `- **${r.title}** [${r.probability}/${r.impact}]: ${r.description}`).join('\n')}

## Recommendations
${this.recommendations.map(r => `- **${r.title}**: ${r.description}`).join('\n')}
    `.trim();
  }

  protected calculateScore(): number {
    return this.pmfMetrics?.pmfScore || 5;
  }

  private estimateInterestRate(input: AnalysisInput): number {
    const interviewCount = input.founderData?.interviewCount || 0;
    if (interviewCount === 0) return 0.2;

    const problem = input.idea.problemStatement || input.idea.description;
    const urgencyWords = ['urgent', 'critical', 'immediately', 'now', 'desperate'];
    const hasUrgency = urgencyWords.some(w => problem.toLowerCase().includes(w));

    return hasUrgency ? 0.35 : 0.25;
  }
}
