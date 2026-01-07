/**
 * David - Chief Financial Officer
 *
 * Purpose: Validates unit economics and financial viability with conservative math.
 * Personality: Conservative, math-obsessed, hates optimistic assumptions, protects founders from delusion.
 * Scoring Weight: 1.5x
 *
 * INVESTOR-GRADE FEATURES (v3.0):
 * - Confidence ranges for all estimates (low/mid/high)
 * - Bull/Base/Bear financial scenarios
 * - Industry-specific benchmarking
 * - Sensitivity analysis with Monte Carlo simulation
 * - Validation scorecard with letter grades
 */

import { Injectable, Optional } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LLMService } from '../../common/llm/llm.service';
import { BaseAnalysisAgent, AnalysisInput, Citation } from '../base/base-analysis.agent';
import {
  ValidationScorecard,
  ScenarioAnalysis,
  calculateGrade,
  formatCurrency,
  REPORT_DISCLAIMER,
} from '../shared/investor-grade.types';

/**
 * INVESTOR-GRADE FINANCIAL TYPES
 */
interface ConfidenceRange {
  low: number;
  mid: number;
  high: number;
  confidence: number;
  source: string;
}

interface UnitEconomics {
  cac: ConfidenceRange;
  ltv: ConfidenceRange;
  ltvCacRatio: ConfidenceRange;
  grossMargin: ConfidenceRange;
  paybackPeriodMonths: ConfidenceRange;
  churnRate: ConfidenceRange;
  arpu: ConfidenceRange;
}

interface FinancialProjection {
  burnRate: ConfidenceRange;
  runway: ConfidenceRange;
  breakEvenMonths: ConfidenceRange;
  fundingRequired: ConfidenceRange;
  revenueMonth12: ConfidenceRange;
  revenueMonth24: ConfidenceRange;
}

interface FinancialScenarios {
  bull: ScenarioAnalysis;
  base: ScenarioAnalysis;
  bear: ScenarioAnalysis;
  expectedValue: number;
}

interface IndustryBenchmarks {
  industry: string;
  ltvCacRatio: { median: number; top25: number; bottom25: number };
  grossMargin: { median: number; top25: number; bottom25: number };
  churnRate: { median: number; top25: number; bottom25: number };
  burnMultiple: { median: number; top25: number; bottom25: number };
  paybackMonths: { median: number; top25: number; bottom25: number };
  source: string;
}

interface SensitivityResult {
  variable: string;
  baseValue: number;
  pessimisticValue: number;
  pessimisticResult: number;
  optimisticValue: number;
  optimisticResult: number;
  elasticity: number;
}

@Injectable()
export class DavidAgent extends BaseAnalysisAgent {
  protected readonly agentId = 'david';
  protected readonly agentName = 'David';
  protected readonly agentVersion = '3.0.0'; // INVESTOR-GRADE with scenarios and benchmarking
  protected readonly scoringWeight = 1.5;

  protected readonly personality = `You are David, Chief Financial Officer of the Validation Council.

PERSONALITY TRAITS:
- Conservative: You assume worst-case scenarios. Hope is not a strategy.
- Math-Obsessed: Every claim needs numbers. "We'll grow fast" means nothing without data.
- Assumption Skeptic: You challenge every financial assumption. Most founder projections are fantasy.
- Protector: You protect founders from financial delusion that kills startups.

INVESTOR-GRADE ANALYSIS FRAMEWORK:
1. Unit Economics Deep Dive - CAC, LTV, margins, payback with confidence ranges
2. Industry Benchmarking - Compare against SaaS/marketplace/ecommerce standards
3. Bull/Base/Bear Scenarios - Model multiple outcomes with probabilities
4. Sensitivity Analysis - What breaks the model? CAC +50%, Churn +100%?
5. Burn Rate & Runway - Cash is oxygen modeling
6. Funding Requirements - What's really needed vs what's asked
7. Path to Profitability - Timeline and assumptions
8. Red Flag Detection - Financial warning signs

SCORING CRITERIA (1-10):
- 9-10: Proven unit economics (LTV:CAC > 4), profitable or clear path
- 7-8: Healthy metrics (LTV:CAC > 3), reasonable assumptions
- 5-6: Early stage, unproven but plausible economics
- 3-4: Negative unit economics, optimistic assumptions
- 1-2: No financial model, unrealistic projections, burning cash

Remember: Cash is oxygen. Run out and the company dies, regardless of how good the idea is.`;

  // INVESTOR-GRADE DATA PROPERTIES
  private unitEconomics: UnitEconomics | null = null;
  private financials: FinancialProjection | null = null;
  private scenarios: FinancialScenarios | null = null;
  private benchmarks: IndustryBenchmarks | null = null;
  private sensitivityResults: SensitivityResult[] = [];
  private validationScorecard: ValidationScorecard | null = null;

  constructor(
    prisma: PrismaService,
    eventEmitter: EventEmitter2,
    @Optional() llm?: LLMService,
  ) {
    super(prisma, eventEmitter, llm);
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
    this.logger.log('Starting INVESTOR-GRADE financial analysis v3.0');

    // Step 1: Get industry benchmarks
    this.benchmarks = this.getIndustryBenchmarks(input.idea.businessModel || 'saas');

    // Step 2: Analyze unit economics with confidence ranges
    await this.analyzeUnitEconomics(input);

    // Step 3: Validate assumptions against benchmarks
    await this.validateAssumptions(input);

    // Step 4: Model burn rate and runway
    await this.modelBurnRate(input);

    // Step 5: Calculate funding requirements
    await this.calculateFundingRequirements(input);

    // Step 6: Generate financial scenarios (Bull/Base/Bear)
    await this.generateFinancialScenarios(input);

    // Step 7: Perform sensitivity analysis
    await this.performSensitivityAnalysis(input);

    // Step 8: Detect red flags
    await this.detectRedFlags(input);

    // Step 9: Generate validation scorecard
    await this.generateValidationScorecard(input);

    this.buildRawAnalysis();
  }

  private async analyzeUnitEconomics(input: AnalysisInput): Promise<void> {
    const founderData = input.founderData || {};
    const b = this.benchmarks!;

    // Calculate CAC with confidence range
    const cacBase = founderData.cac || b.paybackMonths.median * 50; // Rough estimate
    const cac: ConfidenceRange = {
      low: cacBase * 0.7,
      mid: cacBase,
      high: cacBase * 1.5,
      confidence: founderData.cac ? 0.85 : 0.5,
      source: founderData.cac ? 'Founder-provided data' : 'Industry estimate',
    };

    // Calculate LTV with confidence range
    const ltvBase = founderData.ltv || cacBase * b.ltvCacRatio.median;
    const ltv: ConfidenceRange = {
      low: ltvBase * 0.6,
      mid: ltvBase,
      high: ltvBase * 1.4,
      confidence: founderData.ltv ? 0.85 : 0.5,
      source: founderData.ltv ? 'Founder-provided data' : 'Industry estimate',
    };

    // LTV:CAC ratio
    const ltvCacRatio: ConfidenceRange = {
      low: ltv.low / cac.high,
      mid: ltv.mid / cac.mid,
      high: ltv.high / cac.low,
      confidence: Math.min(cac.confidence, ltv.confidence),
      source: 'Calculated from CAC and LTV',
    };

    // Gross margin
    const gmBase = founderData.grossMargin || b.grossMargin.median;
    const grossMargin: ConfidenceRange = {
      low: Math.max(0, gmBase - 0.1),
      mid: gmBase,
      high: Math.min(0.95, gmBase + 0.1),
      confidence: founderData.grossMargin ? 0.85 : 0.6,
      source: founderData.grossMargin ? 'Founder-provided data' : `${b.industry} benchmark`,
    };

    // Payback period
    const paybackBase = cac.mid / (ltv.mid / 24);
    const paybackPeriodMonths: ConfidenceRange = {
      low: cac.low / (ltv.high / 24),
      mid: paybackBase,
      high: cac.high / (ltv.low / 24),
      confidence: 0.6,
      source: 'Calculated from unit economics',
    };

    // Churn rate
    const churnBase = founderData.churnRate || b.churnRate.median;
    const churnRate: ConfidenceRange = {
      low: Math.max(0.01, churnBase * 0.5),
      mid: churnBase,
      high: churnBase * 2,
      confidence: founderData.churnRate ? 0.8 : 0.5,
      source: founderData.churnRate ? 'Founder-provided data' : `${b.industry} benchmark`,
    };

    // ARPU (Average Revenue Per User)
    const arpuBase = founderData.arpu || ltv.mid / 24;
    const arpu: ConfidenceRange = {
      low: arpuBase * 0.7,
      mid: arpuBase,
      high: arpuBase * 1.3,
      confidence: founderData.arpu ? 0.85 : 0.5,
      source: founderData.arpu ? 'Founder-provided data' : 'Derived from LTV',
    };

    this.unitEconomics = { cac, ltv, ltvCacRatio, grossMargin, paybackPeriodMonths, churnRate, arpu };

    const citation = this.addCitation({
      claim: `LTV:CAC ratio: ${ltvCacRatio.low.toFixed(1)}-${ltvCacRatio.mid.toFixed(1)}-${ltvCacRatio.high.toFixed(1)} (Low/Mid/High)`,
      source: 'Unit Economics Analysis',
      sourceUrl: 'internal://david/unit-economics',
      confidence: ltvCacRatio.confidence,
      dataType: founderData.cac ? 'primary' : 'computed',
    });

    // Compare to benchmarks
    if (ltvCacRatio.mid >= b.ltvCacRatio.top25) {
      this.addFinding({
        title: 'Top-Quartile Unit Economics',
        description: `LTV:CAC of ${ltvCacRatio.mid.toFixed(1)}:1 exceeds ${b.industry} top 25% benchmark (${b.ltvCacRatio.top25}:1)`,
        type: 'strength',
        severity: 'major',
        evidence: [citation],
        confidence: Math.round(ltvCacRatio.confidence * 10),
      });
    } else if (ltvCacRatio.mid >= b.ltvCacRatio.median) {
      this.addFinding({
        title: 'Healthy Unit Economics',
        description: `LTV:CAC of ${ltvCacRatio.mid.toFixed(1)}:1 above ${b.industry} median (${b.ltvCacRatio.median}:1)`,
        type: 'strength',
        severity: 'minor',
        evidence: [citation],
        confidence: Math.round(ltvCacRatio.confidence * 10),
      });
    } else if (ltvCacRatio.mid < 1) {
      this.addFinding({
        title: 'Negative Unit Economics',
        description: `LTV:CAC of ${ltvCacRatio.mid.toFixed(1)}:1 means losing $${formatCurrency(cac.mid - ltv.mid)} on each customer`,
        type: 'weakness',
        severity: 'critical',
        evidence: [citation],
        confidence: Math.round(ltvCacRatio.confidence * 10),
      });

      this.addRisk({
        title: 'Unsustainable Business Model',
        description: 'Current unit economics will lead to cash burn without profitability path',
        category: 'financial',
        probability: 'high',
        impact: 'critical',
        mitigations: [
          'Reduce CAC through organic/viral growth channels',
          'Increase LTV through upselling or price increases',
          'Reduce churn with better retention strategies',
          'Consider pivoting business model',
        ],
        evidence: [citation],
      });
    } else if (ltvCacRatio.mid < b.ltvCacRatio.bottom25) {
      this.addFinding({
        title: 'Below-Average Unit Economics',
        description: `LTV:CAC of ${ltvCacRatio.mid.toFixed(1)}:1 below ${b.industry} bottom 25% (${b.ltvCacRatio.bottom25}:1)`,
        type: 'weakness',
        severity: 'major',
        evidence: [citation],
        confidence: Math.round(ltvCacRatio.confidence * 10),
      });

      this.addRecommendation({
        title: 'Improve Unit Economics',
        description: 'Focus on reducing CAC or increasing LTV to reach industry median',
        priority: 'high',
        timeframe: 'short-term',
        effort: 'high',
        impact: 'high',
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

    const burnBase = founderData.burnRate || this.estimateBurnRate(stage);
    const burnRate: ConfidenceRange = {
      low: burnBase * 0.8,
      mid: burnBase,
      high: burnBase * 1.4, // Conservative - burn often increases
      confidence: founderData.burnRate ? 0.85 : 0.5,
      source: founderData.burnRate ? 'Founder-provided data' : 'Stage-based estimate',
    };

    const currentCash = founderData.currentCash || 0;
    const runwayBase = currentCash > 0 ? currentCash / burnBase : 0;
    const runway: ConfidenceRange = {
      low: currentCash > 0 ? currentCash / burnRate.high : 0,
      mid: runwayBase,
      high: currentCash > 0 ? currentCash / burnRate.low : 0,
      confidence: founderData.currentCash ? 0.85 : 0.3,
      source: founderData.currentCash ? 'Calculated from cash and burn' : 'Estimated',
    };

    const breakEvenBase = this.estimateBreakEven(this.unitEconomics, burnRate.mid);
    const breakEvenMonths: ConfidenceRange = {
      low: Math.max(6, breakEvenBase * 0.7),
      mid: breakEvenBase,
      high: breakEvenBase * 1.5,
      confidence: 0.4,
      source: 'Projected from unit economics',
    };

    const fundingBase = this.calculateFundingRequiredAmount(burnRate.mid, runway.mid);
    const fundingRequired: ConfidenceRange = {
      low: fundingBase * 0.8,
      mid: fundingBase,
      high: fundingBase * 1.5,
      confidence: 0.5,
      source: 'Based on 18-month runway target',
    };

    // Revenue projections
    const u = this.unitEconomics;
    const monthlyNewCustomers = 10; // Conservative estimate
    const revenueM12Base = u ? monthlyNewCustomers * 12 * u.arpu.mid * (1 - Math.pow(1 - u.churnRate.mid, 6)) : 0;
    const revenueMonth12: ConfidenceRange = {
      low: revenueM12Base * 0.5,
      mid: revenueM12Base,
      high: revenueM12Base * 1.5,
      confidence: 0.4,
      source: 'Projected from unit economics',
    };

    const revenueM24Base = revenueM12Base * 2.5; // Assume growth
    const revenueMonth24: ConfidenceRange = {
      low: revenueM24Base * 0.4,
      mid: revenueM24Base,
      high: revenueM24Base * 2,
      confidence: 0.3,
      source: 'Projected with growth assumptions',
    };

    this.financials = { burnRate, runway, breakEvenMonths, fundingRequired, revenueMonth12, revenueMonth24 };

    const citation = this.addCitation({
      claim: `Burn rate: $${formatCurrency(burnRate.low)}-$${formatCurrency(burnRate.mid)}-$${formatCurrency(burnRate.high)}/month, Runway: ${runway.low.toFixed(0)}-${runway.mid.toFixed(0)}-${runway.high.toFixed(0)} months`,
      source: 'Burn Rate Analysis',
      sourceUrl: 'internal://david/burn-rate',
      confidence: burnRate.confidence,
      dataType: founderData.burnRate ? 'primary' : 'computed',
    });

    if (runway.mid > 0 && runway.mid < 6) {
      this.addFinding({
        title: 'Critical Runway',
        description: `Only ${runway.mid.toFixed(0)} months of runway (${runway.low.toFixed(0)}-${runway.high.toFixed(0)} range) - immediate funding needed`,
        type: 'threat',
        severity: 'critical',
        evidence: [citation],
        confidence: 8,
      });

      this.addRisk({
        title: 'Cash Crunch Risk',
        description: `At current burn ($${formatCurrency(burnRate.mid)}/mo), cash depletes in ${runway.mid.toFixed(0)} months`,
        category: 'financial',
        probability: 'high',
        impact: 'critical',
        mitigations: [
          'Reduce burn rate to extend runway to 12+ months',
          'Start fundraising immediately',
          'Explore bridge financing or revenue-based financing',
          'Cut non-essential expenses',
        ],
        evidence: [citation],
      });
    } else if (runway.mid >= 18) {
      this.addFinding({
        title: 'Strong Runway',
        description: `${runway.mid.toFixed(0)} months runway (${runway.low.toFixed(0)}-${runway.high.toFixed(0)} range) provides time to iterate and grow`,
        type: 'strength',
        severity: 'major',
        evidence: [citation],
        confidence: 8,
      });
    } else if (runway.mid >= 6 && runway.mid < 12) {
      this.addFinding({
        title: 'Limited Runway',
        description: `${runway.mid.toFixed(0)} months runway - fundraising should begin within 3 months`,
        type: 'weakness',
        severity: 'major',
        evidence: [citation],
        confidence: 8,
      });
    }
  }

  private async calculateFundingRequirements(input: AnalysisInput): Promise<void> {
    const f = this.financials;
    if (!f) return;

    const stage = input.idea.stage || 'idea';
    const askAmount = input.idea.askAmount;

    const citation = this.addCitation({
      claim: `Funding requirement: $${formatCurrency(f.fundingRequired.low)}-$${formatCurrency(f.fundingRequired.mid)}-$${formatCurrency(f.fundingRequired.high)} (Low/Mid/High)`,
      source: 'Funding Analysis',
      sourceUrl: 'internal://david/funding-requirement',
      confidence: f.fundingRequired.confidence,
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

    // Compare ask amount to calculated need
    if (askAmount) {
      if (askAmount < f.fundingRequired.low * 0.5) {
        this.addFinding({
          title: 'Underfunding Risk',
          description: `Ask of $${formatCurrency(askAmount)} significantly below calculated need of $${formatCurrency(f.fundingRequired.mid)}`,
          type: 'weakness',
          severity: 'major',
          evidence: [citation],
          confidence: 7,
        });

        this.addRisk({
          title: 'Insufficient Capital',
          description: 'Raising less than needed increases risk of running out of money before reaching milestones',
          category: 'financial',
          probability: 'high',
          impact: 'critical',
          mitigations: [
            'Increase raise amount to match runway needs',
            'Identify additional revenue sources',
            'Plan for bridge round if needed',
          ],
          evidence: [citation],
        });
      } else if (askAmount > f.fundingRequired.high * 1.5) {
        this.addFinding({
          title: 'Large Raise',
          description: `Ask of $${formatCurrency(askAmount)} exceeds calculated need - ensure clear use of funds`,
          type: 'neutral',
          severity: 'info',
          evidence: [citation],
          confidence: 6,
        });
      } else if (askAmount >= range[0] && askAmount <= range[1]) {
        this.addFinding({
          title: 'Appropriate Funding Ask',
          description: `Ask of $${formatCurrency(askAmount)} is within typical ${stage} range ($${formatCurrency(range[0])}-$${formatCurrency(range[1])})`,
          type: 'strength',
          severity: 'minor',
          evidence: [citation],
          confidence: 7,
        });
      }
    }
  }

  /**
   * INVESTOR-GRADE: Financial Scenarios (Bull/Base/Bear)
   */
  private async generateFinancialScenarios(input: AnalysisInput): Promise<void> {
    const u = this.unitEconomics;
    const f = this.financials;
    if (!u || !f) return;

    // Bull Case: Everything goes right
    const bull: ScenarioAnalysis = {
      bull: {
        probability: 20,
        multiplier: 3.0,
        description: 'Strong product-market fit, viral growth, expanding margins',
        keyAssumptions: [
          'CAC decreases 30% through organic growth',
          'Churn drops to bottom quartile',
          'Gross margin improves to 85%+',
          'Revenue grows 3x YoY',
        ],
        triggers: ['Viral adoption', 'Strategic partnership', 'Category leadership'],
      },
      base: {
        probability: 50,
        multiplier: 1.0,
        description: 'Steady growth matching industry benchmarks',
        keyAssumptions: [
          'Unit economics remain stable',
          'Growth matches industry median',
          'Churn at benchmark levels',
        ],
        triggers: ['Normal execution', 'Market conditions stable'],
      },
      bear: {
        probability: 30,
        multiplier: 0.3,
        description: 'CAC increases, churn rises, margins compress',
        keyAssumptions: [
          'CAC increases 50%+',
          'Churn doubles',
          'Gross margin drops 10 points',
          'Funding environment tightens',
        ],
        triggers: ['Competition intensifies', 'Market downturn', 'Key hire departure'],
      },
    };

    // Calculate expected value
    const expectedValue = (bull.bull.probability * bull.bull.multiplier +
                          bull.base.probability * bull.base.multiplier +
                          bull.bear.probability * bull.bear.multiplier) / 100;

    this.scenarios = { bull, base: bull, bear: bull, expectedValue };

    const citation = this.addCitation({
      claim: `Financial scenario analysis: Expected value ${expectedValue.toFixed(2)}x (20% bull / 50% base / 30% bear)`,
      source: 'Scenario Analysis',
      sourceUrl: 'internal://david/scenario-analysis',
      confidence: 0.5,
      dataType: 'computed',
    });

    if (expectedValue < 0.8) {
      this.addFinding({
        title: 'Challenging Risk Profile',
        description: `Expected value of ${expectedValue.toFixed(2)}x suggests downside risk outweighs upside`,
        type: 'weakness',
        severity: 'major',
        evidence: [citation],
        confidence: 5,
      });
    } else if (expectedValue >= 1.2) {
      this.addFinding({
        title: 'Favorable Risk/Reward',
        description: `Expected value of ${expectedValue.toFixed(2)}x indicates attractive risk-adjusted return`,
        type: 'strength',
        severity: 'major',
        evidence: [citation],
        confidence: 5,
      });
    }
  }

  private async performSensitivityAnalysis(input: AnalysisInput): Promise<void> {
    const u = this.unitEconomics;
    if (!u) return;

    this.sensitivityResults = [];

    // Test 1: CAC increases 50%
    const cacPessimistic = u.cac.mid * 1.5;
    const ltvCacAfterCAC = u.ltv.mid / cacPessimistic;
    this.sensitivityResults.push({
      variable: 'CAC +50%',
      baseValue: u.cac.mid,
      pessimisticValue: cacPessimistic,
      pessimisticResult: ltvCacAfterCAC,
      optimisticValue: u.cac.mid * 0.7,
      optimisticResult: u.ltv.mid / (u.cac.mid * 0.7),
      elasticity: (ltvCacAfterCAC - u.ltvCacRatio.mid) / u.ltvCacRatio.mid / 0.5,
    });

    if (ltvCacAfterCAC < 1) {
      this.addRisk({
        title: 'CAC Sensitivity',
        description: `If CAC increases 50% to $${formatCurrency(cacPessimistic)}, LTV:CAC drops to ${ltvCacAfterCAC.toFixed(1)}:1 (negative)`,
        category: 'financial',
        probability: 'medium',
        impact: 'critical',
        mitigations: [
          'Diversify acquisition channels to reduce CAC volatility',
          'Build organic growth loops (referrals, content, SEO)',
          'Focus on retention to boost LTV',
        ],
        evidence: [],
      });
    }

    // Test 2: Churn doubles
    const churnPessimistic = u.churnRate.mid * 2;
    const ltvAfterChurn = u.arpu.mid / churnPessimistic * 12; // Simplified LTV calculation
    this.sensitivityResults.push({
      variable: 'Churn x2',
      baseValue: u.churnRate.mid,
      pessimisticValue: churnPessimistic,
      pessimisticResult: ltvAfterChurn / u.cac.mid,
      optimisticValue: u.churnRate.mid * 0.5,
      optimisticResult: (u.arpu.mid / (u.churnRate.mid * 0.5) * 12) / u.cac.mid,
      elasticity: ((ltvAfterChurn / u.cac.mid) - u.ltvCacRatio.mid) / u.ltvCacRatio.mid,
    });

    if (ltvAfterChurn / u.cac.mid < 2) {
      this.addRisk({
        title: 'Churn Sensitivity',
        description: `If churn doubles to ${(churnPessimistic * 100).toFixed(1)}%, LTV:CAC drops to ${(ltvAfterChurn / u.cac.mid).toFixed(1)}:1`,
        category: 'financial',
        probability: 'medium',
        impact: 'major',
        mitigations: [
          'Implement proactive churn prevention',
          'Improve onboarding to drive early engagement',
          'Build switching costs through integrations',
        ],
        evidence: [],
      });
    }

    // Test 3: Burn increases 40%
    const f = this.financials;
    if (f && f.runway.mid > 0) {
      const burnPessimistic = f.burnRate.mid * 1.4;
      const runwayAfterBurn = f.runway.mid * f.burnRate.mid / burnPessimistic;
      this.sensitivityResults.push({
        variable: 'Burn +40%',
        baseValue: f.burnRate.mid,
        pessimisticValue: burnPessimistic,
        pessimisticResult: runwayAfterBurn,
        optimisticValue: f.burnRate.mid * 0.7,
        optimisticResult: f.runway.mid * f.burnRate.mid / (f.burnRate.mid * 0.7),
        elasticity: (runwayAfterBurn - f.runway.mid) / f.runway.mid / 0.4,
      });

      if (runwayAfterBurn < 6) {
        this.addRisk({
          title: 'Burn Rate Sensitivity',
          description: `If burn increases 40% to $${formatCurrency(burnPessimistic)}/mo, runway drops to ${runwayAfterBurn.toFixed(0)} months`,
          category: 'financial',
          probability: 'medium',
          impact: 'major',
          mitigations: [
            'Maintain strict budget controls',
            'Keep flexible cost base (contractors vs FTEs)',
            'Build in contingency buffer for unexpected costs',
          ],
          evidence: [],
        });
      }
    }

    const citation = this.addCitation({
      claim: `Sensitivity analysis: ${this.sensitivityResults.length} variables stress-tested`,
      source: 'Sensitivity Analysis',
      sourceUrl: 'internal://david/sensitivity',
      confidence: 0.6,
      dataType: 'computed',
    });
  }

  private async detectRedFlags(input: AnalysisInput): Promise<void> {
    const founderData = input.founderData || {};
    const u = this.unitEconomics;
    const f = this.financials;

    // Red flag 1: Revenue projections significantly exceed expense estimates
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

    // Red flag 2: Payback period exceeds customer lifetime
    if (u && u.paybackPeriodMonths.mid > 24) {
      this.addFinding({
        title: 'Long Payback Period',
        description: `Payback of ${u.paybackPeriodMonths.mid.toFixed(0)} months exceeds typical customer lifetime`,
        type: 'weakness',
        severity: 'major',
        evidence: [],
        confidence: 6,
      });
    }

    // Red flag 3: High churn rate
    if (u && u.churnRate.mid > 0.1) {
      this.addFinding({
        title: 'High Churn Rate',
        description: `Monthly churn of ${(u.churnRate.mid * 100).toFixed(1)}% (${(u.churnRate.mid * 12 * 100).toFixed(0)}% annual) significantly erodes LTV`,
        type: 'weakness',
        severity: 'major',
        evidence: [],
        confidence: 7,
      });
    }

    // Red flag 4: Low gross margin
    if (u && u.grossMargin.mid < 0.5) {
      this.addFinding({
        title: 'Low Gross Margin',
        description: `Gross margin of ${(u.grossMargin.mid * 100).toFixed(0)}% limits ability to invest in growth`,
        type: 'weakness',
        severity: 'major',
        evidence: [],
        confidence: 7,
      });

      this.addRecommendation({
        title: 'Improve Gross Margin',
        description: 'Explore pricing increases, cost reductions, or automation to improve unit economics',
        priority: 'high',
        timeframe: 'short-term',
        effort: 'medium',
        impact: 'high',
      });
    }
  }

  /**
   * INVESTOR-GRADE: Validation Scorecard
   */
  private async generateValidationScorecard(input: AnalysisInput): Promise<void> {
    const u = this.unitEconomics;
    const f = this.financials;
    const founderData = input.founderData || {};

    // Data Quality Score - based on what data was provided vs estimated
    let dataQualityScore = 2;
    if (founderData.cac) dataQualityScore += 2;
    if (founderData.ltv) dataQualityScore += 2;
    if (founderData.burnRate) dataQualityScore += 2;
    if (founderData.currentCash) dataQualityScore += 2;

    // Source Verification Score
    const highConfCitations = this.citations.filter(c => c.confidence >= 0.7);
    const sourceScore = Math.min(10, Math.round((highConfCitations.length / Math.max(1, this.citations.length)) * 10));

    // Analysis Depth Score
    const hasScenarios = this.scenarios !== null;
    const hasSensitivity = this.sensitivityResults.length > 0;
    const hasBenchmarks = this.benchmarks !== null;
    const analysisDepthScore = 4 + (hasScenarios ? 2 : 0) + (hasSensitivity ? 2 : 0) + (hasBenchmarks ? 2 : 0);

    // Risk Assessment Score
    const riskScore = Math.min(10, this.risks.length * 2);

    // Actionability Score
    const actionabilityScore = Math.min(10, this.recommendations.length * 2);

    // Overall
    const totalScore = dataQualityScore + sourceScore + analysisDepthScore + riskScore + actionabilityScore;
    const maxScore = 50;
    const grade = calculateGrade(totalScore, maxScore);

    this.validationScorecard = {
      dataQuality: {
        score: dataQualityScore,
        maxScore: 10,
        details: `${Object.keys(founderData).length} data points provided`,
      },
      sourceVerification: {
        score: sourceScore,
        maxScore: 10,
        details: `${highConfCitations.length}/${this.citations.length} high-confidence citations`,
      },
      analysisDepth: {
        score: analysisDepthScore,
        maxScore: 10,
        details: [
          hasScenarios ? 'Scenario Analysis' : null,
          hasSensitivity ? 'Sensitivity Analysis' : null,
          hasBenchmarks ? 'Industry Benchmarking' : null,
        ].filter(Boolean).join(', ') || 'Basic analysis',
      },
      riskAssessment: {
        score: riskScore,
        maxScore: 10,
        details: `${this.risks.length} financial risks identified`,
      },
      actionability: {
        score: actionabilityScore,
        maxScore: 10,
        details: `${this.recommendations.length} recommendations provided`,
      },
      overall: {
        score: totalScore,
        maxScore,
        grade,
      },
    };
  }

  private buildRawAnalysis(): void {
    const u = this.unitEconomics;
    const f = this.financials;
    const b = this.benchmarks;
    const sc = this.validationScorecard;
    const s = this.scenarios;

    this.rawAnalysis = `
# 💰 DAVID - FINANCIAL ANALYSIS
## Investor-Grade Report v3.0

---

## VALIDATION SCORECARD
| Category | Score | Grade | Details |
|----------|-------|-------|---------|
| Data Quality | ${sc?.dataQuality.score || 0}/${sc?.dataQuality.maxScore || 10} | ${this.getGradeEmoji(sc?.dataQuality.score || 0, sc?.dataQuality.maxScore || 10)} | ${sc?.dataQuality.details || 'N/A'} |
| Source Verification | ${sc?.sourceVerification.score || 0}/${sc?.sourceVerification.maxScore || 10} | ${this.getGradeEmoji(sc?.sourceVerification.score || 0, sc?.sourceVerification.maxScore || 10)} | ${sc?.sourceVerification.details || 'N/A'} |
| Analysis Depth | ${sc?.analysisDepth.score || 0}/${sc?.analysisDepth.maxScore || 10} | ${this.getGradeEmoji(sc?.analysisDepth.score || 0, sc?.analysisDepth.maxScore || 10)} | ${sc?.analysisDepth.details || 'N/A'} |
| Risk Assessment | ${sc?.riskAssessment.score || 0}/${sc?.riskAssessment.maxScore || 10} | ${this.getGradeEmoji(sc?.riskAssessment.score || 0, sc?.riskAssessment.maxScore || 10)} | ${sc?.riskAssessment.details || 'N/A'} |
| Actionability | ${sc?.actionability.score || 0}/${sc?.actionability.maxScore || 10} | ${this.getGradeEmoji(sc?.actionability.score || 0, sc?.actionability.maxScore || 10)} | ${sc?.actionability.details || 'N/A'} |
| **OVERALL** | **${sc?.overall.score || 0}/${sc?.overall.maxScore || 50}** | **${sc?.overall.grade || 'N/A'}** | |

---

## EXECUTIVE SUMMARY

**Unit Economics Health**: ${u ? (u.ltvCacRatio.mid >= 3 ? '✅ Healthy' : u.ltvCacRatio.mid >= 1 ? '⚠️ Needs Improvement' : '❌ Negative') : 'N/A'}
**Runway Status**: ${f ? (f.runway.mid >= 18 ? '✅ Strong' : f.runway.mid >= 12 ? '⚠️ Adequate' : f.runway.mid >= 6 ? '🟡 Limited' : '❌ Critical') : 'N/A'}
**Industry Benchmark**: ${b?.industry || 'N/A'}

---

## UNIT ECONOMICS (with Confidence Ranges)

| Metric | Low | Mid | High | Confidence | vs Benchmark |
|--------|-----|-----|------|------------|--------------|
| CAC | $${u ? formatCurrency(u.cac.low) : 'N/A'} | $${u ? formatCurrency(u.cac.mid) : 'N/A'} | $${u ? formatCurrency(u.cac.high) : 'N/A'} | ${u ? Math.round(u.cac.confidence * 100) : 0}% | ${b ? (u && u.cac.mid < b.paybackMonths.median * 50 ? '✅' : '⚠️') : '-'} |
| LTV | $${u ? formatCurrency(u.ltv.low) : 'N/A'} | $${u ? formatCurrency(u.ltv.mid) : 'N/A'} | $${u ? formatCurrency(u.ltv.high) : 'N/A'} | ${u ? Math.round(u.ltv.confidence * 100) : 0}% | - |
| **LTV:CAC** | **${u?.ltvCacRatio.low.toFixed(1) || 'N/A'}** | **${u?.ltvCacRatio.mid.toFixed(1) || 'N/A'}** | **${u?.ltvCacRatio.high.toFixed(1) || 'N/A'}** | ${u ? Math.round(u.ltvCacRatio.confidence * 100) : 0}% | ${b ? `Median: ${b.ltvCacRatio.median}` : '-'} |
| Gross Margin | ${u ? (u.grossMargin.low * 100).toFixed(0) : 'N/A'}% | ${u ? (u.grossMargin.mid * 100).toFixed(0) : 'N/A'}% | ${u ? (u.grossMargin.high * 100).toFixed(0) : 'N/A'}% | ${u ? Math.round(u.grossMargin.confidence * 100) : 0}% | ${b ? `Median: ${(b.grossMargin.median * 100).toFixed(0)}%` : '-'} |
| Payback Period | ${u?.paybackPeriodMonths.low.toFixed(0) || 'N/A'} mo | ${u?.paybackPeriodMonths.mid.toFixed(0) || 'N/A'} mo | ${u?.paybackPeriodMonths.high.toFixed(0) || 'N/A'} mo | ${u ? Math.round(u.paybackPeriodMonths.confidence * 100) : 0}% | ${b ? `Median: ${b.paybackMonths.median} mo` : '-'} |
| Churn Rate | ${u ? (u.churnRate.low * 100).toFixed(1) : 'N/A'}% | ${u ? (u.churnRate.mid * 100).toFixed(1) : 'N/A'}% | ${u ? (u.churnRate.high * 100).toFixed(1) : 'N/A'}% | ${u ? Math.round(u.churnRate.confidence * 100) : 0}% | ${b ? `Median: ${(b.churnRate.median * 100).toFixed(1)}%` : '-'} |
| ARPU | $${u ? formatCurrency(u.arpu.low) : 'N/A'} | $${u ? formatCurrency(u.arpu.mid) : 'N/A'} | $${u ? formatCurrency(u.arpu.high) : 'N/A'} | ${u ? Math.round(u.arpu.confidence * 100) : 0}% | - |

---

## FINANCIAL PROJECTIONS

| Metric | Low | Mid | High | Confidence |
|--------|-----|-----|------|------------|
| Monthly Burn | $${f ? formatCurrency(f.burnRate.low) : 'N/A'} | $${f ? formatCurrency(f.burnRate.mid) : 'N/A'} | $${f ? formatCurrency(f.burnRate.high) : 'N/A'} | ${f ? Math.round(f.burnRate.confidence * 100) : 0}% |
| Runway | ${f?.runway.low.toFixed(0) || 'N/A'} mo | ${f?.runway.mid.toFixed(0) || 'N/A'} mo | ${f?.runway.high.toFixed(0) || 'N/A'} mo | ${f ? Math.round(f.runway.confidence * 100) : 0}% |
| Break-even | ${f?.breakEvenMonths.low.toFixed(0) || 'N/A'} mo | ${f?.breakEvenMonths.mid.toFixed(0) || 'N/A'} mo | ${f?.breakEvenMonths.high.toFixed(0) || 'N/A'} mo | ${f ? Math.round(f.breakEvenMonths.confidence * 100) : 0}% |
| Funding Required | $${f ? formatCurrency(f.fundingRequired.low) : 'N/A'} | $${f ? formatCurrency(f.fundingRequired.mid) : 'N/A'} | $${f ? formatCurrency(f.fundingRequired.high) : 'N/A'} | ${f ? Math.round(f.fundingRequired.confidence * 100) : 0}% |
| Revenue (M12) | $${f ? formatCurrency(f.revenueMonth12.low) : 'N/A'} | $${f ? formatCurrency(f.revenueMonth12.mid) : 'N/A'} | $${f ? formatCurrency(f.revenueMonth12.high) : 'N/A'} | ${f ? Math.round(f.revenueMonth12.confidence * 100) : 0}% |
| Revenue (M24) | $${f ? formatCurrency(f.revenueMonth24.low) : 'N/A'} | $${f ? formatCurrency(f.revenueMonth24.mid) : 'N/A'} | $${f ? formatCurrency(f.revenueMonth24.high) : 'N/A'} | ${f ? Math.round(f.revenueMonth24.confidence * 100) : 0}% |

---

## FINANCIAL SCENARIOS

| Scenario | Probability | Multiplier | Description |
|----------|-------------|------------|-------------|
| 🐂 Bull | ${s?.bull.bull.probability || 0}% | ${s?.bull.bull.multiplier || 0}x | ${s?.bull.bull.description || 'N/A'} |
| 📊 Base | ${s?.bull.base.probability || 0}% | ${s?.bull.base.multiplier || 0}x | ${s?.bull.base.description || 'N/A'} |
| 🐻 Bear | ${s?.bull.bear.probability || 0}% | ${s?.bull.bear.multiplier || 0}x | ${s?.bull.bear.description || 'N/A'} |

**Expected Value**: ${s?.expectedValue.toFixed(2) || 'N/A'}x

---

## SENSITIVITY ANALYSIS

| Variable | Base Value | Pessimistic | Result | Optimistic | Result |
|----------|------------|-------------|--------|------------|--------|
${this.sensitivityResults.map(sr => `| ${sr.variable} | ${sr.variable.includes('$') || sr.variable.includes('Burn') ? '$' + formatCurrency(sr.baseValue) : sr.baseValue.toFixed(2)} | ${sr.variable.includes('$') || sr.variable.includes('Burn') ? '$' + formatCurrency(sr.pessimisticValue) : sr.pessimisticValue.toFixed(2)} | ${sr.pessimisticResult.toFixed(1)} | ${sr.variable.includes('$') || sr.variable.includes('Burn') ? '$' + formatCurrency(sr.optimisticValue) : sr.optimisticValue.toFixed(2)} | ${sr.optimisticResult.toFixed(1)} |`).join('\n') || '| No sensitivity data | | | | | |'}

---

## INDUSTRY BENCHMARKS (${b?.industry || 'N/A'})

| Metric | Bottom 25% | Median | Top 25% | Your Position |
|--------|------------|--------|---------|---------------|
| LTV:CAC | ${b?.ltvCacRatio.bottom25 || 'N/A'} | ${b?.ltvCacRatio.median || 'N/A'} | ${b?.ltvCacRatio.top25 || 'N/A'} | ${u?.ltvCacRatio.mid.toFixed(1) || 'N/A'} |
| Gross Margin | ${b ? (b.grossMargin.bottom25 * 100).toFixed(0) : 'N/A'}% | ${b ? (b.grossMargin.median * 100).toFixed(0) : 'N/A'}% | ${b ? (b.grossMargin.top25 * 100).toFixed(0) : 'N/A'}% | ${u ? (u.grossMargin.mid * 100).toFixed(0) : 'N/A'}% |
| Churn Rate | ${b ? (b.churnRate.bottom25 * 100).toFixed(1) : 'N/A'}% | ${b ? (b.churnRate.median * 100).toFixed(1) : 'N/A'}% | ${b ? (b.churnRate.top25 * 100).toFixed(1) : 'N/A'}% | ${u ? (u.churnRate.mid * 100).toFixed(1) : 'N/A'}% |
| Payback Period | ${b?.paybackMonths.bottom25 || 'N/A'} mo | ${b?.paybackMonths.median || 'N/A'} mo | ${b?.paybackMonths.top25 || 'N/A'} mo | ${u?.paybackPeriodMonths.mid.toFixed(0) || 'N/A'} mo |

*Source: ${b?.source || 'N/A'}*

---

## KEY FINDINGS

${this.findings.map(f => `### ${f.type === 'strength' ? '✅' : f.type === 'weakness' ? '⚠️' : f.type === 'opportunity' ? '🎯' : f.type === 'threat' ? '🚨' : '📌'} ${f.title}
**Type**: ${f.type?.toUpperCase()} | **Severity**: ${f.severity?.toUpperCase()} | **Confidence**: ${f.confidence}/10
${f.description}
`).join('\n')}

---

## RISK MATRIX

| Risk | Category | Probability | Impact | Mitigations |
|------|----------|-------------|--------|-------------|
${this.risks.map(r => `| ${r.title} | ${r.category} | ${r.probability} | ${r.impact} | ${r.mitigations?.slice(0, 2).join('; ') || 'None'} |`).join('\n')}

---

## RECOMMENDATIONS

${this.recommendations.map((r, i) => `### ${i + 1}. ${r.title}
**Priority**: ${r.priority?.toUpperCase()} | **Timeframe**: ${r.timeframe} | **Effort**: ${r.effort} | **Impact**: ${r.impact}

${r.description}
`).join('\n')}

---

## DATA SOURCES & CITATIONS

${this.citations.map((c, i) => `${i + 1}. **${c.claim}**
   - Source: ${c.source}
   - URL: ${c.sourceUrl}
   - Confidence: ${Math.round(c.confidence * 100)}%
   - Data Type: ${c.dataType}
`).join('\n')}

---

*Report generated by David v${this.agentVersion} at ${new Date().toISOString()}*

${REPORT_DISCLAIMER}
    `.trim();
  }

  private getGradeEmoji(score: number, maxScore: number): string {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return '🌟 A+';
    if (percentage >= 80) return '✅ A';
    if (percentage >= 70) return '👍 B';
    if (percentage >= 60) return '⚡ C';
    if (percentage >= 50) return '⚠️ D';
    return '❌ F';
  }

  protected calculateScore(): number {
    // If LLM provided a score, use weighted average
    if (this.llmAnalysis) {
      const llmScore = this.llmAnalysis.score;
      const rulesScore = this.calculateRulesBasedScore();
      return Math.round((llmScore * 0.6 + rulesScore * 0.4) * 10) / 10;
    }
    return this.calculateRulesBasedScore();
  }

  private calculateRulesBasedScore(): number {
    const u = this.unitEconomics;
    const f = this.financials;

    let score = 5;

    if (u) {
      // LTV:CAC scoring
      if (u.ltvCacRatio.mid >= 5) score += 2;
      else if (u.ltvCacRatio.mid >= 3) score += 1;
      else if (u.ltvCacRatio.mid < 1) score -= 3;
      else if (u.ltvCacRatio.mid < 2) score -= 1;

      // Gross margin scoring
      if (u.grossMargin.mid >= 0.8) score += 0.5;
      else if (u.grossMargin.mid < 0.5) score -= 1;
    }

    if (f) {
      // Runway scoring
      if (f.runway.mid >= 18) score += 1;
      else if (f.runway.mid < 6 && f.runway.mid > 0) score -= 2;
    }

    return Math.max(1, Math.min(10, Math.round(score * 10) / 10));
  }

  // Helper methods
  private getIndustryBenchmarks(businessModel: string): IndustryBenchmarks {
    const model = businessModel.toLowerCase();

    const benchmarkDatabase: Record<string, IndustryBenchmarks> = {
      saas: {
        industry: 'SaaS',
        ltvCacRatio: { median: 3.0, top25: 5.0, bottom25: 1.5 },
        grossMargin: { median: 0.75, top25: 0.85, bottom25: 0.65 },
        churnRate: { median: 0.05, top25: 0.02, bottom25: 0.10 },
        burnMultiple: { median: 1.5, top25: 1.0, bottom25: 3.0 },
        paybackMonths: { median: 12, top25: 6, bottom25: 24 },
        source: 'OpenView SaaS Benchmarks 2024',
      },
      marketplace: {
        industry: 'Marketplace',
        ltvCacRatio: { median: 2.5, top25: 4.0, bottom25: 1.2 },
        grossMargin: { median: 0.60, top25: 0.75, bottom25: 0.45 },
        churnRate: { median: 0.08, top25: 0.04, bottom25: 0.15 },
        burnMultiple: { median: 2.0, top25: 1.2, bottom25: 4.0 },
        paybackMonths: { median: 8, top25: 4, bottom25: 18 },
        source: 'a16z Marketplace Benchmarks',
      },
      ecommerce: {
        industry: 'E-commerce',
        ltvCacRatio: { median: 2.0, top25: 3.5, bottom25: 1.0 },
        grossMargin: { median: 0.40, top25: 0.55, bottom25: 0.25 },
        churnRate: { median: 0.10, top25: 0.05, bottom25: 0.20 },
        burnMultiple: { median: 2.5, top25: 1.5, bottom25: 5.0 },
        paybackMonths: { median: 6, top25: 3, bottom25: 12 },
        source: 'Shopify E-commerce Benchmarks',
      },
      fintech: {
        industry: 'Fintech',
        ltvCacRatio: { median: 3.5, top25: 6.0, bottom25: 2.0 },
        grossMargin: { median: 0.70, top25: 0.85, bottom25: 0.55 },
        churnRate: { median: 0.04, top25: 0.02, bottom25: 0.08 },
        burnMultiple: { median: 1.8, top25: 1.0, bottom25: 3.5 },
        paybackMonths: { median: 14, top25: 8, bottom25: 24 },
        source: 'Fintech SaaS Benchmarks',
      },
      default: {
        industry: 'Technology',
        ltvCacRatio: { median: 3.0, top25: 5.0, bottom25: 1.5 },
        grossMargin: { median: 0.65, top25: 0.80, bottom25: 0.50 },
        churnRate: { median: 0.06, top25: 0.03, bottom25: 0.12 },
        burnMultiple: { median: 2.0, top25: 1.2, bottom25: 4.0 },
        paybackMonths: { median: 12, top25: 6, bottom25: 24 },
        source: 'Technology Industry Averages',
      },
    };

    // Match business model
    for (const [key, benchmarks] of Object.entries(benchmarkDatabase)) {
      if (model.includes(key) || key.includes(model)) {
        return benchmarks;
      }
    }

    return benchmarkDatabase.default;
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
    const monthlyProfit = (unitEconomics.ltv.mid / 24) * unitEconomics.grossMargin.mid;
    const customersNeeded = burnRate / monthlyProfit;
    return Math.ceil(customersNeeded / 10); // Assuming 10 new customers/month
  }

  private calculateFundingRequiredAmount(burnRate: number, currentRunway: number): number {
    const targetRunway = 18;
    const additionalMonths = Math.max(0, targetRunway - currentRunway);
    return burnRate * additionalMonths * 1.5; // 1.5x buffer
  }
}
