/**
 * James - Chief Talent Officer
 *
 * Purpose: Evaluates founding team capability and execution risk.
 * Personality: Direct, execution-focused, cares about founder psychology.
 * Scoring Weight: 1.5x
 *
 * REAL DATA SOURCES:
 * - LLM-powered team analysis
 * - Pattern recognition from founder data
 */

import { Injectable, Optional } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LLMService } from '../../common/llm/llm.service';
import { BaseAnalysisAgent, AnalysisInput, Citation } from '../base/base-analysis.agent';

interface TeamMember {
  role: string;
  hasRelevantExperience: boolean;
  yearsExperience: number;
  previousStartups: number;
}

interface TeamAnalysis {
  founderCount: number;
  hasCofounder: boolean;
  teamSize: number;
  skillsCovered: string[];
  skillGaps: string[];
  executionScore: number;
}

@Injectable()
export class JamesAgent extends BaseAnalysisAgent {
  protected readonly agentId = 'james';
  protected readonly agentName = 'James';
  protected readonly agentVersion = '2.0.0'; // Updated with LLM integration
  protected readonly scoringWeight = 1.5;

  protected readonly personality = `You are James, Chief Talent Officer of the Validation Council.

PERSONALITY TRAITS:
- Direct: You tell founders uncomfortable truths about their team.
- Execution-Focused: Ideas are cheap. Execution is everything. You assess ability to ship.
- Empathetic: You understand founder psychology and the emotional toll of startups.
- Pattern Recognition: You've seen what makes founding teams succeed or fail.

ANALYSIS FRAMEWORK:
1. Founder Background Deep Dive - Experience, track record, domain expertise
2. Skills Gap Analysis - What's missing for this specific venture?
3. Co-founder Dynamics - Solo founder risk, complementary skills
4. Execution Capability - Can they actually build and ship?
5. Team Culture Assessment - Values, commitment, resilience
6. Hiring Plan Evaluation - Do they know who they need?

SCORING CRITERIA (1-10):
- 9-10: Serial entrepreneurs with exits, complete skill coverage, proven execution
- 7-8: Strong relevant experience, 2+ founders, minor skill gaps
- 5-6: Some experience, solo founder or skill gaps, unproven execution
- 3-4: First-time founders, significant gaps, no domain expertise
- 1-2: Red flags in team, major skill gaps, execution concerns

Remember: The team is the number one predictor of startup success. A great team with a mediocre idea beats a mediocre team with a great idea.`;

  private teamAnalysis: TeamAnalysis | null = null;

  constructor(
    prisma: PrismaService,
    eventEmitter: EventEmitter2,
    @Optional() llm?: LLMService,
  ) {
    super(prisma, eventEmitter, llm);
  }

  protected buildAnalysisPrompt(input: AnalysisInput): string {
    return `Analyze the founding team for this startup:

STARTUP: ${input.idea.title}
DESCRIPTION: ${input.idea.description}
INDUSTRY: ${input.idea.industry || 'Not specified'}
BUSINESS MODEL: ${input.idea.businessModel || 'Not specified'}

TEAM DATA PROVIDED:
- Founder Count: ${input.founderData?.founderCount || 1}
- Team Size: ${input.founderData?.teamSize || 'Not specified'}
- Domain Experience: ${input.founderData?.domainYears ? `${input.founderData.domainYears} years` : 'Not specified'}
- Previous Startups: ${input.founderData?.previousStartups || 0}
- Team Skills: ${input.founderData?.teamSkills?.join(', ') || 'Not specified'}

Provide comprehensive team analysis including:
1. Founder background and relevant experience assessment
2. Skills coverage and gaps for this specific venture
3. Solo founder risk evaluation (if applicable)
4. Execution capability assessment
5. Domain expertise evaluation
6. Team recommendations and hiring priorities

Be direct about weaknesses. The team is the top predictor of success.`;
  }

  protected async performAnalysis(input: AnalysisInput): Promise<void> {
    this.logger.log('Starting team analysis');

    // Step 1: Analyze founder backgrounds
    await this.analyzeFounderBackgrounds(input);

    // Step 2: Identify skills gaps
    await this.identifySkillGaps(input);

    // Step 3: Assess domain expertise
    await this.assessDomainExpertise(input);

    // Step 4: Evaluate solo founder risk
    await this.evaluateSoloFounderRisk(input);

    // Step 5: Assess execution capability
    await this.assessExecutionCapability(input);

    // Step 6: Generate team recommendations
    await this.generateTeamRecommendations(input);

    this.buildRawAnalysis();
  }

  private async analyzeFounderBackgrounds(input: AnalysisInput): Promise<void> {
    const founderData = input.founderData || {};
    const founderCount = founderData.founderCount || 1;
    const teamSize = founderData.teamSize || founderCount;

    const hasCofounder = founderCount > 1;
    const linkedIns = founderData.founderLinkedIns || [];

    this.teamAnalysis = {
      founderCount,
      hasCofounder,
      teamSize,
      skillsCovered: [],
      skillGaps: [],
      executionScore: 5,
    };

    const citation = this.addCitation({
      claim: `Team consists of ${founderCount} founder(s) and ${teamSize} total members`,
      source: 'Team Analysis',
      sourceUrl: 'internal://james/team-analysis',
      confidence: linkedIns.length > 0 ? 0.85 : 0.5,
      dataType: linkedIns.length > 0 ? 'primary' : 'computed',
    });

    if (hasCofounder) {
      this.addFinding({
        title: 'Co-founder Team',
        description: `${founderCount} co-founders increases execution capacity and resilience`,
        type: 'strength',
        severity: 'major',
        evidence: [citation],
        confidence: 8,
      });
    }

    if (teamSize >= 3) {
      this.addFinding({
        title: 'Early Team Built',
        description: `${teamSize} team members shows ability to recruit and delegate`,
        type: 'strength',
        severity: 'minor',
        evidence: [citation],
        confidence: 7,
      });
    }
  }

  private async identifySkillGaps(input: AnalysisInput): Promise<void> {
    const businessModel = input.idea.businessModel?.toLowerCase() || 'saas';
    const founderData = input.founderData || {};

    // Required skills based on business model
    const requiredSkills: Record<string, string[]> = {
      saas: ['technical', 'product', 'sales', 'marketing'],
      marketplace: ['technical', 'operations', 'marketing', 'partnerships'],
      ecommerce: ['technical', 'operations', 'marketing', 'supply_chain'],
      default: ['technical', 'product', 'marketing'],
    };

    const needed = requiredSkills[businessModel] || requiredSkills.default;
    const covered = founderData.teamSkills || ['product'];
    const gaps = needed.filter(s => !covered.includes(s));

    if (this.teamAnalysis) {
      this.teamAnalysis.skillsCovered = covered;
      this.teamAnalysis.skillGaps = gaps;
    }

    const citation = this.addCitation({
      claim: `Skills assessment: ${covered.length} covered, ${gaps.length} gaps`,
      source: 'Skills Gap Analysis',
      sourceUrl: 'internal://james/skills-gap',
      confidence: founderData.teamSkills ? 0.8 : 0.5,
      dataType: 'computed',
    });

    if (gaps.length === 0) {
      this.addFinding({
        title: 'Complete Skill Coverage',
        description: 'Team covers all critical skills for this business model',
        type: 'strength',
        severity: 'major',
        evidence: [citation],
        confidence: 7,
      });
    } else if (gaps.length >= 2) {
      this.addFinding({
        title: 'Multiple Skills Gaps',
        description: `Missing critical skills: ${gaps.join(', ')}`,
        type: 'weakness',
        severity: 'major',
        evidence: [citation],
        confidence: 7,
      });

      this.addRisk({
        title: 'Execution Risk from Skills Gaps',
        description: `Team lacks ${gaps.join(' and ')} expertise`,
        category: 'execution',
        probability: 'medium',
        impact: 'major',
        mitigations: [
          'Hire for missing skills within 3 months',
          'Find advisors with relevant expertise',
          'Partner with complementary team',
        ],
        evidence: [citation],
      });
    }
  }

  private async assessDomainExpertise(input: AnalysisInput): Promise<void> {
    const industry = input.idea.industry || 'general';
    const founderData = input.founderData || {};
    const hasDomainExp = founderData.domainExperience || false;
    const domainYears = founderData.domainYears || 0;

    const citation = this.addCitation({
      claim: `${domainYears} years of domain experience in ${industry}`,
      source: 'Domain Expertise Analysis',
      sourceUrl: 'internal://james/domain-expertise',
      confidence: hasDomainExp ? 0.8 : 0.4,
      dataType: hasDomainExp ? 'primary' : 'computed',
    });

    if (domainYears >= 5) {
      this.addFinding({
        title: 'Strong Domain Expertise',
        description: `${domainYears}+ years in ${industry} provides deep market understanding`,
        type: 'strength',
        severity: 'major',
        evidence: [citation],
        confidence: 8,
      });
    } else if (domainYears === 0) {
      this.addFinding({
        title: 'No Domain Experience',
        description: `First-time in ${industry} increases learning curve and risk`,
        type: 'weakness',
        severity: 'major',
        evidence: [citation],
        confidence: 6,
      });

      this.addRecommendation({
        title: 'Gain Domain Expertise',
        description: 'Recruit advisor or team member with deep industry experience',
        priority: 'high',
        timeframe: 'short-term',
        effort: 'medium',
        impact: 'high',
      });
    }
  }

  private async evaluateSoloFounderRisk(input: AnalysisInput): Promise<void> {
    const founderCount = input.founderData?.founderCount || 1;

    if (founderCount === 1) {
      const citation = this.addCitation({
        claim: 'Solo founder startup - higher execution risk',
        source: 'Founder Risk Analysis',
        sourceUrl: 'internal://james/solo-founder-risk',
        confidence: 0.85,
        dataType: 'secondary',
      });

      this.addFinding({
        title: 'Solo Founder Risk',
        description: 'Single founder faces higher burnout risk and limited perspective',
        type: 'weakness',
        severity: 'major',
        evidence: [citation],
        confidence: 8,
      });

      this.addRisk({
        title: 'Key Person Dependency',
        description: 'All critical knowledge and relationships with single person',
        category: 'team',
        probability: 'medium',
        impact: 'critical',
        mitigations: [
          'Consider finding a co-founder',
          'Build strong advisory board',
          'Document processes early',
        ],
        evidence: [citation],
      });

      this.addRecommendation({
        title: 'Find Co-founder',
        description: 'Seek complementary co-founder to share burden and bring diverse perspective',
        priority: 'high',
        timeframe: 'medium-term',
        effort: 'high',
        impact: 'high',
      });
    }
  }

  private async assessExecutionCapability(input: AnalysisInput): Promise<void> {
    const founderData = input.founderData || {};
    let executionScore = 5;

    // Previous startup experience
    const previousStartups = founderData.previousStartups || 0;
    if (previousStartups > 0) executionScore += 1.5;
    if (previousStartups > 2) executionScore += 0.5;

    // Previous exits
    if (founderData.hasSuccessfulExit) executionScore += 1;

    // Technical capability
    if (founderData.canBuildMVP) executionScore += 1;

    // GTM experience
    if (founderData.hasGTMExperience) executionScore += 1;

    executionScore = Math.min(10, executionScore);

    if (this.teamAnalysis) {
      this.teamAnalysis.executionScore = executionScore;
    }

    const citation = this.addCitation({
      claim: `Execution capability score: ${executionScore.toFixed(1)}/10`,
      source: 'Execution Assessment',
      sourceUrl: 'internal://james/execution-score',
      confidence: previousStartups > 0 ? 0.8 : 0.5,
      dataType: 'computed',
    });

    if (executionScore >= 7) {
      this.addFinding({
        title: 'Strong Execution Capability',
        description: 'Team has demonstrated ability to execute on previous ventures',
        type: 'strength',
        severity: 'major',
        evidence: [citation],
        confidence: 8,
      });
    } else if (executionScore < 5) {
      this.addFinding({
        title: 'Unproven Execution',
        description: 'Limited track record of startup execution',
        type: 'weakness',
        severity: 'minor',
        evidence: [citation],
        confidence: 6,
      });
    }
  }

  private async generateTeamRecommendations(input: AnalysisInput): Promise<void> {
    const gaps = this.teamAnalysis?.skillGaps || [];

    for (const gap of gaps.slice(0, 2)) {
      this.addRecommendation({
        title: `Hire ${gap.charAt(0).toUpperCase() + gap.slice(1)} Expert`,
        description: `Recruit experienced ${gap} professional within next 3-6 months`,
        priority: 'high',
        timeframe: 'short-term',
        effort: 'high',
        impact: 'high',
      });
    }
  }

  private buildRawAnalysis(): void {
    const t = this.teamAnalysis;
    this.rawAnalysis = `
# James - Team Analysis Report

## Team Composition
- **Founders**: ${t?.founderCount || 1}
- **Total Team Size**: ${t?.teamSize || 1}
- **Has Co-founder**: ${t?.hasCofounder ? 'Yes' : 'No'}

## Skills Assessment
- **Skills Covered**: ${t?.skillsCovered.join(', ') || 'Unknown'}
- **Skills Gaps**: ${t?.skillGaps.join(', ') || 'None identified'}

## Execution Capability
- **Execution Score**: ${t?.executionScore.toFixed(1) || 'N/A'}/10

## Key Findings
${this.findings.map(f => `- **${f.title}**: ${f.description}`).join('\n')}

## Team Risks
${this.risks.map(r => `- **${r.title}** [${r.probability}/${r.impact}]: ${r.description}`).join('\n')}

## Recommendations
${this.recommendations.map(r => `- **${r.title}**: ${r.description}`).join('\n')}
    `.trim();
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
    const t = this.teamAnalysis;
    if (!t) return 5;

    let score = t.executionScore;

    // Adjust for skill gaps
    score -= t.skillGaps.length * 0.5;

    // Bonus for co-founder
    if (t.hasCofounder) score += 0.5;

    // Bonus for larger team
    if (t.teamSize >= 3) score += 0.3;

    return Math.max(1, Math.min(10, Math.round(score * 10) / 10));
  }
}
