/**
 * Quality Gate Service
 * Enforces quality standards for agent outputs
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface QualityCheckResult {
  checkId: string;
  checkName: string;
  passed: boolean;
  score: number;
  threshold: number;
  details: string;
  agentId?: string;
}

export interface QualityGateResult {
  passed: boolean;
  checks: QualityCheckResult[];
  failedChecks: string[];
  overallScore: number;
  recommendations: string[];
}

@Injectable()
export class QualityGateService {
  private readonly logger = new Logger(QualityGateService.name);

  private readonly MIN_CITATIONS_PER_AGENT = 3;
  private readonly MIN_TOTAL_CITATIONS = 15;
  private readonly MIN_CONFIDENCE = 5;
  private readonly MAX_EXECUTION_TIME_MS = 300000; // 5 minutes per agent

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Run all quality checks
   */
  async checkAll(validationId: string, agentResults: Map<string, any>): Promise<QualityGateResult> {
    const checks: QualityCheckResult[] = [];
    const recommendations: string[] = [];

    // Check 1: Citation requirements
    const citationCheck = this.checkCitationRequirements(agentResults);
    checks.push(citationCheck);
    if (!citationCheck.passed) {
      recommendations.push('Increase citation coverage - ensure all claims have sources');
    }

    // Check 2: Confidence levels
    const confidenceCheck = this.checkConfidenceLevels(agentResults);
    checks.push(confidenceCheck);
    if (!confidenceCheck.passed) {
      recommendations.push('Low confidence detected - consider requesting human review');
    }

    // Check 3: Agent coverage
    const coverageCheck = this.checkAgentCoverage(agentResults);
    checks.push(coverageCheck);
    if (!coverageCheck.passed) {
      recommendations.push('Some agents did not complete - results may be incomplete');
    }

    // Check 4: Execution time
    const timeCheck = this.checkExecutionTime(agentResults);
    checks.push(timeCheck);
    if (!timeCheck.passed) {
      recommendations.push('Slow execution detected - may indicate data source issues');
    }

    // Check 5: Finding consistency
    const consistencyCheck = this.checkFindingConsistency(agentResults);
    checks.push(consistencyCheck);
    if (!consistencyCheck.passed) {
      recommendations.push('Inconsistent findings detected - deliberation may be needed');
    }

    // Check 6: Risk coverage
    const riskCheck = this.checkRiskCoverage(agentResults);
    checks.push(riskCheck);
    if (!riskCheck.passed) {
      recommendations.push('Risk analysis may be incomplete');
    }

    const failedChecks = checks.filter(c => !c.passed).map(c => c.checkName);
    const overallScore = checks.reduce((sum, c) => sum + c.score, 0) / checks.length;

    // Gate passes if critical checks pass and overall score is above threshold
    const criticalChecksPassed = checks
      .filter(c => ['Citation Requirements', 'Agent Coverage'].includes(c.checkName))
      .every(c => c.passed);

    const passed = criticalChecksPassed && overallScore >= 0.7;

    // Log audit event
    await this.prisma.auditEvent.create({
      data: {
        validationId,
        eventType: passed ? 'quality_check_passed' : 'quality_check_failed',
        agentId: 'aria',
        data: {
          checks: checks.map(c => ({ name: c.checkName, passed: c.passed, score: c.score })),
          overallScore,
          failedChecks,
        },
        signature: `quality-${Date.now()}`,
      },
    });

    return { passed, checks, failedChecks, overallScore, recommendations };
  }

  /**
   * Check citation requirements
   */
  private checkCitationRequirements(agentResults: Map<string, any>): QualityCheckResult {
    let totalCitations = 0;
    let agentsWithEnoughCitations = 0;

    for (const [agentId, result] of agentResults) {
      const citationCount = result.citations?.length || result.citationCount || 0;
      totalCitations += citationCount;

      if (citationCount >= this.MIN_CITATIONS_PER_AGENT) {
        agentsWithEnoughCitations++;
      }
    }

    const agentCoverageScore = agentsWithEnoughCitations / Math.max(agentResults.size, 1);
    const totalCitationScore = Math.min(1, totalCitations / this.MIN_TOTAL_CITATIONS);
    const score = (agentCoverageScore + totalCitationScore) / 2;

    return {
      checkId: 'citations',
      checkName: 'Citation Requirements',
      passed: score >= 0.7,
      score,
      threshold: 0.7,
      details: `${totalCitations} total citations across ${agentsWithEnoughCitations}/${agentResults.size} agents meeting minimum`,
    };
  }

  /**
   * Check confidence levels
   */
  private checkConfidenceLevels(agentResults: Map<string, any>): QualityCheckResult {
    const confidences: number[] = [];

    for (const result of agentResults.values()) {
      if (typeof result.confidence === 'number') {
        confidences.push(result.confidence);
      }
    }

    if (confidences.length === 0) {
      return {
        checkId: 'confidence',
        checkName: 'Confidence Levels',
        passed: false,
        score: 0,
        threshold: 0.6,
        details: 'No confidence scores available',
      };
    }

    const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
    const normalizedScore = avgConfidence / 10;
    const lowConfidenceCount = confidences.filter(c => c < this.MIN_CONFIDENCE).length;

    return {
      checkId: 'confidence',
      checkName: 'Confidence Levels',
      passed: avgConfidence >= this.MIN_CONFIDENCE && lowConfidenceCount === 0,
      score: normalizedScore,
      threshold: 0.6,
      details: `Average confidence: ${avgConfidence.toFixed(1)}/10, ${lowConfidenceCount} agents below threshold`,
    };
  }

  /**
   * Check agent coverage
   */
  private checkAgentCoverage(agentResults: Map<string, any>): QualityCheckResult {
    const expectedAgents = ['marcus', 'sophia', 'david', 'elena', 'james', 'rachel', 'omar', 'nora'];
    const completedAgents = Array.from(agentResults.keys());
    const failedAgents = Array.from(agentResults.values()).filter(r => r.failed).length;

    const coverageScore = completedAgents.length / expectedAgents.length;
    const successRate = (completedAgents.length - failedAgents) / Math.max(completedAgents.length, 1);
    const score = (coverageScore + successRate) / 2;

    return {
      checkId: 'coverage',
      checkName: 'Agent Coverage',
      passed: score >= 0.8,
      score,
      threshold: 0.8,
      details: `${completedAgents.length}/${expectedAgents.length} agents completed, ${failedAgents} failed`,
    };
  }

  /**
   * Check execution time
   */
  private checkExecutionTime(agentResults: Map<string, any>): QualityCheckResult {
    let slowAgents = 0;
    let totalTime = 0;

    for (const result of agentResults.values()) {
      const execTime = result.executionTimeMs || 0;
      totalTime += execTime;

      if (execTime > this.MAX_EXECUTION_TIME_MS) {
        slowAgents++;
      }
    }

    const avgTime = totalTime / Math.max(agentResults.size, 1);
    const score = 1 - (slowAgents / Math.max(agentResults.size, 1));

    return {
      checkId: 'execution_time',
      checkName: 'Execution Time',
      passed: slowAgents === 0,
      score,
      threshold: 0.9,
      details: `Average: ${(avgTime / 1000).toFixed(1)}s, ${slowAgents} agents exceeded time limit`,
    };
  }

  /**
   * Check finding consistency
   */
  private checkFindingConsistency(agentResults: Map<string, any>): QualityCheckResult {
    const allFindings: any[] = [];

    for (const result of agentResults.values()) {
      if (result.findings) {
        allFindings.push(...result.findings);
      }
    }

    const strengths = allFindings.filter(f => f.type === 'strength').length;
    const weaknesses = allFindings.filter(f => f.type === 'weakness').length;
    const total = allFindings.length;

    // Check for reasonable distribution
    const hasFindings = total >= 5;
    const hasBalance = strengths > 0 && weaknesses > 0;
    const notExtreme = strengths / Math.max(total, 1) > 0.1 && weaknesses / Math.max(total, 1) > 0.1;

    const score = (hasFindings ? 0.4 : 0) + (hasBalance ? 0.3 : 0) + (notExtreme ? 0.3 : 0);

    return {
      checkId: 'consistency',
      checkName: 'Finding Consistency',
      passed: score >= 0.7,
      score,
      threshold: 0.7,
      details: `${total} findings: ${strengths} strengths, ${weaknesses} weaknesses`,
    };
  }

  /**
   * Check risk coverage
   */
  private checkRiskCoverage(agentResults: Map<string, any>): QualityCheckResult {
    const riskCategories = new Set<string>();
    let totalRisks = 0;

    for (const result of agentResults.values()) {
      if (result.risks) {
        for (const risk of result.risks) {
          riskCategories.add(risk.category || 'general');
          totalRisks++;
        }
      }
    }

    const expectedCategories = ['market', 'competition', 'financial', 'execution', 'legal', 'technical'];
    const coverageScore = riskCategories.size / expectedCategories.length;
    const countScore = Math.min(1, totalRisks / 10);
    const score = (coverageScore + countScore) / 2;

    return {
      checkId: 'risk_coverage',
      checkName: 'Risk Coverage',
      passed: score >= 0.5,
      score,
      threshold: 0.5,
      details: `${totalRisks} risks across ${riskCategories.size} categories`,
    };
  }
}
