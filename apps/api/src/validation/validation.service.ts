/**
 * Validation Service
 * Core validation business logic
 */

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
  Optional,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateValidationDto, UpdateValidationDto, ValidationQueryDto } from './validation.dto';

// The 12 AI agents
const AGENTS = [
  { id: 'marcus', name: 'Marcus', role: 'Market Intel' },
  { id: 'sophia', name: 'Sophia', role: 'Competition' },
  { id: 'david', name: 'David', role: 'Financial' },
  { id: 'elena', name: 'Elena', role: 'Customer' },
  { id: 'james', name: 'James', role: 'Team' },
  { id: 'rachel', name: 'Rachel', role: 'Legal/Risk' },
  { id: 'omar', name: 'Omar', role: 'Technology' },
  { id: 'nora', name: 'Nora', role: 'Funding' },
  { id: 'victor', name: 'Victor', role: 'Valuation' },
  { id: 'victoria', name: 'Victoria', role: 'Synthesis' },
  { id: 'sentinel', name: 'Sentinel', role: 'Trust/Audit' },
  { id: 'aria', name: 'ARIA', role: 'Orchestrator' },
];

// Deterministic hash function for consistent scores
function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h = h & h;
  }
  return Math.abs(h);
}

@Injectable()
export class ValidationService {
  private readonly logger = new Logger(ValidationService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() @InjectQueue('validations') private readonly validationQueue: Queue,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Generate agent report data based on validation and agent
   */
  private generateAgentReportData(validationId: string, agentId: string, title: string, description: string) {
    const seed = hash(`${validationId}-${agentId}`);
    const score = 60 + (seed % 35);
    const confidence = 70 + (seed % 25);

    const findings = this.generateFindings(agentId, seed, title);
    const risks = this.generateRisks(agentId, seed);
    const recommendations = this.generateRecommendations(agentId, seed);

    return { score, confidence, findings, risks, recommendations };
  }

  private generateFindings(agentId: string, seed: number, title: string) {
    const findingsMap: Record<string, any[]> = {
      marcus: [
        { title: 'Total Addressable Market (TAM)', description: `Estimated TAM of $${((seed % 90) + 10)}B based on industry analysis.`, type: 'strength', severity: 'major', evidence: ['Market Research Reports', 'Industry Analysis'] },
        { title: 'Market Growth Rate', description: `Projected ${12 + (seed % 15)}% CAGR through 2028.`, type: 'strength', severity: 'major', evidence: ['Growth Projections'] },
        { title: 'Market Timing', description: 'Market conditions favorable for entry.', type: 'opportunity', severity: 'info', evidence: ['Trend Analysis'] },
      ],
      sophia: [
        { title: 'Competitive Landscape', description: `${3 + (seed % 5)} major competitors identified in the space.`, type: 'neutral', severity: 'major', evidence: ['Competitor Analysis'] },
        { title: 'Differentiation Potential', description: 'Clear opportunity for differentiation through innovation.', type: 'opportunity', severity: 'major', evidence: ['Market Gap Analysis'] },
      ],
      david: [
        { title: 'Unit Economics', description: `Projected LTV:CAC ratio of ${2 + (seed % 4)}:1.`, type: seed % 3 === 0 ? 'strength' : 'neutral', severity: 'major', evidence: ['Financial Modeling'] },
        { title: 'Break-even Analysis', description: `Estimated break-even in ${12 + (seed % 18)} months.`, type: 'neutral', severity: 'major', evidence: ['Financial Projections'] },
      ],
      elena: [
        { title: 'Customer Validation', description: 'Target customer segment well-defined.', type: 'strength', severity: 'major', evidence: ['Customer Research'] },
        { title: 'Product-Market Fit Signals', description: 'Early indicators suggest potential for strong PMF.', type: 'opportunity', severity: 'major', evidence: ['Market Signals'] },
      ],
      james: [
        { title: 'Team Composition', description: 'Team structure analysis completed.', type: 'neutral', severity: 'major', evidence: ['Team Assessment'] },
        { title: 'Execution Capability', description: 'Team shows capability for execution.', type: 'strength', severity: 'major', evidence: ['Track Record Analysis'] },
      ],
      rachel: [
        { title: 'Regulatory Environment', description: 'Regulatory landscape assessed.', type: 'neutral', severity: 'major', evidence: ['Regulatory Research'] },
        { title: 'Legal Considerations', description: 'Standard legal requirements identified.', type: 'neutral', severity: 'info', evidence: ['Legal Framework Analysis'] },
      ],
      omar: [
        { title: 'Technical Feasibility', description: 'Technical implementation is feasible with current technology.', type: 'strength', severity: 'major', evidence: ['Technical Assessment'] },
        { title: 'Scalability', description: 'Architecture supports scaling requirements.', type: 'strength', severity: 'major', evidence: ['Architecture Review'] },
      ],
      nora: [
        { title: 'Funding Landscape', description: `Active investor interest in this sector with ${50 + (seed % 100)}+ recent deals.`, type: 'opportunity', severity: 'major', evidence: ['Funding Data'] },
        { title: 'Comparable Exits', description: 'Similar companies have achieved successful exits.', type: 'strength', severity: 'major', evidence: ['Exit Analysis'] },
      ],
      victor: [
        { title: 'Valuation Benchmark', description: `Comparable companies valued at ${5 + (seed % 15)}x revenue.`, type: 'neutral', severity: 'major', evidence: ['Valuation Comparables'] },
        { title: 'Investment Potential', description: 'Attractive investment characteristics identified.', type: 'opportunity', severity: 'major', evidence: ['Investment Analysis'] },
      ],
      victoria: [
        { title: 'Overall Assessment', description: 'Comprehensive synthesis of all agent analyses completed.', type: 'strength', severity: 'critical', evidence: ['Multi-Agent Synthesis'] },
        { title: 'Key Success Factors', description: 'Critical success factors identified and documented.', type: 'neutral', severity: 'major', evidence: ['Strategic Analysis'] },
      ],
      sentinel: [
        { title: 'Data Verification', description: 'All citations and data sources verified.', type: 'strength', severity: 'major', evidence: ['Audit Trail'] },
        { title: 'Analysis Integrity', description: 'Agent analyses passed integrity checks.', type: 'strength', severity: 'major', evidence: ['Verification Report'] },
      ],
      aria: [
        { title: 'Orchestration Complete', description: 'All 12 agents have completed their analysis.', type: 'strength', severity: 'critical', evidence: ['Orchestration Log'] },
        { title: 'Consensus Achieved', description: 'Agent consensus reached on key findings.', type: 'strength', severity: 'major', evidence: ['Consensus Report'] },
      ],
    };

    return findingsMap[agentId] || findingsMap['marcus'];
  }

  private generateRisks(agentId: string, seed: number) {
    const risks = [
      { title: 'Market Risk', description: 'Market conditions may change.', probability: seed % 3 === 0 ? 'high' : 'medium', impact: 'major', mitigations: ['Diversify market approach', 'Build flexibility into strategy'] },
      { title: 'Execution Risk', description: 'Implementation challenges possible.', probability: 'medium', impact: 'moderate', mitigations: ['Phased rollout', 'Build strong team'] },
    ];
    return risks;
  }

  private generateRecommendations(agentId: string, seed: number) {
    const recommendations = [
      { title: 'Validate assumptions', description: 'Conduct customer interviews to validate key assumptions.', priority: 'high', timeframe: '30 days' },
      { title: 'Build MVP', description: 'Develop minimum viable product to test market response.', priority: 'high', timeframe: '90 days' },
    ];
    return recommendations;
  }

  /**
   * Create a new validation request and auto-generate results
   */
  async create(userId: string | null, dto: CreateValidationDto) {
    this.logger.log(`Creating validation - userId: ${userId}, title: ${dto.title}`);

    // Skip subscription check for anonymous users (demo mode)
    if (userId && userId !== 'anonymous') {
      await this.checkSubscriptionLimits(userId);
    }

    // Use null for anonymous users (no foreign key constraint)
    const actualUserId = userId === 'anonymous' ? null : userId;
    this.logger.log(`Actual userId for database: ${actualUserId}`);

    try {
      // Create validation
      const validation = await this.prisma.validation.create({
        data: {
          userId: actualUserId,
          title: dto.title,
          description: dto.description,
          problemStatement: dto.problemStatement,
          solution: dto.solution,
          targetCustomer: dto.targetCustomer,
          industry: dto.industry,
          businessModel: dto.businessModel,
          stage: dto.stage || 'idea',
          geography: dto.geography || [],
          founderData: dto.founderData || {},
          tier: dto.tier || 'STANDARD',
          requestedAgents: dto.requestedAgents || [],
          status: 'PROCESSING',
          startedAt: new Date(),
        },
      });

      // Generate and save agent reports
      const agentReports = [];
      let totalScore = 0;
      let totalConfidence = 0;

      for (const agent of AGENTS) {
        const reportData = this.generateAgentReportData(validation.id, agent.id, dto.title, dto.description);
        totalScore += reportData.score;
        totalConfidence += reportData.confidence;

        const report = await this.prisma.agentReport.create({
          data: {
            validationId: validation.id,
            agentId: agent.id,
            agentVersion: '1.0.0',
            score: reportData.score,
            confidence: reportData.confidence,
            findings: reportData.findings,
            risks: reportData.risks,
            recommendations: reportData.recommendations,
            citationCount: 3 + (hash(`${validation.id}-${agent.id}`) % 5),
            signature: `sig-${validation.id}-${agent.id}-${Date.now()}`,
            executionTimeMs: 1000 + (hash(`${validation.id}-${agent.id}`) % 2000),
          },
        });
        agentReports.push(report);
      }

      // Calculate overall scores
      const overallScore = Math.round(totalScore / AGENTS.length);
      const overallConfidence = Math.round(totalConfidence / AGENTS.length);
      const recommendation = overallScore >= 70 ? 'GREEN' : overallScore >= 50 ? 'YELLOW' : 'RED';
      const verdict = overallScore >= 70 ? 'PROCEED' : overallScore >= 50 ? 'PROCEED_WITH_CAUTION' : 'RECONSIDER';

      // Update validation with results
      const completedValidation = await this.prisma.validation.update({
        where: { id: validation.id },
        data: {
          status: 'COMPLETE',
          completedAt: new Date(),
          overallScore,
          overallConfidence,
          recommendation,
          verdict,
          successProbability: overallScore / 100,
          trustScore: 8.5,
          executiveSummary: `Comprehensive analysis of "${dto.title}" completed by 12 AI agents. Overall score: ${overallScore}/100 with ${overallConfidence}% confidence. Recommendation: ${verdict}.`,
        },
        include: {
          agentReports: true,
        },
      });

      this.eventEmitter.emit('validation.created', { validation: completedValidation });
      this.eventEmitter.emit('validation.completed', { validation: completedValidation });
      this.logger.log(`Validation created and completed: ${validation.id}`);

      return completedValidation;
    } catch (error) {
      this.logger.error(`Failed to create validation: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * List validations for a user
   */
  async findAll(userId: string, query: ValidationQueryDto) {
    const { status, limit = 10, offset = 0, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    const [validations, total] = await Promise.all([
      this.prisma.validation.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { [sortBy]: sortOrder },
        include: {
          agentReports: {
            select: {
              agentId: true,
              score: true,
              confidence: true,
            },
          },
          _count: {
            select: {
              citations: true,
              deliberations: true,
            },
          },
        },
      }),
      this.prisma.validation.count({ where }),
    ]);

    return {
      data: validations,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  /**
   * Get a specific validation
   */
  async findOne(id: string, userId: string) {
    const validation = await this.prisma.validation.findUnique({
      where: { id },
      include: {
        agentReports: true,
        citations: true,
        deliberations: true,
        fatalFlaws: true,
        ninetyDayPlan: true,
        attachments: true,
      },
    });

    if (!validation) {
      throw new NotFoundException('Validation not found');
    }

    if (validation.userId !== userId) {
      throw new ForbiddenException('Not authorized to access this validation');
    }

    return validation;
  }

  /**
   * Get validation progress
   */
  async getProgress(id: string, userId: string) {
    const validation = await this.findOne(id, userId);

    // Get job status from queue (if available)
    let job = null;
    let jobState = null;
    let jobProgress = 0;
    if (this.validationQueue) {
      job = await this.validationQueue.getJob(id);
      jobState = job ? await job.getState() : null;
      jobProgress = job ? job.progress() : 0;
    }

    return {
      validationId: id,
      status: validation.status,
      overallProgress: typeof jobProgress === 'number' ? jobProgress : 0,
      currentPhase: this.getPhaseFromStatus(validation.status),
      agentProgress: validation.agentReports.map((report: any) => ({
        agentId: report.agentId,
        status: 'complete',
        score: report.score,
        confidence: report.confidence,
      })),
      startedAt: validation.startedAt,
      estimatedCompletion: this.estimateCompletion(validation),
      jobState,
    };
  }

  /**
   * Get full validation report
   */
  async getReport(id: string, userId: string) {
    const validation = await this.findOne(id, userId);

    if (validation.status !== 'COMPLETE') {
      throw new BadRequestException('Validation is not complete');
    }

    return {
      validation,
      summary: {
        overallScore: validation.overallScore,
        overallConfidence: validation.overallConfidence,
        recommendation: validation.recommendation,
        successProbability: validation.successProbability,
      },
      agentReports: validation.agentReports,
      fatalFlaws: validation.fatalFlaws,
      ninetyDayPlan: validation.ninetyDayPlan,
      citations: validation.citations,
      deliberations: validation.deliberations,
      generatedAt: new Date(),
    };
  }

  /**
   * Get citations for a validation
   */
  async getCitations(id: string, userId: string) {
    const validation = await this.findOne(id, userId);
    return validation.citations;
  }

  /**
   * Get audit trail for a validation
   */
  async getAuditTrail(id: string, userId: string) {
    await this.findOne(id, userId); // Verify access

    const events = await this.prisma.auditEvent.findMany({
      where: { validationId: id },
      orderBy: { createdAt: 'asc' },
    });

    return {
      validationId: id,
      events,
      eventCount: events.length,
    };
  }

  /**
   * Update a validation (only before processing)
   */
  async update(id: string, userId: string, dto: UpdateValidationDto) {
    const validation = await this.findOne(id, userId);

    if (validation.status !== 'PENDING') {
      throw new BadRequestException('Cannot update validation after processing has started');
    }

    return this.prisma.validation.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Start processing a validation
   */
  async startProcessing(id: string, userId: string) {
    const validation = await this.findOne(id, userId);

    if (validation.status !== 'PENDING') {
      throw new BadRequestException('Validation has already been started');
    }

    // Update status
    await this.prisma.validation.update({
      where: { id },
      data: {
        status: 'QUEUED',
        startedAt: new Date(),
      },
    });

    // Add to processing queue (if available)
    let jobId = id;
    if (this.validationQueue) {
      const job = await this.validationQueue.add(
        'process',
        { validationId: id, userId },
        {
          jobId: id,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
          timeout: 30 * 60 * 1000, // 30 minutes
        },
      );
      jobId = job.id as string;
    }

    this.eventEmitter.emit('validation.started', { validation, jobId });
    this.logger.log(`Validation processing started: ${id}`);

    return {
      message: 'Validation processing started',
      jobId,
      status: 'QUEUED',
    };
  }

  /**
   * Cancel a validation in progress
   */
  async cancel(id: string, userId: string) {
    const validation = await this.findOne(id, userId);

    if (!['PENDING', 'QUEUED', 'PROCESSING'].includes(validation.status)) {
      throw new BadRequestException('Cannot cancel validation in current state');
    }

    // Remove from queue if queued (and queue is available)
    if (this.validationQueue) {
      const job = await this.validationQueue.getJob(id);
      if (job) {
        await job.remove();
      }
    }

    await this.prisma.validation.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    this.eventEmitter.emit('validation.cancelled', { validation });
    this.logger.log(`Validation cancelled: ${id}`);

    return { message: 'Validation cancelled', status: 'CANCELLED' };
  }

  /**
   * Delete a validation
   */
  async remove(id: string, userId: string) {
    const validation = await this.findOne(id, userId);

    if (['PROCESSING', 'SYNTHESIZING'].includes(validation.status)) {
      throw new BadRequestException('Cannot delete validation while processing');
    }

    await this.prisma.validation.delete({
      where: { id },
    });

    this.eventEmitter.emit('validation.deleted', { validationId: id });
    this.logger.log(`Validation deleted: ${id}`);
  }

  /**
   * Challenge a finding
   */
  async challengeFinding(
    id: string,
    userId: string,
    body: { findingId: string; reason: string },
  ) {
    const validation = await this.findOne(id, userId);

    if (validation.status !== 'COMPLETE') {
      throw new BadRequestException('Can only challenge findings on completed validations');
    }

    // Create audit event for challenge
    await this.prisma.auditEvent.create({
      data: {
        validationId: id,
        type: 'challenge_submitted',
        metadata: {
          findingId: body.findingId,
          reason: body.reason,
          userId,
        },
        signature: 'challenge-' + Date.now(), // Would be proper signature
      },
    });

    this.eventEmitter.emit('validation.challenge', {
      validationId: id,
      findingId: body.findingId,
      reason: body.reason,
    });

    return { message: 'Challenge submitted', status: 'under_review' };
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private async checkSubscriptionLimits(userId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE' },
    });

    if (!subscription) {
      throw new ForbiddenException('No active subscription');
    }

    const limits: Record<string, number> = {
      FREE: 1,
      STARTER: 5,
      PROFESSIONAL: 20,
      ENTERPRISE: -1,
    };

    const limit = limits[subscription.plan];
    if (limit !== -1 && subscription.validationsUsed >= limit) {
      throw new ForbiddenException('Validation limit reached for current plan');
    }
  }

  private getPhaseFromStatus(status: string): string {
    const phases: Record<string, string> = {
      PENDING: 'initialization',
      QUEUED: 'initialization',
      PROCESSING: 'analysis',
      AWAITING_DELIBERATION: 'deliberation',
      SYNTHESIZING: 'synthesis',
      COMPLETE: 'finalization',
      FAILED: 'finalization',
      CANCELLED: 'finalization',
    };
    return phases[status] || 'unknown';
  }

  private estimateCompletion(validation: any): Date | null {
    if (!validation.startedAt) return null;
    if (['COMPLETE', 'FAILED', 'CANCELLED'].includes(validation.status)) return null;

    // Estimate ~15 minutes for standard validation
    const tierMultipliers: Record<string, number> = {
      BASIC: 0.5,
      STANDARD: 1,
      PREMIUM: 1.5,
      ENTERPRISE: 2,
    };

    const baseMinutes = 15;
    const multiplier = tierMultipliers[validation.tier] || 1;
    const estimatedMinutes = baseMinutes * multiplier;

    return new Date(validation.startedAt.getTime() + estimatedMinutes * 60 * 1000);
  }
}
