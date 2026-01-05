/**
 * Execution Planner
 * Builds DAG-based execution plans for agent orchestration
 */

import { Injectable } from '@nestjs/common';

export interface ExecutionPhase {
  order: number;
  agents: string[];
  parallel: boolean;
  dependencies: string[];
  estimatedTimeMs: number;
}

export interface ExecutionPlan {
  validationId: string;
  phases: ExecutionPhase[];
  totalAgents: number;
  estimatedTotalTimeMs: number;
  criticalPath: string[];
}

interface AgentDependency {
  agentId: string;
  dependsOn: string[];
  estimatedTimeMs: number;
  canParallelize: boolean;
}

@Injectable()
export class ExecutionPlanner {
  private readonly agentDependencies: Map<string, AgentDependency> = new Map([
    ['marcus', { agentId: 'marcus', dependsOn: [], estimatedTimeMs: 45000, canParallelize: true }],
    ['sophia', { agentId: 'sophia', dependsOn: [], estimatedTimeMs: 60000, canParallelize: true }],
    ['nora', { agentId: 'nora', dependsOn: [], estimatedTimeMs: 40000, canParallelize: true }],
    ['david', { agentId: 'david', dependsOn: ['marcus'], estimatedTimeMs: 50000, canParallelize: true }],
    ['elena', { agentId: 'elena', dependsOn: [], estimatedTimeMs: 55000, canParallelize: true }],
    ['james', { agentId: 'james', dependsOn: [], estimatedTimeMs: 35000, canParallelize: true }],
    ['rachel', { agentId: 'rachel', dependsOn: ['sophia'], estimatedTimeMs: 45000, canParallelize: true }],
    ['omar', { agentId: 'omar', dependsOn: [], estimatedTimeMs: 40000, canParallelize: true }],
    ['victor', { agentId: 'victor', dependsOn: ['marcus', 'david', 'nora'], estimatedTimeMs: 50000, canParallelize: false }],
    ['victoria', { agentId: 'victoria', dependsOn: ['*'], estimatedTimeMs: 60000, canParallelize: false }],
    ['sentinel', { agentId: 'sentinel', dependsOn: [], estimatedTimeMs: 30000, canParallelize: true }],
  ]);

  /**
   * Build execution plan based on context
   */
  async buildPlan(context: { validationId: string; requestedAgents: string[]; tier: string }): Promise<ExecutionPlan> {
    const requestedAgents = context.requestedAgents.length > 0
      ? context.requestedAgents
      : this.getDefaultAgents(context.tier);

    // Build dependency graph
    const phases = this.buildPhases(requestedAgents);
    const criticalPath = this.findCriticalPath(phases);
    const totalTime = this.calculateTotalTime(phases);

    return {
      validationId: context.validationId,
      phases,
      totalAgents: requestedAgents.length,
      estimatedTotalTimeMs: totalTime,
      criticalPath,
    };
  }

  /**
   * Get default agents based on tier
   */
  private getDefaultAgents(tier: string): string[] {
    const tierAgents: Record<string, string[]> = {
      BASIC: ['marcus', 'sophia', 'david', 'elena'],
      STANDARD: ['marcus', 'sophia', 'david', 'elena', 'james', 'rachel', 'omar', 'nora'],
      PREMIUM: ['marcus', 'sophia', 'david', 'elena', 'james', 'rachel', 'omar', 'nora', 'victor', 'victoria'],
      ENTERPRISE: ['marcus', 'sophia', 'david', 'elena', 'james', 'rachel', 'omar', 'nora', 'victor', 'victoria', 'sentinel'],
    };

    return tierAgents[tier] || tierAgents.STANDARD;
  }

  /**
   * Build execution phases respecting dependencies
   */
  private buildPhases(agents: string[]): ExecutionPhase[] {
    const phases: ExecutionPhase[] = [];
    const completed = new Set<string>();
    const remaining = new Set(agents);

    let phaseOrder = 1;

    while (remaining.size > 0) {
      const readyAgents: string[] = [];

      for (const agentId of remaining) {
        const dep = this.agentDependencies.get(agentId);
        if (!dep) continue;

        // Check if all dependencies are satisfied
        const depsReady = dep.dependsOn.every(d => {
          if (d === '*') return remaining.size === 1; // Last agent
          return completed.has(d) || !agents.includes(d);
        });

        if (depsReady) {
          readyAgents.push(agentId);
        }
      }

      if (readyAgents.length === 0 && remaining.size > 0) {
        // Circular dependency or missing dependency - add remaining as final phase
        readyAgents.push(...remaining);
      }

      // Check if agents can run in parallel
      const canParallelize = readyAgents.every(a => {
        const dep = this.agentDependencies.get(a);
        return dep?.canParallelize ?? true;
      });

      const phase: ExecutionPhase = {
        order: phaseOrder++,
        agents: readyAgents,
        parallel: canParallelize && readyAgents.length > 1,
        dependencies: readyAgents.flatMap(a => {
          const dep = this.agentDependencies.get(a);
          return dep?.dependsOn.filter(d => d !== '*') || [];
        }),
        estimatedTimeMs: canParallelize
          ? Math.max(...readyAgents.map(a => this.agentDependencies.get(a)?.estimatedTimeMs || 30000))
          : readyAgents.reduce((sum, a) => sum + (this.agentDependencies.get(a)?.estimatedTimeMs || 30000), 0),
      };

      phases.push(phase);

      for (const agentId of readyAgents) {
        completed.add(agentId);
        remaining.delete(agentId);
      }
    }

    return phases;
  }

  /**
   * Find the critical path through the execution plan
   */
  private findCriticalPath(phases: ExecutionPhase[]): string[] {
    // Simplified: return the agents with longest total execution time
    const criticalPath: string[] = [];

    for (const phase of phases) {
      if (!phase.parallel) {
        criticalPath.push(...phase.agents);
      } else {
        // Add the slowest agent from parallel phase
        const slowest = phase.agents.reduce((a, b) => {
          const timeA = this.agentDependencies.get(a)?.estimatedTimeMs || 0;
          const timeB = this.agentDependencies.get(b)?.estimatedTimeMs || 0;
          return timeA > timeB ? a : b;
        });
        criticalPath.push(slowest);
      }
    }

    return criticalPath;
  }

  /**
   * Calculate total estimated execution time
   */
  private calculateTotalTime(phases: ExecutionPhase[]): number {
    return phases.reduce((total, phase) => total + phase.estimatedTimeMs, 0);
  }
}
