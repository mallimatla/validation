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

@Injectable()
export class ValidationService {
  private readonly logger = new Logger(ValidationService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() @InjectQueue('validations') private readonly validationQueue: Queue,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create a new validation request
   */
  async create(userId: string | null, dto: CreateValidationDto) {
    // Skip subscription check for anonymous users (demo mode)
    if (userId && userId !== 'anonymous') {
      await this.checkSubscriptionLimits(userId);
    }

    // Use null for anonymous users (no foreign key constraint)
    const actualUserId = userId === 'anonymous' ? null : userId;

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
        status: 'PENDING',
      },
    });

    this.eventEmitter.emit('validation.created', { validation });
    this.logger.log(`Validation created: ${validation.id}`);

    return validation;
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
