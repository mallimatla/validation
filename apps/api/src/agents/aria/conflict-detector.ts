/**
 * Conflict Detector
 * Identifies disagreements between agent outputs
 */

import { Injectable } from '@nestjs/common';

export interface AgentConflict {
  id: string;
  agents: string[];
  topic: string;
  description: string;
  severity: number; // 0-1, higher = more severe
  scores: { agentId: string; score: number }[];
  requiresDeliberation: boolean;
}

export interface AgentOutput {
  agentId: string;
  score: number;
  confidence: number;
  findings: any[];
  risks: any[];
}

@Injectable()
export class ConflictDetector {
  private readonly DELIBERATION_THRESHOLD = 0.2; // 20% disagreement triggers deliberation
  private readonly CRITICAL_THRESHOLD = 0.4; // 40% disagreement is critical

  /**
   * Detect conflicts between agent outputs
   */
  detect(outputs: AgentOutput[]): AgentConflict[] {
    const conflicts: AgentConflict[] = [];

    // Check score disagreements
    const scoreConflicts = this.detectScoreConflicts(outputs);
    conflicts.push(...scoreConflicts);

    // Check finding contradictions
    const findingConflicts = this.detectFindingConflicts(outputs);
    conflicts.push(...findingConflicts);

    // Check risk assessment disagreements
    const riskConflicts = this.detectRiskConflicts(outputs);
    conflicts.push(...riskConflicts);

    return conflicts;
  }

  /**
   * Detect score disagreements
   */
  private detectScoreConflicts(outputs: AgentOutput[]): AgentConflict[] {
    const conflicts: AgentConflict[] = [];

    if (outputs.length < 2) return conflicts;

    const scores = outputs.map(o => ({ agentId: o.agentId, score: o.score }));
    const maxScore = Math.max(...scores.map(s => s.score));
    const minScore = Math.min(...scores.map(s => s.score));
    const scoreDiff = (maxScore - minScore) / 10; // Normalize to 0-1

    if (scoreDiff > this.DELIBERATION_THRESHOLD) {
      const highAgent = scores.find(s => s.score === maxScore)!;
      const lowAgent = scores.find(s => s.score === minScore)!;

      conflicts.push({
        id: `score-conflict-${Date.now()}`,
        agents: [highAgent.agentId, lowAgent.agentId],
        topic: 'Overall Score Disagreement',
        description: `${highAgent.agentId} scored ${maxScore.toFixed(1)} while ${lowAgent.agentId} scored ${minScore.toFixed(1)} (difference: ${(scoreDiff * 100).toFixed(0)}%)`,
        severity: scoreDiff,
        scores,
        requiresDeliberation: scoreDiff > this.DELIBERATION_THRESHOLD,
      });
    }

    return conflicts;
  }

  /**
   * Detect contradictory findings
   */
  private detectFindingConflicts(outputs: AgentOutput[]): AgentConflict[] {
    const conflicts: AgentConflict[] = [];

    // Group findings by type
    const strengthFindings = outputs.flatMap(o =>
      o.findings?.filter((f: any) => f.type === 'strength').map((f: any) => ({ ...f, agentId: o.agentId })) || []
    );
    const weaknessFindings = outputs.flatMap(o =>
      o.findings?.filter((f: any) => f.type === 'weakness').map((f: any) => ({ ...f, agentId: o.agentId })) || []
    );

    // Check for same topic appearing as both strength and weakness
    for (const strength of strengthFindings) {
      for (const weakness of weaknessFindings) {
        if (strength.agentId === weakness.agentId) continue;

        const similarity = this.calculateTextSimilarity(
          strength.title?.toLowerCase() || '',
          weakness.title?.toLowerCase() || ''
        );

        if (similarity > 0.6) {
          conflicts.push({
            id: `finding-conflict-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            agents: [strength.agentId, weakness.agentId],
            topic: 'Contradictory Findings',
            description: `${strength.agentId} sees "${strength.title}" as a strength, but ${weakness.agentId} sees similar aspect as a weakness`,
            severity: 0.5,
            scores: [],
            requiresDeliberation: true,
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Detect risk assessment disagreements
   */
  private detectRiskConflicts(outputs: AgentOutput[]): AgentConflict[] {
    const conflicts: AgentConflict[] = [];

    // Group risks by category
    const risksByCategory = new Map<string, { agentId: string; probability: string; impact: string }[]>();

    for (const output of outputs) {
      for (const risk of output.risks || []) {
        const category = risk.category || 'general';
        if (!risksByCategory.has(category)) {
          risksByCategory.set(category, []);
        }
        risksByCategory.get(category)!.push({
          agentId: output.agentId,
          probability: risk.probability,
          impact: risk.impact,
        });
      }
    }

    // Check for disagreements within same category
    for (const [category, risks] of risksByCategory) {
      if (risks.length < 2) continue;

      const probabilities = risks.map(r => this.probabilityToNumber(r.probability));
      const maxProb = Math.max(...probabilities);
      const minProb = Math.min(...probabilities);

      if (maxProb - minProb > 0.4) {
        const highAgent = risks[probabilities.indexOf(maxProb)];
        const lowAgent = risks[probabilities.indexOf(minProb)];

        conflicts.push({
          id: `risk-conflict-${category}-${Date.now()}`,
          agents: [highAgent.agentId, lowAgent.agentId],
          topic: `${category} Risk Assessment`,
          description: `Disagreement on ${category} risk probability: ${highAgent.agentId} rates it ${highAgent.probability}, ${lowAgent.agentId} rates it ${lowAgent.probability}`,
          severity: (maxProb - minProb) * 0.7,
          scores: [],
          requiresDeliberation: maxProb - minProb > 0.5,
        });
      }
    }

    return conflicts;
  }

  /**
   * Simple text similarity (Jaccard)
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.split(/\s+/));
    const words2 = new Set(text2.split(/\s+/));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Convert probability string to number
   */
  private probabilityToNumber(prob: string): number {
    const mapping: Record<string, number> = {
      high: 0.8,
      medium: 0.5,
      low: 0.2,
    };
    return mapping[prob?.toLowerCase()] ?? 0.5;
  }
}
