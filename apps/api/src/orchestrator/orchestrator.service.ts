/**
 * Orchestrator Service (ARIA)
 * Manages validation workflow and agent coordination
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class OrchestratorService {
  private readonly logger = new Logger(OrchestratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Build execution plan for a validation
   */
  async buildExecutionPlan(validationId: string) {
    const validation = await this.prisma.validation.findUnique({
      where: { id: validationId },
    });

    if (!validation) {
      throw new Error('Validation not found');
    }

    // Determine which agents to run
    const allAgents = ['marcus', 'sophia', 'david', 'elena', 'james', 'rachel', 'omar', 'nora'];
    const requestedAgents = validation.requestedAgents.length > 0
      ? validation.requestedAgents
      : allAgents;

    // Build DAG - some agents can run in parallel
    const phases = [
      // Phase 1: Data gathering agents (parallel)
      { agents: ['marcus', 'nora'].filter(a => requestedAgents.includes(a)), parallel: true },
      // Phase 2: Analysis agents (parallel)
      { agents: ['sophia', 'david', 'elena', 'james'].filter(a => requestedAgents.includes(a)), parallel: true },
      // Phase 3: Risk agents
      { agents: ['rachel', 'omar'].filter(a => requestedAgents.includes(a)), parallel: true },
    ];

    return {
      validationId,
      phases: phases.filter(p => p.agents.length > 0),
      totalAgents: requestedAgents.length,
      estimatedTimeMs: requestedAgents.length * 60000, // ~1 min per agent
    };
  }

  /**
   * Detect conflicts between agent outputs
   */
  detectConflicts(agentReports: any[]): Array<{ agents: string[]; topic: string; severity: number }> {
    const conflicts: Array<{ agents: string[]; topic: string; severity: number }> = [];

    // Check for score disagreements
    const scores = agentReports.map(r => ({ agentId: r.agentId, score: r.score }));

    for (let i = 0; i < scores.length; i++) {
      for (let j = i + 1; j < scores.length; j++) {
        const diff = Math.abs(scores[i].score - scores[j].score);
        if (diff > 2) {
          conflicts.push({
            agents: [scores[i].agentId, scores[j].agentId],
            topic: 'Overall score disagreement',
            severity: diff / 10,
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Trigger deliberation between agents
   */
  async triggerDeliberation(validationId: string, conflict: { agents: string[]; topic: string }) {
    this.logger.log(`Triggering deliberation for ${validationId}: ${conflict.topic}`);

    const deliberation = await this.prisma.deliberation.create({
      data: {
        validationId,
        topic: conflict.topic,
        triggerReason: 'Score disagreement detected',
        initiatingAgent: 'victoria',
        respondingAgents: conflict.agents,
        transcript: [],
        resolution: {},
      },
    });

    this.eventEmitter.emit('deliberation.started', { deliberation });

    return deliberation;
  }
}
