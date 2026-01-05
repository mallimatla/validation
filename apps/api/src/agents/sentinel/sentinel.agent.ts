/**
 * Sentinel - Chief Trust & Audit Officer
 *
 * Purpose: Verifies citations, monitors agent accuracy, ensures accountability.
 * Personality: Skeptical, thorough, guardian of truth.
 * Scoring Weight: 0 (audit agent, does not contribute to validation score)
 *
 * Key Responsibilities:
 * 1. Verify all citations have valid sources
 * 2. Check for contradictions between agents
 * 3. Flag low-confidence claims
 * 4. Monitor agent accuracy over time
 * 5. Maintain audit trail integrity
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as crypto from 'crypto';

interface Citation {
  id: string;
  claim: string;
  source: string;
  sourceUrl: string;
  confidence: number;
  dataType: 'primary' | 'secondary' | 'computed';
  snapshotHash?: string;
}

interface AgentReport {
  agentId: string;
  agentName: string;
  version: string;
  score: number;
  citations: Citation[];
  findings: any[];
  rawAnalysis: string;
}

interface TrustIssue {
  type: 'unverified_citation' | 'low_confidence' | 'missing_source' | 'contradiction' | 'stale_data';
  severity: 'critical' | 'major' | 'minor';
  agentId: string;
  description: string;
  citationId?: string;
  recommendation: string;
}

interface AuditResult {
  validationId: string;
  trustScore: number;
  issuesFound: TrustIssue[];
  citationStats: {
    total: number;
    verified: number;
    unverified: number;
    lowConfidence: number;
  };
  agentAccuracyFlags: Record<string, string[]>;
  integrityHash: string;
  auditedAt: Date;
}

@Injectable()
export class SentinelAgent {
  private readonly logger = new Logger(SentinelAgent.name);

  readonly agentId = 'sentinel';
  readonly agentName = 'Sentinel';
  readonly agentVersion = '1.0.0';
  readonly scoringWeight = 0; // Audit agent doesn't contribute to score

  // Thresholds
  private readonly LOW_CONFIDENCE_THRESHOLD = 0.5;
  private readonly SCORE_DISAGREEMENT_THRESHOLD = 3;

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async audit(
    validationId: string,
    agentReports: AgentReport[]
  ): Promise<AuditResult> {
    this.logger.log(`Starting audit for validation ${validationId}`);

    const issues: TrustIssue[] = [];

    // Step 1: Audit all citations
    const citationStats = await this.auditCitations(agentReports, issues);

    // Step 2: Check for contradictions
    await this.checkContradictions(agentReports, issues);

    // Step 3: Flag low confidence claims
    await this.flagLowConfidence(agentReports, issues);

    // Step 4: Check agent accuracy history
    const agentAccuracyFlags = await this.checkAgentAccuracy(agentReports);

    // Step 5: Calculate trust score
    const trustScore = this.calculateTrustScore(citationStats, issues);

    // Step 6: Generate integrity hash
    const integrityHash = this.generateIntegrityHash(validationId, agentReports);

    const result: AuditResult = {
      validationId,
      trustScore,
      issuesFound: issues,
      citationStats,
      agentAccuracyFlags,
      integrityHash,
      auditedAt: new Date(),
    };

    // Save audit results
    await this.saveAuditResult(result);

    // Create audit event
    await this.createAuditEvent(validationId, result);

    this.logger.log(`Audit complete: trustScore=${trustScore}, issues=${issues.length}`);
    return result;
  }

  private async auditCitations(
    agentReports: AgentReport[],
    issues: TrustIssue[]
  ): Promise<AuditResult['citationStats']> {
    let total = 0;
    let verified = 0;
    let unverified = 0;
    let lowConfidence = 0;

    for (const report of agentReports) {
      for (const citation of report.citations) {
        total++;

        // Check if citation has source
        if (!citation.sourceUrl || citation.sourceUrl.startsWith('internal://')) {
          // Internal citations are computed, mark as verified if confidence is reasonable
          if (citation.confidence >= this.LOW_CONFIDENCE_THRESHOLD) {
            verified++;
          } else {
            lowConfidence++;
            issues.push({
              type: 'low_confidence',
              severity: 'minor',
              agentId: report.agentId,
              description: `Low confidence (${(citation.confidence * 100).toFixed(0)}%) on claim: "${citation.claim}"`,
              citationId: citation.id,
              recommendation: 'Gather more data to increase confidence',
            });
          }
        } else if (citation.snapshotHash) {
          // Has snapshot - considered verified
          verified++;
        } else {
          // External URL without snapshot
          unverified++;
          issues.push({
            type: 'unverified_citation',
            severity: 'minor',
            agentId: report.agentId,
            description: `Citation lacks snapshot: "${citation.claim}"`,
            citationId: citation.id,
            recommendation: 'Capture and store source snapshot',
          });
        }

        if (citation.confidence < this.LOW_CONFIDENCE_THRESHOLD) {
          lowConfidence++;
        }
      }
    }

    return { total, verified, unverified, lowConfidence };
  }

  private async checkContradictions(
    agentReports: AgentReport[],
    issues: TrustIssue[]
  ): Promise<void> {
    // Check for score disagreements
    const scores = agentReports
      .filter(r => r.score > 0)
      .map(r => ({ agentId: r.agentId, score: r.score }));

    if (scores.length >= 2) {
      const maxScore = Math.max(...scores.map(s => s.score));
      const minScore = Math.min(...scores.map(s => s.score));

      if (maxScore - minScore > this.SCORE_DISAGREEMENT_THRESHOLD) {
        const highAgent = scores.find(s => s.score === maxScore);
        const lowAgent = scores.find(s => s.score === minScore);

        issues.push({
          type: 'contradiction',
          severity: 'major',
          agentId: 'multiple',
          description: `Significant score disagreement: ${highAgent?.agentId} (${maxScore}) vs ${lowAgent?.agentId} (${minScore})`,
          recommendation: 'Review deliberation and reconcile viewpoints',
        });
      }
    }

    // Check for contradicting findings
    const allFindings = agentReports.flatMap(r =>
      r.findings.map(f => ({ ...f, agentId: r.agentId }))
    );

    // Look for opposite findings on same topic
    const findingsByTopic = new Map<string, any[]>();
    for (const finding of allFindings) {
      const topic = finding.title.toLowerCase().split(' ')[0]; // Simple topic extraction
      if (!findingsByTopic.has(topic)) {
        findingsByTopic.set(topic, []);
      }
      findingsByTopic.get(topic)!.push(finding);
    }

    for (const [topic, findings] of findingsByTopic) {
      const hasStrength = findings.some(f => f.type === 'strength');
      const hasWeakness = findings.some(f => f.type === 'weakness');

      if (hasStrength && hasWeakness) {
        const strengthAgent = findings.find(f => f.type === 'strength')?.agentId;
        const weaknessAgent = findings.find(f => f.type === 'weakness')?.agentId;

        if (strengthAgent !== weaknessAgent) {
          issues.push({
            type: 'contradiction',
            severity: 'minor',
            agentId: 'multiple',
            description: `Opposing views on "${topic}": ${strengthAgent} (strength) vs ${weaknessAgent} (weakness)`,
            recommendation: 'Different perspectives captured - review for nuance',
          });
        }
      }
    }
  }

  private async flagLowConfidence(
    agentReports: AgentReport[],
    issues: TrustIssue[]
  ): Promise<void> {
    for (const report of agentReports) {
      // Check findings confidence
      for (const finding of report.findings) {
        if (finding.confidence < 5) {
          issues.push({
            type: 'low_confidence',
            severity: finding.severity === 'critical' ? 'major' : 'minor',
            agentId: report.agentId,
            description: `Low confidence finding: "${finding.title}" (${finding.confidence}/10)`,
            recommendation: 'Gather additional evidence to support this finding',
          });
        }
      }
    }
  }

  private async checkAgentAccuracy(
    agentReports: AgentReport[]
  ): Promise<Record<string, string[]>> {
    const flags: Record<string, string[]> = {};

    for (const report of agentReports) {
      flags[report.agentId] = [];

      // Query historical accuracy
      const accuracyMetrics = await this.prisma.agentAccuracy.findFirst({
        where: { agentId: report.agentId },
        orderBy: { calculatedAt: 'desc' },
      });

      if (accuracyMetrics) {
        if (accuracyMetrics.accuracy != null && accuracyMetrics.accuracy < 0.6) {
          flags[report.agentId].push(
            `Historical accuracy below threshold: ${(accuracyMetrics.accuracy * 100).toFixed(0)}%`
          );
        }

        if (accuracyMetrics.totalPredictions != null && accuracyMetrics.totalPredictions < 10) {
          flags[report.agentId].push(
            `Limited prediction history: ${accuracyMetrics.totalPredictions} predictions`
          );
        }
      } else {
        flags[report.agentId].push('No historical accuracy data available');
      }
    }

    return flags;
  }

  private calculateTrustScore(
    citationStats: AuditResult['citationStats'],
    issues: TrustIssue[]
  ): number {
    let score = 10;

    // Deduct for unverified citations
    const unverifiedRatio = citationStats.total > 0
      ? citationStats.unverified / citationStats.total
      : 0;
    score -= unverifiedRatio * 2;

    // Deduct for low confidence
    const lowConfidenceRatio = citationStats.total > 0
      ? citationStats.lowConfidence / citationStats.total
      : 0;
    score -= lowConfidenceRatio * 1.5;

    // Deduct for issues
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const majorIssues = issues.filter(i => i.severity === 'major').length;
    const minorIssues = issues.filter(i => i.severity === 'minor').length;

    score -= criticalIssues * 2;
    score -= majorIssues * 1;
    score -= minorIssues * 0.3;

    return Math.max(1, Math.min(10, Math.round(score * 10) / 10));
  }

  private generateIntegrityHash(
    validationId: string,
    agentReports: AgentReport[]
  ): string {
    const content = JSON.stringify({
      validationId,
      reports: agentReports.map(r => ({
        agentId: r.agentId,
        version: r.version,
        score: r.score,
        citationCount: r.citations.length,
        findingCount: r.findings.length,
      })),
      timestamp: new Date().toISOString(),
    });

    return crypto.createHash('sha256').update(content).digest('hex');
  }

  private async saveAuditResult(result: AuditResult): Promise<void> {
    await this.prisma.auditEvent.create({
      data: {
        validationId: result.validationId,
        type: 'AUDIT_COMPLETED',
        agentId: this.agentId,
        metadata: {
          trustScore: result.trustScore,
          issueCount: result.issuesFound.length,
          citationStats: result.citationStats,
          integrityHash: result.integrityHash,
        },
        timestamp: result.auditedAt,
      },
    });

    // Update validation with trust score
    await this.prisma.validation.update({
      where: { id: result.validationId },
      data: {
        trustScore: result.trustScore,
        auditedAt: result.auditedAt,
      },
    });
  }

  private async createAuditEvent(
    validationId: string,
    result: AuditResult
  ): Promise<void> {
    // Emit event for monitoring
    this.eventEmitter.emit('audit.completed', {
      validationId,
      trustScore: result.trustScore,
      issueCount: result.issuesFound.length,
    });

    // Flag critical issues
    const criticalIssues = result.issuesFound.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      this.eventEmitter.emit('audit.critical_issues', {
        validationId,
        issues: criticalIssues,
      });
    }
  }

  /**
   * Verify a specific citation by checking its source
   */
  async verifyCitation(citationId: string): Promise<{
    verified: boolean;
    reason: string;
  }> {
    const citation = await this.prisma.citation.findUnique({
      where: { id: citationId },
      include: { snapshot: true },
    });

    if (!citation) {
      return { verified: false, reason: 'Citation not found' };
    }

    if (citation.snapshot) {
      // Has snapshot - verify hash
      const contentHash = crypto
        .createHash('sha256')
        .update(citation.snapshot.content)
        .digest('hex');

      if (contentHash === citation.snapshot.contentHash) {
        return { verified: true, reason: 'Snapshot verified' };
      } else {
        return { verified: false, reason: 'Snapshot hash mismatch' };
      }
    }

    if (citation.sourceUrl.startsWith('internal://')) {
      return { verified: true, reason: 'Internal computed citation' };
    }

    return { verified: false, reason: 'No snapshot available for external source' };
  }

  /**
   * Track a prediction for future accuracy measurement
   */
  async trackPrediction(
    validationId: string,
    agentId: string,
    predictionType: string,
    predictedValue: any,
    confidence: number
  ): Promise<string> {
    const prediction = await this.prisma.prediction.create({
      data: {
        validationId,
        agentId,
        predictionType,
        predictedValue,
        confidence,
        createdAt: new Date(),
      },
    });

    return prediction.id;
  }

  /**
   * Record actual outcome and update accuracy
   */
  async recordOutcome(
    predictionId: string,
    actualValue: any,
    wasAccurate: boolean
  ): Promise<void> {
    await this.prisma.prediction.update({
      where: { id: predictionId },
      data: {
        actualValue,
        wasAccurate,
        evaluatedAt: new Date(),
      },
    });

    // Get prediction to update agent accuracy
    const prediction = await this.prisma.prediction.findUnique({
      where: { id: predictionId },
    });

    if (prediction) {
      await this.updateAgentAccuracy(prediction.agentId);
    }
  }

  private async updateAgentAccuracy(agentId: string): Promise<void> {
    // Calculate overall accuracy for agent
    const predictions = await this.prisma.prediction.findMany({
      where: {
        agentId,
        wasAccurate: { not: null },
      },
    });

    if (predictions.length === 0) return;

    const accurateCount = predictions.filter((p: { wasAccurate: boolean | null }) => p.wasAccurate).length;
    const accuracy = accurateCount / predictions.length;

    await this.prisma.agentAccuracy.upsert({
      where: { agentId },
      create: {
        agentId,
        agentVersion: '1.0.0',
        metricType: 'overall',
        metricValue: accuracy,
        accuracy,
        totalPredictions: predictions.length,
        sampleSize: predictions.length,
        confidence: Math.min(1, predictions.length / 100),
        calculatedAt: new Date(),
      },
      update: {
        accuracy,
        metricValue: accuracy,
        totalPredictions: predictions.length,
        sampleSize: predictions.length,
        confidence: Math.min(1, predictions.length / 100),
        calculatedAt: new Date(),
      },
    });
  }
}
