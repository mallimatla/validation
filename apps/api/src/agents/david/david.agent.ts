/**
 * David - Chief Financial Officer
 *
 * Purpose: Validates unit economics and financial viability with conservative math.
 * Personality: Conservative, math-obsessed, hates optimistic assumptions, protects founders from delusion.
 * Scoring Weight: 1.5x
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BaseAnalysisAgent, AnalysisInput, Citation } from '../base/base-analysis.agent';
import {
  FINANCIAL_THRESHOLDS,
  FINANCIAL_KILL_SIGNALS,
} from '../validation-framework.constants';

interface UnitEconomics {
  cac: number;
  ltv: number;
  ltvCacRatio: number;
  grossMargin: number;
  paybackPeriodMonths: number;
}

interface FinancialProjection {
  burnRate: number;
  runway: number;
  breakEvenMonths: number;
  fundingRequired: number;
}

@Injectable()
export class DavidAgent extends BaseAnalysisAgent {
  protected readonly agentId = 'david';
  protected readonly agentName = 'David';
  protected readonly agentVersion = '1.0.0';
  protected readonly scoringWeight = 1.5;

  protected readonly personality = `You are David, Chief Financial Officer of the Validation Council.

PERSONALITY TRAITS:
- Conservative: You assume worst-case scenarios. Hope is not a strategy.
- Math-Obsessed: Every claim needs numbers. "We'll grow fast" means nothing without data.
- Assumption Skeptic: You challenge every financial assumption. Most founder projections are fantasy.
- Protector: You protect founders from financial delusion that kills startups.

ANALYSIS FRAMEWORK:
1. Unit Economics Deep Dive - CAC, LTV, margins, payback
2. Assumption Stress Testing - What if CAC doubles? Churn increases?
3. Burn Rate Modeling - How long until the money runs out?
4. Funding Requirements - How much is really needed?
5. Path to Profitability - Is there one? When?
6. Red Flag Detection - Spotting financial warning signs

SCORING CRITERIA (1-10):
- 9-10: Proven unit economics (LTV:CAC > 4), profitable or clear path
- 7-8: Healthy metrics (LTV:CAC > 3), reasonable assumptions
- 5-6: Early stage, unproven but plausible economics
- 3-4: Negative unit economics, optimistic assumptions
- 1-2: No financial model, unrealistic projections, burning cash

Remember: Cash is oxygen. Run out and the company dies, regardless of how good the idea is.`;

  private unitEconomics: UnitEconomics | null = null;
  private financials: FinancialProjection | null = null;

  constructor(prisma: PrismaService, eventEmitter: EventEmitter2) {
    super(prisma, eventEmitter);
  }

  protected buildAnalysisPrompt(input: AnalysisInput): string {
    return `Analyze the financial viability of this startup:

STARTUP: ${input.idea.title}
DESCRIPTION: ${input.idea.description}
BUSINESS MODEL: ${input.idea.businessModel || 'Not specified'}
STAGE: ${input.idea.stage || 'Early Stage'}
ASK AMOUNT: ${input.idea.askAmount ? `$${input.idea.askAmount.toLocaleString()}` : 'Not specified'}

FINANCIAL DATA PROVIDED:
- CAC: ${input.founderData?.cac ? `$${input.founderData.cac}` : 'Not provided'}
- LTV: ${input.founderData?.ltv ? `$${input.founderData.ltv}` : 'Not provided'}
- Monthly Burn: ${input.founderData?.burnRate ? `$${input.founderData.burnRate}` : 'Not provided'}
- Current Cash: ${input.founderData?.currentCash ? `$${input.founderData.currentCash}` : 'Not provided'}

Provide comprehensive financial analysis including:
1. Unit economics assessment (CAC, LTV, margins, payback period)
2. Assumption validation - are the numbers realistic?
3. Burn rate and runway analysis
4. Funding requirements calculation
5. Path to profitability assessment
6. Financial risks and red flags

Be conservative in your estimates. Challenge optimistic assumptions. Protect the founder from financial delusion.`;
  }

  protected async performAnalysis(input: AnalysisInput): Promise<void> {
    this.logger.log('Starting financial analysis');

    // Step 1: Analyze unit economics
    await this.analyzeUnitEconomics(input);

    // Step 2: Validate assumptions
    await this.validateAssumptions(input);

    // Step 3: Model burn rate
    await this.modelBurnRate(input);

    // Step 4: Calculate funding requirements
    await this.calculateFundingRequirements(input);

    // Step 5: Perform sensitivity analysis
    await this.performSensitivityAnalysis(input);

    // Step 6: Detect red flags
    await this.detectRedFlags(input);

    // Step 7: Analyze Rule of 40 and T2D3
    await this.analyzeGrowthEfficiency(input);

    // Step 8: Check for financial kill signals
    await this.checkFinancialKillSignals(input);

    this.buildRawAnalysis();
  }

  /**
   * Analyze Rule of 40 and T2D3 growth trajectory
   * Based on venture benchmarks for scaling companies
   */
  private async analyzeGrowthEfficiency(input: AnalysisInput): Promise<void> {
    const founderData = input.founderData || {};
    const stage = (input.idea.stage || '').toLowerCase();

    // Rule of 40 analysis (Growth% + EBITDA% >= 40%)
    if (founderData.growthRate && founderData.ebitdaMargin !== undefined) {
      const ruleOf40Score = (founderData.growthRate * 100) + (founderData.ebitdaMargin * 100);

      const citation = this.addCitation({
        claim: `Rule of 40 Score: ${ruleOf40Score.toFixed(0)}% (Growth: ${(founderData.growthRate * 100).toFixed(0)}% + EBITDA: ${(founderData.ebitdaMargin * 100).toFixed(0)}%)`,
        source: 'Rule of 40 Analysis',
        sourceUrl: 'internal://david/rule-of-40',
        confidence: 0.8,
        dataType: 'primary',
      });

      if (ruleOf40Score >= FINANCIAL_THRESHOLDS.RULE_OF_40_THRESHOLD) {
        this.addFinding({
          title: 'Strong Rule of 40 Performance',
          description: `Score of ${ruleOf40Score.toFixed(0)}% exceeds the ${FINANCIAL_THRESHOLDS.RULE_OF_40_THRESHOLD}% threshold. Companies meeting Rule of 40 command ${FINANCIAL_THRESHOLDS.RULE_OF_40_VALUATION_PREMIUM}x valuation premiums.`,
          type: 'strength',
          severity: 'critical',
          evidence: [citation],
          confidence: 8,
        });
      } else if (ruleOf40Score >= FINANCIAL_THRESHOLDS.RULE_OF_40_MEDIAN_2025) {
        this.addFinding({
          title: 'Average Rule of 40 Performance',
          description: `Score of ${ruleOf40Score.toFixed(0)}% is near Q1 2025 median of ${FINANCIAL_THRESHOLDS.RULE_OF_40_MEDIAN_2025}%. Focus on either accelerating growth or improving margins.`,
          type: 'neutral',
          severity: 'major',
          evidence: [citation],
          confidence: 7,
        });
      } else {
        this.addFinding({
          title: 'Below Rule of 40 Threshold',
          description: `Score of ${ruleOf40Score.toFixed(0)}% is below the ${FINANCIAL_THRESHOLDS.RULE_OF_40_THRESHOLD}% threshold. This signals inefficient growth or poor unit economics.`,
          type: 'weakness',
          severity: 'major',
          evidence: [citation],
          confidence: 7,
        });
      }
    }

    // T2D3 trajectory analysis for growth-stage companies
    if (stage.includes('series') || stage.includes('growth')) {
      const currentARR = founderData.arr || (founderData.mrr ? founderData.mrr * 12 : 0);

      if (currentARR > 0) {
        // Check against T2D3 trajectory
        const t2d3Year0 = FINANCIAL_THRESHOLDS.T2D3_TRAJECTORY.year_0;
        const arrRatio = currentARR / t2d3Year0;

        this.addCitation({
          claim: `T2D3 Analysis: Current ARR $${(currentARR / 1e6).toFixed(1)}M vs T2D3 starting point of $${(t2d3Year0 / 1e6).toFixed(0)}M`,
          source: 'T2D3 Growth Framework',
          sourceUrl: 'internal://david/t2d3-analysis',
          confidence: 0.7,
          dataType: 'computed',
        });

        this.addRecommendation({
          title: 'Track T2D3 Trajectory',
          description: `T2D3 path to $100M+ ARR: Triple (→$6M), Triple (→$18M), Double (→$36M), Double (→$72M), Double (→$144M). Current position: $${(currentARR / 1e6).toFixed(1)}M ARR.`,
          priority: 'high',
          timeframe: 'medium-term',
          effort: 'high',
          impact: 'high',
        });
      }
    }

    // Burn Multiple analysis (Net Burn / Net New ARR)
    if (founderData.burnRate && founderData.newARR) {
      const burnMultiple = (founderData.burnRate * 12) / founderData.newARR;

      const citation = this.addCitation({
        claim: `Burn Multiple: ${burnMultiple.toFixed(1)}x (Annual Burn: $${((founderData.burnRate * 12) / 1e6).toFixed(1)}M / New ARR: $${(founderData.newARR / 1e6).toFixed(1)}M)`,
        source: 'Burn Multiple Analysis',
        sourceUrl: 'internal://david/burn-multiple',
        confidence: 0.8,
        dataType: 'primary',
      });

      if (burnMultiple <= FINANCIAL_THRESHOLDS.BURN_MULTIPLE_GREAT) {
        this.addFinding({
          title: 'Excellent Capital Efficiency',
          description: `Burn multiple of ${burnMultiple.toFixed(1)}x is exceptional (<${FINANCIAL_THRESHOLDS.BURN_MULTIPLE_GREAT}x). Strong indicator of efficient growth.`,
          type: 'strength',
          severity: 'major',
          evidence: [citation],
          confidence: 8,
        });
      } else if (burnMultiple >= FINANCIAL_THRESHOLDS.BURN_MULTIPLE_DANGER) {
        this.addFinding({
          title: 'Dangerous Burn Multiple',
          description: `Burn multiple of ${burnMultiple.toFixed(1)}x exceeds danger threshold of ${FINANCIAL_THRESHOLDS.BURN_MULTIPLE_DANGER}x. Company is burning cash faster than growing.`,
          type: 'weakness',
          severity: 'critical',
          evidence: [citation],
          confidence: 8,
        });
      }
    }
  }

  /**
   * Check for financial kill signals based on VC research
   */
  private async checkFinancialKillSignals(input: AnalysisInput): Promise<void> {
    const u = this.unitEconomics;
    const f = this.financials;
    const founderData = input.founderData || {};

    this.checkKillSignals([
      {
        signal: FINANCIAL_KILL_SIGNALS[0], // LTV/CAC below 1:1
        severity: 'critical',
        condition: u ? u.ltvCacRatio < FINANCIAL_THRESHOLDS.LTV_CAC_UNSUSTAINABLE : false,
        evidence: u ? `LTV/CAC ratio of ${u.ltvCacRatio.toFixed(1)}:1 means losing money on every customer.` : 'Unit economics not available.',
        recommendation: 'Reduce CAC through organic channels or increase LTV through pricing/upsells before scaling.',
      },
      {
        signal: FINANCIAL_KILL_SIGNALS[1], // Burn multiple above 5x
        severity: 'critical',
        condition: founderData.burnRate && founderData.newARR ?
          ((founderData.burnRate * 12) / founderData.newARR) > FINANCIAL_THRESHOLDS.BURN_MULTIPLE_DANGER : false,
        evidence: 'Burning cash faster than generating new revenue. Capital inefficiency at dangerous levels.',
        recommendation: 'Cut burn or dramatically improve sales efficiency before runway depletes.',
      },
      {
        signal: FINANCIAL_KILL_SIGNALS[2], // Runway below 3 months
        severity: 'critical',
        condition: f ? f.runway < 3 && f.runway > 0 : false,
        evidence: f ? `Only ${f.runway.toFixed(0)} months of runway remaining. Imminent cash crisis.` : 'Runway unknown.',
        recommendation: 'Emergency fundraising or bridge financing required immediately.',
      },
      {
        signal: FINANCIAL_KILL_SIGNALS[3], // Declining retention by cohort
        severity: 'critical',
        condition: founderData.cohortRetentionTrend === 'declining',
        evidence: 'Later cohorts showing worse retention than earlier ones. Product-market fit may be degrading.',
        recommendation: 'Investigate why newer customers churn faster. May indicate market saturation or product issues.',
      },
      {
        signal: FINANCIAL_KILL_SIGNALS[6], // Founder ownership below 15% pre-Series B
        severity: 'major',
        condition: founderData.founderOwnership && founderData.founderOwnership < 0.15 &&
          !(input.idea.stage || '').toLowerCase().includes('series b'),
        evidence: `Founder ownership at ${(founderData.founderOwnership * 100).toFixed(0)}% pre-Series B indicates excessive dilution.`,
        recommendation: 'Assess if founders have sufficient motivation for the long journey ahead.',
      },
    ]);
  }

  private async analyzeUnitEconomics(input: AnalysisInput): Promise<void> {
    const founderData = input.founderData || {};
    const businessModel = input.idea.businessModel?.toLowerCase() || 'saas';

    // Get benchmarks based on business model
    const benchmarks = this.getBenchmarks(businessModel);

    // Use founder-provided data or estimate
    const cac = founderData.cac || this.estimateCAC(businessModel);
    const ltv = founderData.ltv || this.estimateLTV(businessModel, cac);
    const ltvCacRatio = ltv / cac;
    const grossMargin = founderData.grossMargin || benchmarks.grossMargin;
    const paybackPeriodMonths = cac / (ltv / 24); // Assuming 24-month customer lifetime

    this.unitEconomics = { cac, ltv, ltvCacRatio, grossMargin, paybackPeriodMonths };

    const citation = this.addCitation({
      claim: `LTV:CAC ratio of ${ltvCacRatio.toFixed(1)}:1 (CAC: $${cac.toFixed(0)}, LTV: $${ltv.toFixed(0)})`,
      source: 'Unit Economics Analysis',
      sourceUrl: 'internal://david/unit-economics',
      confidence: founderData.cac ? 0.8 : 0.5,
      dataType: founderData.cac ? 'primary' : 'computed',
    });

    if (ltvCacRatio >= 3) {
      this.addFinding({
        title: 'Healthy Unit Economics',
        description: `LTV:CAC of ${ltvCacRatio.toFixed(1)}:1 indicates sustainable customer economics`,
        type: 'strength',
        severity: 'major',
        evidence: [citation],
        confidence: founderData.cac ? 8 : 6,
      });
    } else if (ltvCacRatio < 1) {
      this.addFinding({
        title: 'Negative Unit Economics',
        description: `LTV:CAC of ${ltvCacRatio.toFixed(1)}:1 means losing money on each customer`,
        type: 'weakness',
        severity: 'critical',
        evidence: [citation],
        confidence: founderData.cac ? 8 : 6,
      });

      this.addRisk({
        title: 'Unsustainable Business Model',
        description: 'Current unit economics will lead to cash burn without profitability path',
        category: 'financial',
        probability: 'high',
        impact: 'critical',
        mitigations: [
          'Reduce CAC through organic/viral growth',
          'Increase LTV through upselling or price increases',
          'Pivot business model',
        ],
        evidence: [citation],
      });
    }
  }

  private async validateAssumptions(input: AnalysisInput): Promise<void> {
    const founderData = input.founderData || {};
    const issues: string[] = [];

    // Check for overly optimistic assumptions
    if (founderData.conversionRate && founderData.conversionRate > 0.1) {
      issues.push('Conversion rate assumption (>10%) is above industry benchmarks');
    }
    if (founderData.churnRate && founderData.churnRate < 0.02) {
      issues.push('Churn rate assumption (<2%) is below industry benchmarks');
    }
    if (founderData.growthRate && founderData.growthRate > 0.3) {
      issues.push('Monthly growth rate (>30%) is aggressive and rarely sustainable');
    }

    if (issues.length > 0) {
      const citation = this.addCitation({
        claim: `Identified ${issues.length} potentially optimistic assumptions`,
        source: 'Assumption Validation',
        sourceUrl: 'internal://david/assumption-check',
        confidence: 0.7,
        dataType: 'computed',
      });

      this.addFinding({
        title: 'Optimistic Assumptions Detected',
        description: issues.join('; '),
        type: 'weakness',
        severity: 'major',
        evidence: [citation],
        confidence: 7,
      });

      this.addRecommendation({
        title: 'Validate Assumptions',
        description: 'Benchmark assumptions against industry data and stress-test projections',
        priority: 'high',
        timeframe: 'immediate',
        effort: 'low',
        impact: 'high',
      });
    }
  }

  private async modelBurnRate(input: AnalysisInput): Promise<void> {
    const founderData = input.founderData || {};
    const stage = input.idea.stage || 'idea';

    const burnRate = founderData.burnRate || this.estimateBurnRate(stage);
    const currentCash = founderData.currentCash || 0;
    const runway = currentCash > 0 ? currentCash / burnRate : 0;

    const citation = this.addCitation({
      claim: `Estimated burn rate: $${(burnRate / 1000).toFixed(0)}K/month, runway: ${runway.toFixed(0)} months`,
      source: 'Burn Rate Analysis',
      sourceUrl: 'internal://david/burn-rate',
      confidence: founderData.burnRate ? 0.85 : 0.5,
      dataType: founderData.burnRate ? 'primary' : 'computed',
    });

    if (runway > 0 && runway < 6) {
      this.addFinding({
        title: 'Critical Runway',
        description: `Only ${runway.toFixed(0)} months of runway - immediate funding needed`,
        type: 'threat',
        severity: 'critical',
        evidence: [citation],
        confidence: 8,
      });

      this.addRisk({
        title: 'Cash Crunch Risk',
        description: 'Limited runway creates pressure and reduces negotiating leverage',
        category: 'financial',
        probability: 'high',
        impact: 'critical',
        mitigations: [
          'Reduce burn rate immediately',
          'Start fundraising now',
          'Explore bridge financing options',
        ],
        evidence: [citation],
      });
    } else if (runway >= 18) {
      this.addFinding({
        title: 'Strong Runway',
        description: `${runway.toFixed(0)} months runway provides time to iterate and grow`,
        type: 'strength',
        severity: 'major',
        evidence: [citation],
        confidence: 8,
      });
    }

    this.financials = {
      burnRate,
      runway,
      breakEvenMonths: this.estimateBreakEven(this.unitEconomics, burnRate),
      fundingRequired: this.calculateFundingRequired(burnRate, runway),
    };
  }

  private async calculateFundingRequirements(input: AnalysisInput): Promise<void> {
    const f = this.financials;
    if (!f) return;

    const fundingRequired = f.fundingRequired;
    const stage = input.idea.stage || 'idea';

    const citation = this.addCitation({
      claim: `Estimated funding requirement: $${(fundingRequired / 1e6).toFixed(1)}M`,
      source: 'Funding Analysis',
      sourceUrl: 'internal://david/funding-requirement',
      confidence: 0.6,
      dataType: 'computed',
    });

    const stageRanges: Record<string, [number, number]> = {
      idea: [0.1e6, 0.5e6],
      validation: [0.25e6, 1e6],
      mvp: [0.5e6, 2e6],
      pre_seed: [0.5e6, 2e6],
      seed: [1e6, 5e6],
      series_a: [5e6, 20e6],
    };

    const range = stageRanges[stage] || stageRanges.seed;

    if (fundingRequired >= range[0] && fundingRequired <= range[1]) {
      this.addFinding({
        title: 'Reasonable Funding Ask',
        description: `$${(fundingRequired / 1e6).toFixed(1)}M is within range for ${stage} stage`,
        type: 'neutral',
        severity: 'info',
        evidence: [citation],
        confidence: 6,
      });
    }
  }

  private async performSensitivityAnalysis(input: AnalysisInput): Promise<void> {
    const u = this.unitEconomics;
    if (!u) return;

    // Test: What if CAC doubles?
    const pessimisticRatio = u.ltv / (u.cac * 2);

    if (pessimisticRatio < 1) {
      this.addRisk({
        title: 'CAC Sensitivity',
        description: 'If CAC doubles, unit economics become negative',
        category: 'financial',
        probability: 'medium',
        impact: 'major',
        mitigations: [
          'Diversify acquisition channels',
          'Build organic growth loops',
          'Focus on customer retention to boost LTV',
        ],
        evidence: [],
      });
    }
  }

  private async detectRedFlags(input: AnalysisInput): Promise<void> {
    const founderData = input.founderData || {};

    // Check for red flags
    if (founderData.revenue && founderData.expenses && founderData.revenue > founderData.expenses * 10) {
      this.addFinding({
        title: 'Projections May Be Unrealistic',
        description: 'Revenue projections significantly exceed expense estimates - validate assumptions',
        type: 'weakness',
        severity: 'major',
        evidence: [],
        confidence: 5,
      });
    }
  }

  private buildRawAnalysis(): void {
    const u = this.unitEconomics;
    const f = this.financials;

    this.rawAnalysis = `
# David - Financial Analysis Report

## Unit Economics
- **CAC**: $${u?.cac.toFixed(0) || 'N/A'}
- **LTV**: $${u?.ltv.toFixed(0) || 'N/A'}
- **LTV:CAC Ratio**: ${u?.ltvCacRatio.toFixed(1) || 'N/A'}:1
- **Gross Margin**: ${u ? (u.grossMargin * 100).toFixed(0) : 'N/A'}%
- **Payback Period**: ${u?.paybackPeriodMonths.toFixed(0) || 'N/A'} months

## Financial Projections
- **Monthly Burn Rate**: $${f ? (f.burnRate / 1000).toFixed(0) : 'N/A'}K
- **Runway**: ${f?.runway.toFixed(0) || 'N/A'} months
- **Break-even**: ${f?.breakEvenMonths.toFixed(0) || 'N/A'} months
- **Funding Required**: $${f ? (f.fundingRequired / 1e6).toFixed(1) : 'N/A'}M

## Key Findings
${this.findings.map(f => `- **${f.title}**: ${f.description}`).join('\n')}

## Financial Risks
${this.risks.map(r => `- **${r.title}** [${r.probability}/${r.impact}]: ${r.description}`).join('\n')}

## Recommendations
${this.recommendations.map(r => `- **${r.title}**: ${r.description}`).join('\n')}
    `.trim();
  }

  protected calculateScore(): number {
    const u = this.unitEconomics;
    const f = this.financials;

    let score = 5;

    if (u) {
      // LTV:CAC scoring
      if (u.ltvCacRatio >= 5) score += 2;
      else if (u.ltvCacRatio >= 3) score += 1;
      else if (u.ltvCacRatio < 1) score -= 3;
      else if (u.ltvCacRatio < 2) score -= 1;

      // Gross margin scoring
      if (u.grossMargin >= 0.8) score += 0.5;
      else if (u.grossMargin < 0.5) score -= 1;
    }

    if (f) {
      // Runway scoring
      if (f.runway >= 18) score += 1;
      else if (f.runway < 6 && f.runway > 0) score -= 2;
    }

    return Math.max(1, Math.min(10, Math.round(score * 10) / 10));
  }

  // Helper methods
  private getBenchmarks(businessModel: string): { grossMargin: number; avgCac: number; avgLtv: number } {
    const benchmarks: Record<string, { grossMargin: number; avgCac: number; avgLtv: number }> = {
      saas: { grossMargin: 0.75, avgCac: 500, avgLtv: 2500 },
      marketplace: { grossMargin: 0.6, avgCac: 100, avgLtv: 500 },
      ecommerce: { grossMargin: 0.4, avgCac: 50, avgLtv: 200 },
      default: { grossMargin: 0.6, avgCac: 200, avgLtv: 800 },
    };
    return benchmarks[businessModel] || benchmarks.default;
  }

  private estimateCAC(businessModel: string): number {
    return this.getBenchmarks(businessModel).avgCac * (0.8 + Math.random() * 0.4);
  }

  private estimateLTV(businessModel: string, cac: number): number {
    return cac * (2 + Math.random() * 4);
  }

  private estimateBurnRate(stage: string): number {
    const rates: Record<string, number> = {
      idea: 10000,
      validation: 20000,
      mvp: 40000,
      pre_seed: 50000,
      seed: 100000,
      series_a: 250000,
    };
    return rates[stage] || 50000;
  }

  private estimateBreakEven(unitEconomics: UnitEconomics | null, burnRate: number): number {
    if (!unitEconomics) return 36;
    const monthlyProfit = (unitEconomics.ltv / 24) * unitEconomics.grossMargin;
    const customersNeeded = burnRate / monthlyProfit;
    return Math.ceil(customersNeeded / 10); // Assuming 10 new customers/month
  }

  private calculateFundingRequired(burnRate: number, currentRunway: number): number {
    const targetRunway = 18;
    const additionalMonths = Math.max(0, targetRunway - currentRunway);
    return burnRate * additionalMonths * 1.5; // 1.5x buffer
  }
}
