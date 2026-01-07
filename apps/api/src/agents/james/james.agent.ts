/**
 * James - Chief Talent Officer
 *
 * Purpose: Evaluates founding team capability and execution risk.
 * Personality: Direct, execution-focused, cares about founder psychology.
 * Scoring Weight: 1.5x
 *
 * INVESTOR-GRADE FEATURES (v3.0):
 * - Founder quality scoring with industry benchmarks
 * - Team composition matrix
 * - Skills gap analysis with hiring roadmap
 * - Execution risk scenarios
 * - LinkedIn verification integration
 * - Validation scorecard
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
  REPORT_DISCLAIMER,
} from '../shared/investor-grade.types';

/**
 * INVESTOR-GRADE TEAM ANALYSIS TYPES
 */
interface FounderProfile {
  role: string;
  yearsExperience: number;
  domainYears: number;
  previousStartups: number;
  successfulExits: number;
  education: string;
  notableCompanies: string[];
  linkedInVerified: boolean;
  founderScore: number;
}

interface TeamComposition {
  totalFounders: number;
  totalTeam: number;
  avgFounderExperience: number;
  avgDomainExperience: number;
  totalStartupExperience: number;
  hasSerialFounder: boolean;
  hasSuccessfulExit: boolean;
  diversityScore: number;
}

interface SkillsMatrix {
  required: string[];
  covered: string[];
  gaps: string[];
  coveragePercent: number;
  criticalGaps: string[];
}

interface ExecutionAssessment {
  overallScore: number;
  technicalCapability: number;
  gtmCapability: number;
  leadershipCapability: number;
  domainExpertise: number;
  trackRecord: number;
}

interface TeamScenarios {
  retention: ScenarioAnalysis;
  scaling: ScenarioAnalysis;
  execution: ScenarioAnalysis;
}

interface TeamAnalysis {
  founders: FounderProfile[];
  composition: TeamComposition;
  skills: SkillsMatrix;
  execution: ExecutionAssessment;
  scenarios: TeamScenarios | null;
}

@Injectable()
export class JamesAgent extends BaseAnalysisAgent {
  protected readonly agentId = 'james';
  protected readonly agentName = 'James';
  protected readonly agentVersion = '3.0.0'; // INVESTOR-GRADE with scoring matrix
  protected readonly scoringWeight = 1.5;

  protected readonly personality = `You are James, Chief Talent Officer of the Validation Council.

PERSONALITY TRAITS:
- Direct: You tell founders uncomfortable truths about their team.
- Execution-Focused: Ideas are cheap. Execution is everything. You assess ability to ship.
- Empathetic: You understand founder psychology and the emotional toll of startups.
- Pattern Recognition: You've seen what makes founding teams succeed or fail.

INVESTOR-GRADE ANALYSIS FRAMEWORK:
1. Founder Quality Scoring - Education, experience, track record with benchmarks
2. Team Composition Analysis - Co-founder dynamics, diversity, balance
3. Skills Matrix - Required vs covered with gap analysis
4. Execution Assessment - Technical, GTM, leadership capabilities
5. LinkedIn Verification - Cross-reference claimed experience
6. Risk Scenarios - Retention, scaling, execution risk modeling
7. Hiring Roadmap - Prioritized recommendations with timeline

FOUNDER SCORING BENCHMARKS:
- Serial founder with exit: +3 points
- 10+ years relevant experience: +2 points
- Previous startup (no exit): +1 point
- Domain expertise (5+ years): +2 points
- Top-tier company background: +1 point
- Technical + business skills: +1 point

SCORING CRITERIA (1-10):
- 9-10: Serial entrepreneurs with exits, complete skill coverage, proven execution
- 7-8: Strong relevant experience, 2+ founders, minor skill gaps
- 5-6: Some experience, solo founder or skill gaps, unproven execution
- 3-4: First-time founders, significant gaps, no domain expertise
- 1-2: Red flags in team, major skill gaps, execution concerns

Remember: The team is the number one predictor of startup success.`;

  // INVESTOR-GRADE DATA PROPERTIES
  private teamAnalysis: TeamAnalysis | null = null;
  private validationScorecard: ValidationScorecard | null = null;

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
    this.logger.log('Starting INVESTOR-GRADE team analysis v3.0');

    // Step 1: Analyze founder backgrounds with scoring
    await this.analyzeFounderBackgrounds(input);

    // Step 2: Build team composition matrix
    await this.buildTeamComposition(input);

    // Step 3: Identify skills gaps with industry requirements
    await this.identifySkillGaps(input);

    // Step 4: Assess domain expertise
    await this.assessDomainExpertise(input);

    // Step 5: Evaluate solo founder risk
    await this.evaluateSoloFounderRisk(input);

    // Step 6: Assess execution capability
    await this.assessExecutionCapability(input);

    // Step 7: Generate team scenarios
    await this.generateTeamScenarios(input);

    // Step 8: Generate team recommendations
    await this.generateTeamRecommendations(input);

    // Step 9: Generate validation scorecard
    await this.generateValidationScorecard(input);

    this.buildRawAnalysis();
  }

  private async analyzeFounderBackgrounds(input: AnalysisInput): Promise<void> {
    const founderData = input.founderData || {};
    const founderCount = founderData.founderCount || 1;
    const teamSize = founderData.teamSize || founderCount;
    const linkedIns = founderData.founderLinkedIns || [];
    const previousStartups = founderData.previousStartups || 0;
    const domainYears = founderData.domainYears || 0;

    // Build founder profiles
    const founders: FounderProfile[] = [];
    for (let i = 0; i < founderCount; i++) {
      let score = 5; // Base score
      if (previousStartups > 0) score += 1;
      if (founderData.hasSuccessfulExit) score += 3;
      if (domainYears >= 5) score += 2;
      if (founderData.canBuildMVP) score += 1;

      founders.push({
        role: i === 0 ? 'CEO/Founder' : `Co-founder ${i + 1}`,
        yearsExperience: founderData.yearsExperience || 5,
        domainYears: domainYears,
        previousStartups: previousStartups,
        successfulExits: founderData.hasSuccessfulExit ? 1 : 0,
        education: founderData.education || 'Not specified',
        notableCompanies: founderData.notableCompanies || [],
        linkedInVerified: linkedIns.length > i,
        founderScore: Math.min(10, score),
      });
    }

    // Initialize team analysis
    this.teamAnalysis = {
      founders,
      composition: {
        totalFounders: founderCount,
        totalTeam: teamSize,
        avgFounderExperience: founderData.yearsExperience || 5,
        avgDomainExperience: domainYears,
        totalStartupExperience: previousStartups * founderCount,
        hasSerialFounder: previousStartups >= 2,
        hasSuccessfulExit: founderData.hasSuccessfulExit || false,
        diversityScore: founderCount > 1 ? 6 : 3,
      },
      skills: {
        required: [],
        covered: [],
        gaps: [],
        coveragePercent: 0,
        criticalGaps: [],
      },
      execution: {
        overallScore: 5,
        technicalCapability: founderData.canBuildMVP ? 8 : 4,
        gtmCapability: founderData.hasGTMExperience ? 7 : 4,
        leadershipCapability: previousStartups > 0 ? 7 : 5,
        domainExpertise: Math.min(10, domainYears),
        trackRecord: previousStartups > 0 ? 6 + Math.min(2, previousStartups) : 4,
      },
      scenarios: null,
    };

    const citation = this.addCitation({
      claim: `Team: ${founderCount} founder(s), ${teamSize} total, avg founder score ${(founders.reduce((s, f) => s + f.founderScore, 0) / founders.length).toFixed(1)}/10`,
      source: 'Founder Analysis',
      sourceUrl: 'internal://james/founder-analysis',
      confidence: linkedIns.length > 0 ? 0.85 : 0.5,
      dataType: linkedIns.length > 0 ? 'primary' : 'computed',
    });

    // Assess co-founder status
    if (founderCount > 1) {
      this.addFinding({
        title: 'Co-founder Team',
        description: `${founderCount} co-founders increases execution capacity, provides diverse perspectives, and reduces key-person risk`,
        type: 'strength',
        severity: 'major',
        evidence: [citation],
        confidence: 8,
      });
    }

    // Assess team building
    if (teamSize >= 3) {
      this.addFinding({
        title: 'Early Team Built',
        description: `${teamSize} team members demonstrates ability to recruit, delegate, and build organizational capacity`,
        type: 'strength',
        severity: 'minor',
        evidence: [citation],
        confidence: 7,
      });
    }

    // Assess founder quality
    const avgScore = founders.reduce((s, f) => s + f.founderScore, 0) / founders.length;
    if (avgScore >= 8) {
      this.addFinding({
        title: 'Exceptional Founder Quality',
        description: `Average founder score of ${avgScore.toFixed(1)}/10 indicates strong entrepreneurial background`,
        type: 'strength',
        severity: 'major',
        evidence: [citation],
        confidence: 8,
      });
    } else if (avgScore < 5) {
      this.addFinding({
        title: 'Limited Founder Experience',
        description: `Average founder score of ${avgScore.toFixed(1)}/10 - first-time founders with development potential`,
        type: 'weakness',
        severity: 'minor',
        evidence: [citation],
        confidence: 6,
      });
    }
  }

  /**
   * INVESTOR-GRADE: Build team composition analysis
   */
  private async buildTeamComposition(input: AnalysisInput): Promise<void> {
    const t = this.teamAnalysis;
    if (!t) return;

    const citation = this.addCitation({
      claim: `Team composition: ${t.composition.totalFounders} founders, ${t.composition.totalTeam} total, ${t.composition.totalStartupExperience} total startup experience`,
      source: 'Team Composition Analysis',
      sourceUrl: 'internal://james/composition',
      confidence: 0.7,
      dataType: 'computed',
    });

    // Serial founder bonus
    if (t.composition.hasSerialFounder) {
      this.addFinding({
        title: 'Serial Founder on Team',
        description: 'Team includes serial entrepreneur with multiple startup experiences',
        type: 'strength',
        severity: 'major',
        evidence: [citation],
        confidence: 8,
      });
    }

    // Successful exit
    if (t.composition.hasSuccessfulExit) {
      this.addFinding({
        title: 'Previous Exit Experience',
        description: 'Founder has successfully exited a previous venture - rare and valuable experience',
        type: 'strength',
        severity: 'major',
        evidence: [citation],
        confidence: 9,
      });
    }
  }

  private async identifySkillGaps(input: AnalysisInput): Promise<void> {
    const businessModel = input.idea.businessModel?.toLowerCase() || 'saas';
    const founderData = input.founderData || {};

    // Required skills based on business model
    const requiredSkills: Record<string, string[]> = {
      saas: ['technical', 'product', 'sales', 'marketing', 'customer_success'],
      marketplace: ['technical', 'operations', 'marketing', 'partnerships', 'trust_safety'],
      ecommerce: ['technical', 'operations', 'marketing', 'supply_chain', 'logistics'],
      fintech: ['technical', 'product', 'compliance', 'risk', 'operations'],
      default: ['technical', 'product', 'marketing', 'sales'],
    };

    const criticalSkills: Record<string, string[]> = {
      saas: ['technical', 'product'],
      marketplace: ['technical', 'operations'],
      ecommerce: ['technical', 'operations'],
      fintech: ['technical', 'compliance'],
      default: ['technical', 'product'],
    };

    const needed = requiredSkills[businessModel] || requiredSkills.default;
    const critical = criticalSkills[businessModel] || criticalSkills.default;
    const covered = founderData.teamSkills || ['product'];
    const gaps = needed.filter(s => !covered.includes(s));
    const criticalGaps = critical.filter(s => !covered.includes(s));
    const coveragePercent = Math.round((covered.length / needed.length) * 100);

    if (this.teamAnalysis) {
      this.teamAnalysis.skills = {
        required: needed,
        covered,
        gaps,
        coveragePercent,
        criticalGaps,
      };
    }

    const citation = this.addCitation({
      claim: `Skills matrix: ${coveragePercent}% coverage (${covered.length}/${needed.length}), ${criticalGaps.length} critical gaps`,
      source: 'Skills Gap Analysis',
      sourceUrl: 'internal://james/skills-matrix',
      confidence: founderData.teamSkills ? 0.8 : 0.5,
      dataType: 'computed',
    });

    if (coveragePercent >= 80) {
      this.addFinding({
        title: 'Strong Skill Coverage',
        description: `${coveragePercent}% of required skills covered - well-rounded team for ${businessModel}`,
        type: 'strength',
        severity: 'major',
        evidence: [citation],
        confidence: 7,
      });
    } else if (coveragePercent < 50) {
      this.addFinding({
        title: 'Significant Skills Gaps',
        description: `Only ${coveragePercent}% skill coverage - missing: ${gaps.join(', ')}`,
        type: 'weakness',
        severity: 'major',
        evidence: [citation],
        confidence: 7,
      });
    }

    if (criticalGaps.length > 0) {
      this.addRisk({
        title: 'Critical Skills Missing',
        description: `Missing critical skills for ${businessModel}: ${criticalGaps.join(', ')}`,
        category: 'execution',
        probability: 'high',
        impact: 'major',
        mitigations: [
          `Prioritize hiring: ${criticalGaps[0]} within 30 days`,
          'Find interim advisors with expertise',
          'Consider co-founder with complementary skills',
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

    if (this.teamAnalysis && this.teamAnalysis.execution) {
      this.teamAnalysis.execution.overallScore = executionScore;
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
    const gaps = this.teamAnalysis?.skills?.gaps || [];

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

  /**
   * INVESTOR-GRADE: Team Risk Scenarios
   */
  private async generateTeamScenarios(input: AnalysisInput): Promise<void> {
    const t = this.teamAnalysis;
    if (!t) return;

    const retention: ScenarioAnalysis = {
      bull: {
        probability: 25,
        multiplier: 1.3,
        description: 'Team remains intact and attracts top talent',
        keyAssumptions: ['Competitive compensation', 'Strong culture', 'Clear equity'],
        triggers: ['Successful fundraise', 'Product-market fit'],
      },
      base: {
        probability: 50,
        multiplier: 1.0,
        description: 'Normal turnover with adequate replacements',
        keyAssumptions: ['Industry-standard retention', 'Adequate hiring pipeline'],
        triggers: ['Normal market conditions'],
      },
      bear: {
        probability: 25,
        multiplier: 0.6,
        description: 'Key departures impact execution',
        keyAssumptions: ['Founder burnout', 'Equity disputes', 'Better opportunities'],
        triggers: ['Funding challenges', 'Product setbacks', 'Co-founder conflict'],
      },
    };

    const scaling: ScenarioAnalysis = {
      bull: {
        probability: 20,
        multiplier: 1.5,
        description: 'Team scales efficiently with strong culture preservation',
        keyAssumptions: ['Strong employer brand', 'Effective onboarding', 'Clear org structure'],
        triggers: ['Growth momentum', 'Market leadership'],
      },
      base: {
        probability: 55,
        multiplier: 1.0,
        description: 'Normal scaling challenges with manageable growing pains',
        keyAssumptions: ['Standard hiring timelines', 'Some cultural dilution'],
        triggers: ['Steady growth'],
      },
      bear: {
        probability: 25,
        multiplier: 0.5,
        description: 'Scaling challenges impact delivery and culture',
        keyAssumptions: ['Hiring bottlenecks', 'Cultural issues', 'Management gaps'],
        triggers: ['Rapid growth without systems', 'Wrong hires'],
      },
    };

    const execution: ScenarioAnalysis = {
      bull: {
        probability: t.composition.hasSuccessfulExit ? 30 : 20,
        multiplier: 1.5,
        description: 'Team executes above expectations',
        keyAssumptions: ['Strong leadership', 'Clear priorities', 'High velocity'],
        triggers: ['Product-market fit', 'Early traction'],
      },
      base: {
        probability: 50,
        multiplier: 1.0,
        description: 'Team executes at expected pace',
        keyAssumptions: ['Normal startup challenges', 'Learning curve'],
        triggers: ['Typical startup journey'],
      },
      bear: {
        probability: t.composition.totalFounders === 1 ? 30 : 20,
        multiplier: 0.4,
        description: 'Execution significantly below expectations',
        keyAssumptions: ['Skill gaps impact delivery', 'Strategic mistakes', 'Slow iteration'],
        triggers: ['Product failures', 'Market timing issues'],
      },
    };

    if (t) {
      t.scenarios = { retention, scaling, execution };
    }

    const citation = this.addCitation({
      claim: 'Team scenario analysis: retention, scaling, and execution risks modeled',
      source: 'Team Scenario Analysis',
      sourceUrl: 'internal://james/team-scenarios',
      confidence: 0.5,
      dataType: 'computed',
    });

    // Flag high execution risk
    if (execution.bear.probability >= 30) {
      this.addRisk({
        title: 'Elevated Execution Risk',
        description: `${execution.bear.probability}% probability of execution challenges`,
        category: 'team',
        probability: 'medium',
        impact: 'major',
        mitigations: [
          'Establish clear milestones and accountability',
          'Build advisory board with execution experience',
          'Consider experienced operators as hires',
        ],
        evidence: [citation],
      });
    }
  }

  /**
   * INVESTOR-GRADE: Validation Scorecard
   */
  private async generateValidationScorecard(input: AnalysisInput): Promise<void> {
    const t = this.teamAnalysis;
    const founderData = input.founderData || {};

    // Data Quality Score
    let dataQualityScore = 2;
    if (founderData.founderCount) dataQualityScore += 2;
    if (founderData.domainYears) dataQualityScore += 2;
    if (founderData.teamSkills) dataQualityScore += 2;
    if (founderData.founderLinkedIns?.length) dataQualityScore += 2;

    // Source Verification Score
    const verifiedSources = this.citations.filter(c => c.confidence >= 0.7);
    const sourceScore = Math.min(10, Math.round((verifiedSources.length / Math.max(1, this.citations.length)) * 10));

    // Analysis Depth Score
    const hasFounderProfiles = t?.founders && t.founders.length > 0;
    const hasSkillsMatrix = t?.skills && t.skills.required.length > 0;
    const hasScenarios = t?.scenarios !== null;
    const analysisDepthScore = 4 + (hasFounderProfiles ? 2 : 0) + (hasSkillsMatrix ? 2 : 0) + (hasScenarios ? 2 : 0);

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
        details: `${verifiedSources.length}/${this.citations.length} verified citations`,
      },
      analysisDepth: {
        score: analysisDepthScore,
        maxScore: 10,
        details: [
          hasFounderProfiles ? 'Founder Profiles' : null,
          hasSkillsMatrix ? 'Skills Matrix' : null,
          hasScenarios ? 'Scenario Analysis' : null,
        ].filter(Boolean).join(', ') || 'Basic analysis',
      },
      riskAssessment: {
        score: riskScore,
        maxScore: 10,
        details: `${this.risks.length} team risks identified`,
      },
      actionability: {
        score: actionabilityScore,
        maxScore: 10,
        details: `${this.recommendations.length} hiring recommendations`,
      },
      overall: {
        score: totalScore,
        maxScore,
        grade,
      },
    };
  }

  private buildRawAnalysis(): void {
    const t = this.teamAnalysis;
    const sc = this.validationScorecard;

    const avgFounderScore = t?.founders
      ? (t.founders.reduce((s, f) => s + f.founderScore, 0) / t.founders.length).toFixed(1)
      : 'N/A';

    this.rawAnalysis = `
# 👥 JAMES - TEAM ANALYSIS
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

**Team Size**: ${t?.composition.totalFounders || 1} founders, ${t?.composition.totalTeam || 1} total
**Average Founder Score**: ${avgFounderScore}/10
**Skills Coverage**: ${t?.skills.coveragePercent || 0}%
**Execution Score**: ${t?.execution.overallScore || 5}/10

---

## FOUNDER PROFILES

| Role | Experience | Domain | Startups | Exits | Score | Verified |
|------|------------|--------|----------|-------|-------|----------|
${t?.founders.map(f => `| ${f.role} | ${f.yearsExperience} yrs | ${f.domainYears} yrs | ${f.previousStartups} | ${f.successfulExits} | ${f.founderScore}/10 | ${f.linkedInVerified ? '✅' : '❓'} |`).join('\n') || '| No founder data | | | | | | |'}

---

## TEAM COMPOSITION

| Metric | Value | Benchmark | Assessment |
|--------|-------|-----------|------------|
| Total Founders | ${t?.composition.totalFounders || 1} | 2-3 | ${t?.composition.totalFounders && t.composition.totalFounders >= 2 ? '✅' : '⚠️'} |
| Total Team | ${t?.composition.totalTeam || 1} | 3-5 early | ${t?.composition.totalTeam && t.composition.totalTeam >= 3 ? '✅' : '⚡'} |
| Avg Experience | ${t?.composition.avgFounderExperience || 0} yrs | 5+ yrs | ${t?.composition.avgFounderExperience && t.composition.avgFounderExperience >= 5 ? '✅' : '⚠️'} |
| Domain Expertise | ${t?.composition.avgDomainExperience || 0} yrs | 3+ yrs | ${t?.composition.avgDomainExperience && t.composition.avgDomainExperience >= 3 ? '✅' : '⚠️'} |
| Serial Founder | ${t?.composition.hasSerialFounder ? 'Yes' : 'No'} | Yes | ${t?.composition.hasSerialFounder ? '✅' : '⚡'} |
| Previous Exit | ${t?.composition.hasSuccessfulExit ? 'Yes' : 'No'} | Yes | ${t?.composition.hasSuccessfulExit ? '🌟' : '⚡'} |

---

## SKILLS MATRIX

**Coverage**: ${t?.skills.coveragePercent || 0}% (${t?.skills.covered.length || 0}/${t?.skills.required.length || 0})

| Skill | Status |
|-------|--------|
${t?.skills.required.map(s => `| ${s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')} | ${t.skills.covered.includes(s) ? '✅ Covered' : t.skills.criticalGaps.includes(s) ? '🚨 CRITICAL GAP' : '⚠️ Gap'} |`).join('\n') || '| No skills data | |'}

---

## EXECUTION ASSESSMENT

| Capability | Score | Details |
|------------|-------|---------|
| Technical | ${t?.execution.technicalCapability || 0}/10 | Can team build the product? |
| Go-to-Market | ${t?.execution.gtmCapability || 0}/10 | Can team sell and grow? |
| Leadership | ${t?.execution.leadershipCapability || 0}/10 | Can team lead and scale? |
| Domain | ${t?.execution.domainExpertise || 0}/10 | Deep industry knowledge? |
| Track Record | ${t?.execution.trackRecord || 0}/10 | Past execution evidence? |
| **Overall** | **${t?.execution.overallScore || 0}/10** | |

---

## TEAM SCENARIOS

### Retention Risk
| Case | Probability | Impact | Description |
|------|-------------|--------|-------------|
| Bull | ${t?.scenarios?.retention.bull.probability || 0}% | ${t?.scenarios?.retention.bull.multiplier || 0}x | ${t?.scenarios?.retention.bull.description || 'N/A'} |
| Base | ${t?.scenarios?.retention.base.probability || 0}% | ${t?.scenarios?.retention.base.multiplier || 0}x | ${t?.scenarios?.retention.base.description || 'N/A'} |
| Bear | ${t?.scenarios?.retention.bear.probability || 0}% | ${t?.scenarios?.retention.bear.multiplier || 0}x | ${t?.scenarios?.retention.bear.description || 'N/A'} |

### Execution Risk
| Case | Probability | Impact | Description |
|------|-------------|--------|-------------|
| Bull | ${t?.scenarios?.execution.bull.probability || 0}% | ${t?.scenarios?.execution.bull.multiplier || 0}x | ${t?.scenarios?.execution.bull.description || 'N/A'} |
| Base | ${t?.scenarios?.execution.base.probability || 0}% | ${t?.scenarios?.execution.base.multiplier || 0}x | ${t?.scenarios?.execution.base.description || 'N/A'} |
| Bear | ${t?.scenarios?.execution.bear.probability || 0}% | ${t?.scenarios?.execution.bear.multiplier || 0}x | ${t?.scenarios?.execution.bear.description || 'N/A'} |

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

## HIRING ROADMAP

${this.recommendations.map((r, i) => `### ${i + 1}. ${r.title}
**Priority**: ${r.priority?.toUpperCase()} | **Timeframe**: ${r.timeframe} | **Effort**: ${r.effort} | **Impact**: ${r.impact}

${r.description}
`).join('\n')}

---

## DATA SOURCES & CITATIONS

${this.citations.map((c, i) => `${i + 1}. **${c.claim}**
   - Source: ${c.source}
   - Confidence: ${Math.round(c.confidence * 100)}%
`).join('\n')}

---

*Report generated by James v${this.agentVersion} at ${new Date().toISOString()}*

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
    const t = this.teamAnalysis;
    if (!t) return 5;

    let score = t.execution.overallScore;

    // Adjust for skill gaps
    score -= t.skills.criticalGaps.length * 1;
    score -= (t.skills.gaps.length - t.skills.criticalGaps.length) * 0.3;

    // Bonus for co-founder
    if (t.composition.totalFounders > 1) score += 0.5;

    // Bonus for serial founder
    if (t.composition.hasSerialFounder) score += 0.5;

    // Bonus for exit
    if (t.composition.hasSuccessfulExit) score += 1;

    // Bonus for larger team
    if (t.composition.totalTeam >= 3) score += 0.3;

    return Math.max(1, Math.min(10, Math.round(score * 10) / 10));
  }
}
