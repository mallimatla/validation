/**
 * Elena - Chief Customer Validation Officer
 *
 * Purpose: Analyzes real customer data to determine product-market fit signals.
 * Personality: Empathetic but ruthlessly honest, can smell BS from founders.
 * Scoring Weight: 2.0x (HIGHEST - most predictive of success)
 */

import { Injectable, Optional } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LLMService } from '../../common/llm/llm.service';
import { BaseAnalysisAgent, AnalysisInput, Citation } from '../base/base-analysis.agent';
import {
  PMF_THRESHOLDS,
  PMF_KILL_SIGNALS,
  CB_INSIGHTS_FAILURE_CAUSES,
} from '../validation-framework.constants';

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
  protected readonly agentVersion = '2.0.0';
  protected readonly scoringWeight = 2.0;

  protected readonly personality = `You are Elena, Chief Customer Validation Officer of the Validation Council.

PERSONALITY TRAITS:
- Empathetic: You understand the founder journey but won't sugarcoat reality.
- Ruthlessly Honest: You can smell BS. "Customers loved it" means nothing without evidence.
- Evidence-Driven: Only real customer signals matter - interviews, pre-orders, revenue.
- Highest Weight: Your analysis is the MOST predictive of success (2.0x weight).

ANALYSIS FRAMEWORK:
1. Customer Interview Analysis - Quality > Quantity, but need at least 20+
2. Signal Detection - Strong vs weak interest signals
3. Pre-order/Revenue Validation - Money talks, everything else walks
4. Pain Intensity Assessment - Is this a painkiller or vitamin?
5. Willingness to Pay - Have they tested pricing?
6. PMF Score Calculation - Quantified product-market fit indicators

STRONG SIGNALS (look for these):
- "When can I buy this?"
- "Can I pay for early access?"
- "I introduced it to 5 colleagues"
- "I've been looking for something like this for months"
- Actual pre-orders with money exchanged

WEAK SIGNALS (discount these):
- "Sounds interesting"
- "I might use it"
- "Let me know when it's ready"
- "Good luck with that"
- Verbal commitments without follow-through

SCORING CRITERIA (1-10):
- 9-10: 50+ interviews, 40%+ strong interest, pre-orders, WTP validated
- 7-8: 30+ interviews, 30%+ strong interest, waitlist traction
- 5-6: 15+ interviews, moderate interest signals
- 3-4: <10 interviews, weak signals, no validation
- 1-2: Zero customer research, building in a vacuum

Remember: Founders need TRUTH, not comfort. Better harsh feedback now than failure later.`;

  private pmfMetrics: PMFMetrics | null = null;
  private signals: CustomerSignal[] = [];

  constructor(
    prisma: PrismaService,
    eventEmitter: EventEmitter2,
    @Optional() llm?: LLMService,
  ) {
    super(prisma, eventEmitter, llm);
  }

  protected buildAnalysisPrompt(input: AnalysisInput): string {
    return `Analyze the customer validation evidence for this startup:

STARTUP: ${input.idea.title}
DESCRIPTION: ${input.idea.description}
PROBLEM: ${input.idea.problemStatement || 'Not specified'}
TARGET CUSTOMER: ${input.idea.targetCustomer || 'Not specified'}

CUSTOMER EVIDENCE PROVIDED:
- Interview Count: ${input.founderData?.interviewCount || 0}
- Strong Interest Rate: ${input.founderData?.strongInterestRate ? (input.founderData.strongInterestRate * 100).toFixed(0) + '%' : 'Not measured'}
- Pre-orders: ${input.founderData?.preorders || 0}
- Waitlist Size: ${input.founderData?.waitlistSize || 0}

Provide comprehensive customer validation analysis including:
1. Assessment of customer research quality and quantity
2. Identification of strong vs weak customer signals
3. Pre-order/revenue validation assessment
4. Pain intensity evaluation
5. PMF score calculation (1-10)
6. Specific recommendations for improving customer validation

Be ruthlessly honest. If there's no real customer evidence, say so clearly.`;
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

    // Step 6: Run Sean Ellis PMF Test (40% threshold)
    await this.runSeanEllisTest(input);

    // Step 7: Analyze retention metrics (NRR, DAU/MAU)
    await this.analyzeRetentionMetrics(input);

    // Step 8: Calculate PMF score
    await this.calculatePMFScore(input);

    // Step 9: Check PMF kill signals
    await this.checkPMFKillSignals(input);

    this.buildRawAnalysis();
  }

  /**
   * Sean Ellis Test: "How would you feel if you could no longer use [product]?"
   * PMF threshold: 40%+ say "Very disappointed"
   */
  private async runSeanEllisTest(input: AnalysisInput): Promise<void> {
    const founderData = input.founderData || {};
    const veryDisappointedPercentage = founderData.seanEllisScore || founderData.veryDisappointedRate;

    if (veryDisappointedPercentage !== undefined) {
      const sampleSize = founderData.seanEllisSampleSize || 0;

      const citation = this.addCitation({
        claim: `Sean Ellis PMF Test: ${(veryDisappointedPercentage * 100).toFixed(0)}% would be "very disappointed" (n=${sampleSize})`,
        source: 'Sean Ellis PMF Survey',
        sourceUrl: 'internal://elena/sean-ellis-test',
        confidence: sampleSize >= PMF_THRESHOLDS.SEAN_ELLIS_CONFIDENT_RESPONSES ? 0.9 :
                   sampleSize >= PMF_THRESHOLDS.SEAN_ELLIS_MINIMUM_RESPONSES ? 0.7 : 0.5,
        dataType: 'primary',
      });

      if (veryDisappointedPercentage >= PMF_THRESHOLDS.SEAN_ELLIS_PMF_THRESHOLD) {
        this.addFinding({
          title: 'Strong PMF Signal (Sean Ellis)',
          description: `${(veryDisappointedPercentage * 100).toFixed(0)}% "very disappointed" exceeds the ${(PMF_THRESHOLDS.SEAN_ELLIS_PMF_THRESHOLD * 100).toFixed(0)}% PMF threshold. This is a strong indicator of product-market fit.`,
          type: 'strength',
          severity: 'critical',
          evidence: [citation],
          confidence: 9,
        });
      } else if (veryDisappointedPercentage >= 0.25) {
        this.addFinding({
          title: 'Emerging PMF (Sean Ellis)',
          description: `${(veryDisappointedPercentage * 100).toFixed(0)}% "very disappointed" is below the ${(PMF_THRESHOLDS.SEAN_ELLIS_PMF_THRESHOLD * 100).toFixed(0)}% threshold but shows promise. Focus on the most engaged segment.`,
          type: 'neutral',
          severity: 'major',
          evidence: [citation],
          confidence: 7,
        });
      } else {
        this.addFinding({
          title: 'No PMF Detected (Sean Ellis)',
          description: `Only ${(veryDisappointedPercentage * 100).toFixed(0)}% "very disappointed" - significantly below ${(PMF_THRESHOLDS.SEAN_ELLIS_PMF_THRESHOLD * 100).toFixed(0)}% threshold. This is CB Insights' #1 startup failure cause (${(CB_INSIGHTS_FAILURE_CAUSES.no_market_need.percentage * 100).toFixed(0)}% of failures).`,
          type: 'weakness',
          severity: 'critical',
          evidence: [citation],
          confidence: 8,
        });
      }

      if (sampleSize < PMF_THRESHOLDS.SEAN_ELLIS_MINIMUM_RESPONSES) {
        this.addRecommendation({
          title: 'Increase Survey Sample Size',
          description: `Current sample of ${sampleSize} is below ${PMF_THRESHOLDS.SEAN_ELLIS_MINIMUM_RESPONSES} minimum for directional guidance. Need ${PMF_THRESHOLDS.SEAN_ELLIS_CONFIDENT_RESPONSES}+ for confidence.`,
          priority: 'high',
          timeframe: 'immediate',
          effort: 'low',
          impact: 'high',
        });
      }
    }
  }

  /**
   * Analyze retention metrics: NRR, DAU/MAU, activation rates
   */
  private async analyzeRetentionMetrics(input: AnalysisInput): Promise<void> {
    const founderData = input.founderData || {};

    // Net Revenue Retention (NRR)
    if (founderData.nrr !== undefined) {
      const nrr = founderData.nrr;

      const citation = this.addCitation({
        claim: `Net Revenue Retention: ${(nrr * 100).toFixed(0)}%`,
        source: 'Retention Analysis',
        sourceUrl: 'internal://elena/nrr-analysis',
        confidence: 0.85,
        dataType: 'primary',
      });

      if (nrr >= PMF_THRESHOLDS.NRR_EXCEPTIONAL) {
        this.addFinding({
          title: 'Exceptional Net Revenue Retention',
          description: `NRR of ${(nrr * 100).toFixed(0)}% is exceptional (Snowflake IPO was 164%). Each 1% improvement adds ~${(PMF_THRESHOLDS.NRR_VALUE_INCREASE_PER_PERCENT * 100).toFixed(0)}% company value.`,
          type: 'strength',
          severity: 'critical',
          evidence: [citation],
          confidence: 9,
        });
      } else if (nrr >= PMF_THRESHOLDS.NRR_TOP_QUARTILE) {
        this.addFinding({
          title: 'Strong Net Revenue Retention',
          description: `NRR of ${(nrr * 100).toFixed(0)}% is top quartile (${(PMF_THRESHOLDS.NRR_TOP_QUARTILE * 100).toFixed(0)}%+). Indicates strong expansion revenue.`,
          type: 'strength',
          severity: 'major',
          evidence: [citation],
          confidence: 8,
        });
      } else if (nrr < PMF_THRESHOLDS.NRR_HEALTHY) {
        this.addFinding({
          title: 'Below-Target Net Revenue Retention',
          description: `NRR of ${(nrr * 100).toFixed(0)}% is below ${(PMF_THRESHOLDS.NRR_HEALTHY * 100).toFixed(0)}% healthy threshold. Churn exceeds expansion.`,
          type: 'weakness',
          severity: 'major',
          evidence: [citation],
          confidence: 8,
        });
      }
    }

    // DAU/MAU ratio
    if (founderData.dauMau !== undefined) {
      const dauMau = founderData.dauMau;

      const citation = this.addCitation({
        claim: `DAU/MAU ratio: ${(dauMau * 100).toFixed(0)}%`,
        source: 'Engagement Analysis',
        sourceUrl: 'internal://elena/dau-mau-analysis',
        confidence: 0.85,
        dataType: 'primary',
      });

      if (dauMau >= PMF_THRESHOLDS.DAU_MAU_STICKY) {
        this.addFinding({
          title: 'Sticky Product Engagement',
          description: `DAU/MAU of ${(dauMau * 100).toFixed(0)}% exceeds ${(PMF_THRESHOLDS.DAU_MAU_STICKY * 100).toFixed(0)}% stickiness threshold. Users return frequently.`,
          type: 'strength',
          severity: 'major',
          evidence: [citation],
          confidence: 8,
        });
      } else if (dauMau < PMF_THRESHOLDS.DAU_MAU_SAAS_AVERAGE) {
        this.addFinding({
          title: 'Below-Average Engagement',
          description: `DAU/MAU of ${(dauMau * 100).toFixed(0)}% is below SaaS average of ${(PMF_THRESHOLDS.DAU_MAU_SAAS_AVERAGE * 100).toFixed(0)}%.`,
          type: 'weakness',
          severity: 'minor',
          evidence: [citation],
          confidence: 7,
        });
      }
    }

    // Activation rate
    if (founderData.activationRate !== undefined) {
      const activation = founderData.activationRate;

      if (activation < PMF_THRESHOLDS.ACTIVATION_POOR) {
        this.addFinding({
          title: 'Critical Activation Problem',
          description: `Only ${(activation * 100).toFixed(0)}% of users activate - below ${(PMF_THRESHOLDS.ACTIVATION_POOR * 100).toFixed(0)}% threshold. Fix onboarding immediately.`,
          type: 'weakness',
          severity: 'critical',
          evidence: [],
          confidence: 8,
        });
      }
    }
  }

  /**
   * Check PMF kill signals
   */
  private async checkPMFKillSignals(input: AnalysisInput): Promise<void> {
    const founderData = input.founderData || {};
    const months = founderData.monthsInMarket || 0;

    this.checkKillSignals([
      {
        signal: PMF_KILL_SIGNALS[0], // Below 20% "very disappointed" after 24 months
        severity: 'critical',
        condition: months >= 24 &&
          founderData.seanEllisScore !== undefined &&
          founderData.seanEllisScore < 0.20,
        evidence: `After ${months} months, only ${((founderData.seanEllisScore || 0) * 100).toFixed(0)}% would be "very disappointed" - well below PMF threshold.`,
        recommendation: 'Consider major pivot. Product is not resonating with market.',
      },
      {
        signal: PMF_KILL_SIGNALS[1], // Retention curves declining to zero
        severity: 'critical',
        condition: founderData.retentionTrend === 'declining_to_zero',
        evidence: 'Retention curves show all cohorts trending toward zero usage.',
        recommendation: 'Users are not finding lasting value. Investigate core value proposition.',
      },
      {
        signal: PMF_KILL_SIGNALS[2], // 0% organic growth
        severity: 'critical',
        condition: founderData.organicGrowthRate !== undefined && founderData.organicGrowthRate === 0,
        evidence: 'Zero organic/viral growth after significant paid acquisition.',
        recommendation: 'Product lacks natural word-of-mouth. May indicate weak value prop.',
      },
      {
        signal: PMF_KILL_SIGNALS[3], // Activation rate below 10%
        severity: 'critical',
        condition: founderData.activationRate !== undefined &&
          founderData.activationRate < PMF_THRESHOLDS.ACTIVATION_POOR,
        evidence: `Activation rate of ${((founderData.activationRate || 0) * 100).toFixed(0)}% means 90%+ of signups never experience core value.`,
        recommendation: 'Fix onboarding before spending more on acquisition.',
      },
    ]);
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
    // Get the raw PMF score, default to 5 (neutral) if no data
    let score = this.pmfMetrics?.pmfScore ?? 5;

    // If pmfScore is very low due to lack of data (not actual negative signals),
    // use a more neutral baseline. A score below 3 with minimal data is too harsh.
    const hasCustomerData = this.pmfMetrics && (
      this.pmfMetrics.interviewCount > 0 ||
      this.pmfMetrics.preorderCount > 0 ||
      this.pmfMetrics.waitlistSize > 0
    );

    // If we have no real customer data, default to neutral (5) rather than penalizing
    if (!hasCustomerData && score < 3) {
      score = 5;
    }

    // Ensure score is bounded to 1-10 and properly rounded to avoid floating point issues
    return Math.round(Math.max(1, Math.min(10, score)) * 10) / 10;
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
