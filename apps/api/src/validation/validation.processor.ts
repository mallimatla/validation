/**
 * Validation Processor
 * Bull queue processor for validation jobs
 */

import { Process, Processor, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../common/prisma/prisma.service';

interface ValidationJobData {
  validationId: string;
  userId: string;
}

@Processor('validations')
export class ValidationProcessor {
  private readonly logger = new Logger(ValidationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @OnQueueActive()
  onActive(job: Job<ValidationJobData>) {
    this.logger.log(`Processing job ${job.id} for validation ${job.data.validationId}`);
  }

  @OnQueueCompleted()
  onComplete(job: Job<ValidationJobData>) {
    this.logger.log(`Completed job ${job.id} for validation ${job.data.validationId}`);
  }

  @OnQueueFailed()
  onFailed(job: Job<ValidationJobData>, error: Error) {
    this.logger.error(
      `Failed job ${job.id} for validation ${job.data.validationId}: ${error.message}`,
    );
  }

  @Process('process')
  async processValidation(job: Job<ValidationJobData>) {
    const { validationId, userId } = job.data;

    this.logger.log(`Starting validation processing: ${validationId}`);

    try {
      // Update status to processing
      await this.prisma.validation.update({
        where: { id: validationId },
        data: { status: 'PROCESSING' },
      });

      // Get validation details
      const validation = await this.prisma.validation.findUnique({
        where: { id: validationId },
        include: { attachments: true },
      });

      if (!validation) {
        throw new Error('Validation not found');
      }

      // Create audit event
      await this.createAuditEvent(validationId, 'validation_started', {
        tier: validation.tier,
        requestedAgents: validation.requestedAgents,
      });

      // Phase 1: Data gathering (10-30%)
      await job.progress(10);
      await this.gatherData(validationId, validation);

      // Phase 2: Agent analysis (30-70%)
      await job.progress(30);
      const agentResults = await this.runAgents(validationId, validation, job);

      // Phase 3: Check for deliberations (70-80%)
      await job.progress(70);
      await this.checkDeliberations(validationId, agentResults);

      // Phase 4: Synthesis (80-95%)
      await job.progress(80);
      await this.prisma.validation.update({
        where: { id: validationId },
        data: { status: 'SYNTHESIZING' },
      });
      await this.synthesizeResults(validationId, agentResults);

      // Phase 5: Finalization (95-100%)
      await job.progress(95);
      await this.finalizeValidation(validationId);

      await job.progress(100);

      // Update usage
      await this.prisma.subscription.updateMany({
        where: { userId, status: 'ACTIVE' },
        data: { validationsUsed: { increment: 1 } },
      });

      this.eventEmitter.emit('validation.completed', { validationId });
      this.logger.log(`Validation completed: ${validationId}`);

      return { success: true, validationId };
    } catch (error) {
      this.logger.error(`Validation failed: ${validationId}`, error);

      await this.prisma.validation.update({
        where: { id: validationId },
        data: { status: 'FAILED' },
      });

      await this.createAuditEvent(validationId, 'validation_failed', {
        error: (error as Error).message,
      });

      throw error;
    }
  }

  private async gatherData(validationId: string, validation: any) {
    // This would gather data from external sources
    // For now, create a placeholder audit event
    await this.createAuditEvent(validationId, 'data_fetched', {
      sources: ['placeholder'],
      success: true,
    });
  }

  private async runAgents(validationId: string, validation: any, job: Job) {
    // This would run the actual agents via the orchestrator
    // For now, create placeholder agent reports

    const agentIds = ['marcus', 'sophia', 'david', 'elena', 'james', 'rachel', 'omar', 'nora'];
    const results: any[] = [];

    for (let i = 0; i < agentIds.length; i++) {
      const agentId = agentIds[i];

      // Update progress
      const progress = 30 + Math.floor((i / agentIds.length) * 40);
      await job.progress(progress);

      // Create audit event for agent start
      await this.createAuditEvent(validationId, 'agent_started', {
        agentId,
        agentVersion: '1.0.0',
      });

      // Create placeholder agent report
      const report = await this.prisma.agentReport.create({
        data: {
          validationId,
          agentId,
          agentVersion: '1.0.0',
          score: Math.random() * 4 + 5, // 5-9 range for demo
          confidence: Math.random() * 2 + 7, // 7-9 range for demo
          findings: [],
          risks: [],
          recommendations: [],
          citationCount: 0,
          signature: `${agentId}-${Date.now()}`,
          executionTimeMs: Math.floor(Math.random() * 10000 + 5000),
        },
      });

      results.push(report);

      // Create audit event for agent completion
      await this.createAuditEvent(validationId, 'agent_completed', {
        agentId,
        score: report.score,
        confidence: report.confidence,
      });
    }

    return results;
  }

  private async checkDeliberations(validationId: string, agentResults: any[]) {
    // Check if any agents have significant disagreements (>20%)
    // For now, this is a placeholder
    const scores = agentResults.map((r) => r.score);
    const maxDiff = Math.max(...scores) - Math.min(...scores);

    if (maxDiff > 2) {
      // Significant disagreement
      await this.prisma.validation.update({
        where: { id: validationId },
        data: { status: 'AWAITING_DELIBERATION' },
      });

      await this.prisma.deliberation.create({
        data: {
          validationId,
          topic: 'Score disagreement',
          triggerReason: `Score spread of ${maxDiff.toFixed(1)} detected`,
          initiatingAgent: 'victoria',
          respondingAgents: agentResults.map((r) => r.agentId),
          transcript: [],
          resolution: {
            outcome: 'consensus',
            finalPosition: 'Weighted average applied',
            adjustments: [],
          },
        },
      });
    }
  }

  private async synthesizeResults(validationId: string, agentResults: any[]) {
    // Calculate weighted overall score
    const weights: Record<string, number> = {
      marcus: 1.0,
      sophia: 1.2,
      david: 1.5,
      elena: 2.0,
      james: 1.5,
      rachel: 0.8,
      omar: 1.0,
      nora: 0.8,
    };

    let totalWeight = 0;
    let weightedSum = 0;
    let confidenceSum = 0;

    for (const result of agentResults) {
      const weight = weights[result.agentId] || 1.0;
      totalWeight += weight;
      weightedSum += result.score * weight;
      confidenceSum += result.confidence;
    }

    const overallScore = weightedSum / totalWeight;
    const overallConfidence = confidenceSum / agentResults.length;

    // Determine recommendation
    let recommendation: string;
    if (overallScore >= 7) {
      recommendation = 'GREEN';
    } else if (overallScore >= 5) {
      recommendation = 'YELLOW';
    } else {
      recommendation = 'RED';
    }

    // Calculate success probability (simplified)
    const successProbability = (overallScore / 10) * 100;

    // Update validation with results
    await this.prisma.validation.update({
      where: { id: validationId },
      data: {
        overallScore,
        overallConfidence,
        recommendation,
        successProbability,
      },
    });

    // Create 90-day plan
    await this.prisma.ninetyDayPlan.create({
      data: {
        validationId,
        phases: [
          {
            phase: 1,
            title: 'Validation & Discovery',
            objectives: ['Validate core assumptions', 'Build initial MVP'],
            tasks: [],
            expectedOutcomes: ['10 customer interviews', 'Working prototype'],
          },
          {
            phase: 2,
            title: 'Early Traction',
            objectives: ['Launch beta', 'Get first paying customers'],
            tasks: [],
            expectedOutcomes: ['5 beta users', '2 paying customers'],
          },
          {
            phase: 3,
            title: 'Growth Foundation',
            objectives: ['Establish metrics', 'Prepare for fundraising'],
            tasks: [],
            expectedOutcomes: ['Key metrics tracked', 'Pitch deck ready'],
          },
        ],
        milestones: [],
        validationGates: [],
        criticalPath: ['Customer interviews', 'MVP', 'Beta launch'],
      },
    });
  }

  private async finalizeValidation(validationId: string) {
    const validation = await this.prisma.validation.findUnique({
      where: { id: validationId },
      include: {
        agentReports: true,
      },
    });

    if (!validation) return;

    // Calculate totals
    const totalTokens = validation.agentReports.reduce(
      (sum, r: any) => sum + (r.inputTokens || 0) + (r.outputTokens || 0),
      0,
    );

    const executionTimeMs = validation.agentReports.reduce(
      (sum, r: any) => sum + (r.executionTimeMs || 0),
      0,
    );

    // Estimate cost (placeholder)
    const totalCost = (totalTokens / 1000) * 0.003;

    await this.prisma.validation.update({
      where: { id: validationId },
      data: {
        status: 'COMPLETE',
        completedAt: new Date(),
        totalTokens,
        executionTimeMs,
        totalCost,
      },
    });

    await this.createAuditEvent(validationId, 'validation_completed', {
      overallScore: validation.overallScore,
      recommendation: validation.recommendation,
      totalTokens,
      executionTimeMs,
    });
  }

  private async createAuditEvent(validationId: string, eventType: string, data: any) {
    await this.prisma.auditEvent.create({
      data: {
        validationId,
        type: eventType,
        metadata: data,
        signature: `${eventType}-${Date.now()}`, // Would be proper cryptographic signature
      },
    });
  }
}
