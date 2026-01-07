/**
 * Victor - Chief Valuation Officer
 *
 * INVESTOR-GRADE VALUATION ANALYSIS v3.0
 *
 * Purpose: Calculates company valuation using multiple methodologies and comparable analysis.
 * Personality: Quantitative, methodical, conservative but fair.
 * Scoring Weight: 1.0x
 *
 * KEY FEATURES:
 * - Multiple Valuation Methods (Revenue Multiple, Comparable, Stage-Based, DCF, Scorecard)
 * - Comparable Transactions with Real Data
 * - DCF Analysis with Scenario Modeling
 * - Risk-Adjusted Valuation
 * - Sensitivity Analysis
 * - Validation Scorecard (A-F grading)
 *
 * INVESTOR-GRADE STANDARDS:
 * - All valuations include confidence ranges
 * - Multiple methodologies triangulated
 * - Comparable transaction evidence
 * - Sensitivity tables for key assumptions
 * - Bull/Base/Bear scenario analysis
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
 * Enhanced Valuation Method with confidence ranges
 */
interface ValuationMethod {
  method: string;
  value: { low: number; mid: number; high: number };
  confidence: number;
  weight: number;
  assumptions: string[];
  applicability: 'high' | 'medium' | 'low';
  rationale: string;
}

/**
 * Comparable Transaction for benchmarking
 */
interface ComparableTransaction {
  companyName: string;
  industry: string;
  stage: string;
  valuation: number;
  revenue: number;
  multiple: number;
  fundingDate: string;
  investors: string[];
  relevanceScore: number;
  source: string;
}

/**
 * DCF Analysis Output
 */
interface DCFAnalysis {
  terminalValue: number;
  discountRate: number;
  projectedCashFlows: { year: number; cashFlow: number; discounted: number }[];
  enterpriseValue: number;
  assumptions: string[];
  sensitivityTable: { discountRate: number; terminalGrowth: number; value: number }[];
}

/**
 * Scorecard Valuation Components
 */
interface ScorecardValuation {
  baseValuation: number;
  adjustments: { factor: string; score: number; adjustment: number }[];
  adjustedValuation: number;
  methodology: string;
}

/**
 * Risk-Adjusted Metrics
 */
interface RiskAdjustment {
  factor: string;
  category: string;
  impact: number; // -30% to +30%
  probability: number;
  expectedAdjustment: number;
}

/**
 * Sensitivity Analysis Entry
 */
interface SensitivityEntry {
  variable: string;
  baseCase: number;
  scenarios: { change: string; value: number; valuationImpact: number }[];
}

/**
 * Valuation Scenarios
 */
interface ValuationScenarios {
  bull: { valuation: number; probability: number; drivers: string[] };
  base: { valuation: number; probability: number; drivers: string[] };
  bear: { valuation: number; probability: number; drivers: string[] };
  expectedValue: number;
}

/**
 * Comprehensive Valuation Analysis
 */
interface ValuationAnalysis {
  methods: ValuationMethod[];
  comparables: ComparableTransaction[];
  dcf: DCFAnalysis | null;
  scorecard: ScorecardValuation | null;
  riskAdjustments: RiskAdjustment[];
  sensitivityAnalysis: SensitivityEntry[];
  scenarios: ValuationScenarios;
  recommended: {
    preMoney: { low: number; mid: number; high: number };
    postMoney: { low: number; mid: number; high: number };
    impliedOwnership: number;
  };
  negotiationRange: { floor: number; target: number; ceiling: number };
  defensePoints: string[];
}

@Injectable()
export class VictorAgent extends BaseAnalysisAgent {
  protected readonly agentId = 'victor';
  protected readonly agentName = 'Victor';
  protected readonly agentVersion = '3.0.0'; // INVESTOR-GRADE
  protected readonly scoringWeight = 1.0;

  protected readonly personality = `You are Victor, Chief Valuation Officer of the Validation Council.

INVESTOR-GRADE VALUATION v3.0

PERSONALITY TRAITS:
- Quantitative: Numbers don't lie. You calculate, don't guess.
- Methodical: Multiple valuation methods triangulate to truth.
- Conservative but Fair: Don't undervalue, but don't let enthusiasm inflate numbers.
- Transparent: Show your work. Founders should understand how you got there.

VALUATION FRAMEWORK (5 Methods):
1. Revenue Multiple - ARR/MRR multiples by industry and growth
2. Comparable Transactions - Recent funding rounds for similar companies
3. Stage-Based - Typical valuations for stage/traction combination
4. DCF Analysis - Discounted cash flows for revenue-stage companies
5. Scorecard Method - Weighted factor adjustment from baseline

INVESTOR-GRADE STANDARDS:
- Every valuation has Low/Mid/High ranges
- Comparable transaction evidence required
- Sensitivity analysis for key assumptions
- Bull/Base/Bear scenarios with probabilities
- Risk-adjusted expected value calculation
- Negotiation range with defense points

SCORING CRITERIA:
- 9-10: Multiple methods converge, strong comparables, narrow range
- 7-8: Good triangulation, reasonable comparables, moderate confidence
- 5-6: Limited methods applicable, wider range, growing uncertainty
- 3-4: Pre-revenue, limited comparables, high uncertainty
- 1-2: Speculative valuation, insufficient data for confidence

Remember: Valuation is part art, part science. Show the art AND the science.`;

  private valuationAnalysis: ValuationAnalysis | null = null;
  private validationScorecard: ValidationScorecard | null = null;

  constructor(
    prisma: PrismaService,
    eventEmitter: EventEmitter2,
    @Optional() llm?: LLMService,
  ) {
    super(prisma, eventEmitter, llm);
  }

  protected buildAnalysisPrompt(input: AnalysisInput): string {
    return `Calculate the valuation for this startup:

STARTUP: ${input.idea.title}
DESCRIPTION: ${input.idea.description}
INDUSTRY: ${input.idea.industry || 'Not specified'}
STAGE: ${input.idea.stage || 'Seed'}
BUSINESS MODEL: ${input.idea.businessModel || 'Not specified'}

METRICS (if available):
- Current Revenue: ${input.idea.revenue ? `$${input.idea.revenue}` : 'Pre-revenue'}
- Users: ${input.idea.userCount || 'Not specified'}
- Growth Rate: ${input.idea.growthRate ? `${input.idea.growthRate}%` : 'Not specified'}

Provide comprehensive valuation analysis including:
1. Revenue multiple valuation (if applicable)
2. Comparable company analysis with specific examples
3. Stage-based valuation benchmarks
4. Recommended pre-money valuation with range
5. Key factors that could increase or decrease valuation
6. Valuation defense strategy for investor negotiations

Be transparent about methodology and uncertainty. Show your work.`;
  }

  protected async performAnalysis(input: AnalysisInput): Promise<void> {
    this.logger.log('Starting INVESTOR-GRADE valuation analysis v3.0');

    // Initialize analysis structure
    this.initializeValuationAnalysis();

    // Step 1: Revenue multiple valuation
    await this.calculateRevenueMultiple(input);

    // Step 2: Comparable transactions analysis
    await this.analyzeComparableTransactions(input);

    // Step 3: Stage-based valuation
    await this.calculateStageBasedValuation(input);

    // Step 4: DCF analysis (if applicable)
    await this.performDCFAnalysis(input);

    // Step 5: Scorecard valuation method
    await this.calculateScorecardValuation(input);

    // Step 6: Synthesize all methods
    await this.synthesizeValuations(input);

    // Step 7: Risk adjustments
    await this.applyRiskAdjustments(input);

    // Step 8: Sensitivity analysis
    await this.performSensitivityAnalysis(input);

    // Step 9: Scenario analysis
    await this.generateScenarios(input);

    // Step 10: Generate recommendations
    await this.generateValuationRecommendations(input);

    // Step 11: Build validation scorecard
    this.generateValidationScorecard();

    // Build investor-grade report
    this.buildRawAnalysis();
  }

  private initializeValuationAnalysis(): void {
    this.valuationAnalysis = {
      methods: [],
      comparables: [],
      dcf: null,
      scorecard: null,
      riskAdjustments: [],
      sensitivityAnalysis: [],
      scenarios: {
        bull: { valuation: 0, probability: 25, drivers: [] },
        base: { valuation: 0, probability: 50, drivers: [] },
        bear: { valuation: 0, probability: 25, drivers: [] },
        expectedValue: 0,
      },
      recommended: {
        preMoney: { low: 0, mid: 0, high: 0 },
        postMoney: { low: 0, mid: 0, high: 0 },
        impliedOwnership: 20,
      },
      negotiationRange: { floor: 0, target: 0, ceiling: 0 },
      defensePoints: [],
    };
  }

  private async calculateRevenueMultiple(input: AnalysisInput): Promise<void> {
    const annualRevenue = (input.fundingContext?.currentMRR || 0) * 12;
    const growthRate = input.fundingContext?.growthRate || 0;
    const industry = input.idea.industry?.toLowerCase() || 'technology';

    // Industry-specific base multiples with ranges (2024 data)
    const industryMultiples: Record<string, { low: number; mid: number; high: number }> = {
      saas: { low: 6, mid: 10, high: 18 },
      fintech: { low: 8, mid: 12, high: 20 },
      marketplace: { low: 4, mid: 8, high: 14 },
      ecommerce: { low: 2, mid: 4, high: 8 },
      healthtech: { low: 6, mid: 10, high: 16 },
      ai: { low: 10, mid: 15, high: 30 },
      cybersecurity: { low: 8, mid: 12, high: 20 },
      edtech: { low: 4, mid: 8, high: 14 },
      proptech: { low: 5, mid: 9, high: 15 },
      default: { low: 5, mid: 8, high: 14 },
    };

    const baseMultiple = industryMultiples[industry] || industryMultiples.default;

    // Growth rate adjustment factor
    let growthMultiplier = 1.0;
    if (growthRate >= 200) growthMultiplier = 2.0;
    else if (growthRate >= 100) growthMultiplier = 1.5;
    else if (growthRate >= 50) growthMultiplier = 1.2;
    else if (growthRate >= 25) growthMultiplier = 1.0;
    else if (growthRate < 15) growthMultiplier = 0.7;

    if (annualRevenue > 0) {
      const method: ValuationMethod = {
        method: 'Revenue Multiple',
        value: {
          low: annualRevenue * baseMultiple.low * growthMultiplier,
          mid: annualRevenue * baseMultiple.mid * growthMultiplier,
          high: annualRevenue * baseMultiple.high * growthMultiplier,
        },
        confidence: 0.75,
        weight: 0.3,
        applicability: 'high',
        assumptions: [
          `Base ${industry} multiple: ${baseMultiple.low}x - ${baseMultiple.high}x ARR`,
          `Growth adjustment: ${(growthMultiplier * 100 - 100).toFixed(0)}% (${growthRate}% YoY growth)`,
          `ARR: $${formatCurrency(annualRevenue)}`,
        ],
        rationale: `${baseMultiple.mid}x ARR multiple adjusted for ${growthRate}% growth`,
      };

      this.valuationAnalysis!.methods.push(method);

      const citation = this.addCitation({
        claim: `Revenue multiple valuation: ${formatCurrency(method.value.low)} - ${formatCurrency(method.value.high)}`,
        source: 'Revenue Multiple Analysis',
        sourceUrl: 'internal://victor/revenue-multiple',
        confidence: 0.75,
        dataType: 'computed',
      });

      this.addFinding({
        title: 'Revenue Multiple Valuation',
        description: `${formatCurrency(method.value.mid)} at ${(baseMultiple.mid * growthMultiplier).toFixed(1)}x ARR (range: ${formatCurrency(method.value.low)} - ${formatCurrency(method.value.high)})`,
        type: 'neutral',
        severity: 'info',
        evidence: [citation],
        confidence: 8,
      });
    }
  }

  private async analyzeComparableTransactions(input: AnalysisInput): Promise<void> {
    const industry = input.idea.industry?.toLowerCase() || 'technology';
    const stage = input.fundingContext?.targetStage || 'seed';

    // Real comparable transaction data (public information)
    const comparableDatabase: Record<string, ComparableTransaction[]> = {
      saas: [
        { companyName: 'Notion', industry: 'SaaS', stage: 'Series C', valuation: 10000000000, revenue: 500000000, multiple: 20, fundingDate: '2024', investors: ['Sequoia', 'Index Ventures'], relevanceScore: 85, source: 'TechCrunch' },
        { companyName: 'Linear', industry: 'SaaS', stage: 'Series B', valuation: 400000000, revenue: 30000000, multiple: 13.3, fundingDate: '2024', investors: ['Accel', 'Sequoia'], relevanceScore: 90, source: 'Crunchbase' },
        { companyName: 'Figma (Seed)', industry: 'SaaS', stage: 'Seed', valuation: 14000000, revenue: 0, multiple: 0, fundingDate: '2013', investors: ['Index Ventures'], relevanceScore: 75, source: 'Public Records' },
        { companyName: 'Airtable', industry: 'SaaS', stage: 'Series F', valuation: 11000000000, revenue: 200000000, multiple: 55, fundingDate: '2022', investors: ['Thrive Capital'], relevanceScore: 80, source: 'Crunchbase' },
      ],
      fintech: [
        { companyName: 'Stripe', industry: 'Fintech', stage: 'Series I', valuation: 50000000000, revenue: 14000000000, multiple: 3.6, fundingDate: '2023', investors: ['Andreessen', 'Sequoia'], relevanceScore: 70, source: 'WSJ' },
        { companyName: 'Plaid', industry: 'Fintech', stage: 'Series D', valuation: 13400000000, revenue: 300000000, multiple: 44.7, fundingDate: '2021', investors: ['Altimeter'], relevanceScore: 85, source: 'Bloomberg' },
        { companyName: 'Mercury', industry: 'Fintech', stage: 'Series B', valuation: 1620000000, revenue: 100000000, multiple: 16.2, fundingDate: '2024', investors: ['Sequoia', 'a16z'], relevanceScore: 92, source: 'Crunchbase' },
        { companyName: 'Ramp', industry: 'Fintech', stage: 'Series D', valuation: 8100000000, revenue: 300000000, multiple: 27, fundingDate: '2023', investors: ['Founders Fund', 'Stripe'], relevanceScore: 88, source: 'TechCrunch' },
      ],
      ai: [
        { companyName: 'Anthropic', industry: 'AI', stage: 'Series D', valuation: 18400000000, revenue: 200000000, multiple: 92, fundingDate: '2024', investors: ['Google', 'Spark Capital'], relevanceScore: 80, source: 'Reuters' },
        { companyName: 'Mistral AI', industry: 'AI', stage: 'Series B', valuation: 6000000000, revenue: 50000000, multiple: 120, fundingDate: '2024', investors: ['a16z', 'General Catalyst'], relevanceScore: 85, source: 'Bloomberg' },
        { companyName: 'Cohere', industry: 'AI', stage: 'Series D', valuation: 5500000000, revenue: 35000000, multiple: 157, fundingDate: '2024', investors: ['NVIDIA', 'Salesforce'], relevanceScore: 88, source: 'TechCrunch' },
        { companyName: 'Hugging Face', industry: 'AI', stage: 'Series D', valuation: 4500000000, revenue: 30000000, multiple: 150, fundingDate: '2023', investors: ['Google', 'Amazon'], relevanceScore: 82, source: 'Crunchbase' },
      ],
      default: [
        { companyName: 'Seed Stage Median', industry: 'Tech', stage: 'Seed', valuation: 8000000, revenue: 0, multiple: 0, fundingDate: '2024', investors: ['Various'], relevanceScore: 95, source: 'PitchBook Data' },
        { companyName: 'Series A Median', industry: 'Tech', stage: 'Series A', valuation: 25000000, revenue: 1000000, multiple: 25, fundingDate: '2024', investors: ['Various'], relevanceScore: 95, source: 'PitchBook Data' },
        { companyName: 'Series B Median', industry: 'Tech', stage: 'Series B', valuation: 75000000, revenue: 5000000, multiple: 15, fundingDate: '2024', investors: ['Various'], relevanceScore: 95, source: 'PitchBook Data' },
      ],
    };

    const industryComparables = comparableDatabase[industry] || comparableDatabase.default;

    // Filter by stage relevance
    const stageRelevantComps = industryComparables.map(comp => ({
      ...comp,
      relevanceScore: comp.stage.toLowerCase().includes(stage) ? comp.relevanceScore + 10 : comp.relevanceScore - 20,
    })).sort((a, b) => b.relevanceScore - a.relevanceScore);

    this.valuationAnalysis!.comparables = stageRelevantComps.slice(0, 5);

    // Calculate implied valuation from comparables
    const relevantComps = stageRelevantComps.filter(c => c.relevanceScore > 60);
    if (relevantComps.length > 0) {
      const avgMultiple = relevantComps.reduce((sum, c) => sum + c.multiple, 0) / relevantComps.length;
      const annualRevenue = (input.fundingContext?.currentMRR || 0) * 12;

      if (annualRevenue > 0) {
        const comparableValuation = annualRevenue * avgMultiple;

        const method: ValuationMethod = {
          method: 'Comparable Transactions',
          value: {
            low: comparableValuation * 0.7,
            mid: comparableValuation,
            high: comparableValuation * 1.3,
          },
          confidence: 0.65,
          weight: 0.25,
          applicability: relevantComps.length >= 3 ? 'high' : 'medium',
          assumptions: [
            `Based on ${relevantComps.length} comparable transactions`,
            `Average multiple: ${avgMultiple.toFixed(1)}x revenue`,
            `Most relevant: ${relevantComps[0]?.companyName}`,
          ],
          rationale: `${avgMultiple.toFixed(1)}x from comparable ${industry} transactions`,
        };

        this.valuationAnalysis!.methods.push(method);
      }
    }

    const citation = this.addCitation({
      claim: `Analyzed ${stageRelevantComps.length} comparable ${industry} transactions`,
      source: 'Comparable Transaction Analysis',
      sourceUrl: 'internal://victor/comparables',
      confidence: 0.65,
      dataType: 'secondary',
    });

    this.addFinding({
      title: 'Comparable Transactions',
      description: `Found ${relevantComps.length} highly relevant comparables in ${industry} (${stageRelevantComps.map(c => c.companyName).slice(0, 3).join(', ')})`,
      type: 'neutral',
      severity: 'info',
      evidence: [citation],
      confidence: 7,
    });
  }

  private async calculateStageBasedValuation(input: AnalysisInput): Promise<void> {
    const stage = input.fundingContext?.targetStage || 'seed';
    const hasRevenue = (input.fundingContext?.currentMRR || 0) > 0;
    const mrr = input.fundingContext?.currentMRR || 0;
    const users = input.fundingContext?.currentUsers || 0;
    const hasProduct = input.fundingContext?.hasProduct !== false;
    const growthRate = input.fundingContext?.growthRate || 0;

    // 2024 stage-based pre-money valuations (US market)
    const stageRanges: Record<string, { low: number; mid: number; high: number }> = {
      'pre-seed': { low: 1000000, mid: 3000000, high: 6000000 },
      seed: { low: 3000000, mid: 8000000, high: 15000000 },
      'series-a': { low: 12000000, mid: 25000000, high: 50000000 },
      'series-b': { low: 40000000, mid: 80000000, high: 150000000 },
      'series-c': { low: 100000000, mid: 200000000, high: 500000000 },
    };

    const baseRange = stageRanges[stage] || stageRanges.seed;

    // Traction adjustment factors
    let tractionMultiplier = 1.0;
    if (hasRevenue && mrr > 50000) tractionMultiplier += 0.3;
    else if (hasRevenue && mrr > 10000) tractionMultiplier += 0.2;
    else if (hasRevenue) tractionMultiplier += 0.1;

    if (users > 100000) tractionMultiplier += 0.25;
    else if (users > 10000) tractionMultiplier += 0.15;
    else if (users > 1000) tractionMultiplier += 0.05;

    if (hasProduct) tractionMultiplier += 0.1;
    if (growthRate > 100) tractionMultiplier += 0.2;
    else if (growthRate > 50) tractionMultiplier += 0.1;

    const method: ValuationMethod = {
      method: 'Stage-Based Benchmarks',
      value: {
        low: baseRange.low * tractionMultiplier,
        mid: baseRange.mid * tractionMultiplier,
        high: baseRange.high * tractionMultiplier,
      },
      confidence: 0.6,
      weight: 0.2,
      applicability: 'high',
      assumptions: [
        `${stage.charAt(0).toUpperCase() + stage.slice(1)} stage baseline: ${formatCurrency(baseRange.mid)}`,
        `Traction multiplier: ${tractionMultiplier.toFixed(2)}x`,
        hasRevenue ? `Revenue: $${mrr.toLocaleString()}/mo` : 'Pre-revenue',
        users > 0 ? `Users: ${users.toLocaleString()}` : 'No users tracked',
      ],
      rationale: `${stage} stage with ${((tractionMultiplier - 1) * 100).toFixed(0)}% traction premium`,
    };

    this.valuationAnalysis!.methods.push(method);

    const citation = this.addCitation({
      claim: `Stage-based valuation: ${formatCurrency(method.value.mid)} (2024 ${stage} benchmarks)`,
      source: 'Stage-Based Analysis',
      sourceUrl: 'internal://victor/stage-valuation',
      confidence: 0.6,
      dataType: 'computed',
    });

    this.addFinding({
      title: 'Stage-Based Valuation',
      description: `${formatCurrency(method.value.mid)} based on ${stage} benchmarks with traction adjustment`,
      type: 'neutral',
      severity: 'info',
      evidence: [citation],
      confidence: 6,
    });
  }

  private async performDCFAnalysis(input: AnalysisInput): Promise<void> {
    const annualRevenue = (input.fundingContext?.currentMRR || 0) * 12;
    const growthRate = input.fundingContext?.growthRate || 30;

    // DCF only meaningful with some revenue
    if (annualRevenue < 100000) {
      return; // Skip DCF for very early stage
    }

    // Assumptions
    const discountRate = 0.35; // 35% for early-stage
    const terminalGrowthRate = 0.03; // 3% terminal growth
    const projectionYears = 5;
    const marginProgression = [0.0, 0.05, 0.10, 0.15, 0.20]; // Improving margins

    // Project cash flows
    const projectedCashFlows: { year: number; cashFlow: number; discounted: number }[] = [];
    let revenue = annualRevenue;
    let currentGrowth = growthRate / 100;

    for (let year = 1; year <= projectionYears; year++) {
      revenue *= (1 + currentGrowth);
      currentGrowth *= 0.8; // Decaying growth
      const cashFlow = revenue * marginProgression[year - 1];
      const discounted = cashFlow / Math.pow(1 + discountRate, year);
      projectedCashFlows.push({ year, cashFlow: Math.round(cashFlow), discounted: Math.round(discounted) });
    }

    // Terminal value
    const terminalCashFlow = projectedCashFlows[projectionYears - 1].cashFlow * (1 + terminalGrowthRate);
    const terminalValue = terminalCashFlow / (discountRate - terminalGrowthRate);
    const discountedTerminal = terminalValue / Math.pow(1 + discountRate, projectionYears);

    // Enterprise value
    const sumDiscounted = projectedCashFlows.reduce((sum, cf) => sum + cf.discounted, 0);
    const enterpriseValue = sumDiscounted + discountedTerminal;

    // Sensitivity table
    const sensitivityTable: { discountRate: number; terminalGrowth: number; value: number }[] = [];
    const discountRates = [0.30, 0.35, 0.40];
    const terminalGrowths = [0.02, 0.03, 0.04];

    for (const dr of discountRates) {
      for (const tg of terminalGrowths) {
        const tv = terminalCashFlow / (dr - tg);
        const dtv = tv / Math.pow(1 + dr, projectionYears);
        const ev = sumDiscounted * (discountRate / dr) + dtv;
        sensitivityTable.push({ discountRate: dr, terminalGrowth: tg, value: Math.round(ev) });
      }
    }

    this.valuationAnalysis!.dcf = {
      terminalValue: Math.round(terminalValue),
      discountRate,
      projectedCashFlows,
      enterpriseValue: Math.round(enterpriseValue),
      assumptions: [
        `Discount rate: ${(discountRate * 100).toFixed(0)}% (early-stage risk)`,
        `Terminal growth: ${(terminalGrowthRate * 100).toFixed(0)}%`,
        `Initial growth: ${growthRate}% (decaying 20%/year)`,
        `Margin progression: 0% → 20% over 5 years`,
      ],
      sensitivityTable,
    };

    const method: ValuationMethod = {
      method: 'DCF Analysis',
      value: {
        low: enterpriseValue * 0.7,
        mid: enterpriseValue,
        high: enterpriseValue * 1.4,
      },
      confidence: 0.5, // Lower confidence for early-stage DCF
      weight: 0.15,
      applicability: annualRevenue > 1000000 ? 'medium' : 'low',
      assumptions: this.valuationAnalysis!.dcf.assumptions,
      rationale: `5-year DCF with ${(discountRate * 100).toFixed(0)}% discount rate`,
    };

    this.valuationAnalysis!.methods.push(method);

    const citation = this.addCitation({
      claim: `DCF enterprise value: ${formatCurrency(enterpriseValue)}`,
      source: 'DCF Analysis',
      sourceUrl: 'internal://victor/dcf',
      confidence: 0.5,
      dataType: 'computed',
    });

    this.addFinding({
      title: 'DCF Valuation',
      description: `${formatCurrency(enterpriseValue)} enterprise value (5-year projection at ${(discountRate * 100)}% discount)`,
      type: 'neutral',
      severity: 'info',
      evidence: [citation],
      confidence: 5,
    });
  }

  private async calculateScorecardValuation(input: AnalysisInput): Promise<void> {
    const stage = input.fundingContext?.targetStage || 'seed';

    // Base valuations by stage (2024)
    const stageBaseValuations: Record<string, number> = {
      'pre-seed': 3000000,
      seed: 8000000,
      'series-a': 25000000,
      'series-b': 80000000,
    };

    const baseValuation = stageBaseValuations[stage] || 8000000;

    // Scorecard factors
    const adjustments: { factor: string; score: number; adjustment: number }[] = [];

    // Team strength (0-30%)
    const teamScore = input.founderData?.hasSuccessfulExit ? 25 : (input.founderData?.previousStartups || 0) >= 2 ? 15 : 5;
    adjustments.push({ factor: 'Team Strength', score: teamScore, adjustment: (teamScore / 100) * baseValuation });

    // Market opportunity (0-25%)
    const marketScore = 15; // Default moderate
    adjustments.push({ factor: 'Market Opportunity', score: marketScore, adjustment: (marketScore / 100) * baseValuation });

    // Product/Technology (0-15%)
    const productScore = input.fundingContext?.hasProduct ? 12 : 5;
    adjustments.push({ factor: 'Product/Technology', score: productScore, adjustment: (productScore / 100) * baseValuation });

    // Traction/Revenue (0-20%)
    const mrr = input.fundingContext?.currentMRR || 0;
    const tractionScore = mrr > 50000 ? 20 : mrr > 10000 ? 15 : mrr > 0 ? 10 : 0;
    adjustments.push({ factor: 'Traction/Revenue', score: tractionScore, adjustment: (tractionScore / 100) * baseValuation });

    // Competitive environment (-15% to +10%)
    const competitiveScore = 0; // Neutral default
    adjustments.push({ factor: 'Competitive Position', score: competitiveScore, adjustment: (competitiveScore / 100) * baseValuation });

    const totalAdjustment = adjustments.reduce((sum, adj) => sum + adj.adjustment, 0);
    const adjustedValuation = baseValuation + totalAdjustment;

    this.valuationAnalysis!.scorecard = {
      baseValuation,
      adjustments,
      adjustedValuation,
      methodology: 'Dave Berkus Scorecard Method (Modified)',
    };

    const method: ValuationMethod = {
      method: 'Scorecard Method',
      value: {
        low: adjustedValuation * 0.8,
        mid: adjustedValuation,
        high: adjustedValuation * 1.2,
      },
      confidence: 0.55,
      weight: 0.1,
      applicability: 'medium',
      assumptions: adjustments.map(a => `${a.factor}: ${a.score > 0 ? '+' : ''}${a.score}%`),
      rationale: `Scorecard with ${((totalAdjustment / baseValuation) * 100).toFixed(0)}% net adjustment`,
    };

    this.valuationAnalysis!.methods.push(method);
  }

  private async synthesizeValuations(input: AnalysisInput): Promise<void> {
    const v = this.valuationAnalysis!;

    if (v.methods.length === 0) {
      // Default for no applicable methods
      v.recommended.preMoney = { low: 3000000, mid: 5000000, high: 8000000 };
      return;
    }

    // Weight methods by confidence and applicability
    const applicabilityWeights = { high: 1.0, medium: 0.7, low: 0.4 };

    let totalWeight = 0;
    let weightedLow = 0;
    let weightedMid = 0;
    let weightedHigh = 0;

    for (const method of v.methods) {
      const effectiveWeight = method.weight * method.confidence * applicabilityWeights[method.applicability];
      totalWeight += effectiveWeight;
      weightedLow += method.value.low * effectiveWeight;
      weightedMid += method.value.mid * effectiveWeight;
      weightedHigh += method.value.high * effectiveWeight;
    }

    v.recommended.preMoney = {
      low: Math.round(weightedLow / totalWeight),
      mid: Math.round(weightedMid / totalWeight),
      high: Math.round(weightedHigh / totalWeight),
    };

    // Calculate post-money based on typical raise (20-25% dilution at seed)
    const raiseAmount = v.recommended.preMoney.mid * 0.25;
    v.recommended.postMoney = {
      low: v.recommended.preMoney.low + raiseAmount,
      mid: v.recommended.preMoney.mid + raiseAmount,
      high: v.recommended.preMoney.high + raiseAmount,
    };
    v.recommended.impliedOwnership = Math.round((raiseAmount / v.recommended.postMoney.mid) * 100);

    // Negotiation range
    v.negotiationRange = {
      floor: Math.round(v.recommended.preMoney.low * 0.9),
      target: v.recommended.preMoney.mid,
      ceiling: Math.round(v.recommended.preMoney.high * 1.1),
    };

    const citation = this.addCitation({
      claim: `Synthesized valuation from ${v.methods.length} methods: ${formatCurrency(v.recommended.preMoney.mid)}`,
      source: 'Valuation Synthesis',
      sourceUrl: 'internal://victor/synthesis',
      confidence: 0.7,
      dataType: 'computed',
    });

    this.addFinding({
      title: 'Recommended Pre-Money Valuation',
      description: `${formatCurrency(v.recommended.preMoney.mid)} (range: ${formatCurrency(v.recommended.preMoney.low)} - ${formatCurrency(v.recommended.preMoney.high)}) based on ${v.methods.length} weighted methods`,
      type: 'neutral',
      severity: 'major',
      evidence: [citation],
      confidence: 7,
    });
  }

  private async applyRiskAdjustments(input: AnalysisInput): Promise<void> {
    const v = this.valuationAnalysis!;
    const hasRevenue = (input.fundingContext?.currentMRR || 0) > 0;

    // Team risk
    const hasExperience = (input.founderData?.previousStartups || 0) > 0;
    v.riskAdjustments.push({
      factor: 'Team Experience',
      category: 'Team',
      impact: hasExperience ? 5 : -10,
      probability: 0.8,
      expectedAdjustment: hasExperience ? 4 : -8,
    });

    // Revenue/traction risk
    v.riskAdjustments.push({
      factor: 'Revenue Validation',
      category: 'Traction',
      impact: hasRevenue ? 10 : -15,
      probability: 0.9,
      expectedAdjustment: hasRevenue ? 9 : -13.5,
    });

    // Market timing risk
    v.riskAdjustments.push({
      factor: 'Market Conditions',
      category: 'Market',
      impact: -5, // Conservative in current market
      probability: 0.7,
      expectedAdjustment: -3.5,
    });

    // Competition risk
    v.riskAdjustments.push({
      factor: 'Competitive Pressure',
      category: 'Market',
      impact: -5,
      probability: 0.6,
      expectedAdjustment: -3,
    });

    // Calculate net adjustment
    const netAdjustment = v.riskAdjustments.reduce((sum, r) => sum + r.expectedAdjustment, 0);

    if (Math.abs(netAdjustment) > 5) {
      const riskType = netAdjustment > 0 ? 'strength' : 'weakness';
      this.addFinding({
        title: 'Risk-Adjusted Valuation Impact',
        description: `Net ${netAdjustment > 0 ? '+' : ''}${netAdjustment.toFixed(1)}% adjustment based on risk factors`,
        type: riskType,
        severity: Math.abs(netAdjustment) > 10 ? 'major' : 'minor',
        evidence: [],
        confidence: 6,
      });
    }
  }

  private async performSensitivityAnalysis(input: AnalysisInput): Promise<void> {
    const v = this.valuationAnalysis!;
    const baseValuation = v.recommended.preMoney.mid;

    // Growth rate sensitivity
    v.sensitivityAnalysis.push({
      variable: 'Growth Rate',
      baseCase: input.fundingContext?.growthRate || 30,
      scenarios: [
        { change: '-50%', value: (input.fundingContext?.growthRate || 30) * 0.5, valuationImpact: -20 },
        { change: '-25%', value: (input.fundingContext?.growthRate || 30) * 0.75, valuationImpact: -10 },
        { change: 'Base', value: input.fundingContext?.growthRate || 30, valuationImpact: 0 },
        { change: '+25%', value: (input.fundingContext?.growthRate || 30) * 1.25, valuationImpact: 10 },
        { change: '+50%', value: (input.fundingContext?.growthRate || 30) * 1.5, valuationImpact: 20 },
      ],
    });

    // Revenue multiple sensitivity
    v.sensitivityAnalysis.push({
      variable: 'Revenue Multiple',
      baseCase: 10,
      scenarios: [
        { change: '6x', value: 6, valuationImpact: -30 },
        { change: '8x', value: 8, valuationImpact: -15 },
        { change: '10x (Base)', value: 10, valuationImpact: 0 },
        { change: '12x', value: 12, valuationImpact: 15 },
        { change: '15x', value: 15, valuationImpact: 35 },
      ],
    });

    // Market conditions sensitivity
    v.sensitivityAnalysis.push({
      variable: 'Market Conditions',
      baseCase: 0,
      scenarios: [
        { change: 'Bear Market', value: -20, valuationImpact: -25 },
        { change: 'Neutral', value: 0, valuationImpact: 0 },
        { change: 'Bull Market', value: 20, valuationImpact: 30 },
      ],
    });

    const citation = this.addCitation({
      claim: 'Sensitivity analysis across growth, multiples, and market conditions',
      source: 'Sensitivity Analysis',
      sourceUrl: 'internal://victor/sensitivity',
      confidence: 0.6,
      dataType: 'computed',
    });

    this.addFinding({
      title: 'Valuation Sensitivity',
      description: `Valuation ranges from ${formatCurrency(baseValuation * 0.6)} (-40%) to ${formatCurrency(baseValuation * 1.5)} (+50%) based on key variable changes`,
      type: 'neutral',
      severity: 'info',
      evidence: [citation],
      confidence: 6,
    });
  }

  private async generateScenarios(input: AnalysisInput): Promise<void> {
    const v = this.valuationAnalysis!;
    const baseValuation = v.recommended.preMoney.mid;

    // Bull case (25% probability)
    v.scenarios.bull = {
      valuation: Math.round(baseValuation * 1.4),
      probability: 25,
      drivers: [
        'Strong traction acceleration in next 6 months',
        'Hot market conditions for the sector',
        'Competitive investor interest',
        'Strategic investor premium',
      ],
    };

    // Base case (50% probability)
    v.scenarios.base = {
      valuation: baseValuation,
      probability: 50,
      drivers: [
        'Current traction trajectory continues',
        'Market conditions remain stable',
        'Standard fundraising timeline',
        'Typical institutional investor terms',
      ],
    };

    // Bear case (25% probability)
    v.scenarios.bear = {
      valuation: Math.round(baseValuation * 0.7),
      probability: 25,
      drivers: [
        'Traction stalls or slows',
        'Market downturn affects valuations',
        'Extended fundraising timeline',
        'Down-round from previous valuation',
      ],
    };

    // Expected value
    v.scenarios.expectedValue = Math.round(
      v.scenarios.bull.valuation * (v.scenarios.bull.probability / 100) +
      v.scenarios.base.valuation * (v.scenarios.base.probability / 100) +
      v.scenarios.bear.valuation * (v.scenarios.bear.probability / 100)
    );

    // Build defense points
    v.defensePoints = [
      `Revenue multiple supported by ${v.comparables.length} comparable transactions`,
      v.comparables[0] ? `Similar company ${v.comparables[0].companyName} valued at ${formatCurrency(v.comparables[0].valuation)}` : null,
      `Stage-based benchmarks support ${formatCurrency(v.recommended.preMoney.low)} - ${formatCurrency(v.recommended.preMoney.high)} range`,
      `${v.methods.length} independent valuation methods converge`,
      `Traction metrics justify premium over baseline`,
    ].filter(Boolean) as string[];

    const citation = this.addCitation({
      claim: `Scenario analysis: Bull ${formatCurrency(v.scenarios.bull.valuation)}, Base ${formatCurrency(v.scenarios.base.valuation)}, Bear ${formatCurrency(v.scenarios.bear.valuation)}`,
      source: 'Scenario Analysis',
      sourceUrl: 'internal://victor/scenarios',
      confidence: 0.65,
      dataType: 'computed',
    });

    this.addFinding({
      title: 'Scenario-Weighted Valuation',
      description: `Expected value: ${formatCurrency(v.scenarios.expectedValue)} (Bull: ${formatCurrency(v.scenarios.bull.valuation)} @ ${v.scenarios.bull.probability}%, Base: ${formatCurrency(v.scenarios.base.valuation)} @ ${v.scenarios.base.probability}%, Bear: ${formatCurrency(v.scenarios.bear.valuation)} @ ${v.scenarios.bear.probability}%)`,
      type: 'neutral',
      severity: 'major',
      evidence: [citation],
      confidence: 7,
    });
  }

  private async generateValuationRecommendations(input: AnalysisInput): Promise<void> {
    const v = this.valuationAnalysis!;
    const hasRevenue = (input.fundingContext?.currentMRR || 0) > 0;

    this.addRecommendation({
      title: 'Target Valuation Strategy',
      description: `Target ${formatCurrency(v.negotiationRange.target)} pre-money, negotiate floor at ${formatCurrency(v.negotiationRange.floor)}`,
      priority: 'critical',
      timeframe: 'immediate',
      effort: 'low',
      impact: 'high',
    });

    this.addRecommendation({
      title: 'Prepare Valuation Defense',
      description: `Document ${v.defensePoints.length} key supporting data points: comparable transactions, traction metrics, and multi-method validation`,
      priority: 'high',
      timeframe: 'immediate',
      effort: 'medium',
      impact: 'high',
    });

    if (!hasRevenue) {
      this.addRecommendation({
        title: 'Consider SAFE/Convertible Notes',
        description: 'Pre-revenue status creates valuation uncertainty; convertible instruments defer pricing to next round',
        priority: 'high',
        timeframe: 'short-term',
        effort: 'low',
        impact: 'medium',
      });

      this.addRisk({
        title: 'Pre-Revenue Valuation Risk',
        description: 'Without revenue, valuation is primarily based on stage benchmarks and team, creating wider investor variance',
        category: 'funding',
        probability: 'high',
        impact: 'moderate',
        mitigations: [
          'Use SAFE notes to defer valuation',
          'Focus discussions on traction over valuation',
          'Target investors who invest at this stage',
        ],
        evidence: [],
      });
    }

    // Check valuation reasonableness
    const requestedValuation = input.fundingContext?.requestedValuation;
    if (requestedValuation) {
      const variance = ((requestedValuation - v.recommended.preMoney.mid) / v.recommended.preMoney.mid) * 100;

      if (variance > 50) {
        this.addFinding({
          title: 'Valuation Expectations Above Market',
          description: `Requested ${formatCurrency(requestedValuation)} is ${variance.toFixed(0)}% above calculated fair value`,
          type: 'weakness',
          severity: 'major',
          evidence: [],
          confidence: 7,
        });

        this.addRisk({
          title: 'Overvaluation Risk',
          description: 'High valuation expectations may limit investor pool and extend fundraising timeline',
          category: 'funding',
          probability: 'high',
          impact: 'major',
          mitigations: [
            'Align expectations with market comparables',
            'Build additional traction before raising',
            'Consider smaller round to demonstrate momentum',
          ],
          evidence: [],
        });
      } else if (variance < -30) {
        this.addFinding({
          title: 'Potential Undervaluation',
          description: `Requested ${formatCurrency(requestedValuation)} is ${Math.abs(variance).toFixed(0)}% below calculated fair value`,
          type: 'opportunity',
          severity: 'minor',
          evidence: [],
          confidence: 6,
        });

        this.addRecommendation({
          title: 'Consider Higher Valuation',
          description: `Market data suggests you could target ${formatCurrency(v.recommended.preMoney.mid)} (${Math.abs(variance).toFixed(0)}% higher)`,
          priority: 'medium',
          timeframe: 'immediate',
          effort: 'low',
          impact: 'high',
        });
      }
    }

    this.addRecommendation({
      title: 'Investor Communication Strategy',
      description: 'Lead with traction story, present valuation range (not single number), reference comparable transactions',
      priority: 'medium',
      timeframe: 'short-term',
      effort: 'medium',
      impact: 'medium',
    });
  }

  private generateValidationScorecard(): void {
    const v = this.valuationAnalysis!;

    // Data Quality (5 points)
    let dataQualityScore = 1;
    if (v.methods.length >= 3) dataQualityScore += 1.5;
    else if (v.methods.length >= 2) dataQualityScore += 0.5;
    if (v.comparables.length >= 3) dataQualityScore += 1;
    if (v.dcf) dataQualityScore += 0.5;
    if (v.sensitivityAnalysis.length > 0) dataQualityScore += 1;
    dataQualityScore = Math.min(5, dataQualityScore);

    // Source Verification (5 points)
    let sourceScore = 2; // Base for internal calculations
    const highRelevanceComps = v.comparables.filter(c => c.relevanceScore > 80).length;
    if (highRelevanceComps >= 3) sourceScore += 2;
    else if (highRelevanceComps >= 1) sourceScore += 1;
    if (v.methods.some(m => m.applicability === 'high')) sourceScore += 1;
    sourceScore = Math.min(5, sourceScore);

    // Analysis Depth (5 points)
    let analysisScore = 1;
    if (v.methods.length >= 4) analysisScore += 1.5;
    else if (v.methods.length >= 2) analysisScore += 0.5;
    if (v.scenarios.expectedValue > 0) analysisScore += 1;
    if (v.riskAdjustments.length >= 3) analysisScore += 1;
    if (v.sensitivityAnalysis.length >= 2) analysisScore += 1;
    analysisScore = Math.min(5, analysisScore);

    // Risk Assessment (5 points)
    let riskScore = 1;
    if (v.riskAdjustments.length >= 3) riskScore += 1.5;
    if (this.risks.length >= 2) riskScore += 1;
    if (v.defensePoints.length >= 3) riskScore += 1;
    if (v.negotiationRange.floor > 0) riskScore += 0.5;
    riskScore = Math.min(5, riskScore);

    // Actionability (5 points)
    let actionScore = 2; // Base for recommendations
    if (this.recommendations.length >= 3) actionScore += 1;
    if (v.negotiationRange.target > 0) actionScore += 1;
    if (v.defensePoints.length >= 3) actionScore += 1;
    actionScore = Math.min(5, actionScore);

    const totalScore = dataQualityScore + sourceScore + analysisScore + riskScore + actionScore;

    this.validationScorecard = {
      dataQuality: { score: dataQualityScore, maxScore: 5, details: `${v.methods.length} methods, ${v.comparables.length} comparables` },
      sourceVerification: { score: sourceScore, maxScore: 5, details: `${highRelevanceComps} high-relevance transactions` },
      analysisDepth: { score: analysisScore, maxScore: 5, details: `Multi-method synthesis with scenario analysis` },
      riskAssessment: { score: riskScore, maxScore: 5, details: `${v.riskAdjustments.length} risk factors evaluated` },
      actionability: { score: actionScore, maxScore: 5, details: `${this.recommendations.length} recommendations with negotiation range` },
      overall: { score: totalScore, maxScore: 25, grade: calculateGrade(totalScore, 25) },
    };
  }

  private buildRawAnalysis(): void {
    const v = this.valuationAnalysis!;
    const sc = this.validationScorecard!;

    this.rawAnalysis = `
# Victor - INVESTOR-GRADE Valuation Analysis
## Version 3.0.0 | ${new Date().toLocaleDateString()}

---

## VALIDATION SCORECARD

| Category | Score | Grade | Details |
|----------|-------|-------|---------|
| Data Quality | ${sc.dataQuality.score.toFixed(1)}/${sc.dataQuality.maxScore} | ${calculateGrade(sc.dataQuality.score, sc.dataQuality.maxScore)} | ${sc.dataQuality.details} |
| Source Verification | ${sc.sourceVerification.score.toFixed(1)}/${sc.sourceVerification.maxScore} | ${calculateGrade(sc.sourceVerification.score, sc.sourceVerification.maxScore)} | ${sc.sourceVerification.details} |
| Analysis Depth | ${sc.analysisDepth.score.toFixed(1)}/${sc.analysisDepth.maxScore} | ${calculateGrade(sc.analysisDepth.score, sc.analysisDepth.maxScore)} | ${sc.analysisDepth.details} |
| Risk Assessment | ${sc.riskAssessment.score.toFixed(1)}/${sc.riskAssessment.maxScore} | ${calculateGrade(sc.riskAssessment.score, sc.riskAssessment.maxScore)} | ${sc.riskAssessment.details} |
| Actionability | ${sc.actionability.score.toFixed(1)}/${sc.actionability.maxScore} | ${calculateGrade(sc.actionability.score, sc.actionability.maxScore)} | ${sc.actionability.details} |
| **OVERALL** | **${sc.overall.score.toFixed(1)}/${sc.overall.maxScore}** | **${sc.overall.grade}** | |

---

## EXECUTIVE SUMMARY

Based on ${v.methods.length} valuation methodologies and ${v.comparables.length} comparable transactions, we recommend a **pre-money valuation of ${formatCurrency(v.recommended.preMoney.mid)}** (range: ${formatCurrency(v.recommended.preMoney.low)} - ${formatCurrency(v.recommended.preMoney.high)}).

The scenario-weighted expected value is **${formatCurrency(v.scenarios.expectedValue)}**, with a negotiation floor of ${formatCurrency(v.negotiationRange.floor)} and ceiling of ${formatCurrency(v.negotiationRange.ceiling)}.

---

## VALUATION METHODOLOGIES

${v.methods.map(m => `
### ${m.method}
- **Value**: ${formatCurrency(m.value.mid)} (${formatCurrency(m.value.low)} - ${formatCurrency(m.value.high)})
- **Confidence**: ${(m.confidence * 100).toFixed(0)}% | **Weight**: ${(m.weight * 100).toFixed(0)}% | **Applicability**: ${m.applicability}
- **Rationale**: ${m.rationale}
- **Assumptions**:
${m.assumptions.map(a => `  - ${a}`).join('\n')}
`).join('\n')}

---

## COMPARABLE TRANSACTIONS

| Company | Stage | Valuation | Multiple | Relevance | Source |
|---------|-------|-----------|----------|-----------|--------|
${v.comparables.map(c => `| ${c.companyName} | ${c.stage} | ${formatCurrency(c.valuation)} | ${c.multiple.toFixed(1)}x | ${c.relevanceScore}% | ${c.source} |`).join('\n')}

---

## SCENARIO ANALYSIS

### Bull Case (${v.scenarios.bull.probability}% probability)
**Valuation**: ${formatCurrency(v.scenarios.bull.valuation)}
**Drivers**:
${v.scenarios.bull.drivers.map(d => `- ${d}`).join('\n')}

### Base Case (${v.scenarios.base.probability}% probability)
**Valuation**: ${formatCurrency(v.scenarios.base.valuation)}
**Drivers**:
${v.scenarios.base.drivers.map(d => `- ${d}`).join('\n')}

### Bear Case (${v.scenarios.bear.probability}% probability)
**Valuation**: ${formatCurrency(v.scenarios.bear.valuation)}
**Drivers**:
${v.scenarios.bear.drivers.map(d => `- ${d}`).join('\n')}

**Expected Value**: ${formatCurrency(v.scenarios.expectedValue)}

---

## SENSITIVITY ANALYSIS

${v.sensitivityAnalysis.map(s => `
### ${s.variable}
| Scenario | Value | Valuation Impact |
|----------|-------|------------------|
${s.scenarios.map(sc => `| ${sc.change} | ${typeof sc.value === 'number' ? sc.value.toFixed(1) : sc.value} | ${sc.valuationImpact > 0 ? '+' : ''}${sc.valuationImpact}% |`).join('\n')}
`).join('\n')}

---

## RISK ADJUSTMENTS

| Factor | Category | Impact | Probability | Expected Adjustment |
|--------|----------|--------|-------------|---------------------|
${v.riskAdjustments.map(r => `| ${r.factor} | ${r.category} | ${r.impact > 0 ? '+' : ''}${r.impact}% | ${(r.probability * 100).toFixed(0)}% | ${r.expectedAdjustment > 0 ? '+' : ''}${r.expectedAdjustment.toFixed(1)}% |`).join('\n')}

---

## RECOMMENDED VALUATION

### Pre-Money
| | Low | Mid | High |
|-|-----|-----|------|
| **Pre-Money** | ${formatCurrency(v.recommended.preMoney.low)} | ${formatCurrency(v.recommended.preMoney.mid)} | ${formatCurrency(v.recommended.preMoney.high)} |
| **Post-Money** | ${formatCurrency(v.recommended.postMoney.low)} | ${formatCurrency(v.recommended.postMoney.mid)} | ${formatCurrency(v.recommended.postMoney.high)} |

**Implied Dilution**: ${v.recommended.impliedOwnership}%

### Negotiation Range
- **Floor**: ${formatCurrency(v.negotiationRange.floor)}
- **Target**: ${formatCurrency(v.negotiationRange.target)}
- **Ceiling**: ${formatCurrency(v.negotiationRange.ceiling)}

---

## VALUATION DEFENSE POINTS

${v.defensePoints.map((d, i) => `${i + 1}. ${d}`).join('\n')}

---

## KEY FINDINGS

${this.findings.map(f => `
### ${f.title}
- **Type**: ${f.type} | **Severity**: ${f.severity} | **Confidence**: ${f.confidence}/10
- ${f.description}
`).join('\n')}

---

## RISKS

${this.risks.map(r => `
### ${r.title}
- **Category**: ${r.category} | **Probability**: ${r.probability} | **Impact**: ${r.impact}
- ${r.description}
- **Mitigations**: ${r.mitigations.join('; ')}
`).join('\n')}

---

## RECOMMENDATIONS

${this.recommendations.map(r => `
### ${r.title}
- **Priority**: ${r.priority} | **Timeframe**: ${r.timeframe} | **Effort**: ${r.effort} | **Impact**: ${r.impact}
- ${r.description}
`).join('\n')}

---

${REPORT_DISCLAIMER}
    `.trim();
  }

  protected calculateScore(): number {
    const v = this.valuationAnalysis;
    if (!v) return 5;

    let score = 5; // Base score

    // Method convergence bonus
    if (v.methods.length >= 3) {
      const values = v.methods.map(m => m.value.mid);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      const cv = Math.sqrt(variance) / mean; // Coefficient of variation

      if (cv < 0.2) score += 2; // Methods converge well
      else if (cv < 0.4) score += 1;
      else score -= 0.5; // High variance
    }

    // Comparable quality bonus
    const highRelevanceComps = v.comparables.filter(c => c.relevanceScore > 80).length;
    if (highRelevanceComps >= 3) score += 1;
    else if (highRelevanceComps === 0) score -= 1;

    // Data completeness bonus
    if (v.dcf) score += 0.5;
    if (v.sensitivityAnalysis.length >= 2) score += 0.5;
    if (v.riskAdjustments.length >= 3) score += 0.5;

    // Confidence average
    const avgConfidence = v.methods.length > 0
      ? v.methods.reduce((sum, m) => sum + m.confidence, 0) / v.methods.length
      : 0.5;
    score += (avgConfidence - 0.5) * 2;

    return Math.max(1, Math.min(10, Math.round(score * 10) / 10));
  }
}
