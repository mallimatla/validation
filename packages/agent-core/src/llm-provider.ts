/**
 * LLM Provider - Abstraction layer for LLM integrations
 *
 * Supports:
 * - Anthropic Claude (primary)
 * - OpenAI GPT (fallback)
 *
 * Features:
 * - Automatic retry with exponential backoff
 * - Usage tracking
 * - Rate limiting
 * - Fallback provider support
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { retryWithBackoff, sleep } from '@validation-council/shared';

// ============================================================================
// Types
// ============================================================================

export interface LLMRequest {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
}

export interface LLMResponse {
  content: string;
  model: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  finishReason: 'end_turn' | 'max_tokens' | 'stop_sequence' | 'error';
  latencyMs: number;
}

export interface LLMUsageStats {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  requestCount: number;
  totalLatencyMs: number;
}

export interface LLMProviderConfig {
  anthropicApiKey?: string;
  openaiApiKey?: string;
  primaryProvider: 'anthropic' | 'openai';
  fallbackEnabled: boolean;
  maxRetries: number;
  rateLimitPerMinute: number;
}

// ============================================================================
// LLM Provider Interface
// ============================================================================

export interface LLMProvider {
  complete(request: LLMRequest): Promise<LLMResponse>;
  getUsageStats(): LLMUsageStats;
  resetUsageStats(): void;
}

// ============================================================================
// Multi-Provider LLM Implementation
// ============================================================================

export class MultiProviderLLM implements LLMProvider {
  private anthropic?: Anthropic;
  private openai?: OpenAI;
  private config: LLMProviderConfig;

  // Usage tracking
  private usageStats: LLMUsageStats = {
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    requestCount: 0,
    totalLatencyMs: 0,
  };

  // Rate limiting
  private requestTimestamps: number[] = [];

  constructor(config: LLMProviderConfig) {
    this.config = config;

    if (config.anthropicApiKey) {
      this.anthropic = new Anthropic({ apiKey: config.anthropicApiKey });
    }

    if (config.openaiApiKey) {
      this.openai = new OpenAI({ apiKey: config.openaiApiKey });
    }

    if (!this.anthropic && !this.openai) {
      throw new Error('At least one LLM provider must be configured');
    }
  }

  /**
   * Complete a prompt using the configured providers
   */
  async complete(request: LLMRequest): Promise<LLMResponse> {
    await this.enforceRateLimit();

    const _startTime = Date.now();

    try {
      let response: LLMResponse;

      if (this.config.primaryProvider === 'anthropic' && this.anthropic) {
        response = await this.completeWithAnthropic(request);
      } else if (this.config.primaryProvider === 'openai' && this.openai) {
        response = await this.completeWithOpenAI(request);
      } else {
        throw new Error('Primary provider not available');
      }

      this.updateUsageStats(response);
      return response;
    } catch (error) {
      // Try fallback if enabled
      if (this.config.fallbackEnabled) {
        console.warn(`Primary provider failed, trying fallback: ${(error as Error).message}`);

        if (this.config.primaryProvider === 'anthropic' && this.openai) {
          const response = await this.completeWithOpenAI(request);
          this.updateUsageStats(response);
          return response;
        } else if (this.config.primaryProvider === 'openai' && this.anthropic) {
          const response = await this.completeWithAnthropic(request);
          this.updateUsageStats(response);
          return response;
        }
      }

      throw error;
    }
  }

  /**
   * Get current usage statistics
   */
  getUsageStats(): LLMUsageStats {
    return { ...this.usageStats };
  }

  /**
   * Reset usage statistics
   */
  resetUsageStats(): void {
    this.usageStats = {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      requestCount: 0,
      totalLatencyMs: 0,
    };
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Complete using Anthropic Claude
   */
  private async completeWithAnthropic(request: LLMRequest): Promise<LLMResponse> {
    if (!this.anthropic) {
      throw new Error('Anthropic client not initialized');
    }

    const startTime = Date.now();

    const response = await retryWithBackoff(
      async () => {
        return this.anthropic!.messages.create({
          model: request.model || 'claude-3-5-sonnet-20241022',
          max_tokens: request.maxTokens || 4096,
          temperature: request.temperature ?? 0.3,
          system: request.systemPrompt,
          messages: [
            {
              role: 'user',
              content: request.userPrompt,
            },
          ],
          stop_sequences: request.stopSequences,
        });
      },
      this.config.maxRetries
    );

    const latencyMs = Date.now() - startTime;

    // Extract text content
    const textContent = response.content.find((c) => c.type === 'text');
    const content = textContent && textContent.type === 'text' ? textContent.text : '';

    return {
      content,
      model: response.model,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      finishReason: this.mapAnthropicStopReason(response.stop_reason),
      latencyMs,
    };
  }

  /**
   * Complete using OpenAI
   */
  private async completeWithOpenAI(request: LLMRequest): Promise<LLMResponse> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    const startTime = Date.now();

    // Map Claude model to OpenAI equivalent
    const model = this.mapToOpenAIModel(request.model);

    const response = await retryWithBackoff(
      async () => {
        return this.openai!.chat.completions.create({
          model,
          max_tokens: request.maxTokens || 4096,
          temperature: request.temperature ?? 0.3,
          messages: [
            {
              role: 'system',
              content: request.systemPrompt,
            },
            {
              role: 'user',
              content: request.userPrompt,
            },
          ],
          stop: request.stopSequences,
        });
      },
      this.config.maxRetries
    );

    const latencyMs = Date.now() - startTime;

    return {
      content: response.choices[0]?.message?.content || '',
      model: response.model,
      usage: {
        inputTokens: response.usage?.prompt_tokens || 0,
        outputTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
      finishReason: this.mapOpenAIFinishReason(response.choices[0]?.finish_reason),
      latencyMs,
    };
  }

  /**
   * Enforce rate limiting
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Remove timestamps older than one minute
    this.requestTimestamps = this.requestTimestamps.filter((t) => t > oneMinuteAgo);

    // If at rate limit, wait
    if (this.requestTimestamps.length >= this.config.rateLimitPerMinute) {
      const oldestTimestamp = this.requestTimestamps[0];
      const waitTime = oldestTimestamp + 60000 - now;
      if (waitTime > 0) {
        await sleep(waitTime);
      }
    }

    this.requestTimestamps.push(now);
  }

  /**
   * Update usage statistics
   */
  private updateUsageStats(response: LLMResponse): void {
    this.usageStats.inputTokens += response.usage.inputTokens;
    this.usageStats.outputTokens += response.usage.outputTokens;
    this.usageStats.totalTokens += response.usage.totalTokens;
    this.usageStats.requestCount += 1;
    this.usageStats.totalLatencyMs += response.latencyMs;
  }

  /**
   * Map Anthropic stop reason to standard format
   */
  private mapAnthropicStopReason(
    reason: string | null
  ): 'end_turn' | 'max_tokens' | 'stop_sequence' | 'error' {
    switch (reason) {
      case 'end_turn':
        return 'end_turn';
      case 'max_tokens':
        return 'max_tokens';
      case 'stop_sequence':
        return 'stop_sequence';
      default:
        return 'error';
    }
  }

  /**
   * Map OpenAI finish reason to standard format
   */
  private mapOpenAIFinishReason(
    reason?: string | null
  ): 'end_turn' | 'max_tokens' | 'stop_sequence' | 'error' {
    switch (reason) {
      case 'stop':
        return 'end_turn';
      case 'length':
        return 'max_tokens';
      default:
        return 'error';
    }
  }

  /**
   * Map Claude model to OpenAI equivalent
   */
  private mapToOpenAIModel(claudeModel?: string): string {
    const mapping: Record<string, string> = {
      'claude-3-5-sonnet-20241022': 'gpt-4-turbo-preview',
      'claude-3-opus-20240229': 'gpt-4-turbo-preview',
      'claude-3-haiku-20240307': 'gpt-3.5-turbo',
    };

    return mapping[claudeModel || ''] || 'gpt-4-turbo-preview';
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createLLMProvider(config?: Partial<LLMProviderConfig>): LLMProvider {
  const fullConfig: LLMProviderConfig = {
    anthropicApiKey: config?.anthropicApiKey || process.env.ANTHROPIC_API_KEY,
    openaiApiKey: config?.openaiApiKey || process.env.OPENAI_API_KEY,
    primaryProvider: config?.primaryProvider || 'anthropic',
    fallbackEnabled: config?.fallbackEnabled ?? true,
    maxRetries: config?.maxRetries ?? 3,
    rateLimitPerMinute: config?.rateLimitPerMinute ?? 60,
  };

  return new MultiProviderLLM(fullConfig);
}
