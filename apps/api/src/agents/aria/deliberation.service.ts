/**
 * Deliberation Service
 * Facilitates debates between agents when conflicts arise
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AgentConflict } from './conflict-detector';

export interface DeliberationMessage {
  agentId: string;
  position: string;
  evidence: string[];
  confidence: number;
  timestamp: Date;
}

export interface DeliberationResult {
  id: string;
  validationId: string;
  conflict: AgentConflict;
  messages: DeliberationMessage[];
  resolution: {
    outcome: 'consensus' | 'majority' | 'expert_override' | 'unresolved';
    finalPosition: string;
    adjustments: { agentId: string; originalScore: number; adjustedScore: number; reason: string }[];
    reasoning: string;
  };
  completedAt: Date;
}

@Injectable()
export class DeliberationService {
  private readonly logger = new Logger(DeliberationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Facilitate a deliberation between agents
   */
  async facilitate(
    validationId: string,
    conflict: AgentConflict,
    agentResults: Map<string, any>,
  ): Promise<DeliberationResult> {
    this.logger.log(`Starting deliberation for conflict: ${conflict.topic}`);

    const messages: DeliberationMessage[] = [];
    const adjustments: { agentId: string; originalScore: number; adjustedScore: number; reason: string }[] = [];

    // Step 1: Collect positions from each involved agent
    for (const agentId of conflict.agents) {
      const result = agentResults.get(agentId);
      if (!result) continue;

      messages.push({
        agentId,
        position: this.extractPosition(agentId, result, conflict),
        evidence: this.extractEvidence(result),
        confidence: result.confidence || 7,
        timestamp: new Date(),
      });
    }

    // Step 2: Analyze positions and evidence
    const analysis = this.analyzePositions(messages, conflict);

    // Step 3: Determine resolution
    const resolution = this.determineResolution(analysis, conflict, messages);

    // Step 4: Calculate any score adjustments
    if (resolution.outcome !== 'unresolved') {
      for (const agentId of conflict.agents) {
        const result = agentResults.get(agentId);
        if (!result) continue;

        const originalScore = result.score || 5;
        const adjustment = this.calculateAdjustment(agentId, originalScore, resolution, analysis);

        if (adjustment !== 0) {
          adjustments.push({
            agentId,
            originalScore,
            adjustedScore: Math.max(1, Math.min(10, originalScore + adjustment)),
            reason: resolution.reasoning,
          });
        }
      }
    }

    resolution.adjustments = adjustments;

    // Step 5: Store deliberation record
    const deliberation = await this.prisma.deliberation.create({
      data: {
        validationId,
        topic: conflict.topic,
        triggerReason: conflict.description,
        initiatingAgent: 'aria',
        respondingAgents: conflict.agents,
        transcript: messages,
        resolution,
      },
    });

    this.logger.log(`Deliberation completed: ${resolution.outcome}`);

    return {
      id: deliberation.id,
      validationId,
      conflict,
      messages,
      resolution,
      completedAt: new Date(),
    };
  }

  /**
   * Extract position from agent result
   */
  private extractPosition(agentId: string, result: any, conflict: AgentConflict): string {
    const score = result.score || 5;
    const scoreDescriptor = score >= 7 ? 'positive' : score >= 5 ? 'neutral' : 'negative';

    if (conflict.topic.includes('Score')) {
      return `Based on my analysis, I rate this idea as ${scoreDescriptor} (${score}/10). ` +
             `Key factors: ${(result.findings || []).slice(0, 3).map((f: any) => f.title).join(', ')}`;
    }

    if (conflict.topic.includes('Risk')) {
      const relevantRisks = (result.risks || []).slice(0, 2);
      return `My risk assessment indicates: ${relevantRisks.map((r: any) => `${r.title} (${r.probability} probability)`).join(', ')}`;
    }

    return `My analysis suggests a ${scoreDescriptor} outlook based on the available evidence.`;
  }

  /**
   * Extract evidence from agent result
   */
  private extractEvidence(result: any): string[] {
    const evidence: string[] = [];

    // Add citations
    if (result.citations) {
      evidence.push(...result.citations.slice(0, 3).map((c: any) => `[${c.source}] ${c.claim}`));
    }

    // Add finding evidence
    if (result.findings) {
      for (const finding of result.findings.slice(0, 2)) {
        if (finding.evidence?.length) {
          evidence.push(...finding.evidence.slice(0, 2).map((e: any) => e.claim || e));
        }
      }
    }

    return evidence;
  }

  /**
   * Analyze positions from all agents
   */
  private analyzePositions(messages: DeliberationMessage[], conflict: AgentConflict): {
    weightedAverage: number;
    strongestPosition: DeliberationMessage | null;
    evidenceStrength: Map<string, number>;
  } {
    // Calculate weighted average based on confidence
    const totalConfidence = messages.reduce((sum, m) => sum + m.confidence, 0);
    const weightedSum = messages.reduce((sum, m) => {
      const score = conflict.scores.find(s => s.agentId === m.agentId)?.score || 5;
      return sum + score * (m.confidence / totalConfidence);
    }, 0);

    // Find position with most evidence
    const evidenceStrength = new Map<string, number>();
    let strongestPosition: DeliberationMessage | null = null;
    let maxEvidence = 0;

    for (const message of messages) {
      const strength = message.evidence.length * message.confidence;
      evidenceStrength.set(message.agentId, strength);

      if (strength > maxEvidence) {
        maxEvidence = strength;
        strongestPosition = message;
      }
    }

    return { weightedAverage: weightedSum, strongestPosition, evidenceStrength };
  }

  /**
   * Determine resolution based on analysis
   */
  private determineResolution(
    analysis: ReturnType<typeof this.analyzePositions>,
    conflict: AgentConflict,
    messages: DeliberationMessage[],
  ): DeliberationResult['resolution'] {
    // Check for consensus (all within 1 point)
    const scores = conflict.scores.map(s => s.score);
    const scoreRange = Math.max(...scores) - Math.min(...scores);

    if (scoreRange <= 1) {
      return {
        outcome: 'consensus',
        finalPosition: `All agents agree within acceptable margin. Weighted score: ${analysis.weightedAverage.toFixed(1)}`,
        adjustments: [],
        reasoning: 'Scores are within acceptable range, no adjustment needed.',
      };
    }

    // Check for majority (>60% within 2 points of each other)
    const medianScore = scores.sort((a, b) => a - b)[Math.floor(scores.length / 2)];
    const agreeingAgents = scores.filter(s => Math.abs(s - medianScore) <= 2);

    if (agreeingAgents.length / scores.length > 0.6) {
      return {
        outcome: 'majority',
        finalPosition: `Majority of agents converge around ${medianScore.toFixed(1)}. Outliers will be adjusted.`,
        adjustments: [],
        reasoning: `Majority agreement reached. Weighted average: ${analysis.weightedAverage.toFixed(1)}`,
      };
    }

    // Check for expert override (high-weight agent has strong evidence)
    if (analysis.strongestPosition && analysis.strongestPosition.confidence >= 8) {
      return {
        outcome: 'expert_override',
        finalPosition: `${analysis.strongestPosition.agentId} has the strongest evidence-backed position.`,
        adjustments: [],
        reasoning: `Expert agent ${analysis.strongestPosition.agentId} provided compelling evidence with high confidence.`,
      };
    }

    // Unresolved - significant disagreement remains
    return {
      outcome: 'unresolved',
      finalPosition: `Agents maintain significant disagreement. Human review recommended.`,
      adjustments: [],
      reasoning: `Score range of ${scoreRange.toFixed(1)} points could not be reconciled automatically.`,
    };
  }

  /**
   * Calculate score adjustment for an agent
   */
  private calculateAdjustment(
    agentId: string,
    originalScore: number,
    resolution: DeliberationResult['resolution'],
    analysis: ReturnType<typeof this.analyzePositions>,
  ): number {
    if (resolution.outcome === 'consensus') return 0;

    const targetScore = analysis.weightedAverage;
    const difference = targetScore - originalScore;

    switch (resolution.outcome) {
      case 'majority':
        // Adjust outliers toward weighted average by 50%
        return Math.abs(difference) > 2 ? difference * 0.5 : 0;

      case 'expert_override':
        // Only adjust if this isn't the expert
        if (analysis.strongestPosition?.agentId === agentId) return 0;
        return difference * 0.3;

      default:
        return 0;
    }
  }
}
