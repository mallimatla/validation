/**
 * James - Chief Talent Officer
 *
 * Purpose: Evaluates founding team capability and execution risk.
 * Personality: Direct, execution-focused, cares about founder psychology.
 * Scoring Weight: 1.5x
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
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
  protected readonly agentVersion = '1.0.0';
  protected readonly scoringWeight = 1.5;

  private teamAnalysis: TeamAnalysis | null = null;

  constructor(prisma: PrismaService, eventEmitter: EventEmitter2) {
    super(prisma, eventEmitter);
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
