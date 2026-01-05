/**
 * Validation Types for The Validation Council
 * These types define the validation workflow and results
 */

import { AgentOutput, AgentProgress, Citation, Finding, Risk, Recommendation, AgentId } from './agent.types';

// ============================================================================
// Validation Status Types
// ============================================================================

export type ValidationStatus =
  | 'pending'
  | 'queued'
  | 'processing'
  | 'awaiting_deliberation'
  | 'synthesizing'
  | 'complete'
  | 'failed'
  | 'cancelled';

export type ValidationTier = 'basic' | 'standard' | 'premium' | 'enterprise';

// ============================================================================
// Idea Input Types
// ============================================================================

export interface IdeaInput {
  title: string;
  description: string;
  problemStatement?: string;
  solution?: string;
  targetCustomer?: string;
  industry?: string;
  businessModel?: string;
  stage: IdeaStage;
  geography?: string[];
  attachments?: IdeaAttachment[];
  founderProvided?: FounderProvidedData;
}

export type IdeaStage =
  | 'idea'
  | 'validation'
  | 'mvp'
  | 'pre_seed'
  | 'seed'
  | 'series_a'
  | 'growth';

export interface IdeaAttachment {
  id: string;
  type: 'pitch_deck' | 'financial_model' | 'interview_transcript' | 'analytics' | 'other';
  filename: string;
  url: string;
  mimeType: string;
  uploadedAt: Date;
}

export interface FounderProvidedData {
  marketSize?: {
    tam?: number;
    sam?: number;
    som?: number;
    source?: string;
  };
  competitors?: string[];
  financials?: {
    cac?: number;
    ltv?: number;
    burnRate?: number;
    runway?: number;
    revenue?: number;
  };
  customerData?: {
    interviewCount?: number;
    preorders?: number;
    waitlistSize?: number;
    conversionRate?: number;
  };
  teamInfo?: {
    founderCount?: number;
    teamSize?: number;
    founderLinkedIns?: string[];
  };
}

// ============================================================================
// Validation Request Types
// ============================================================================

export interface ValidationRequest {
  id: string;
  userId: string;
  idea: IdeaInput;
  tier: ValidationTier;
  priority: 'normal' | 'high' | 'urgent';
  requestedAgents?: AgentId[];
  createdAt: Date;
}

// ============================================================================
// Validation Result Types
// ============================================================================

export type ValidationVerdict = 'GREEN' | 'YELLOW' | 'RED';

export interface ValidationResult {
  id: string;
  requestId: string;
  userId: string;
  idea: IdeaInput;
  status: ValidationStatus;

  // Overall Results
  overallScore?: number;
  overallConfidence?: number;
  verdict?: ValidationVerdict;

  // Agent Reports
  agentReports: AgentOutput[];

  // Synthesized Results
  keyFindings?: Finding[];
  topRisks?: Risk[];
  criticalRecommendations?: Recommendation[];

  // Fatal Flaws
  fatalFlaws?: FatalFlaw[];

  // 90-Day Plan
  ninetyDayPlan?: NinetyDayPlan;

  // Success Probability
  successProbability?: SuccessProbability;

  // Timestamps
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;

  // Metadata
  executionTimeMs?: number;
  totalTokenUsage?: number;
  totalCost?: number;
}

// ============================================================================
// Fatal Flaw Types
// ============================================================================

export type FatalFlawCategory =
  | 'no_market'
  | 'no_differentiation'
  | 'unsustainable_economics'
  | 'legal_blocker'
  | 'technical_impossibility'
  | 'team_mismatch'
  | 'timing_wrong';

export interface FatalFlaw {
  id: string;
  category: FatalFlawCategory;
  title: string;
  description: string;
  evidence: Citation[];
  agentSource: AgentId;
  canBeMitigated: boolean;
  mitigation?: string;
}

// ============================================================================
// 90-Day Plan Types
// ============================================================================

export interface NinetyDayPlan {
  phases: PlanPhase[];
  milestones: Milestone[];
  validationGates: ValidationGate[];
  estimatedCost: number;
  criticalPath: string[];
}

export interface PlanPhase {
  phase: number; // 1, 2, or 3 (30-day phases)
  title: string;
  objectives: string[];
  tasks: PlanTask[];
  expectedOutcomes: string[];
}

export interface PlanTask {
  id: string;
  title: string;
  description: string;
  phase: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'validation' | 'development' | 'marketing' | 'operations' | 'fundraising';
  estimatedHours?: number;
  dependencies?: string[];
}

export interface Milestone {
  id: string;
  title: string;
  day: number;
  criteria: string[];
  isGate: boolean;
}

export interface ValidationGate {
  id: string;
  title: string;
  day: number;
  criteria: GateCriteria[];
  passAction: string;
  failAction: string;
}

export interface GateCriteria {
  metric: string;
  target: string;
  importance: 'must_have' | 'should_have' | 'nice_to_have';
}

// ============================================================================
// Success Probability Types
// ============================================================================

export interface SuccessProbability {
  overallProbability: number; // 0-100
  confidenceInterval: {
    low: number;
    high: number;
  };
  breakdown: ProbabilityBreakdown[];
  comparableOutcomes: ComparableOutcome[];
  methodology: string;
}

export interface ProbabilityBreakdown {
  factor: string;
  weight: number;
  score: number;
  contribution: number;
}

export interface ComparableOutcome {
  companyName: string;
  similarity: number;
  outcome: 'success' | 'failure' | 'pivot' | 'acquired';
  details: string;
  source: string;
}

// ============================================================================
// Deliberation Types
// ============================================================================

export interface Deliberation {
  id: string;
  validationId: string;
  topic: string;
  triggerReason: string;
  initiatingAgent: AgentId;
  respondingAgents: AgentId[];
  transcript: DeliberationMessage[];
  resolution: DeliberationResolution;
  createdAt: Date;
  completedAt?: Date;
}

export interface DeliberationMessage {
  agentId: AgentId;
  message: string;
  evidence?: Citation[];
  timestamp: Date;
}

export interface DeliberationResolution {
  outcome: 'consensus' | 'majority' | 'expert_override' | 'unresolved';
  finalPosition: string;
  adjustments: ScoreAdjustment[];
  reasoning: string;
}

export interface ScoreAdjustment {
  agentId: AgentId;
  originalScore: number;
  adjustedScore: number;
  reason: string;
}

// ============================================================================
// Validation Progress Types
// ============================================================================

export interface ValidationProgress {
  validationId: string;
  status: ValidationStatus;
  overallProgress: number; // 0-100
  currentPhase: 'initialization' | 'data_gathering' | 'analysis' | 'deliberation' | 'synthesis' | 'finalization';
  agentProgress: AgentProgress[];
  estimatedCompletion?: Date;
  lastUpdated: Date;
}
