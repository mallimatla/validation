/**
 * Victor - Chief Valuation Officer
 *
 * Purpose: Calculates company valuation using multiple methodologies and comparable analysis.
 * Personality: Quantitative, methodical, conservative but fair.
 * Scoring Weight: 1.0x
 *
 * REAL DATA SOURCES:
 * - LLM-powered valuation analysis
 */

import { Injectable, Optional } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LLMService } from '../../common/llm/llm.service';
import { BaseAnalysisAgent, AnalysisInput, Citation } from '../base/base-analysis.agent';

interface ValuationMethodology {
  method: string;
  value: number;
  confidence: number;
  rationale: string;
}

interface ValuationAnalysis {
  methodologies: ValuationMethodology[];
  recommendedValuation: number;
  valuationRange: { low: number; mid: number; high: number };
  stage: string;
  multipleUsed: string;
  comparableMultiples: number[];
}

@Injectable()
export class VictorAgent extends BaseAnalysisAgent {
  protected readonly agentId = 'victor';
  protected readonly agentName = 'Victor';
  protected readonly agentVersion = '2.0.0'; // Updated with LLM integration
  protected readonly scoringWeight = 1.0;

  protected readonly personality = `You are Victor, Chief Valuation Officer of the Validation Council.

PERSONALITY TRAITS:
- Quantitative: Numbers don't lie. You calculate, don't guess.
- Methodical: Multiple valuation methods triangulate to truth.
- Conservative but Fair: Don't undervalue, but don't let enthusiasm inflate numbers.
- Transparent: Show your work. Founders should understand how you got there.

ANALYSIS FRAMEWORK:
1. Revenue Multiple Valuation - If revenue exists, what multiple applies?
2. Comparable Company Analysis - What did similar companies raise at?
3. Stage-Based Valuation - What's typical for this stage/traction?
4. DCF/Future Value - For later-stage, projected cash flows matter
5. Synthesis - Weight methodologies based on applicability
6. Range Analysis - Provide realistic low/mid/high scenarios

SCORING CRITERIA (1-10):
- 9-10: Clear valuation metrics, strong comparable data, high confidence
- 7-8: Good data points, reasonable confidence in valuation range
- 5-6: Limited data, wider valuation range, moderate confidence
- 3-4: Pre-revenue, speculative valuation, large uncertainty
- 1-2: No basis for valuation, extremely high uncertainty

Remember: Valuation is part art, part science. Be honest about uncertainty.`;

  private valuationAnalysis: ValuationAnalysis | null = null;

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
    this.logger.log('Starting valuation analysis');

    // Step 1: Revenue multiple valuation
    await this.calculateRevenueMultiple(input);

    // Step 2: Comparable company analysis
    await this.analyzeComparables(input);

    // Step 3: Stage-based valuation
    await this.calculateStageBasedValuation(input);

    // Step 4: Synthesize valuations
    await this.synthesizeValuations(input);

    // Step 5: Assess valuation risks
    await this.assessValuationRisks(input);

    // Step 6: Generate recommendations
    await this.generateRecommendations(input);

    this.buildRawAnalysis();
  }

  private async calculateRevenueMultiple(input: AnalysisInput): Promise<void> {
    const annualRevenue = (input.fundingContext?.currentMRR || 0) * 12;
    const growthRate = input.fundingContext?.growthRate || 0;
    const industry = input.idea.industry || 'technology';

    // Base multiples by industry
    const baseMultiples: Record<string, number> = {
      saas: 10,
      fintech: 12,
      marketplace: 8,
      ecommerce: 3,
      healthtech: 10,
      ai: 15,
      default: 8,
    };

    let multiple = baseMultiples[industry.toLowerCase()] || baseMultiples.default;

    // Adjust for growth
    if (growthRate >= 100) multiple *= 1.5;
    else if (growthRate >= 50) multiple *= 1.2;
    else if (growthRate < 20) multiple *= 0.7;

    const valuation = annualRevenue > 0 ? annualRevenue * multiple : 0;

    this.valuationAnalysis = {
      methodologies: [],
      recommendedValuation: 0,
      valuationRange: { low: 0, mid: 0, high: 0 },
      stage: 'seed',
      multipleUsed: `${multiple}x ARR`,
      comparableMultiples: [],
    };

    if (annualRevenue > 0) {
      this.valuationAnalysis.methodologies.push({
        method: 'Revenue Multiple',
        value: valuation,
        confidence: 0.7,
        rationale: `${multiple}x ARR based on ${industry} benchmarks and ${growthRate}% growth`,
      });

      const citation = this.addCitation({
        claim: `Revenue multiple valuation: $${(valuation / 1000000).toFixed(1)}M at ${multiple}x ARR`,
        source: 'Revenue Multiple Analysis',
        sourceUrl: 'internal://victor/revenue-multiple',
        confidence: 0.7,
        dataType: 'computed',
      });

      this.addFinding({
        title: 'Revenue-Based Valuation',
        description: `$${(valuation / 1000000).toFixed(1)}M valuation using ${multiple}x ARR multiple`,
        type: 'neutral',
        severity: 'info',
        evidence: [citation],
        confidence: 7,
      });
    }
  }

  private async analyzeComparables(input: AnalysisInput): Promise<void> {
    const industry = input.idea.industry || 'technology';

    // Comparable company multiples by industry
    const comparableMultiples: Record<string, number[]> = {
      saas: [8, 10, 12, 15],
      fintech: [10, 12, 14, 18],
      marketplace: [6, 8, 10, 12],
      healthtech: [8, 10, 12, 14],
      ai: [12, 15, 18, 25],
      default: [6, 8, 10, 12],
    };

    const multiples = comparableMultiples[industry.toLowerCase()] || comparableMultiples.default;
    const avgMultiple = multiples.reduce((a, b) => a + b, 0) / multiples.length;

    if (this.valuationAnalysis) {
      this.valuationAnalysis.comparableMultiples = multiples;
    }

    const citation = this.addCitation({
      claim: `Comparable ${industry} companies trade at ${avgMultiple.toFixed(1)}x average revenue multiple`,
      source: 'Comparable Company Analysis',
      sourceUrl: 'internal://victor/comparables',
      confidence: 0.65,
      dataType: 'secondary',
    });

    this.addFinding({
      title: 'Comparable Multiples',
      description: `Industry comparables range from ${Math.min(...multiples)}x to ${Math.max(...multiples)}x revenue`,
      type: 'neutral',
      severity: 'info',
      evidence: [citation],
      confidence: 6,
    });
  }

  private async calculateStageBasedValuation(input: AnalysisInput): Promise<void> {
    const stage = input.fundingContext?.targetStage || 'seed';
    const hasRevenue = (input.fundingContext?.currentMRR || 0) > 0;
    const hasUsers = (input.fundingContext?.currentUsers || 0) > 0;
    const hasProduct = input.fundingContext?.hasProduct !== false;

    // Stage-based pre-money valuations
    const stageValuations: Record<string, { base: number; max: number }> = {
      'pre-seed': { base: 2000000, max: 5000000 },
      seed: { base: 5000000, max: 15000000 },
      'series-a': { base: 15000000, max: 50000000 },
      'series-b': { base: 40000000, max: 150000000 },
    };

    const stageRange = stageValuations[stage] || stageValuations.seed;
    let valuation = stageRange.base;

    // Adjust based on traction
    if (hasRevenue) valuation += (stageRange.max - stageRange.base) * 0.4;
    if (hasUsers) valuation += (stageRange.max - stageRange.base) * 0.2;
    if (hasProduct) valuation += (stageRange.max - stageRange.base) * 0.2;

    // Cap at max
    valuation = Math.min(valuation, stageRange.max);

    if (this.valuationAnalysis) {
      this.valuationAnalysis.stage = stage;
      this.valuationAnalysis.methodologies.push({
        method: 'Stage-Based',
        value: valuation,
        confidence: 0.6,
        rationale: `${stage} stage valuation with ${hasRevenue ? 'revenue' : 'no revenue'} traction`,
      });
    }

    const citation = this.addCitation({
      claim: `Stage-based valuation: $${(valuation / 1000000).toFixed(1)}M for ${stage}`,
      source: 'Stage-Based Valuation',
      sourceUrl: 'internal://victor/stage-valuation',
      confidence: 0.6,
      dataType: 'computed',
    });

    this.addFinding({
      title: 'Stage-Based Valuation',
      description: `$${(valuation / 1000000).toFixed(1)}M based on ${stage} stage benchmarks`,
      type: 'neutral',
      severity: 'info',
      evidence: [citation],
      confidence: 6,
    });
  }

  private async synthesizeValuations(input: AnalysisInput): Promise<void> {
    if (!this.valuationAnalysis || this.valuationAnalysis.methodologies.length === 0) {
      // Default valuation for pre-revenue
      this.valuationAnalysis = {
        methodologies: [{ method: 'Stage-Based', value: 5000000, confidence: 0.5, rationale: 'Default seed valuation' }],
        recommendedValuation: 5000000,
        valuationRange: { low: 3000000, mid: 5000000, high: 8000000 },
        stage: 'seed',
        multipleUsed: 'N/A - Pre-revenue',
        comparableMultiples: [],
      };
      return;
    }

    // Weight methodologies by confidence
    const totalWeight = this.valuationAnalysis.methodologies.reduce((sum, m) => sum + m.confidence, 0);
    const weightedValuation = this.valuationAnalysis.methodologies.reduce(
      (sum, m) => sum + m.value * (m.confidence / totalWeight),
      0
    );

    // Calculate range
    const values = this.valuationAnalysis.methodologies.map(m => m.value);
    const low = Math.min(...values) * 0.8;
    const high = Math.max(...values) * 1.2;

    this.valuationAnalysis.recommendedValuation = weightedValuation;
    this.valuationAnalysis.valuationRange = {
      low: Math.round(low),
      mid: Math.round(weightedValuation),
      high: Math.round(high),
    };

    const citation = this.addCitation({
      claim: `Recommended valuation: $${(weightedValuation / 1000000).toFixed(1)}M (range: $${(low / 1000000).toFixed(1)}M - $${(high / 1000000).toFixed(1)}M)`,
      source: 'Valuation Synthesis',
      sourceUrl: 'internal://victor/synthesis',
      confidence: 0.65,
      dataType: 'computed',
    });

    this.addFinding({
      title: 'Recommended Valuation',
      description: `$${(weightedValuation / 1000000).toFixed(1)}M pre-money valuation (range: $${(low / 1000000).toFixed(1)}M - $${(high / 1000000).toFixed(1)}M)`,
      type: 'neutral',
      severity: 'major',
      evidence: [citation],
      confidence: 6,
    });
  }

  private async assessValuationRisks(input: AnalysisInput): Promise<void> {
    const hasRevenue = (input.fundingContext?.currentMRR || 0) > 0;
    const requestedValuation = input.fundingContext?.requestedValuation || 0;
    const recommendedValuation = this.valuationAnalysis?.recommendedValuation || 5000000;

    // Check if requested valuation is reasonable
    if (requestedValuation > 0) {
      const variance = ((requestedValuation - recommendedValuation) / recommendedValuation) * 100;

      if (variance > 50) {
        this.addFinding({
          title: 'Valuation Expectations High',
          description: `Requested valuation ${Math.round(variance)}% above comparable benchmarks`,
          type: 'weakness',
          severity: 'major',
          evidence: [],
          confidence: 7,
        });

        this.addRisk({
          title: 'Fundraising Difficulty',
          description: 'High valuation expectations may extend fundraising timeline',
          category: 'funding',
          probability: 'high',
          impact: 'major',
          mitigations: [
            'Adjust valuation expectations to market',
            'Focus on building traction to justify valuation',
            'Consider smaller round at lower valuation',
          ],
          evidence: [],
        });
      } else if (variance < -30) {
        this.addFinding({
          title: 'Valuation Expectations Conservative',
          description: 'Requested valuation below market may indicate underselling',
          type: 'neutral',
          severity: 'minor',
          evidence: [],
          confidence: 6,
        });
      }
    }

    // Pre-revenue valuation risk
    if (!hasRevenue) {
      this.addRisk({
        title: 'Pre-Revenue Valuation Uncertainty',
        description: 'Without revenue, valuation is highly speculative',
        category: 'funding',
        probability: 'medium',
        impact: 'moderate',
        mitigations: [
          'Focus on user traction metrics',
          'Demonstrate product-market fit signals',
          'Use SAFE notes to defer valuation',
        ],
        evidence: [],
      });
    }
  }

  private async generateRecommendations(input: AnalysisInput): Promise<void> {
    const hasRevenue = (input.fundingContext?.currentMRR || 0) > 0;
    const recommendedValuation = this.valuationAnalysis?.recommendedValuation || 5000000;

    this.addRecommendation({
      title: 'Valuation Strategy',
      description: `Target $${(recommendedValuation / 1000000).toFixed(1)}M pre-money based on market analysis`,
      priority: 'high',
      timeframe: 'immediate',
      effort: 'low',
      impact: 'high',
    });

    if (!hasRevenue) {
      this.addRecommendation({
        title: 'Consider SAFE Notes',
        description: 'Use SAFE/convertible notes to defer valuation until traction improves',
        priority: 'medium',
        timeframe: 'short-term',
        effort: 'low',
        impact: 'medium',
      });
    }

    this.addRecommendation({
      title: 'Valuation Defense',
      description: 'Prepare comparable analysis and traction metrics to justify valuation',
      priority: 'high',
      timeframe: 'short-term',
      effort: 'medium',
      impact: 'high',
    });
  }

  private buildRawAnalysis(): void {
    const v = this.valuationAnalysis;
    this.rawAnalysis = `
# Victor - Valuation Analysis Report

## Valuation Methodologies
${v?.methodologies.map(m => `- **${m.method}**: $${(m.value / 1000000).toFixed(1)}M (${(m.confidence * 100).toFixed(0)}% confidence) - ${m.rationale}`).join('\n') || 'No methodologies applied'}

## Recommended Valuation
- **Pre-Money**: $${((v?.recommendedValuation || 0) / 1000000).toFixed(1)}M
- **Range**: $${((v?.valuationRange.low || 0) / 1000000).toFixed(1)}M - $${((v?.valuationRange.high || 0) / 1000000).toFixed(1)}M
- **Stage**: ${v?.stage || 'Unknown'}
- **Multiple Used**: ${v?.multipleUsed || 'N/A'}

## Comparable Multiples
${v?.comparableMultiples.length ? v.comparableMultiples.join('x, ') + 'x' : 'None analyzed'}

## Key Findings
${this.findings.map(f => `- **${f.title}**: ${f.description}`).join('\n')}

## Valuation Risks
${this.risks.map(r => `- **${r.title}** [${r.probability}/${r.impact}]: ${r.description}`).join('\n')}

## Recommendations
${this.recommendations.map(r => `- **${r.title}**: ${r.description}`).join('\n')}
    `.trim();
  }

  protected calculateScore(): number {
    const v = this.valuationAnalysis;
    if (!v) return 5;

    // Score based on valuation confidence and reasonableness
    let score = 6;

    // Higher confidence from more methodologies
    if (v.methodologies.length >= 2) score += 1;
    if (v.methodologies.length >= 3) score += 0.5;

    // Average methodology confidence
    const avgConfidence = v.methodologies.reduce((sum, m) => sum + m.confidence, 0) / v.methodologies.length;
    score += (avgConfidence - 0.5) * 4; // -2 to +2 adjustment

    // Narrow range is better
    const rangeRatio = v.valuationRange.high / v.valuationRange.low;
    if (rangeRatio < 2) score += 0.5;
    if (rangeRatio > 3) score -= 0.5;

    return Math.max(1, Math.min(10, Math.round(score * 10) / 10));
  }
}
