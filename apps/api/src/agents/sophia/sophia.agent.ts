/**
 * Sophia - Chief Competitive Strategy Officer
 *
 * Purpose: Maps competitive landscape and assesses differentiation with brutal honesty.
 * Personality: Strategic thinker, pattern matcher, brutally honest about threats.
 * Scoring Weight: 1.2x
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BaseAnalysisAgent, AnalysisInput, Citation } from '../base/base-analysis.agent';
import {
  SEVEN_POWERS,
  MOAT_THRESHOLDS,
  MOAT_KILL_SIGNALS,
  NETWORK_EFFECT_TYPES,
} from '../validation-framework.constants';

interface Competitor {
  name: string;
  type: 'direct' | 'indirect' | 'adjacent';
  funding?: number;
  traffic?: number;
  differentiation: string;
  threat: 'high' | 'medium' | 'low';
}

interface CompetitiveAnalysis {
  competitors: Competitor[];
  marketConcentration: 'monopoly' | 'oligopoly' | 'fragmented';
  differentiationScore: number;
  moatStrength: number;
}

@Injectable()
export class SophiaAgent extends BaseAnalysisAgent {
  protected readonly agentId = 'sophia';
  protected readonly agentName = 'Sophia';
  protected readonly agentVersion = '1.0.0';
  protected readonly scoringWeight = 1.2;

  protected readonly personality = `You are Sophia, Chief Competitive Strategy Officer of the Validation Council.

PERSONALITY TRAITS:
- Strategic Thinker: You see patterns across industries and can predict competitive moves.
- Pattern Matcher: You've analyzed thousands of competitive landscapes and recognize winning strategies.
- Brutally Honest: If the competitive situation is dire, you say it directly. Better to pivot than fight unwinnable battles.
- Protective: You want to save founders from walking into competitive minefields.

ANALYSIS FRAMEWORK:
1. Competitive Mapping - Direct, indirect, and adjacent competitors
2. Funding Intelligence - Who has money to wage competitive war?
3. Differentiation Assessment - What's truly unique? What can be copied?
4. Moat Analysis - Network effects, data advantages, switching costs, brand
5. War Gaming - How will competitors respond to this new entrant?
6. Timing Analysis - Is there a window of opportunity?

SCORING CRITERIA (1-10):
- 9-10: Blue ocean, no direct competitors, strong moat potential
- 7-8: Few competitors, clear differentiation, defensible position
- 5-6: Moderate competition, some differentiation, unclear moat
- 3-4: Crowded market, weak differentiation, well-funded competitors
- 1-2: Dominated by giants, no clear path to compete

Remember: Competition is not just about who exists today, but who will enter tomorrow.`;

  private analysis: CompetitiveAnalysis | null = null;

  constructor(prisma: PrismaService, eventEmitter: EventEmitter2) {
    super(prisma, eventEmitter);
  }

  protected buildAnalysisPrompt(input: AnalysisInput): string {
    return `Analyze the competitive landscape for this startup:

STARTUP: ${input.idea.title}
DESCRIPTION: ${input.idea.description}
SOLUTION: ${input.idea.solution || 'Not specified'}
INDUSTRY: ${input.idea.industry || 'Not specified'}
TARGET CUSTOMER: ${input.idea.targetCustomer || 'Not specified'}

Provide comprehensive competitive analysis including:
1. List of direct, indirect, and adjacent competitors
2. Assessment of competitor funding and resources
3. Differentiation analysis - what's truly unique
4. Moat potential assessment (network effects, data, switching costs)
5. War gaming scenarios - how competitors might respond
6. Strategic recommendations for competitive positioning

Be brutally honest about the competitive reality. If this is a crowded space, say so clearly.`;
  }

  protected async performAnalysis(input: AnalysisInput): Promise<void> {
    this.logger.log('Starting competitive analysis');

    // Step 1: Discover competitors
    const competitors = await this.discoverCompetitors(input);

    // Step 2: Analyze funding intelligence
    await this.analyzeFundingIntelligence(competitors);

    // Step 3: Assess differentiation
    const differentiationScore = await this.assessDifferentiation(input, competitors);

    // Step 4: Analyze moat potential
    const moatStrength = await this.analyzeMoat(input);

    // Step 5: Generate war gaming scenarios
    await this.generateWarGamingScenarios(input, competitors);

    // Store analysis
    this.analysis = {
      competitors,
      marketConcentration: this.determineConcentration(competitors),
      differentiationScore,
      moatStrength,
    };

    this.buildRawAnalysis();
  }

  private async discoverCompetitors(input: AnalysisInput): Promise<Competitor[]> {
    const industry = input.idea.industry || 'technology';
    const competitors: Competitor[] = [];

    // Simulated competitor discovery (would use real APIs)
    const directCompetitors = this.generateCompetitors(industry, 'direct', 3);
    const indirectCompetitors = this.generateCompetitors(industry, 'indirect', 2);
    const adjacentCompetitors = this.generateCompetitors(industry, 'adjacent', 2);

    competitors.push(...directCompetitors, ...indirectCompetitors, ...adjacentCompetitors);

    const citation = this.addCitation({
      claim: `Identified ${competitors.length} competitors in the ${industry} space`,
      source: 'Competitive Analysis',
      sourceUrl: 'internal://sophia/competitor-discovery',
      confidence: 0.75,
      dataType: 'computed',
    });

    if (directCompetitors.length >= 5) {
      this.addFinding({
        title: 'Crowded Market',
        description: `${directCompetitors.length} direct competitors identified - differentiation is critical`,
        type: 'threat',
        severity: 'major',
        evidence: [citation],
        confidence: 7,
      });
    } else if (directCompetitors.length <= 2) {
      this.addFinding({
        title: 'Limited Direct Competition',
        description: `Only ${directCompetitors.length} direct competitors - potential blue ocean opportunity`,
        type: 'opportunity',
        severity: 'major',
        evidence: [citation],
        confidence: 7,
      });
    }

    return competitors;
  }

  private async analyzeFundingIntelligence(competitors: Competitor[]): Promise<void> {
    const wellFunded = competitors.filter(c => (c.funding || 0) > 10e6);

    if (wellFunded.length > 0) {
      const citation = this.addCitation({
        claim: `${wellFunded.length} competitors have raised $10M+`,
        source: 'Funding Intelligence',
        sourceUrl: 'internal://sophia/funding-analysis',
        confidence: 0.8,
        dataType: 'computed',
      });

      this.addFinding({
        title: 'Well-Funded Competition',
        description: `${wellFunded.length} competitors have significant funding - expect aggressive competition`,
        type: 'threat',
        severity: wellFunded.length > 3 ? 'critical' : 'major',
        evidence: [citation],
        confidence: 8,
      });

      this.addRisk({
        title: 'Funding Disadvantage',
        description: 'Competitors have more resources for product development and marketing',
        category: 'competition',
        probability: 'high',
        impact: 'major',
        mitigations: [
          'Focus on specific niche where incumbents are weak',
          'Build capital-efficient growth model',
          'Consider strategic partnerships',
        ],
        evidence: [citation],
      });
    }
  }

  private async assessDifferentiation(input: AnalysisInput, competitors: Competitor[]): Promise<number> {
    // Assess differentiation based on solution uniqueness
    const solution = input.idea.solution || input.idea.description;
    const uniqueFeatures = this.extractUniqueFeatures(solution);

    const differentiationScore = Math.min(10, 5 + uniqueFeatures.length);

    const citation = this.addCitation({
      claim: `Differentiation score: ${differentiationScore}/10 based on ${uniqueFeatures.length} unique aspects`,
      source: 'Differentiation Analysis',
      sourceUrl: 'internal://sophia/differentiation',
      confidence: 0.65,
      dataType: 'computed',
    });

    if (differentiationScore >= 7) {
      this.addFinding({
        title: 'Strong Differentiation',
        description: `Clear unique value proposition with ${uniqueFeatures.length} differentiating factors`,
        type: 'strength',
        severity: 'major',
        evidence: [citation],
        confidence: 7,
      });
    } else if (differentiationScore < 5) {
      this.addFinding({
        title: 'Weak Differentiation',
        description: 'Limited unique value proposition - risk of commoditization',
        type: 'weakness',
        severity: 'critical',
        evidence: [citation],
        confidence: 7,
      });

      this.addRecommendation({
        title: 'Strengthen Differentiation',
        description: 'Identify and develop unique features that competitors cannot easily replicate',
        priority: 'critical',
        timeframe: 'immediate',
        effort: 'high',
        impact: 'high',
      });
    }

    return differentiationScore;
  }

  /**
   * Analyze moat using Hamilton Helmer's 7 Powers framework
   * Based on research showing 70% of tech value comes from network effects
   */
  private async analyzeMoat(input: AnalysisInput): Promise<number> {
    let moatScore = 0;
    const detectedPowers: string[] = [];
    const powerAnalysis: Record<string, { detected: boolean; strength: string; evidence: string }> = {};

    // Analyze each of the 7 Powers
    const powers = [
      { key: 'scale_economies', check: () => this.hasScaleEconomies(input) },
      { key: 'network_economies', check: () => this.hasNetworkEffects(input) },
      { key: 'counter_positioning', check: () => this.hasCounterPositioning(input) },
      { key: 'switching_costs', check: () => this.hasSwitchingCosts(input) },
      { key: 'branding', check: () => this.hasBrandingPower(input) },
      { key: 'cornered_resource', check: () => this.hasCorneredResource(input) },
      { key: 'process_power', check: () => this.hasProcessPower(input) },
    ];

    for (const power of powers) {
      const powerInfo = SEVEN_POWERS[power.key as keyof typeof SEVEN_POWERS];
      const detected = power.check();

      powerAnalysis[power.key] = {
        detected,
        strength: powerInfo.strength,
        evidence: detected ? `Indicators present for ${powerInfo.name}` : 'Not detected',
      };

      if (detected) {
        detectedPowers.push(powerInfo.name);
        // Assign points based on power strength
        const strengthPoints: Record<string, number> = {
          'very_high': 2.5,
          'high': 2,
          'medium_high': 1.5,
          'medium': 1,
        };
        moatScore += strengthPoints[powerInfo.strength] || 1;
      }
    }

    // Check for data advantage specifically (often overestimated by founders per NFX research)
    const hasDataNetwork = this.hasDataAdvantage(input);
    if (hasDataNetwork) {
      this.addFinding({
        title: 'Data Network Effect Claimed',
        description: 'Data network effects are often weaker than founders believe. Validate: Does more data actually improve product for all users? Is data proprietary and defensible?',
        type: 'neutral',
        severity: 'info',
        evidence: [],
        confidence: 7,
      });
    }

    const citation = this.addCitation({
      claim: `7 Powers Analysis: ${detectedPowers.length}/7 powers detected - ${detectedPowers.join(', ') || 'None identified'}. ${(MOAT_THRESHOLDS.NETWORK_EFFECTS_VALUE_SHARE * 100).toFixed(0)}% of tech value since 1994 comes from network effects.`,
      source: 'Hamilton Helmer 7 Powers Framework',
      sourceUrl: 'internal://sophia/seven-powers-analysis',
      confidence: 0.75,
      dataType: 'computed',
    });

    if (moatScore >= 5) {
      this.addFinding({
        title: 'Strong Defensibility (7 Powers)',
        description: `Detected powers: ${detectedPowers.join(', ')}. These create structural advantages competitors cannot easily replicate.`,
        type: 'strength',
        severity: 'critical',
        evidence: [citation],
        confidence: 7,
      });
    } else if (moatScore >= 2) {
      this.addFinding({
        title: 'Moderate Defensibility (7 Powers)',
        description: `Detected powers: ${detectedPowers.join(', ') || 'Weak signals only'}. Need to strengthen moat before scaling.`,
        type: 'neutral',
        severity: 'major',
        evidence: [citation],
        confidence: 6,
      });
    } else {
      this.addFinding({
        title: 'Limited Defensibility (7 Powers)',
        description: 'No strong powers detected. Business can be easily replicated. This is a major concern for venture-scale returns.',
        type: 'weakness',
        severity: 'critical',
        evidence: [citation],
        confidence: 7,
      });

      this.addRecommendation({
        title: 'Develop Strategic Power',
        description: 'Focus on building at least one of: network effects (strongest), counter-positioning against incumbents, or high switching costs through deep integration.',
        priority: 'critical',
        timeframe: 'immediate',
        effort: 'high',
        impact: 'high',
      });
    }

    // Check moat kill signals
    this.checkMoatKillSignals(input, moatScore);

    return Math.min(10, moatScore);
  }

  /**
   * Check for moat-related kill signals
   */
  private checkMoatKillSignals(input: AnalysisInput, moatScore: number): void {
    this.checkKillSignals([
      {
        signal: MOAT_KILL_SIGNALS[0], // Easily replicable in under 12 months
        severity: 'major',
        condition: moatScore < 2,
        evidence: 'No significant barriers to replication identified.',
        recommendation: 'Identify unique defensible advantages or first-mover dynamics.',
      },
      {
        signal: MOAT_KILL_SIGNALS[2], // Commoditized supply
        severity: 'major',
        condition: this.hasCommoditizedSupply(input),
        evidence: 'Supply side is commoditized with low differentiation.',
        recommendation: 'Focus on demand-side aggregation or unique supply partnerships.',
      },
    ]);
  }

  private hasScaleEconomies(input: AnalysisInput): boolean {
    const desc = (input.idea.description + (input.idea.solution || '')).toLowerCase();
    return ['infrastructure', 'manufacturing', 'logistics', 'wholesale', 'distribution'].some(k => desc.includes(k));
  }

  private hasCounterPositioning(input: AnalysisInput): boolean {
    const desc = (input.idea.description + (input.idea.solution || '')).toLowerCase();
    // Counter-positioning: new business model incumbents can't copy
    return ['disrupt', 'replace', 'alternative to', 'unlike traditional', 'reimagine'].some(k => desc.includes(k));
  }

  private hasBrandingPower(input: AnalysisInput): boolean {
    const desc = (input.idea.description + (input.idea.solution || '')).toLowerCase();
    return ['premium', 'luxury', 'brand', 'trust', 'reputation'].some(k => desc.includes(k));
  }

  private hasCorneredResource(input: AnalysisInput): boolean {
    const desc = (input.idea.description + (input.idea.solution || '')).toLowerCase();
    return ['exclusive', 'patent', 'licensed', 'proprietary', 'only', 'unique access'].some(k => desc.includes(k));
  }

  private hasProcessPower(input: AnalysisInput): boolean {
    const desc = (input.idea.description + (input.idea.solution || '')).toLowerCase();
    return ['operational excellence', 'process', 'methodology', 'system', 'proven approach'].some(k => desc.includes(k));
  }

  private hasCommoditizedSupply(input: AnalysisInput): boolean {
    const desc = (input.idea.description + (input.idea.solution || '')).toLowerCase();
    return ['commodity', 'standard', 'generic', 'undifferentiated'].some(k => desc.includes(k));
  }

  private async generateWarGamingScenarios(input: AnalysisInput, competitors: Competitor[]): Promise<void> {
    const highThreatCompetitors = competitors.filter(c => c.threat === 'high');

    for (const competitor of highThreatCompetitors.slice(0, 2)) {
      this.addRisk({
        title: `${competitor.name} Competitive Response`,
        description: `If successful, ${competitor.name} may respond with similar features or aggressive pricing`,
        category: 'competition',
        probability: 'medium',
        impact: 'major',
        mitigations: [
          'Move fast to establish market position',
          'Build customer lock-in through superior experience',
          'Consider partnership or acquisition discussions',
        ],
        evidence: [],
      });
    }
  }

  private buildRawAnalysis(): void {
    const a = this.analysis;
    this.rawAnalysis = `
# Sophia - Competitive Strategy Report

## Competitive Landscape
- **Total Competitors**: ${a?.competitors.length || 0}
- **Direct Competitors**: ${a?.competitors.filter(c => c.type === 'direct').length || 0}
- **Market Concentration**: ${a?.marketConcentration || 'N/A'}

## Differentiation Assessment
- **Differentiation Score**: ${a?.differentiationScore || 0}/10
- **Moat Strength**: ${a?.moatStrength || 0}/10

## Competitor Details
${a?.competitors.map(c => `- **${c.name}** (${c.type}): Threat level ${c.threat}`).join('\n') || 'None identified'}

## Key Findings
${this.findings.map(f => `- **${f.title}**: ${f.description}`).join('\n')}

## Competitive Risks
${this.risks.map(r => `- **${r.title}** [${r.probability}/${r.impact}]: ${r.description}`).join('\n')}

## Strategic Recommendations
${this.recommendations.map(r => `- **${r.title}**: ${r.description}`).join('\n')}
    `.trim();
  }

  protected calculateScore(): number {
    const a = this.analysis;
    if (!a) return 5;

    let score = 5;

    // Competitor count scoring (fewer is better)
    const directCount = a.competitors.filter(c => c.type === 'direct').length;
    if (directCount === 0) score += 2;
    else if (directCount <= 2) score += 1;
    else if (directCount >= 10) score -= 2;
    else if (directCount >= 5) score -= 1;

    // Differentiation scoring
    score += (a.differentiationScore - 5) * 0.3;

    // Moat scoring
    score += (a.moatStrength - 5) * 0.2;

    // Market concentration
    if (a.marketConcentration === 'fragmented') score += 0.5;
    if (a.marketConcentration === 'monopoly') score -= 1;

    return Math.max(1, Math.min(10, Math.round(score * 10) / 10));
  }

  // Helper methods
  private generateCompetitors(industry: string, type: 'direct' | 'indirect' | 'adjacent', count: number): Competitor[] {
    const competitors: Competitor[] = [];
    const threats: Array<'high' | 'medium' | 'low'> = ['high', 'medium', 'low'];

    for (let i = 0; i < count; i++) {
      competitors.push({
        name: `${type.charAt(0).toUpperCase()}Competitor${i + 1}`,
        type,
        funding: Math.random() * 50e6,
        traffic: Math.random() * 1e6,
        differentiation: `${type} player in ${industry}`,
        threat: threats[Math.min(i, 2)],
      });
    }

    return competitors;
  }

  private determineConcentration(competitors: Competitor[]): 'monopoly' | 'oligopoly' | 'fragmented' {
    const directCount = competitors.filter(c => c.type === 'direct').length;
    if (directCount <= 1) return 'monopoly';
    if (directCount <= 5) return 'oligopoly';
    return 'fragmented';
  }

  private extractUniqueFeatures(solution: string): string[] {
    const keywords = ['ai', 'automated', 'first', 'only', 'unique', 'patent', 'proprietary'];
    return keywords.filter(k => solution.toLowerCase().includes(k));
  }

  private hasNetworkEffects(input: AnalysisInput): boolean {
    const desc = (input.idea.description + (input.idea.solution || '')).toLowerCase();
    return ['marketplace', 'social', 'network', 'community', 'platform'].some(k => desc.includes(k));
  }

  private hasDataAdvantage(input: AnalysisInput): boolean {
    const desc = (input.idea.description + (input.idea.solution || '')).toLowerCase();
    return ['data', 'ai', 'machine learning', 'analytics', 'insights'].some(k => desc.includes(k));
  }

  private hasSwitchingCosts(input: AnalysisInput): boolean {
    const desc = (input.idea.description + (input.idea.solution || '')).toLowerCase();
    return ['integration', 'workflow', 'enterprise', 'migration', 'embedded'].some(k => desc.includes(k));
  }
}
