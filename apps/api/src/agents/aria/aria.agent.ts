/**
 * ARIA - Chief Orchestration Officer
 *
 * Purpose: Manages the entire validation workflow, dispatches agents,
 * ensures quality, and resolves conflicts between agents.
 *
 * NOT a scoring agent - ARIA orchestrates other agents.
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ExecutionPlanner, ExecutionPlan, ExecutionPhase } from './execution-planner';
import { ConflictDetector, AgentConflict } from './conflict-detector';
import { DeliberationService } from './deliberation.service';
import { QualityGateService, QualityCheckResult } from './quality-gate.service';

export interface OrchestrationContext {
  validationId: string;
  userId: string;
  tier: string;
  requestedAgents: string[];
  founderData: Record<string, any>;
}

export interface OrchestrationResult {
  success: boolean;
  validationId: string;
  agentResults: Map<string, any>;
  conflicts: AgentConflict[];
  deliberations: any[];
  qualityChecks: QualityCheckResult[];
  executionTimeMs: number;
}

@Injectable()
export class AriaAgent {
  private readonly logger = new Logger(AriaAgent.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly executionPlanner: ExecutionPlanner,
    private readonly conflictDetector: ConflictDetector,
    private readonly deliberationService: DeliberationService,
    private readonly qualityGateService: QualityGateService,
  ) {}

  /**
   * Main orchestration method - coordinates the entire validation
   */
  async orchestrate(context: OrchestrationContext): Promise<OrchestrationResult> {
    const startTime = Date.now();
    this.logger.log(`Starting orchestration for validation ${context.validationId}`);

    const agentResults = new Map<string, any>();
    const conflicts: AgentConflict[] = [];
    const deliberations: any[] = [];
    const qualityChecks: QualityCheckResult[] = [];

    try {
      // Step 1: Build execution plan
      const plan = await this.executionPlanner.buildPlan(context);
      this.logger.log(`Execution plan built: ${plan.phases.length} phases, ${plan.totalAgents} agents`);

      await this.logAuditEvent(context.validationId, 'orchestration_started', {
        plan: { phases: plan.phases.length, agents: plan.totalAgents },
      });

      // Step 2: Execute each phase
      for (const phase of plan.phases) {
        this.logger.log(`Executing phase ${phase.order}: ${phase.agents.join(', ')}`);

        const phaseResults = await this.executePhase(context, phase, agentResults);

        for (const [agentId, result] of phaseResults) {
          agentResults.set(agentId, result);
        }

        // Step 3: Check for conflicts after each phase
        const phaseConflicts = this.conflictDetector.detect(Array.from(agentResults.values()));
        conflicts.push(...phaseConflicts);

        // Step 4: Trigger deliberation if significant conflicts
        for (const conflict of phaseConflicts.filter(c => c.severity > 0.2)) {
          const deliberation = await this.deliberationService.facilitate(
            context.validationId,
            conflict,
            agentResults,
          );
          deliberations.push(deliberation);
        }
      }

      // Step 5: Quality gate checks
      const qualityResult = await this.qualityGateService.checkAll(
        context.validationId,
        agentResults,
      );
      qualityChecks.push(...qualityResult.checks);

      if (!qualityResult.passed) {
        this.logger.warn(`Quality gates failed: ${qualityResult.failedChecks.join(', ')}`);
      }

      // Step 6: Final synthesis
      await this.logAuditEvent(context.validationId, 'orchestration_completed', {
        agentCount: agentResults.size,
        conflictCount: conflicts.length,
        deliberationCount: deliberations.length,
        qualityPassed: qualityResult.passed,
      });

      return {
        success: true,
        validationId: context.validationId,
        agentResults,
        conflicts,
        deliberations,
        qualityChecks,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.error(`Orchestration failed: ${(error as Error).message}`);

      await this.logAuditEvent(context.validationId, 'orchestration_failed', {
        error: (error as Error).message,
      });

      throw error;
    }
  }

  /**
   * Execute a phase of agents (parallel or sequential)
   */
  private async executePhase(
    context: OrchestrationContext,
    phase: ExecutionPhase,
    previousResults: Map<string, any>,
  ): Promise<Map<string, any>> {
    const results = new Map<string, any>();

    if (phase.parallel) {
      // Execute agents in parallel
      const promises = phase.agents.map(agentId =>
        this.executeAgent(context, agentId, previousResults)
          .then(result => ({ agentId, result }))
          .catch(error => ({ agentId, error }))
      );

      const outcomes = await Promise.all(promises);

      for (const outcome of outcomes) {
        if ('error' in outcome) {
          this.logger.error(`Agent ${outcome.agentId} failed: ${outcome.error}`);
          // Store error result
          results.set(outcome.agentId, { error: outcome.error, failed: true });
        } else {
          results.set(outcome.agentId, outcome.result);
        }
      }
    } else {
      // Execute agents sequentially
      for (const agentId of phase.agents) {
        try {
          const result = await this.executeAgent(context, agentId, previousResults);
          results.set(agentId, result);
        } catch (error) {
          this.logger.error(`Agent ${agentId} failed: ${(error as Error).message}`);
          results.set(agentId, { error: (error as Error).message, failed: true });
        }
      }
    }

    return results;
  }

  /**
   * Execute a single agent
   */
  private async executeAgent(
    context: OrchestrationContext,
    agentId: string,
    previousResults: Map<string, any>,
  ): Promise<any> {
    this.logger.debug(`Executing agent: ${agentId}`);

    await this.logAuditEvent(context.validationId, 'agent_dispatched', {
      agentId,
      previousAgents: Array.from(previousResults.keys()),
    });

    // This would call the actual agent implementation
    // For now, we emit an event that the agent module handles
    this.eventEmitter.emit(`agent.${agentId}.execute`, {
      context,
      previousResults: Object.fromEntries(previousResults),
    });

    // In actual implementation, we'd wait for the agent to complete
    // and return its result. For now, return a placeholder.
    return {
      agentId,
      status: 'completed',
      timestamp: new Date(),
    };
  }

  /**
   * Log an audit event
   */
  private async logAuditEvent(validationId: string, eventType: string, data: any): Promise<void> {
    await this.prisma.auditEvent.create({
      data: {
        validationId,
        eventType,
        agentId: 'aria',
        data,
        signature: this.generateSignature({ validationId, eventType, data }),
      },
    });
  }

  /**
   * Generate a signature for audit events
   */
  private generateSignature(data: any): string {
    const crypto = require('crypto');
    const secret = process.env.AUDIT_SIGNING_SECRET || 'development-secret';
    return crypto.createHmac('sha256', secret).update(JSON.stringify(data)).digest('hex');
  }
}
