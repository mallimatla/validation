/**
 * Outcome Tracking Types for The Validation Council
 * These types define how we track and measure prediction accuracy
 */

import { AgentId } from './agent.types';

// ============================================================================
// Outcome Types
// ============================================================================

export type OutcomeType =
  | 'funded'
  | 'pmf_achieved'
  | 'profitable'
  | 'acquired'
  | 'ipo'
  | 'pivoted'
  | 'shutdown'
  | 'still_operating'
  | 'unknown';

export type OutcomeVerificationSource =
  | 'crunchbase'
  | 'linkedin'
  | 'news_article'
  | 'founder_survey'
  | 'sec_filing'
  | 'press_release'
  | 'manual_verification';

// ============================================================================
// Outcome Interface
// ============================================================================

export interface Outcome {
  id: string;
  validationId: string;
  outcomeType: OutcomeType;
  outcomeDate?: Date;
  verified: boolean;
  verificationSource?: OutcomeVerificationSource;
  verificationUrl?: string;
  details: OutcomeDetails;
  reportedAt: Date;
  verifiedAt?: Date;
  verifiedBy?: string;
}

export interface OutcomeDetails {
  // Funding outcomes
  fundingAmount?: number;
  fundingRound?: string;
  investors?: string[];
  valuation?: number;

  // Acquisition outcomes
  acquirer?: string;
  acquisitionPrice?: number;

  // Operating outcomes
  revenue?: number;
  employees?: number;
  customers?: number;

  // Shutdown outcomes
  shutdownReason?: string;
  burnedCapital?: number;

  // Additional context
  notes?: string;
}

// ============================================================================
// Follow-up Types
// ============================================================================

export type FollowUpStatus = 'scheduled' | 'sent' | 'responded' | 'expired' | 'cancelled';

export interface FollowUp {
  id: string;
  validationId: string;
  userId: string;
  scheduledFor: Date;
  status: FollowUpStatus;
  monthsAfterValidation: number;
  sentAt?: Date;
  respondedAt?: Date;
  response?: FollowUpResponse;
}

export interface FollowUpResponse {
  outcomeType: OutcomeType;
  details?: Partial<OutcomeDetails>;
  feedback?: string;
  willingToShareMore: boolean;
}

// ============================================================================
// Accuracy Tracking Types
// ============================================================================

export interface AgentAccuracyMetrics {
  agentId: AgentId;
  agentVersion: string;
  metrics: AccuracyMetric[];
  overallAccuracy: number;
  sampleSize: number;
  lastCalculated: Date;
  trend: 'improving' | 'stable' | 'declining';
}

export interface AccuracyMetric {
  metricId: string;
  metricType: string;
  description: string;
  targetValue: number;
  actualValue: number;
  sampleSize: number;
  confidence: number;
  passesTarget: boolean;
}

// ============================================================================
// Platform Statistics Types
// ============================================================================

export interface PlatformStats {
  // Volume stats
  totalValidations: number;
  validationsLast30Days: number;
  validationsLast7Days: number;

  // Outcome stats
  outcomesCollected: number;
  outcomeCollectionRate: number;
  averageFollowUpResponseRate: number;

  // Accuracy stats
  overallPlatformAccuracy: number;
  agentAccuracies: Record<AgentId, number>;
  accuracyTrend: 'improving' | 'stable' | 'declining';

  // Quality stats
  averageCitationsPerValidation: number;
  deliberationRate: number;
  humanReviewRate: number;

  // Outcome distribution
  outcomeDistribution: Record<OutcomeType, number>;
  successRate: number;

  // Trust metrics
  refundRate: number;
  challengeRate: number;
  challengeSuccessRate: number;

  // Last updated
  calculatedAt: Date;
}

// ============================================================================
// Prediction vs Actual Types
// ============================================================================

export interface PredictionComparison {
  validationId: string;
  agentId: AgentId;
  predictionType: string;
  predictedValue: number | string;
  actualValue?: number | string;
  accuracy?: number;
  withinThreshold: boolean;
  threshold: number;
  comparisonDate?: Date;
}

export interface AgentPredictionRecord {
  agentId: AgentId;
  agentVersion: string;
  validationId: string;
  predictions: Prediction[];
  outcomes?: Prediction[];
  evaluated: boolean;
  evaluatedAt?: Date;
}

export interface Prediction {
  type: string;
  value: number | string | boolean;
  confidence: number;
  reasoning?: string;
}

// ============================================================================
// Refund Types
// ============================================================================

export type RefundStatus = 'requested' | 'under_review' | 'approved' | 'denied' | 'processed';

export interface RefundRequest {
  id: string;
  validationId: string;
  userId: string;
  reason: string;
  evidence?: string;
  claimedInaccuracy?: ClaimedInaccuracy[];
  amount: number;
  status: RefundStatus;
  requestedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewNotes?: string;
  processedAt?: Date;
}

export interface ClaimedInaccuracy {
  agentId: AgentId;
  findingId: string;
  claim: string;
  actualResult: string;
  evidence?: string;
}

// ============================================================================
// Trust Dashboard Types
// ============================================================================

export interface TrustDashboard {
  platformHealth: 'excellent' | 'good' | 'fair' | 'poor';
  stats: PlatformStats;
  agentHealth: AgentHealthStatus[];
  recentIssues: TrustIssue[];
  lastUpdated: Date;
}

export interface AgentHealthStatus {
  agentId: AgentId;
  version: string;
  health: 'healthy' | 'degraded' | 'unhealthy';
  accuracy: number;
  targetAccuracy: number;
  trend: 'improving' | 'stable' | 'declining';
  lastEvaluated: Date;
  issueCount: number;
}

export interface TrustIssue {
  id: string;
  type: 'accuracy_drop' | 'high_refund_rate' | 'data_source_failure' | 'citation_invalid' | 'bias_detected';
  severity: 'critical' | 'major' | 'minor';
  agentId?: AgentId;
  description: string;
  detectedAt: Date;
  resolvedAt?: Date;
  resolution?: string;
}
