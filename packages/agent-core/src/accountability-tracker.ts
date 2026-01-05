/**
 * AccountabilityTracker - Tracks agent predictions and measures accuracy
 *
 * Core responsibility: Enable accuracy measurement by recording predictions
 * that can later be compared against actual outcomes.
 *
 * Features:
 * - Prediction recording
 * - Outcome comparison
 * - Accuracy calculation
 * - Trend analysis
 */

import {
  AgentOutput,
  AgentId,
  AccuracyMetric,
  Prediction,
  PredictionComparison,
  generateId,
} from '@validation-council/shared';

// ============================================================================
// Types
// ============================================================================

export interface RecordedPrediction {
  id: string;
  validationId: string;
  agentId: AgentId;
  agentVersion: string;
  predictions: Prediction[];
  recordedAt: Date;
  evaluated: boolean;
  evaluatedAt?: Date;
  accuracy?: number;
}

export interface OutcomeData {
  validationId: string;
  outcomes: Array<{
    type: string;
    value: number | string | boolean;
    confidence: number;
    verifiedAt: Date;
    source: string;
  }>;
}

export interface AccuracyReport {
  agentId: AgentId;
  agentVersion: string;
  overallAccuracy: number;
  sampleSize: number;
  metrics: AccuracyMetric[];
  trend: 'improving' | 'stable' | 'declining';
  lastCalculated: Date;
}

export interface PredictionStorage {
  store(prediction: RecordedPrediction): Promise<void>;
  getByValidation(validationId: string): Promise<RecordedPrediction[]>;
  getByAgent(agentId: AgentId, version?: string): Promise<RecordedPrediction[]>;
  getUnevaluated(): Promise<RecordedPrediction[]>;
  update(id: string, data: Partial<RecordedPrediction>): Promise<void>;
}

// ============================================================================
// In-Memory Prediction Storage (for development)
// ============================================================================

export class InMemoryPredictionStorage implements PredictionStorage {
  private predictions: Map<string, RecordedPrediction> = new Map();

  async store(prediction: RecordedPrediction): Promise<void> {
    this.predictions.set(prediction.id, prediction);
  }

  async getByValidation(validationId: string): Promise<RecordedPrediction[]> {
    return Array.from(this.predictions.values()).filter(
      (p) => p.validationId === validationId
    );
  }

  async getByAgent(agentId: AgentId, version?: string): Promise<RecordedPrediction[]> {
    return Array.from(this.predictions.values()).filter(
      (p) => p.agentId === agentId && (!version || p.agentVersion === version)
    );
  }

  async getUnevaluated(): Promise<RecordedPrediction[]> {
    return Array.from(this.predictions.values()).filter((p) => !p.evaluated);
  }

  async update(id: string, data: Partial<RecordedPrediction>): Promise<void> {
    const existing = this.predictions.get(id);
    if (existing) {
      this.predictions.set(id, { ...existing, ...data });
    }
  }
}

// ============================================================================
// Accountability Tracker
// ============================================================================

export class AccountabilityTracker {
  private storage: PredictionStorage;
  private accuracyCache: Map<string, AccuracyReport> = new Map();
  private accuracyTargets: Map<AgentId, number>;

  constructor(storage?: PredictionStorage, accuracyTargets?: Map<AgentId, number>) {
    this.storage = storage || new InMemoryPredictionStorage();
    this.accuracyTargets = accuracyTargets || this.getDefaultAccuracyTargets();
  }

  /**
   * Record predictions from an agent output
   */
  async recordPrediction(output: AgentOutput): Promise<void> {
    const predictions = this.extractPredictions(output);

    const record: RecordedPrediction = {
      id: generateId('pred'),
      validationId: output.validationId,
      agentId: output.agentId as AgentId,
      agentVersion: output.agentVersion,
      predictions,
      recordedAt: new Date(),
      evaluated: false,
    };

    await this.storage.store(record);
  }

  /**
   * Evaluate predictions against actual outcomes
   */
  async evaluateOutcomes(outcomeData: OutcomeData): Promise<PredictionComparison[]> {
    const predictions = await this.storage.getByValidation(outcomeData.validationId);
    const comparisons: PredictionComparison[] = [];

    for (const record of predictions) {
      for (const prediction of record.predictions) {
        const outcome = outcomeData.outcomes.find((o) => o.type === prediction.type);

        if (outcome) {
          const accuracy = this.calculatePredictionAccuracy(
            prediction.value,
            outcome.value,
            prediction.type
          );

          const threshold = this.getThresholdForType(prediction.type);

          comparisons.push({
            validationId: outcomeData.validationId,
            agentId: record.agentId,
            predictionType: prediction.type,
            predictedValue: prediction.value,
            actualValue: outcome.value,
            accuracy,
            withinThreshold: accuracy >= threshold,
            threshold,
            comparisonDate: new Date(),
          });
        }
      }

      // Mark as evaluated
      await this.storage.update(record.id, {
        evaluated: true,
        evaluatedAt: new Date(),
      });
    }

    // Invalidate accuracy cache
    for (const comparison of comparisons) {
      this.accuracyCache.delete(comparison.agentId);
    }

    return comparisons;
  }

  /**
   * Calculate accuracy metrics for an agent
   */
  async calculateAccuracy(agentId: AgentId, version?: string): Promise<AccuracyReport> {
    const cacheKey = `${agentId}:${version || 'all'}`;
    const cached = this.accuracyCache.get(cacheKey);
    if (cached && Date.now() - cached.lastCalculated.getTime() < 3600000) {
      return cached;
    }

    const predictions = await this.storage.getByAgent(agentId, version);
    const evaluatedPredictions = predictions.filter((p) => p.evaluated);

    if (evaluatedPredictions.length === 0) {
      return {
        agentId,
        agentVersion: version || 'all',
        overallAccuracy: 0,
        sampleSize: 0,
        metrics: [],
        trend: 'stable',
        lastCalculated: new Date(),
      };
    }

    // Group predictions by type and calculate metrics
    const metricsByType = new Map<string, { accuracies: number[]; count: number }>();

    for (const record of evaluatedPredictions) {
      if (record.accuracy !== undefined) {
        // Note: In a real implementation, we'd have accuracy per prediction type
        // For now, use the overall record accuracy
        const key = 'overall';
        const existing = metricsByType.get(key) || { accuracies: [], count: 0 };
        existing.accuracies.push(record.accuracy);
        existing.count++;
        metricsByType.set(key, existing);
      }
    }

    const metrics: AccuracyMetric[] = [];
    let totalAccuracy = 0;
    let totalCount = 0;

    for (const [type, data] of metricsByType) {
      const avgAccuracy =
        data.accuracies.reduce((sum, a) => sum + a, 0) / data.accuracies.length;
      totalAccuracy += avgAccuracy * data.count;
      totalCount += data.count;

      metrics.push({
        metricId: generateId('metric'),
        agentId,
        agentVersion: version || 'all',
        metricType: type,
        metricValue: avgAccuracy,
        sampleSize: data.count,
        confidence: this.calculateConfidence(data.count),
        calculatedAt: new Date(),
      });
    }

    const overallAccuracy = totalCount > 0 ? totalAccuracy / totalCount : 0;

    const report: AccuracyReport = {
      agentId,
      agentVersion: version || 'all',
      overallAccuracy,
      sampleSize: evaluatedPredictions.length,
      metrics,
      trend: this.calculateTrend(agentId, overallAccuracy),
      lastCalculated: new Date(),
    };

    this.accuracyCache.set(cacheKey, report);
    return report;
  }

  /**
   * Get accuracy target for an agent
   */
  getAccuracyTarget(agentId: AgentId): number {
    return this.accuracyTargets.get(agentId) || 0.70;
  }

  /**
   * Check if agent meets accuracy target
   */
  async meetsAccuracyTarget(agentId: AgentId, version?: string): Promise<boolean> {
    const report = await this.calculateAccuracy(agentId, version);
    const target = this.getAccuracyTarget(agentId);
    return report.overallAccuracy >= target;
  }

  /**
   * Get agents with declining accuracy
   */
  async getDecliningAgents(): Promise<AgentId[]> {
    const declining: AgentId[] = [];

    for (const agentId of this.accuracyTargets.keys()) {
      const report = await this.calculateAccuracy(agentId);
      if (report.trend === 'declining') {
        declining.push(agentId);
      }
    }

    return declining;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Extract trackable predictions from agent output
   */
  private extractPredictions(output: AgentOutput): Prediction[] {
    const predictions: Prediction[] = [];

    // Add the overall score as a prediction
    predictions.push({
      type: 'score',
      value: output.score,
      confidence: output.confidence,
      reasoning: `Overall score from ${output.agentId}`,
    });

    // Extract specific predictions from findings
    for (const finding of output.findings) {
      if (finding.type === 'strength' || finding.type === 'weakness') {
        predictions.push({
          type: `finding:${finding.id}`,
          value: finding.type === 'strength',
          confidence: finding.confidence,
          reasoning: finding.description,
        });
      }
    }

    // Extract risk predictions
    for (const risk of output.risks) {
      predictions.push({
        type: `risk:${risk.id}`,
        value: risk.probability === 'high',
        confidence: risk.probability === 'high' ? 0.8 : risk.probability === 'medium' ? 0.5 : 0.3,
        reasoning: risk.description,
      });
    }

    return predictions;
  }

  /**
   * Calculate accuracy between predicted and actual values
   */
  private calculatePredictionAccuracy(
    predicted: number | string | boolean,
    actual: number | string | boolean,
    type: string
  ): number {
    // Boolean comparison
    if (typeof predicted === 'boolean' && typeof actual === 'boolean') {
      return predicted === actual ? 1 : 0;
    }

    // String comparison
    if (typeof predicted === 'string' && typeof actual === 'string') {
      return predicted.toLowerCase() === actual.toLowerCase() ? 1 : 0;
    }

    // Numeric comparison
    if (typeof predicted === 'number' && typeof actual === 'number') {
      if (actual === 0) return predicted === 0 ? 1 : 0;
      const percentError = Math.abs(predicted - actual) / Math.abs(actual);
      return Math.max(0, 1 - percentError);
    }

    return 0;
  }

  /**
   * Get accuracy threshold for a prediction type
   */
  private getThresholdForType(type: string): number {
    const thresholds: Record<string, number> = {
      score: 0.8, // Within 20% of actual
      market_size: 0.7, // Within 30% of actual
      burn_rate: 0.75, // Within 25% of actual
      timeline: 0.65, // Within 35% of actual
      default: 0.7,
    };

    return thresholds[type] || thresholds.default;
  }

  /**
   * Calculate confidence based on sample size
   */
  private calculateConfidence(sampleSize: number): number {
    // Simple confidence based on sample size
    // More sophisticated implementations would use statistical methods
    if (sampleSize < 5) return 0.3;
    if (sampleSize < 10) return 0.5;
    if (sampleSize < 30) return 0.7;
    if (sampleSize < 100) return 0.85;
    return 0.95;
  }

  /**
   * Calculate trend for an agent's accuracy
   */
  private calculateTrend(
    agentId: AgentId,
    currentAccuracy: number
  ): 'improving' | 'stable' | 'declining' {
    // Would compare with historical data in a real implementation
    // For now, compare with target
    const target = this.getAccuracyTarget(agentId);

    if (currentAccuracy > target * 1.1) return 'improving';
    if (currentAccuracy < target * 0.9) return 'declining';
    return 'stable';
  }

  /**
   * Get default accuracy targets for all agents
   */
  private getDefaultAccuracyTargets(): Map<AgentId, number> {
    return new Map([
      ['marcus', 0.70],
      ['sophia', 0.65],
      ['david', 0.75],
      ['elena', 0.85],
      ['james', 0.75],
      ['rachel', 0.90],
      ['omar', 0.75],
      ['nora', 0.70],
      ['victor', 0.75],
      ['victoria', 0.85],
    ]);
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createAccountabilityTracker(
  storage?: PredictionStorage,
  accuracyTargets?: Map<AgentId, number>
): AccountabilityTracker {
  return new AccountabilityTracker(storage, accuracyTargets);
}
