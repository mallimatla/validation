/**
 * Audit Types for The Validation Council
 * These types define the audit trail and logging system
 */

import { AgentId } from './agent.types';

// ============================================================================
// Audit Event Types
// ============================================================================

export type AuditEventType =
  // Validation Lifecycle
  | 'validation_requested'
  | 'validation_started'
  | 'validation_completed'
  | 'validation_failed'
  | 'validation_cancelled'
  // Agent Lifecycle
  | 'agent_started'
  | 'agent_progress'
  | 'agent_completed'
  | 'agent_failed'
  | 'agent_timeout'
  | 'agent_retried'
  // Data Operations
  | 'data_fetched'
  | 'data_cached'
  | 'citation_created'
  | 'snapshot_stored'
  // Deliberation
  | 'deliberation_started'
  | 'deliberation_message'
  | 'deliberation_resolved'
  // Quality Gates
  | 'quality_check_passed'
  | 'quality_check_failed'
  | 'human_review_requested'
  // User Actions
  | 'challenge_submitted'
  | 'challenge_resolved'
  | 'refund_requested'
  | 'refund_processed'
  // System Events
  | 'system_error'
  | 'rate_limit_hit'
  | 'api_failure';

// ============================================================================
// Audit Event Interface
// ============================================================================

export interface AuditEvent {
  id: string;
  validationId: string;
  eventType: AuditEventType;
  agentId?: AgentId;
  timestamp: Date;
  data: AuditEventData;
  signature: string;
  previousEventId?: string; // Chain events together
  metadata?: Record<string, unknown>;
}

export type AuditEventData =
  | ValidationRequestedData
  | AgentStartedData
  | AgentCompletedData
  | AgentFailedData
  | DataFetchedData
  | CitationCreatedData
  | DeliberationData
  | QualityCheckData
  | ChallengeData
  | RefundData
  | SystemErrorData
  | GenericEventData;

export interface ValidationRequestedData {
  userId: string;
  ideaTitle: string;
  tier: string;
  requestedAgents?: AgentId[];
}

export interface AgentStartedData {
  agentId: AgentId;
  agentVersion: string;
  inputSummary: string;
}

export interface AgentCompletedData {
  agentId: AgentId;
  agentVersion: string;
  score: number;
  confidence: number;
  citationCount: number;
  executionTimeMs: number;
  tokenUsage: number;
}

export interface AgentFailedData {
  agentId: AgentId;
  agentVersion: string;
  errorType: string;
  errorMessage: string;
  retryCount: number;
  willRetry: boolean;
}

export interface DataFetchedData {
  source: string;
  url: string;
  success: boolean;
  responseTimeMs: number;
  cached: boolean;
  errorMessage?: string;
}

export interface CitationCreatedData {
  citationId: string;
  claim: string;
  source: string;
  sourceUrl: string;
  confidence: number;
}

export interface DeliberationData {
  deliberationId: string;
  topic: string;
  participants: AgentId[];
  outcome?: string;
}

export interface QualityCheckData {
  checkType: string;
  passed: boolean;
  details: string;
  threshold?: number;
  actualValue?: number;
}

export interface ChallengeData {
  challengeId: string;
  findingId: string;
  challengeReason: string;
  resolution?: string;
  accepted?: boolean;
}

export interface RefundData {
  refundId: string;
  reason: string;
  amount: number;
  approved: boolean;
  approverNotes?: string;
}

export interface SystemErrorData {
  errorType: string;
  errorMessage: string;
  stackTrace?: string;
  context?: Record<string, unknown>;
}

export interface GenericEventData {
  message: string;
  details?: Record<string, unknown>;
}

// ============================================================================
// Audit Trail Interface
// ============================================================================

export interface AuditTrail {
  validationId: string;
  events: AuditEvent[];
  startTime: Date;
  endTime?: Date;
  eventCount: number;
  agents: AgentId[];
  hasErrors: boolean;
  hasDeliberations: boolean;
}

// ============================================================================
// Audit Query Types
// ============================================================================

export interface AuditQuery {
  validationId?: string;
  agentId?: AgentId;
  eventTypes?: AuditEventType[];
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface AuditStats {
  totalEvents: number;
  eventsByType: Record<AuditEventType, number>;
  eventsByAgent: Record<AgentId, number>;
  errorRate: number;
  averageExecutionTime: number;
}

// ============================================================================
// Replay Types
// ============================================================================

export interface ReplayRequest {
  validationId: string;
  fromEventId?: string;
  toEventId?: string;
  dryRun: boolean;
}

export interface ReplayResult {
  validationId: string;
  eventsReplayed: number;
  success: boolean;
  differences: ReplayDifference[];
  newResult?: unknown;
}

export interface ReplayDifference {
  eventId: string;
  field: string;
  originalValue: unknown;
  replayValue: unknown;
  significance: 'critical' | 'major' | 'minor';
}
