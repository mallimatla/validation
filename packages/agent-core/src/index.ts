/**
 * @validation-council/agent-core
 * Core agent framework for The Validation Council platform
 */

// Base Agent
export { BaseAgent, AgentInput, AgentEvent, AgentEventType, AgentEventHandler } from './base-agent';

// LLM Provider
export {
  LLMProvider,
  LLMRequest,
  LLMResponse,
  LLMUsageStats,
  LLMProviderConfig,
  MultiProviderLLM,
  createLLMProvider,
} from './llm-provider';

// Citation Manager
export {
  CitationManager,
  CreateCitationParams,
  VerificationResult,
  SnapshotStorage,
  InMemorySnapshotStorage,
  createCitationManager,
} from './citation-manager';

// Accountability Tracker
export {
  AccountabilityTracker,
  RecordedPrediction,
  OutcomeData,
  AccuracyReport,
  PredictionStorage,
  InMemoryPredictionStorage,
  createAccountabilityTracker,
} from './accountability-tracker';

// Agent Registry
export {
  AgentRegistry,
  AgentConstructor,
  RegisteredAgent,
  AgentRegistryConfig,
  getGlobalRegistry,
  setGlobalRegistry,
  createAgentRegistry,
} from './agent-registry';

// Re-export shared types commonly used with agents
export type {
  AgentConfig,
  AgentOutput,
  AgentStatus,
  AgentProgress,
  Citation,
  Finding,
  Risk,
  Recommendation,
  DataSource,
  AgentId,
} from '@validation-council/shared';
