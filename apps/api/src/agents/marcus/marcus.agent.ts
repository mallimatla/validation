/**
 * Marcus - Chief Market Intelligence Officer
 *
 * Purpose: Validates market size, timing, and opportunity with quantitative evidence.
 * Personality: Quantitative, skeptical, demands data, hates hand-waving.
 * Scoring Weight: 1.0x
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BaseAnalysisAgent, AnalysisInput, Citation } from '../base/base-analysis.agent';

interface MarketData {
  tam: number;
  sam: number;
  som: number;
  growthRate: number;
  marketTiming: 'emerging' | 'growing' | 'mature' | 'declining';
}

@Injectable()
export class MarcusAgent extends BaseAnalysisAgent {
  protected readonly agentId = 'marcus';
  protected readonly agentName = 'Marcus';
  protected readonly agentVersion = '1.0.0';
  protected readonly scoringWeight = 1.0;

  private marketData: MarketData | null = null;

  constructor(prisma: PrismaService, eventEmitter: EventEmitter2) {
    super(prisma, eventEmitter);
  }

  protected async performAnalysis(input: AnalysisInput): Promise<void> {
    this.logger.log('Starting market intelligence analysis');

    // Step 1: Analyze market size
    await this.analyzeMarketSize(input);

    // Step 2: Analyze growth trends
    await this.analyzeGrowthTrends(input);

    // Step 3: Assess market timing
    await this.assessMarketTiming(input);

    // Step 4: Identify customer segments
    await this.identifyCustomerSegments(input);

    // Step 5: Detect demand signals
    await this.detectDemandSignals(input);

    // Step 6: Flag market risks
    await this.flagMarketRisks(input);

    // Build raw analysis
    this.buildRawAnalysis();
  }

  private async analyzeMarketSize(input: AnalysisInput): Promise<void> {
    const industry = input.idea.industry || 'technology';
    const geography = input.idea.geography?.[0] || 'Global';

    // Simulated market research (would use actual APIs in production)
    const tamEstimate = this.estimateTAM(industry, geography);
    const samEstimate = tamEstimate * 0.3;
    const somEstimate = samEstimate * 0.1;

    this.marketData = {
      tam: tamEstimate,
      sam: samEstimate,
      som: somEstimate,
      growthRate: this.estimateGrowthRate(industry),
      marketTiming: this.determineMarketTiming(industry),
    };

    // Add citation for market size
    const citation = this.addCitation({
      claim: `The ${industry} market in ${geography} is estimated at $${(tamEstimate / 1e9).toFixed(1)}B TAM`,
      source: 'Market Analysis (Computed)',
      sourceUrl: 'internal://marcus/market-analysis',
      confidence: 0.7,
      dataType: 'computed',
    });

    // Add finding
    if (tamEstimate >= 1e9) {
      this.addFinding({
        title: 'Large Addressable Market',
        description: `TAM of $${(tamEstimate / 1e9).toFixed(1)}B indicates significant market opportunity`,
        type: 'strength',
        severity: 'major',
        evidence: [citation],
        confidence: 7,
      });
    } else if (tamEstimate < 1e8) {
      this.addFinding({
        title: 'Limited Market Size',
        description: `TAM of $${(tamEstimate / 1e6).toFixed(0)}M may limit growth potential`,
        type: 'weakness',
        severity: 'major',
        evidence: [citation],
        confidence: 7,
      });
    }
  }

  private async analyzeGrowthTrends(input: AnalysisInput): Promise<void> {
    const growthRate = this.marketData?.growthRate || 0;

    const citation = this.addCitation({
      claim: `Industry growth rate estimated at ${(growthRate * 100).toFixed(1)}% annually`,
      source: 'Growth Analysis (Computed)',
      sourceUrl: 'internal://marcus/growth-analysis',
      confidence: 0.65,
      dataType: 'computed',
    });

    if (growthRate > 0.15) {
      this.addFinding({
        title: 'High Growth Market',
        description: `${(growthRate * 100).toFixed(0)}% annual growth indicates strong market momentum`,
        type: 'strength',
        severity: 'major',
        evidence: [citation],
        confidence: 7,
      });
    } else if (growthRate < 0.05) {
      this.addFinding({
        title: 'Slow Growing Market',
        description: `${(growthRate * 100).toFixed(0)}% annual growth suggests mature or declining market`,
        type: 'weakness',
        severity: 'minor',
        evidence: [citation],
        confidence: 6,
      });
    }
  }

  private async assessMarketTiming(input: AnalysisInput): Promise<void> {
    const timing = this.marketData?.marketTiming || 'growing';

    const citation = this.addCitation({
      claim: `Market is currently in ${timing} phase`,
      source: 'Market Timing Analysis',
      sourceUrl: 'internal://marcus/timing-analysis',
      confidence: 0.6,
      dataType: 'computed',
    });

    const timingDescriptions: Record<string, { type: 'strength' | 'weakness' | 'opportunity'; desc: string }> = {
      emerging: { type: 'opportunity', desc: 'Early mover advantage possible but market validation risk exists' },
      growing: { type: 'strength', desc: 'Optimal timing - market is validated and growing' },
      mature: { type: 'weakness', desc: 'Market is mature - differentiation will be critical' },
      declining: { type: 'weakness', desc: 'Market is declining - major pivot may be needed' },
    };

    const { type, desc } = timingDescriptions[timing];

    this.addFinding({
      title: `${timing.charAt(0).toUpperCase() + timing.slice(1)} Market`,
      description: desc,
      type,
      severity: timing === 'declining' ? 'critical' : 'minor',
      evidence: [citation],
      confidence: 6,
    });
  }

  private async identifyCustomerSegments(input: AnalysisInput): Promise<void> {
    const targetCustomer = input.idea.targetCustomer || 'general consumers';

    const citation = this.addCitation({
      claim: `Primary target segment: ${targetCustomer}`,
      source: 'Customer Segmentation Analysis',
      sourceUrl: 'internal://marcus/segmentation',
      confidence: 0.7,
      dataType: 'secondary',
    });

    this.addFinding({
      title: 'Target Customer Identified',
      description: `Primary target: ${targetCustomer}. Segment clarity enables focused go-to-market.`,
      type: 'neutral',
      severity: 'info',
      evidence: [citation],
      confidence: 7,
    });

    this.addRecommendation({
      title: 'Validate Customer Segment',
      description: `Conduct 10+ interviews with ${targetCustomer} to validate problem-solution fit`,
      priority: 'high',
      timeframe: 'immediate',
      effort: 'medium',
      impact: 'high',
    });
  }

  private async detectDemandSignals(input: AnalysisInput): Promise<void> {
    // Simulated demand signal detection
    const hasStrongDemand = input.idea.description.length > 200;

    if (hasStrongDemand) {
      this.addFinding({
        title: 'Potential Demand Signals',
        description: 'Industry trends suggest growing demand in this space',
        type: 'opportunity',
        severity: 'minor',
        evidence: [],
        confidence: 5,
      });
    }
  }

  private async flagMarketRisks(input: AnalysisInput): Promise<void> {
    // Market concentration risk
    this.addRisk({
      title: 'Market Concentration Risk',
      description: 'Market may be dominated by few large players',
      category: 'market',
      probability: 'medium',
      impact: 'moderate',
      mitigations: ['Focus on underserved niches', 'Build defensible differentiation'],
      evidence: [],
    });

    // Economic sensitivity
    this.addRisk({
      title: 'Economic Sensitivity',
      description: 'Market demand may be sensitive to economic downturns',
      category: 'market',
      probability: 'low',
      impact: 'major',
      mitigations: ['Target essential services', 'Build recurring revenue model'],
      evidence: [],
    });
  }

  private buildRawAnalysis(): void {
    const md = this.marketData;
    this.rawAnalysis = `
# Marcus - Market Intelligence Report

## Market Size Analysis
- **TAM**: $${md ? (md.tam / 1e9).toFixed(1) : 'N/A'}B
- **SAM**: $${md ? (md.sam / 1e9).toFixed(1) : 'N/A'}B
- **SOM**: $${md ? (md.som / 1e6).toFixed(0) : 'N/A'}M

## Growth Analysis
- **Annual Growth Rate**: ${md ? (md.growthRate * 100).toFixed(1) : 'N/A'}%
- **Market Timing**: ${md?.marketTiming || 'N/A'}

## Key Findings
${this.findings.map(f => `- **${f.title}**: ${f.description}`).join('\n')}

## Identified Risks
${this.risks.map(r => `- **${r.title}** [${r.probability}/${r.impact}]: ${r.description}`).join('\n')}

## Recommendations
${this.recommendations.map(r => `- **${r.title}**: ${r.description}`).join('\n')}
    `.trim();
  }

  protected calculateScore(): number {
    const md = this.marketData;
    if (!md) return 5;

    let score = 5;

    // TAM scoring
    if (md.tam >= 10e9) score += 2;
    else if (md.tam >= 1e9) score += 1;
    else if (md.tam < 100e6) score -= 2;

    // Growth rate scoring
    if (md.growthRate >= 0.2) score += 1.5;
    else if (md.growthRate >= 0.1) score += 0.5;
    else if (md.growthRate < 0.05) score -= 1;

    // Market timing scoring
    if (md.marketTiming === 'growing') score += 1;
    else if (md.marketTiming === 'emerging') score += 0.5;
    else if (md.marketTiming === 'declining') score -= 2;

    return Math.max(1, Math.min(10, Math.round(score * 10) / 10));
  }

  // Helper methods
  private estimateTAM(industry: string, geography: string): number {
    const baseTAMs: Record<string, number> = {
      'ai/ml': 200e9,
      'saas': 150e9,
      'fintech': 100e9,
      'healthcare': 80e9,
      'ecommerce': 120e9,
      'edtech': 40e9,
      'default': 50e9,
    };
    const base = baseTAMs[industry.toLowerCase()] || baseTAMs.default;
    return base * (0.7 + Math.random() * 0.6);
  }

  private estimateGrowthRate(industry: string): number {
    const rates: Record<string, number> = {
      'ai/ml': 0.25,
      'saas': 0.15,
      'fintech': 0.12,
      'healthcare': 0.08,
      'ecommerce': 0.10,
      'edtech': 0.14,
      'default': 0.10,
    };
    return rates[industry.toLowerCase()] || rates.default;
  }

  private determineMarketTiming(industry: string): 'emerging' | 'growing' | 'mature' | 'declining' {
    const emerging = ['ai/ml', 'web3', 'quantum'];
    const growing = ['saas', 'fintech', 'edtech', 'healthtech'];
    const mature = ['ecommerce', 'social'];

    const lower = industry.toLowerCase();
    if (emerging.some(e => lower.includes(e))) return 'emerging';
    if (growing.some(g => lower.includes(g))) return 'growing';
    if (mature.some(m => lower.includes(m))) return 'mature';
    return 'growing';
  }
}
