/**
 * BaseAgent - Abstract base class for all agents in The Validation Council
 *
 * This class provides the core functionality that all agents must implement:
 * - LLM integration (Claude/OpenAI)
 * - Citation management
 * - Scoring standardization
 * - Accountability tracking
 * - Audit logging
 */

import {
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
import { generateId, hashContent, generateSignature } from '@validation-council/shared';
import { LLMProvider, LLMResponse } from './llm-provider';
import { CitationManager } from './citation-manager';
import { AccountabilityTracker } from './accountability-tracker';

// ============================================================================
// Agent Input Type
// ============================================================================

export interface AgentInput {
  validationId: string;
  ideaTitle: string;
  ideaDescription: string;
  problemStatement?: string;
  solution?: string;
  targetCustomer?: string;
  industry?: string;
  businessModel?: string;
  stage?: string;
  geography?: string[];
  founderData?: Record<string, unknown>;
  attachments?: Array<{ type: string; url: string; content?: string }>;
  previousAgentOutputs?: AgentOutput[];
  context?: Record<string, unknown>;
}

// ============================================================================
// Agent Events
// ============================================================================

export type AgentEventType =
  | 'started'
  | 'progress'
  | 'data_fetched'
  | 'llm_called'
  | 'citation_added'
  | 'finding_added'
  | 'completed'
  | 'failed';

export interface AgentEvent {
  type: AgentEventType;
  agentId: AgentId;
  timestamp: Date;
  data?: Record<string, unknown>;
}

export type AgentEventHandler = (event: AgentEvent) => void;

// ============================================================================
// Abstract Base Agent Class
// ============================================================================

export abstract class BaseAgent {
  protected config: AgentConfig;
  protected llmProvider: LLMProvider;
  protected citationManager: CitationManager;
  protected accountabilityTracker: AccountabilityTracker;
  protected eventHandlers: AgentEventHandler[] = [];

  // State
  protected status: AgentStatus = 'idle';
  protected progress: number = 0;
  protected currentStep: string = '';
  protected startTime?: Date;

  // Results accumulator
  protected citations: Citation[] = [];
  protected findings: Finding[] = [];
  protected risks: Risk[] = [];
  protected recommendations: Recommendation[] = [];

  constructor(
    config: AgentConfig,
    llmProvider: LLMProvider,
    citationManager: CitationManager,
    accountabilityTracker: AccountabilityTracker
  ) {
    this.config = config;
    this.llmProvider = llmProvider;
    this.citationManager = citationManager;
    this.accountabilityTracker = accountabilityTracker;
  }

  // ============================================================================
  // Abstract Methods - Must be implemented by each agent
  // ============================================================================

  /**
   * Main analysis method - each agent implements their specific analysis logic
   */
  protected abstract analyze(input: AgentInput): Promise<void>;

  /**
   * Generate the system prompt for this agent
   */
  protected abstract getSystemPrompt(): string;

  /**
   * Generate the analysis prompt with the specific input
   */
  protected abstract getAnalysisPrompt(input: AgentInput): string;

  /**
   * Calculate the score based on findings and analysis
   */
  protected abstract calculateScore(): number;

  /**
   * Calculate confidence level based on data quality
   */
  protected abstract calculateConfidence(): number;

  // ============================================================================
  // Public Methods
  // ============================================================================

  /**
   * Execute the agent analysis
   */
  async execute(input: AgentInput): Promise<AgentOutput> {
    this.startTime = new Date();
    this.status = 'initializing';
    this.progress = 0;

    // Reset results
    this.citations = [];
    this.findings = [];
    this.risks = [];
    this.recommendations = [];

    try {
      this.emit('started', { input: { validationId: input.validationId } });

      // Run the analysis
      this.status = 'running';
      await this.analyze(input);

      // Calculate final score and confidence
      const score = this.calculateScore();
      const confidence = this.calculateConfidence();

      // Validate output meets quality standards
      await this.validateOutput();

      // Build the output
      const output = await this.buildOutput(input.validationId, score, confidence);

      this.status = 'complete';
      this.progress = 100;

      this.emit('completed', { output });

      // Track for accountability
      await this.accountabilityTracker.recordPrediction(output);

      return output;
    } catch (error) {
      this.status = 'failed';
      this.emit('failed', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Get current progress
   */
  getProgress(): AgentProgress {
    return {
      agentId: this.config.id as AgentId,
      status: this.status,
      progress: this.progress,
      currentStep: this.currentStep,
      startedAt: this.startTime || new Date(),
      estimatedCompletion: this.estimateCompletion(),
    };
  }

  /**
   * Register event handler
   */
  onEvent(handler: AgentEventHandler): void {
    this.eventHandlers.push(handler);
  }

  /**
   * Get agent configuration
   */
  getConfig(): AgentConfig {
    return this.config;
  }

  // ============================================================================
  // Protected Helper Methods
  // ============================================================================

  /**
   * Update progress and emit event
   */
  protected updateProgress(progress: number, step: string): void {
    this.progress = progress;
    this.currentStep = step;
    this.emit('progress', { progress, step });
  }

  /**
   * Call the LLM with retry logic
   */
  protected async callLLM(
    systemPrompt: string,
    userPrompt: string,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<LLMResponse> {
    this.status = 'processing';

    const response = await this.llmProvider.complete({
      systemPrompt,
      userPrompt,
      model: 'claude-3-5-sonnet-20241022',
      temperature: options?.temperature ?? 0.3,
      maxTokens: options?.maxTokens ?? 4096,
    });

    this.emit('llm_called', {
      inputTokens: response.usage.inputTokens,
      outputTokens: response.usage.outputTokens,
    });

    return response;
  }

  /**
   * Fetch data from a data source
   */
  protected async fetchData<T>(
    source: DataSource,
    query: string,
    fetcher: () => Promise<T>
  ): Promise<{ data: T | null; citation: Citation | null }> {
    this.status = 'waiting_for_data';

    try {
      const data = await fetcher();

      const citation = await this.citationManager.createCitation({
        claim: query,
        source: source.name,
        sourceUrl: source.id,
        confidence: source.reliability / 10,
        dataType: 'primary',
      });

      this.citations.push(citation);

      this.emit('data_fetched', {
        source: source.name,
        success: true,
      });

      return { data, citation };
    } catch (error) {
      this.emit('data_fetched', {
        source: source.name,
        success: false,
        error: (error as Error).message,
      });

      return { data: null, citation: null };
    }
  }

  /**
   * Add a finding with citations
   */
  protected addFinding(finding: Omit<Finding, 'id' | 'agentId'>): void {
    const fullFinding: Finding = {
      ...finding,
      id: generateId('finding'),
      agentId: this.config.id,
    };

    this.findings.push(fullFinding);
    this.emit('finding_added', { finding: fullFinding });
  }

  /**
   * Add a risk with citations
   */
  protected addRisk(risk: Omit<Risk, 'id' | 'agentId'>): void {
    const fullRisk: Risk = {
      ...risk,
      id: generateId('risk'),
      agentId: this.config.id,
    };

    this.risks.push(fullRisk);
  }

  /**
   * Add a recommendation
   */
  protected addRecommendation(recommendation: Omit<Recommendation, 'id' | 'agentId'>): void {
    const fullRecommendation: Recommendation = {
      ...recommendation,
      id: generateId('rec'),
      agentId: this.config.id,
    };

    this.recommendations.push(fullRecommendation);
  }

  /**
   * Create a citation for a claim
   */
  protected async addCitation(params: {
    claim: string;
    source: string;
    sourceUrl: string;
    confidence: number;
    dataType: 'primary' | 'secondary' | 'computed';
  }): Promise<Citation> {
    const citation = await this.citationManager.createCitation(params);
    this.citations.push(citation);
    this.emit('citation_added', { citation });
    return citation;
  }

  /**
   * Emit an event
   */
  protected emit(type: AgentEventType, data?: Record<string, unknown>): void {
    const event: AgentEvent = {
      type,
      agentId: this.config.id as AgentId,
      timestamp: new Date(),
      data,
    };

    for (const handler of this.eventHandlers) {
      try {
        handler(event);
      } catch (error) {
        console.error('Error in event handler:', error);
      }
    }
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Validate output meets quality standards
   */
  private async validateOutput(): Promise<void> {
    // Check minimum citations
    const minCitations = 3; // From constants
    if (this.citations.length < minCitations) {
      console.warn(
        `Agent ${this.config.id} has only ${this.citations.length} citations (minimum: ${minCitations})`
      );
    }

    // Verify all citations are valid
    for (const citation of this.citations) {
      const isValid = await this.citationManager.verifyCitation(citation.id);
      if (!isValid) {
        console.warn(`Citation ${citation.id} failed verification`);
      }
    }
  }

  /**
   * Build the final output object
   */
  private async buildOutput(
    validationId: string,
    score: number,
    confidence: number
  ): Promise<AgentOutput> {
    const executionTimeMs = this.startTime
      ? Date.now() - this.startTime.getTime()
      : 0;

    // Get LLM usage stats
    const tokenUsage = this.llmProvider.getUsageStats();

    // Build raw analysis summary
    const rawAnalysis = this.buildRawAnalysis();

    // Create output object
    const outputData: Omit<AgentOutput, 'signature'> = {
      agentId: this.config.id,
      agentVersion: this.config.version,
      validationId,
      timestamp: new Date(),
      score,
      confidence,
      findings: this.findings,
      citations: this.citations,
      risks: this.risks,
      recommendations: this.recommendations,
      rawAnalysis,
      executionTimeMs,
      tokenUsage: {
        input: tokenUsage.inputTokens,
        output: tokenUsage.outputTokens,
        total: tokenUsage.totalTokens,
      },
    };

    // Generate signature for tamper detection
    const signature = generateSignature(
      JSON.stringify(outputData),
      process.env.AGENT_SIGNING_SECRET || 'development-secret'
    );

    return {
      ...outputData,
      signature,
    };
  }

  /**
   * Build raw analysis summary
   */
  private buildRawAnalysis(): string {
    const sections = [
      `## ${this.config.name} - ${this.config.role}`,
      `Version: ${this.config.version}`,
      '',
      `### Key Findings (${this.findings.length})`,
      ...this.findings.map((f) => `- **${f.title}**: ${f.description}`),
      '',
      `### Identified Risks (${this.risks.length})`,
      ...this.risks.map((r) => `- **${r.title}** [${r.probability}/${r.impact}]: ${r.description}`),
      '',
      `### Recommendations (${this.recommendations.length})`,
      ...this.recommendations.map((r) => `- **${r.title}** [${r.priority}]: ${r.description}`),
      '',
      `### Citations (${this.citations.length})`,
      ...this.citations.map((c) => `- ${c.claim} ([${c.source}](${c.sourceUrl}))`),
    ];

    return sections.join('\n');
  }

  /**
   * Estimate completion time
   */
  private estimateCompletion(): Date | undefined {
    if (!this.startTime || this.progress === 0) return undefined;

    const elapsed = Date.now() - this.startTime.getTime();
    const estimatedTotal = (elapsed / this.progress) * 100;
    const remaining = estimatedTotal - elapsed;

    return new Date(Date.now() + remaining);
  }
}
