/**
 * Omar - Chief Technology Officer
 *
 * Purpose: Assesses technical feasibility and estimates realistic timelines.
 * Personality: Pragmatic engineer, anti-over-engineering, realistic.
 * Scoring Weight: 1.0x
 */

import { Injectable, Optional } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LLMService } from '../../common/llm/llm.service';
import { BaseAnalysisAgent, AnalysisInput, Citation } from '../base/base-analysis.agent';

interface TechnicalAssessment {
  feasibilityScore: number;
  complexityLevel: 'low' | 'medium' | 'high' | 'very_high';
  estimatedDevMonths: number;
  teamSizeNeeded: number;
  infrastructureCost: number;
  techStack: string[];
  dependencies: string[];
}

@Injectable()
export class OmarAgent extends BaseAnalysisAgent {
  protected readonly agentId = 'omar';
  protected readonly agentName = 'Omar';
  protected readonly agentVersion = '1.0.0';
  protected readonly scoringWeight = 1.0;

  protected readonly personality = `You are Omar, Chief Technology Officer of the Validation Council.

PERSONALITY TRAITS:
- Pragmatic Engineer: You've shipped products. You know what works and what doesn't.
- Anti-Over-Engineering: Start simple. Complexity kills startups faster than competitors.
- Realistic: You've seen "we'll just build it in a weekend" become 18-month projects.
- Build vs Buy Expert: You know when to leverage existing tools vs building custom.

ANALYSIS FRAMEWORK:
1. Feasibility Assessment - Is this technically possible with today's technology?
2. Complexity Analysis - How hard is this really? What are the hidden challenges?
3. Build vs Buy - What should be built vs bought/integrated?
4. Timeline Estimation - Realistic MVP timeline with buffer for unknowns
5. Infrastructure Planning - Scalability, costs, vendor dependencies
6. Technical Risk Identification - What could go wrong technically?

SCORING CRITERIA (1-10):
- 9-10: Standard tech stack, proven patterns, small team can build MVP in 2-3 months
- 7-8: Moderate complexity, some specialized knowledge needed, 4-6 month MVP
- 5-6: Challenging but feasible, requires experienced team, 6-9 month MVP
- 3-4: Very complex, unproven technology, significant R&D needed
- 1-2: Requires breakthrough technology or unsolved problems

Remember: The best code is no code. The second best is simple code. Complexity is the enemy.`;

  private techAssessment: TechnicalAssessment | null = null;

  constructor(
    prisma: PrismaService,
    eventEmitter: EventEmitter2,
    @Optional() llm?: LLMService,
  ) {
    super(prisma, eventEmitter, llm);
  }

  protected buildAnalysisPrompt(input: AnalysisInput): string {
    return `Analyze the technical feasibility of this startup:

STARTUP: ${input.idea.title}
DESCRIPTION: ${input.idea.description}
SOLUTION: ${input.idea.solution || 'Not specified'}
INDUSTRY: ${input.idea.industry || 'Not specified'}
BUSINESS MODEL: ${input.idea.businessModel || 'Not specified'}

Provide comprehensive technical analysis including:
1. Technical feasibility assessment - can this be built?
2. Complexity analysis - hidden challenges and dependencies
3. Build vs buy recommendations - what to leverage vs build
4. Realistic MVP timeline with team size requirements
5. Infrastructure and scaling considerations
6. Key technical risks and mitigation strategies

Be realistic about timelines. Add buffer for the unknown unknowns. Don't sugarcoat complexity.`;
  }

  protected async performAnalysis(input: AnalysisInput): Promise<void> {
    this.logger.log('Starting technical feasibility analysis');

    // Step 1: Assess technical feasibility
    await this.assessFeasibility(input);

    // Step 2: Analyze complexity
    await this.analyzeComplexity(input);

    // Step 3: Build vs buy analysis
    await this.analyzeBuildVsBuy(input);

    // Step 4: Estimate timeline
    await this.estimateTimeline(input);

    // Step 5: Calculate infrastructure costs
    await this.calculateInfrastructureCosts(input);

    // Step 6: Identify technical risks
    await this.identifyTechnicalRisks(input);

    this.buildRawAnalysis();
  }

  private async assessFeasibility(input: AnalysisInput): Promise<void> {
    const solution = (input.idea.solution || input.idea.description).toLowerCase();

    // Check for feasibility concerns
    const hardProblems = ['quantum', 'agi', 'consciousness', 'perpetual', 'faster than light'];
    const challengingProblems = ['self-driving', 'general ai', 'brain-computer', 'fusion'];
    const standardProblems = ['web app', 'mobile app', 'saas', 'api', 'platform'];

    let feasibilityScore = 8;

    if (hardProblems.some(p => solution.includes(p))) {
      feasibilityScore = 2;
    } else if (challengingProblems.some(p => solution.includes(p))) {
      feasibilityScore = 5;
    } else if (standardProblems.some(p => solution.includes(p))) {
      feasibilityScore = 9;
    }

    this.techAssessment = {
      feasibilityScore,
      complexityLevel: 'medium',
      estimatedDevMonths: 6,
      teamSizeNeeded: 2,
      infrastructureCost: 500,
      techStack: [],
      dependencies: [],
    };

    const citation = this.addCitation({
      claim: `Technical feasibility score: ${feasibilityScore}/10`,
      source: 'Feasibility Assessment',
      sourceUrl: 'internal://omar/feasibility',
      confidence: 0.7,
      dataType: 'computed',
    });

    if (feasibilityScore >= 8) {
      this.addFinding({
        title: 'Technically Feasible',
        description: 'Solution uses proven technology and patterns',
        type: 'strength',
        severity: 'major',
        evidence: [citation],
        confidence: 8,
      });
    } else if (feasibilityScore < 5) {
      this.addFinding({
        title: 'Technical Feasibility Concerns',
        description: 'Solution requires breakthrough technology or unsolved problems',
        type: 'weakness',
        severity: 'critical',
        evidence: [citation],
        confidence: 7,
      });

      this.addRisk({
        title: 'Technology Risk',
        description: 'Core technology may not be feasible with current state of the art',
        category: 'technical',
        probability: 'high',
        impact: 'critical',
        mitigations: [
          'Validate core technical assumptions with prototypes',
          'Consult domain experts',
          'Consider simpler alternatives',
        ],
        evidence: [citation],
      });
    }
  }

  private async analyzeComplexity(input: AnalysisInput): Promise<void> {
    const solution = (input.idea.solution || input.idea.description).toLowerCase();

    // Complexity indicators
    const highComplexityIndicators = ['machine learning', 'ai', 'real-time', 'distributed', 'blockchain'];
    const mediumComplexityIndicators = ['api', 'integration', 'mobile', 'analytics'];

    let complexity: 'low' | 'medium' | 'high' | 'very_high' = 'low';
    let complexityScore = 0;

    for (const indicator of highComplexityIndicators) {
      if (solution.includes(indicator)) complexityScore += 2;
    }
    for (const indicator of mediumComplexityIndicators) {
      if (solution.includes(indicator)) complexityScore += 1;
    }

    if (complexityScore >= 6) complexity = 'very_high';
    else if (complexityScore >= 4) complexity = 'high';
    else if (complexityScore >= 2) complexity = 'medium';
    else complexity = 'low';

    if (this.techAssessment) {
      this.techAssessment.complexityLevel = complexity;
    }

    const citation = this.addCitation({
      claim: `Technical complexity: ${complexity}`,
      source: 'Complexity Analysis',
      sourceUrl: 'internal://omar/complexity',
      confidence: 0.7,
      dataType: 'computed',
    });

    if (complexity === 'very_high' || complexity === 'high') {
      this.addFinding({
        title: 'High Technical Complexity',
        description: `${complexity} complexity will require experienced engineers and longer timeline`,
        type: 'weakness',
        severity: 'major',
        evidence: [citation],
        confidence: 7,
      });
    } else {
      this.addFinding({
        title: 'Manageable Complexity',
        description: 'Technical complexity is within normal range for startup development',
        type: 'neutral',
        severity: 'info',
        evidence: [citation],
        confidence: 7,
      });
    }
  }

  private async analyzeBuildVsBuy(input: AnalysisInput): Promise<void> {
    const solution = (input.idea.solution || input.idea.description).toLowerCase();

    // Components that should typically be bought/used as services
    const buyComponents = [
      { keyword: 'payment', recommendation: 'Stripe, PayPal' },
      { keyword: 'auth', recommendation: 'Auth0, Clerk, Firebase Auth' },
      { keyword: 'email', recommendation: 'SendGrid, Postmark' },
      { keyword: 'sms', recommendation: 'Twilio' },
      { keyword: 'video', recommendation: 'Mux, Cloudflare Stream' },
      { keyword: 'search', recommendation: 'Algolia, Elasticsearch' },
    ];

    const recommendations: string[] = [];

    for (const component of buyComponents) {
      if (solution.includes(component.keyword)) {
        recommendations.push(`${component.keyword}: Use ${component.recommendation}`);
      }
    }

    if (recommendations.length > 0) {
      this.addRecommendation({
        title: 'Build vs Buy',
        description: `Leverage existing services: ${recommendations.join('; ')}`,
        priority: 'medium',
        timeframe: 'immediate',
        effort: 'low',
        impact: 'high',
      });
    }
  }

  private async estimateTimeline(input: AnalysisInput): Promise<void> {
    const complexity = this.techAssessment?.complexityLevel || 'medium';

    // Base estimates by complexity
    const baseMonths: Record<string, number> = {
      low: 2,
      medium: 4,
      high: 8,
      very_high: 12,
    };

    const teamSize: Record<string, number> = {
      low: 1,
      medium: 2,
      high: 3,
      very_high: 5,
    };

    const months = baseMonths[complexity];
    const team = teamSize[complexity];

    if (this.techAssessment) {
      this.techAssessment.estimatedDevMonths = months;
      this.techAssessment.teamSizeNeeded = team;
    }

    const citation = this.addCitation({
      claim: `Estimated MVP timeline: ${months} months with ${team} engineers`,
      source: 'Timeline Estimation',
      sourceUrl: 'internal://omar/timeline',
      confidence: 0.6,
      dataType: 'computed',
    });

    this.addFinding({
      title: 'Development Timeline',
      description: `MVP estimated at ${months} months with ${team}-person engineering team`,
      type: 'neutral',
      severity: 'info',
      evidence: [citation],
      confidence: 6,
    });

    if (months > 6) {
      this.addRecommendation({
        title: 'Phase Development',
        description: 'Consider building in phases with earlier customer validation',
        priority: 'high',
        timeframe: 'immediate',
        effort: 'low',
        impact: 'high',
      });
    }
  }

  private async calculateInfrastructureCosts(input: AnalysisInput): Promise<void> {
    const complexity = this.techAssessment?.complexityLevel || 'medium';

    // Monthly infrastructure costs by complexity
    const costs: Record<string, number> = {
      low: 100,
      medium: 500,
      high: 2000,
      very_high: 5000,
    };

    const monthlyCost = costs[complexity];

    if (this.techAssessment) {
      this.techAssessment.infrastructureCost = monthlyCost;
    }

    const citation = this.addCitation({
      claim: `Estimated monthly infrastructure cost: $${monthlyCost}`,
      source: 'Infrastructure Cost Analysis',
      sourceUrl: 'internal://omar/infrastructure',
      confidence: 0.5,
      dataType: 'computed',
    });

    this.addFinding({
      title: 'Infrastructure Costs',
      description: `Expected monthly infrastructure: $${monthlyCost} (scales with usage)`,
      type: 'neutral',
      severity: 'info',
      evidence: [citation],
      confidence: 5,
    });
  }

  private async identifyTechnicalRisks(input: AnalysisInput): Promise<void> {
    const solution = (input.idea.solution || input.idea.description).toLowerCase();

    // Scaling risk
    if (['marketplace', 'social', 'viral'].some(k => solution.includes(k))) {
      this.addRisk({
        title: 'Scaling Risk',
        description: 'Rapid growth could strain infrastructure',
        category: 'technical',
        probability: 'medium',
        impact: 'moderate',
        mitigations: [
          'Design for horizontal scaling from start',
          'Use cloud-native architecture',
          'Implement caching and CDN',
        ],
        evidence: [],
      });
    }

    // Third-party dependency
    this.addRisk({
      title: 'Third-party Dependencies',
      description: 'Reliance on external APIs and services creates dependency risk',
      category: 'technical',
      probability: 'low',
      impact: 'moderate',
      mitigations: [
        'Abstract third-party integrations',
        'Have fallback providers identified',
        'Monitor API deprecation notices',
      ],
      evidence: [],
    });
  }

  private buildRawAnalysis(): void {
    const t = this.techAssessment;
    this.rawAnalysis = `
# Omar - Technical Feasibility Report

## Technical Assessment
- **Feasibility Score**: ${t?.feasibilityScore || 0}/10
- **Complexity Level**: ${t?.complexityLevel || 'Unknown'}
- **Estimated MVP Timeline**: ${t?.estimatedDevMonths || 0} months
- **Team Size Needed**: ${t?.teamSizeNeeded || 0} engineers
- **Monthly Infrastructure**: $${t?.infrastructureCost || 0}

## Key Findings
${this.findings.map(f => `- **${f.title}**: ${f.description}`).join('\n')}

## Technical Risks
${this.risks.map(r => `- **${r.title}** [${r.probability}/${r.impact}]: ${r.description}`).join('\n')}

## Recommendations
${this.recommendations.map(r => `- **${r.title}**: ${r.description}`).join('\n')}
    `.trim();
  }

  protected calculateScore(): number {
    const t = this.techAssessment;
    if (!t) return 7;

    let score = t.feasibilityScore;

    // Adjust for complexity
    if (t.complexityLevel === 'very_high') score -= 1;
    else if (t.complexityLevel === 'low') score += 0.5;

    // Adjust for timeline
    if (t.estimatedDevMonths > 12) score -= 1;
    else if (t.estimatedDevMonths <= 3) score += 0.5;

    return Math.max(1, Math.min(10, Math.round(score * 10) / 10));
  }
}
