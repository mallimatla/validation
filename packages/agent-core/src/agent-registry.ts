/**
 * AgentRegistry - Central registry for all agents in The Validation Council
 *
 * Features:
 * - Agent registration and discovery
 * - Version management
 * - Agent instantiation with dependencies
 * - Configuration validation
 */

import {
  AgentConfig,
  AgentId,
  AGENT_WEIGHTS,
  AGENT_NAMES,
  AGENT_ROLES,
} from '@validation-council/shared';
import { BaseAgent } from './base-agent';
import { LLMProvider, createLLMProvider } from './llm-provider';
import { CitationManager, createCitationManager } from './citation-manager';
import { AccountabilityTracker, createAccountabilityTracker } from './accountability-tracker';

// ============================================================================
// Types
// ============================================================================

export type AgentConstructor = new (
  config: AgentConfig,
  llmProvider: LLMProvider,
  citationManager: CitationManager,
  accountabilityTracker: AccountabilityTracker
) => BaseAgent;

export interface RegisteredAgent {
  id: AgentId;
  name: string;
  role: string;
  version: string;
  constructor: AgentConstructor;
  config: AgentConfig;
}

export interface AgentRegistryConfig {
  llmProvider?: LLMProvider;
  citationManager?: CitationManager;
  accountabilityTracker?: AccountabilityTracker;
}

// ============================================================================
// Agent Registry
// ============================================================================

export class AgentRegistry {
  private agents: Map<AgentId, RegisteredAgent> = new Map();
  private llmProvider: LLMProvider;
  private citationManager: CitationManager;
  private accountabilityTracker: AccountabilityTracker;

  constructor(config?: AgentRegistryConfig) {
    this.llmProvider = config?.llmProvider || createLLMProvider();
    this.citationManager = config?.citationManager || createCitationManager();
    this.accountabilityTracker =
      config?.accountabilityTracker || createAccountabilityTracker();
  }

  /**
   * Register an agent with the registry
   */
  register(
    id: AgentId,
    constructor: AgentConstructor,
    config: Partial<AgentConfig>
  ): void {
    // Build full config with defaults
    const fullConfig: AgentConfig = {
      id,
      name: config.name || AGENT_NAMES[id] || id,
      role: config.role || AGENT_ROLES[id] || 'Agent',
      version: config.version || '1.0.0',
      description: config.description || '',
      personality: config.personality || '',
      scoringWeight: config.scoringWeight ?? AGENT_WEIGHTS[id] ?? 1.0,
      dataSources: config.dataSources || [],
      scoringRubric: config.scoringRubric || this.getDefaultScoringRubric(),
      accountability: config.accountability || this.getDefaultAccountability(),
      systemPrompt: config.systemPrompt || '',
      capabilities: config.capabilities || [],
      dependencies: config.dependencies || [],
    };

    // Validate config
    this.validateConfig(fullConfig);

    const registered: RegisteredAgent = {
      id,
      name: fullConfig.name,
      role: fullConfig.role,
      version: fullConfig.version,
      constructor,
      config: fullConfig,
    };

    this.agents.set(id, registered);
  }

  /**
   * Get a registered agent by ID
   */
  get(id: AgentId): RegisteredAgent | undefined {
    return this.agents.get(id);
  }

  /**
   * Check if an agent is registered
   */
  has(id: AgentId): boolean {
    return this.agents.has(id);
  }

  /**
   * Get all registered agents
   */
  getAll(): RegisteredAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get all agent IDs
   */
  getAllIds(): AgentId[] {
    return Array.from(this.agents.keys());
  }

  /**
   * Get agents by capability
   */
  getByCapability(capability: string): RegisteredAgent[] {
    return Array.from(this.agents.values()).filter((a) =>
      a.config.capabilities.includes(capability)
    );
  }

  /**
   * Create an instance of an agent
   */
  createInstance(id: AgentId): BaseAgent {
    const registered = this.agents.get(id);
    if (!registered) {
      throw new Error(`Agent not registered: ${id}`);
    }

    return new registered.constructor(
      registered.config,
      this.llmProvider,
      this.citationManager,
      this.accountabilityTracker
    );
  }

  /**
   * Create instances of multiple agents
   */
  createInstances(ids: AgentId[]): Map<AgentId, BaseAgent> {
    const instances = new Map<AgentId, BaseAgent>();

    for (const id of ids) {
      instances.set(id, this.createInstance(id));
    }

    return instances;
  }

  /**
   * Get agent dependencies (for execution ordering)
   */
  getDependencies(id: AgentId): AgentId[] {
    const registered = this.agents.get(id);
    return registered?.config.dependencies.map((d) => d as AgentId) || [];
  }

  /**
   * Build execution order respecting dependencies
   */
  buildExecutionOrder(ids: AgentId[]): AgentId[] {
    const ordered: AgentId[] = [];
    const visited = new Set<AgentId>();
    const visiting = new Set<AgentId>();

    const visit = (id: AgentId) => {
      if (visited.has(id)) return;
      if (visiting.has(id)) {
        throw new Error(`Circular dependency detected for agent: ${id}`);
      }

      visiting.add(id);

      const deps = this.getDependencies(id);
      for (const dep of deps) {
        if (ids.includes(dep)) {
          visit(dep);
        }
      }

      visiting.delete(id);
      visited.add(id);
      ordered.push(id);
    };

    for (const id of ids) {
      visit(id);
    }

    return ordered;
  }

  /**
   * Get total scoring weight for a set of agents
   */
  getTotalWeight(ids: AgentId[]): number {
    return ids.reduce((sum, id) => {
      const registered = this.agents.get(id);
      return sum + (registered?.config.scoringWeight ?? 0);
    }, 0);
  }

  /**
   * Unregister an agent
   */
  unregister(id: AgentId): boolean {
    return this.agents.delete(id);
  }

  /**
   * Clear all registrations
   */
  clear(): void {
    this.agents.clear();
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Validate agent configuration
   */
  private validateConfig(config: AgentConfig): void {
    if (!config.id) {
      throw new Error('Agent config must have an id');
    }
    if (!config.version) {
      throw new Error('Agent config must have a version');
    }
    // Additional validation can be added here
  }

  /**
   * Get default scoring rubric
   */
  private getDefaultScoringRubric() {
    return {
      criteria: [
        {
          name: 'Analysis Quality',
          description: 'Quality and depth of analysis',
          weight: 1,
          minScore: 1,
          maxScore: 10,
        },
      ],
      thresholds: {
        excellent: 9,
        good: 7,
        fair: 5,
        poor: 3,
        critical: 1,
      },
    };
  }

  /**
   * Get default accountability config
   */
  private getDefaultAccountability() {
    return {
      trackAccuracy: true,
      accuracyMetrics: ['score', 'predictions'],
      refundEligible: false,
      humanReviewThreshold: 4,
      targetAccuracy: 0.70,
    };
  }
}

// ============================================================================
// Global Registry Instance
// ============================================================================

let globalRegistry: AgentRegistry | null = null;

export function getGlobalRegistry(): AgentRegistry {
  if (!globalRegistry) {
    globalRegistry = new AgentRegistry();
  }
  return globalRegistry;
}

export function setGlobalRegistry(registry: AgentRegistry): void {
  globalRegistry = registry;
}

// ============================================================================
// Factory Function
// ============================================================================

export function createAgentRegistry(config?: AgentRegistryConfig): AgentRegistry {
  return new AgentRegistry(config);
}
