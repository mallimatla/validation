/**
 * Core Agent Types for The Validation Council
 * These types define the contract for all agents in the system
 */

// ============================================================================
// Data Source Types
// ============================================================================

export interface DataSource {
  id: string;
  name: string;
  type: 'api' | 'scraper' | 'database' | 'file' | 'manual';
  reliability: number; // 1-10
  updateFrequency: 'realtime' | 'daily' | 'weekly' | 'monthly' | 'static';
  requiresAuth: boolean;
  rateLimitPerMinute?: number;
}

// ============================================================================
// Scoring Types
// ============================================================================

export interface ScoringCriteria {
  name: string;
  description: string;
  weight: number;
  minScore: number;
  maxScore: number;
}

export interface ScoringRubric {
  criteria: ScoringCriteria[];
  thresholds: {
    excellent: number;  // 9-10
    good: number;       // 7-8
    fair: number;       // 5-6
    poor: number;       // 3-4
    critical: number;   // 1-2
  };
}

// ============================================================================
// Accountability Types
// ============================================================================

export interface AccountabilityConfig {
  trackAccuracy: boolean;
  accuracyMetrics: string[];
  refundEligible: boolean;
  humanReviewThreshold: number;
  targetAccuracy: number;
}

export interface AccuracyMetric {
  metricId: string;
  agentId: string;
  agentVersion: string;
  metricType: string;
  metricValue: number;
  sampleSize: number;
  confidence: number;
  calculatedAt: Date;
}

// ============================================================================
// Agent Configuration Types
// ============================================================================

export interface AgentConfig {
  id: string;
  name: string;
  role: string;
  version: string;
  description: string;
  personality: string;
  scoringWeight: number;
  dataSources: DataSource[];
  scoringRubric: ScoringRubric;
  accountability: AccountabilityConfig;
  systemPrompt: string;
  capabilities: string[];
  dependencies: string[]; // Other agents this depends on
}

// ============================================================================
// Citation & Evidence Types
// ============================================================================

export type DataType = 'primary' | 'secondary' | 'computed';

export interface Citation {
  id: string;
  claim: string;
  source: string;
  sourceUrl: string;
  snapshotUrl: string;
  snapshotHash: string;
  retrievedAt: Date;
  confidence: number;
  dataType: DataType;
  isValid: boolean;
  lastVerified?: Date;
}

export interface Snapshot {
  id: string;
  originalUrl: string;
  content: string;
  contentType: 'html' | 'json' | 'pdf' | 'text' | 'image';
  contentHash: string;
  capturedAt: Date;
  expiresAt: Date;
  storageUrl: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Finding Types
// ============================================================================

export type FindingSeverity = 'critical' | 'major' | 'minor' | 'info';
export type FindingType = 'strength' | 'weakness' | 'opportunity' | 'threat' | 'neutral';

export interface Finding {
  id: string;
  title: string;
  description: string;
  type: FindingType;
  severity: FindingSeverity;
  evidence: Citation[];
  confidence: number;
  agentId: string;
}

// ============================================================================
// Risk Types
// ============================================================================

export type RiskCategory =
  | 'market'
  | 'competition'
  | 'financial'
  | 'execution'
  | 'legal'
  | 'technical'
  | 'team'
  | 'timing';

export type RiskProbability = 'high' | 'medium' | 'low';
export type RiskImpact = 'critical' | 'major' | 'moderate' | 'minor';

export interface Risk {
  id: string;
  title: string;
  description: string;
  category: RiskCategory;
  probability: RiskProbability;
  impact: RiskImpact;
  mitigations: string[];
  evidence: Citation[];
  agentId: string;
}

// ============================================================================
// Recommendation Types
// ============================================================================

export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low';
export type RecommendationTimeframe = 'immediate' | 'short-term' | 'medium-term' | 'long-term';

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: RecommendationPriority;
  timeframe: RecommendationTimeframe;
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  dependencies?: string[];
  agentId: string;
}

// ============================================================================
// Agent Output Types
// ============================================================================

export interface AgentOutput {
  agentId: string;
  agentVersion: string;
  validationId: string;
  timestamp: Date;
  score: number;
  confidence: number;
  findings: Finding[];
  citations: Citation[];
  risks: Risk[];
  recommendations: Recommendation[];
  rawAnalysis: string;
  deliberationNotes?: string;
  signature: string;
  executionTimeMs: number;
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  };
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Agent Status Types
// ============================================================================

export type AgentStatus =
  | 'idle'
  | 'initializing'
  | 'running'
  | 'waiting_for_data'
  | 'processing'
  | 'deliberating'
  | 'complete'
  | 'failed'
  | 'timeout';

export interface AgentProgress {
  agentId: string;
  status: AgentStatus;
  progress: number; // 0-100
  currentStep: string;
  startedAt: Date;
  estimatedCompletion?: Date;
  error?: string;
}

// ============================================================================
// Agent Registry Types
// ============================================================================

export const AGENT_IDS = {
  ARIA: 'aria',
  MARCUS: 'marcus',
  SOPHIA: 'sophia',
  DAVID: 'david',
  ELENA: 'elena',
  JAMES: 'james',
  RACHEL: 'rachel',
  OMAR: 'omar',
  NORA: 'nora',
  VICTOR: 'victor',
  VICTORIA: 'victoria',
  SENTINEL: 'sentinel',
} as const;

export type AgentId = typeof AGENT_IDS[keyof typeof AGENT_IDS];

export const AGENT_WEIGHTS: Record<AgentId, number> = {
  aria: 0,      // Orchestrator, doesn't score
  marcus: 1.0,  // Market Intelligence
  sophia: 1.2,  // Competition
  david: 1.5,   // Financial
  elena: 2.0,   // Customer Validation (highest weight)
  james: 1.5,   // Team
  rachel: 0.8,  // Legal/Risk
  omar: 1.0,    // Technology
  nora: 0.8,    // Funding
  victor: 1.0,  // Valuation (separate report)
  victoria: 0,  // Synthesizer, doesn't have own score
  sentinel: 0,  // Trust/Audit, doesn't score
};
