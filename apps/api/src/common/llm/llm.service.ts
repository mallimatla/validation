/**
 * LLM Service v2.0
 * Multi-provider AI integration with Claude as primary
 * Supports multiple LLMs: Claude, OpenAI, Gemini, with consensus mechanism
 * For trustworthy, accountable analysis
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  jsonMode?: boolean;
  retries?: number;
  provider?: LLMProvider;
  useConsensus?: boolean; // Query multiple LLMs and synthesize
}

export interface LLMResponse {
  content: string;
  model: string;
  provider: LLMProvider;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string;
}

export interface ConsensusResult {
  finalResponse: LLMResponse;
  individualResponses: LLMResponse[];
  consensusScore: number; // 0-1, how much the LLMs agreed
  providers: LLMProvider[];
}

export interface StructuredAnalysis {
  summary: string;
  score: number;
  confidence: number;
  findings: Array<{
    title: string;
    description: string;
    type: 'strength' | 'weakness' | 'opportunity' | 'threat' | 'neutral';
    severity: 'critical' | 'major' | 'minor' | 'info';
    confidence: number;
  }>;
  risks: Array<{
    title: string;
    description: string;
    category: string;
    probability: 'high' | 'medium' | 'low';
    impact: 'critical' | 'major' | 'moderate' | 'minor';
    mitigations: string[];
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    timeframe: 'immediate' | 'short-term' | 'medium-term' | 'long-term';
    effort: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high';
  }>;
  citations: Array<{
    claim: string;
    source: string;
    sourceUrl: string;
    confidence: number;
    dataType: 'primary' | 'secondary' | 'computed';
  }>;
  rawAnalysis: string;
  consensusUsed?: boolean;
  providersUsed?: LLMProvider[];
}

export type LLMProvider = 'claude' | 'openai' | 'gemini';

interface ProviderConfig {
  name: LLMProvider;
  apiKey: string | null;
  defaultModel: string;
  priority: number;
  available: boolean;
}

@Injectable()
export class LLMService implements OnModuleInit {
  private readonly logger = new Logger(LLMService.name);

  // Provider configurations (priority order: Claude > OpenAI > Gemini)
  private providers: Map<LLMProvider, ProviderConfig> = new Map();
  private availableProviders: LLMProvider[] = [];

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    // Initialize providers with priority (lower = higher priority)
    this.providers.set('claude', {
      name: 'claude',
      apiKey: this.configService.get<string>('ANTHROPIC_API_KEY') || null,
      defaultModel: 'claude-3-5-sonnet-20241022',
      priority: 1,
      available: false,
    });

    this.providers.set('openai', {
      name: 'openai',
      apiKey: this.configService.get<string>('OPENAI_API_KEY') || null,
      defaultModel: 'gpt-4o',
      priority: 2,
      available: false,
    });

    this.providers.set('gemini', {
      name: 'gemini',
      apiKey: this.configService.get<string>('GOOGLE_AI_API_KEY') ||
              this.configService.get<string>('GEMINI_API_KEY') || null,
      defaultModel: 'gemini-1.5-pro',
      priority: 3,
      available: false,
    });

    // Check availability and log status
    this.providers.forEach((config, name) => {
      config.available = !!config.apiKey;
      if (config.available) {
        this.availableProviders.push(name);
        this.logger.log(`✓ ${name.toUpperCase()} configured (priority ${config.priority})`);
      }
    });

    // Sort by priority
    this.availableProviders.sort((a, b) => {
      const aConfig = this.providers.get(a)!;
      const bConfig = this.providers.get(b)!;
      return aConfig.priority - bConfig.priority;
    });

    if (this.availableProviders.length === 0) {
      this.logger.warn('⚠ No LLM API keys configured - using mock responses');
    } else {
      this.logger.log(`Primary LLM: ${this.availableProviders[0].toUpperCase()}`);
      if (this.availableProviders.length > 1) {
        this.logger.log(`Multi-LLM consensus available with ${this.availableProviders.length} providers`);
      }
    }
  }

  /**
   * Check if LLM is available
   */
  isAvailable(): boolean {
    return this.availableProviders.length > 0;
  }

  /**
   * Get list of available providers
   */
  getAvailableProviders(): LLMProvider[] {
    return [...this.availableProviders];
  }

  /**
   * Check if multi-LLM consensus is available (2+ providers)
   */
  isConsensusAvailable(): boolean {
    return this.availableProviders.length >= 2;
  }

  /**
   * Get primary provider
   */
  getPrimaryProvider(): LLMProvider | null {
    return this.availableProviders[0] || null;
  }

  /**
   * Complete a chat conversation using the best available provider
   */
  async complete(
    messages: LLMMessage[],
    options: LLMCompletionOptions = {},
  ): Promise<LLMResponse> {
    const {
      temperature = 0.7,
      maxTokens = 4096,
      systemPrompt,
      jsonMode = false,
      retries = 3,
      provider,
      useConsensus = false,
    } = options;

    const allMessages: LLMMessage[] = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages;

    // If consensus requested and available, use it
    if (useConsensus && this.isConsensusAvailable()) {
      const consensus = await this.completeWithConsensus(allMessages, {
        temperature,
        maxTokens,
        jsonMode,
      });
      return consensus.finalResponse;
    }

    // Determine provider order
    let providerOrder: LLMProvider[];
    if (provider && this.providers.get(provider)?.available) {
      providerOrder = [provider, ...this.availableProviders.filter(p => p !== provider)];
    } else {
      providerOrder = [...this.availableProviders];
    }

    // Try providers in order with retries
    for (const currentProvider of providerOrder) {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          return await this.callProvider(currentProvider, allMessages, {
            temperature,
            maxTokens,
            jsonMode,
          });
        } catch (error) {
          this.logger.warn(
            `${currentProvider} attempt ${attempt} failed: ${(error as Error).message}`
          );

          if (attempt === retries) {
            this.logger.warn(`${currentProvider} exhausted retries, trying next provider`);
            break;
          }
          await this.sleep(Math.pow(2, attempt) * 1000);
        }
      }
    }

    // If all providers failed, return mock response
    if (this.availableProviders.length === 0) {
      return this.getMockResponse(allMessages);
    }

    throw new Error('All LLM providers failed after retries');
  }

  /**
   * Complete with multi-LLM consensus for higher accuracy
   * Queries multiple LLMs and synthesizes their responses
   */
  async completeWithConsensus(
    messages: LLMMessage[],
    options: {
      temperature?: number;
      maxTokens?: number;
      jsonMode?: boolean;
      minProviders?: number;
    } = {},
  ): Promise<ConsensusResult> {
    const {
      temperature = 0.3, // Lower temperature for consistency
      maxTokens = 4096,
      jsonMode = false,
      minProviders = 2,
    } = options;

    if (this.availableProviders.length < minProviders) {
      throw new Error(`Consensus requires at least ${minProviders} providers`);
    }

    // Query all available providers in parallel
    const providerPromises = this.availableProviders.map(async (provider) => {
      try {
        return await this.callProvider(provider, messages, {
          temperature,
          maxTokens,
          jsonMode,
        });
      } catch (error) {
        this.logger.warn(`Consensus: ${provider} failed: ${(error as Error).message}`);
        return null;
      }
    });

    const responses = (await Promise.all(providerPromises)).filter(
      (r): r is LLMResponse => r !== null
    );

    if (responses.length < minProviders) {
      throw new Error(`Consensus failed: only ${responses.length} providers responded`);
    }

    // Calculate consensus and synthesize
    const consensusScore = this.calculateConsensusScore(responses, jsonMode);
    const finalResponse = this.synthesizeResponses(responses, jsonMode);

    this.logger.log(
      `Consensus achieved: ${responses.length} providers, agreement: ${(consensusScore * 100).toFixed(1)}%`
    );

    return {
      finalResponse,
      individualResponses: responses,
      consensusScore,
      providers: responses.map(r => r.provider),
    };
  }

  /**
   * Perform structured analysis with optional consensus
   */
  async analyzeStructured(
    prompt: string,
    context: Record<string, any>,
    agentPersonality: string,
    useConsensus: boolean = false,
  ): Promise<StructuredAnalysis> {
    const systemPrompt = `${agentPersonality}

You are an expert analyst providing rigorous startup validation. Your analysis must be:
1. EVIDENCE-BASED: Every claim needs supporting data or logical reasoning
2. ACTIONABLE: Recommendations should be specific and implementable
3. HONEST: Do not sugarcoat problems - investors need truth
4. STRUCTURED: Follow the exact JSON format specified

Respond ONLY with valid JSON in the following format:
{
  "summary": "Brief executive summary of your analysis",
  "score": <number 1-10>,
  "confidence": <number 1-10>,
  "findings": [
    {
      "title": "Finding title",
      "description": "Detailed description with evidence",
      "type": "strength|weakness|opportunity|threat|neutral",
      "severity": "critical|major|minor|info",
      "confidence": <number 1-10>
    }
  ],
  "risks": [
    {
      "title": "Risk title",
      "description": "Risk description",
      "category": "market|financial|technical|team|legal|operational",
      "probability": "high|medium|low",
      "impact": "critical|major|moderate|minor",
      "mitigations": ["mitigation 1", "mitigation 2"]
    }
  ],
  "recommendations": [
    {
      "title": "Recommendation title",
      "description": "Actionable recommendation",
      "priority": "critical|high|medium|low",
      "timeframe": "immediate|short-term|medium-term|long-term",
      "effort": "low|medium|high",
      "impact": "low|medium|high"
    }
  ],
  "citations": [
    {
      "claim": "The specific claim being made",
      "source": "Source name",
      "sourceUrl": "URL or reference",
      "confidence": <number 0-1>,
      "dataType": "primary|secondary|computed"
    }
  ],
  "rawAnalysis": "Your detailed written analysis in markdown format"
}`;

    const userPrompt = `${prompt}

Context:
${JSON.stringify(context, null, 2)}

Provide your thorough analysis following the JSON structure specified. Be comprehensive and rigorous.`;

    // Use consensus if requested and available
    const shouldUseConsensus = useConsensus && this.isConsensusAvailable();

    let response: LLMResponse;
    let providersUsed: LLMProvider[] = [];

    if (shouldUseConsensus) {
      const consensus = await this.completeWithConsensus(
        [{ role: 'user', content: userPrompt }],
        {
          temperature: 0.3,
          maxTokens: 8192,
          jsonMode: true,
        }
      );
      response = consensus.finalResponse;
      providersUsed = consensus.providers;
    } else {
      response = await this.complete(
        [{ role: 'user', content: userPrompt }],
        {
          systemPrompt,
          temperature: 0.3,
          maxTokens: 8192,
          jsonMode: true,
        },
      );
      providersUsed = [response.provider];
    }

    try {
      // Parse JSON from response, handling potential markdown code blocks
      let jsonStr = response.content;
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }

      const parsed = JSON.parse(jsonStr.trim());
      const analysis = this.validateAndNormalizeAnalysis(parsed);

      // Add consensus metadata
      analysis.consensusUsed = shouldUseConsensus;
      analysis.providersUsed = providersUsed;

      return analysis;
    } catch (error) {
      this.logger.error(`Failed to parse LLM response: ${(error as Error).message}`);
      return this.getDefaultAnalysis(response.content);
    }
  }

  /**
   * Perform structured analysis with multi-LLM consensus
   * Queries multiple LLMs and merges their analyses
   */
  async analyzeWithConsensus(
    prompt: string,
    context: Record<string, any>,
    agentPersonality: string,
  ): Promise<StructuredAnalysis> {
    if (!this.isConsensusAvailable()) {
      return this.analyzeStructured(prompt, context, agentPersonality, false);
    }

    // Get analyses from all available providers
    const analyses = await Promise.all(
      this.availableProviders.map(async (provider) => {
        try {
          const response = await this.complete(
            [{ role: 'user', content: `${prompt}\n\nContext:\n${JSON.stringify(context, null, 2)}` }],
            {
              systemPrompt: `${agentPersonality}\n\nRespond with valid JSON in the structured analysis format.`,
              temperature: 0.3,
              maxTokens: 8192,
              jsonMode: true,
              provider,
            }
          );

          let jsonStr = response.content;
          const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (jsonMatch) jsonStr = jsonMatch[1];

          const parsed = JSON.parse(jsonStr.trim());
          return { provider, analysis: this.validateAndNormalizeAnalysis(parsed) };
        } catch (error) {
          this.logger.warn(`Consensus analysis from ${provider} failed: ${(error as Error).message}`);
          return null;
        }
      })
    );

    const validAnalyses = analyses.filter((a): a is NonNullable<typeof a> => a !== null);

    if (validAnalyses.length === 0) {
      throw new Error('All providers failed during consensus analysis');
    }

    if (validAnalyses.length === 1) {
      const result = validAnalyses[0].analysis;
      result.consensusUsed = false;
      result.providersUsed = [validAnalyses[0].provider];
      return result;
    }

    // Merge analyses from multiple providers
    return this.mergeAnalyses(validAnalyses);
  }

  /**
   * Merge multiple analyses into a consensus result
   */
  private mergeAnalyses(
    analyses: Array<{ provider: LLMProvider; analysis: StructuredAnalysis }>
  ): StructuredAnalysis {
    // Average the scores with weighting (primary provider gets higher weight)
    const weights: Record<LLMProvider, number> = {
      claude: 1.2,  // Claude gets slight premium as primary
      openai: 1.0,
      gemini: 1.0,
    };

    let totalWeight = 0;
    let weightedScore = 0;
    let weightedConfidence = 0;

    analyses.forEach(({ provider, analysis }) => {
      const w = weights[provider] || 1.0;
      totalWeight += w;
      weightedScore += analysis.score * w;
      weightedConfidence += analysis.confidence * w;
    });

    const avgScore = weightedScore / totalWeight;
    const avgConfidence = weightedConfidence / totalWeight;

    // Combine findings, removing duplicates by title similarity
    const allFindings = analyses.flatMap(a => a.analysis.findings);
    const mergedFindings = this.deduplicateByTitle(allFindings);

    // Combine risks
    const allRisks = analyses.flatMap(a => a.analysis.risks);
    const mergedRisks = this.deduplicateByTitle(allRisks);

    // Combine recommendations
    const allRecommendations = analyses.flatMap(a => a.analysis.recommendations);
    const mergedRecommendations = this.deduplicateByTitle(allRecommendations);

    // Combine citations
    const allCitations = analyses.flatMap(a => a.analysis.citations);
    const mergedCitations = this.deduplicateCitations(allCitations);

    // Use primary provider's summary and raw analysis as base
    const primary = analyses[0];

    return {
      summary: `[Consensus from ${analyses.length} AI providers] ${primary.analysis.summary}`,
      score: Math.round(avgScore * 10) / 10,
      confidence: Math.min(10, Math.round((avgConfidence + 1) * 10) / 10), // Boost confidence for consensus
      findings: mergedFindings,
      risks: mergedRisks,
      recommendations: mergedRecommendations,
      citations: mergedCitations,
      rawAnalysis: primary.analysis.rawAnalysis,
      consensusUsed: true,
      providersUsed: analyses.map(a => a.provider),
    };
  }

  /**
   * Deduplicate items by title similarity
   */
  private deduplicateByTitle<T extends { title: string }>(items: T[]): T[] {
    const seen = new Map<string, T>();

    for (const item of items) {
      const normalizedTitle = item.title.toLowerCase().trim();
      const existingKey = Array.from(seen.keys()).find(key =>
        this.similarityScore(key, normalizedTitle) > 0.7
      );

      if (!existingKey) {
        seen.set(normalizedTitle, item);
      }
    }

    return Array.from(seen.values());
  }

  /**
   * Deduplicate citations by claim similarity
   */
  private deduplicateCitations(citations: StructuredAnalysis['citations']): StructuredAnalysis['citations'] {
    const seen = new Map<string, typeof citations[0]>();

    for (const citation of citations) {
      const normalizedClaim = citation.claim.toLowerCase().trim();
      const existingKey = Array.from(seen.keys()).find(key =>
        this.similarityScore(key, normalizedClaim) > 0.7
      );

      if (!existingKey) {
        seen.set(normalizedClaim, citation);
      } else {
        // Keep the one with higher confidence
        const existing = seen.get(existingKey)!;
        if (citation.confidence > existing.confidence) {
          seen.set(existingKey, citation);
        }
      }
    }

    return Array.from(seen.values());
  }

  /**
   * Simple string similarity score (Jaccard similarity on words)
   */
  private similarityScore(a: string, b: string): number {
    const wordsA = new Set(a.split(/\s+/));
    const wordsB = new Set(b.split(/\s+/));
    const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
    const union = new Set([...wordsA, ...wordsB]);
    return intersection.size / union.size;
  }

  /**
   * Calculate consensus score between responses
   */
  private calculateConsensusScore(responses: LLMResponse[], jsonMode: boolean): number {
    if (responses.length < 2) return 1.0;

    if (jsonMode) {
      // For JSON responses, compare parsed structures
      try {
        const parsed = responses.map(r => {
          let content = r.content;
          const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (match) content = match[1];
          return JSON.parse(content.trim());
        });

        // Compare scores if present
        const scores = parsed.map(p => p.score).filter(s => typeof s === 'number');
        if (scores.length >= 2) {
          const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
          const variance = scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / scores.length;
          const maxVariance = 81; // Max possible variance for 1-10 scale
          return 1 - (variance / maxVariance);
        }
      } catch {
        // Fall back to text comparison
      }
    }

    // Text comparison using word overlap
    const wordSets = responses.map(r => new Set(r.content.toLowerCase().split(/\s+/)));
    let totalSimilarity = 0;
    let comparisons = 0;

    for (let i = 0; i < wordSets.length; i++) {
      for (let j = i + 1; j < wordSets.length; j++) {
        const intersection = new Set([...wordSets[i]].filter(x => wordSets[j].has(x)));
        const union = new Set([...wordSets[i], ...wordSets[j]]);
        totalSimilarity += intersection.size / union.size;
        comparisons++;
      }
    }

    return comparisons > 0 ? totalSimilarity / comparisons : 1.0;
  }

  /**
   * Synthesize multiple responses into one
   */
  private synthesizeResponses(responses: LLMResponse[], jsonMode: boolean): LLMResponse {
    // Use primary provider's response as base, enhanced with consensus info
    const primary = responses[0];

    if (!jsonMode) {
      return primary;
    }

    // For JSON mode, try to merge data
    try {
      const parsed = responses.map(r => {
        let content = r.content;
        const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (match) content = match[1];
        return JSON.parse(content.trim());
      });

      // Average numeric fields
      const avgScore = parsed.reduce((sum, p) => sum + (p.score || 0), 0) / parsed.length;
      const avgConfidence = parsed.reduce((sum, p) => sum + (p.confidence || 0), 0) / parsed.length;

      const merged = {
        ...parsed[0],
        score: Math.round(avgScore * 10) / 10,
        confidence: Math.round(avgConfidence * 10) / 10,
        _consensusProviders: responses.map(r => r.provider),
      };

      return {
        ...primary,
        content: JSON.stringify(merged, null, 2),
      };
    } catch {
      return primary;
    }
  }

  /**
   * Call a specific provider
   */
  private async callProvider(
    provider: LLMProvider,
    messages: LLMMessage[],
    options: { temperature: number; maxTokens: number; jsonMode: boolean },
  ): Promise<LLMResponse> {
    const config = this.providers.get(provider);
    if (!config?.available) {
      throw new Error(`Provider ${provider} not available`);
    }

    switch (provider) {
      case 'claude':
        return this.callClaude(messages, config, options);
      case 'openai':
        return this.callOpenAI(messages, config, options);
      case 'gemini':
        return this.callGemini(messages, config, options);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  /**
   * Call Claude (Anthropic) API - PRIMARY PROVIDER
   */
  private async callClaude(
    messages: LLMMessage[],
    config: ProviderConfig,
    options: { temperature: number; maxTokens: number; jsonMode: boolean },
  ): Promise<LLMResponse> {
    // Extract system message if present
    const systemMessage = messages.find((m) => m.role === 'system');
    const chatMessages = messages.filter((m) => m.role !== 'system');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.defaultModel,
        max_tokens: options.maxTokens,
        system: systemMessage?.content,
        messages: chatMessages.map((m) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content,
        })),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    return {
      content: data.content[0].text,
      model: data.model,
      provider: 'claude',
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      },
      finishReason: data.stop_reason,
    };
  }

  /**
   * Call OpenAI API - SECONDARY PROVIDER
   */
  private async callOpenAI(
    messages: LLMMessage[],
    config: ProviderConfig,
    options: { temperature: number; maxTokens: number; jsonMode: boolean },
  ): Promise<LLMResponse> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.defaultModel,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        temperature: options.temperature,
        max_tokens: options.maxTokens,
        response_format: options.jsonMode ? { type: 'json_object' } : undefined,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const choice = data.choices[0];

    return {
      content: choice.message.content,
      model: data.model,
      provider: 'openai',
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      },
      finishReason: choice.finish_reason,
    };
  }

  /**
   * Call Google Gemini API - TERTIARY PROVIDER
   */
  private async callGemini(
    messages: LLMMessage[],
    config: ProviderConfig,
    options: { temperature: number; maxTokens: number; jsonMode: boolean },
  ): Promise<LLMResponse> {
    // Convert messages to Gemini format
    const systemMessage = messages.find((m) => m.role === 'system');
    const chatMessages = messages.filter((m) => m.role !== 'system');

    const contents = chatMessages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const requestBody: any = {
      contents,
      generationConfig: {
        temperature: options.temperature,
        maxOutputTokens: options.maxTokens,
      },
    };

    if (systemMessage) {
      requestBody.systemInstruction = {
        parts: [{ text: systemMessage.content }],
      };
    }

    if (options.jsonMode) {
      requestBody.generationConfig.responseMimeType = 'application/json';
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${config.defaultModel}:generateContent?key=${config.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];

    if (!candidate?.content?.parts?.[0]?.text) {
      throw new Error('Invalid Gemini response structure');
    }

    return {
      content: candidate.content.parts[0].text,
      model: config.defaultModel,
      provider: 'gemini',
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount || 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata?.totalTokenCount || 0,
      },
      finishReason: candidate.finishReason || 'stop',
    };
  }

  /**
   * Generate market research with web search integration
   */
  async generateMarketResearch(
    industry: string,
    targetMarket: string,
    geography: string[],
  ): Promise<{
    tam: number;
    sam: number;
    som: number;
    growthRate: number;
    sources: Array<{ name: string; url: string; data: string }>;
  }> {
    const prompt = `Research the market for:
Industry: ${industry}
Target Market: ${targetMarket}
Geography: ${geography.join(', ')}

Provide market sizing (TAM/SAM/SOM) with realistic estimates based on publicly available data.
Include growth rate projections and cite specific sources.`;

    const response = await this.complete(
      [{ role: 'user', content: prompt }],
      {
        systemPrompt: 'You are a market research analyst. Provide accurate market data with citations.',
        temperature: 0.2,
        jsonMode: true,
      },
    );

    try {
      return JSON.parse(response.content);
    } catch {
      return {
        tam: 0,
        sam: 0,
        som: 0,
        growthRate: 0,
        sources: [],
      };
    }
  }

  /**
   * Analyze competitors from market data
   */
  async analyzeCompetitors(
    productDescription: string,
    industry: string,
  ): Promise<Array<{
    name: string;
    description: string;
    funding: string;
    marketShare: number;
    strengths: string[];
    weaknesses: string[];
    differentiators: string[];
  }>> {
    const prompt = `Identify and analyze key competitors for:
Product: ${productDescription}
Industry: ${industry}

List the top 5-10 competitors with their funding, market position, strengths, and weaknesses.
Focus on direct competitors that a startup would face.`;

    const response = await this.complete(
      [{ role: 'user', content: prompt }],
      {
        systemPrompt: 'You are a competitive intelligence analyst. Provide accurate competitor data.',
        temperature: 0.2,
        jsonMode: true,
      },
    );

    try {
      const parsed = JSON.parse(response.content);
      return parsed.competitors || parsed;
    } catch {
      return [];
    }
  }

  /**
   * Mock response for development
   */
  private getMockResponse(messages: LLMMessage[]): LLMResponse {
    const isJsonRequest = messages.some((m) =>
      m.content.includes('JSON') || m.content.includes('json')
    );

    let content: string;
    if (isJsonRequest) {
      content = JSON.stringify({
        summary: 'Mock analysis - LLM API not configured',
        score: 5,
        confidence: 3,
        findings: [
          {
            title: 'API Configuration Required',
            description: 'Configure ANTHROPIC_API_KEY (primary), OPENAI_API_KEY, or GOOGLE_AI_API_KEY to enable real analysis',
            type: 'neutral',
            severity: 'info',
            confidence: 10,
          },
        ],
        risks: [],
        recommendations: [
          {
            title: 'Configure LLM API',
            description: 'Add ANTHROPIC_API_KEY to environment variables for Claude (recommended primary)',
            priority: 'critical',
            timeframe: 'immediate',
            effort: 'low',
            impact: 'high',
          },
        ],
        citations: [],
        rawAnalysis: '# Mock Analysis\n\nThis is a placeholder response. Configure LLM API keys to enable real AI-powered analysis.\n\n**Recommended configuration:**\n1. ANTHROPIC_API_KEY (primary - Claude)\n2. OPENAI_API_KEY (secondary)\n3. GOOGLE_AI_API_KEY (tertiary - Gemini)',
      });
    } else {
      content = 'Mock response - Configure LLM API keys for real analysis.';
    }

    return {
      content,
      model: 'mock',
      provider: 'claude',
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
      finishReason: 'stop',
    };
  }

  /**
   * Validate and normalize analysis structure
   */
  private validateAndNormalizeAnalysis(data: any): StructuredAnalysis {
    return {
      summary: data.summary || '',
      score: Math.max(1, Math.min(10, Number(data.score) || 5)),
      confidence: Math.max(1, Math.min(10, Number(data.confidence) || 5)),
      findings: (data.findings || []).map((f: any) => ({
        title: f.title || 'Untitled Finding',
        description: f.description || '',
        type: this.validateEnum(f.type, ['strength', 'weakness', 'opportunity', 'threat', 'neutral'], 'neutral'),
        severity: this.validateEnum(f.severity, ['critical', 'major', 'minor', 'info'], 'info'),
        confidence: Math.max(1, Math.min(10, Number(f.confidence) || 5)),
      })),
      risks: (data.risks || []).map((r: any) => ({
        title: r.title || 'Untitled Risk',
        description: r.description || '',
        category: r.category || 'operational',
        probability: this.validateEnum(r.probability, ['high', 'medium', 'low'], 'medium'),
        impact: this.validateEnum(r.impact, ['critical', 'major', 'moderate', 'minor'], 'moderate'),
        mitigations: Array.isArray(r.mitigations) ? r.mitigations : [],
      })),
      recommendations: (data.recommendations || []).map((rec: any) => ({
        title: rec.title || 'Untitled Recommendation',
        description: rec.description || '',
        priority: this.validateEnum(rec.priority, ['critical', 'high', 'medium', 'low'], 'medium'),
        timeframe: this.validateEnum(rec.timeframe, ['immediate', 'short-term', 'medium-term', 'long-term'], 'short-term'),
        effort: this.validateEnum(rec.effort, ['low', 'medium', 'high'], 'medium'),
        impact: this.validateEnum(rec.impact, ['low', 'medium', 'high'], 'medium'),
      })),
      citations: (data.citations || []).map((c: any) => ({
        claim: c.claim || '',
        source: c.source || 'Unknown',
        sourceUrl: c.sourceUrl || c.source_url || '',
        confidence: Math.max(0, Math.min(1, Number(c.confidence) || 0.5)),
        dataType: this.validateEnum(c.dataType || c.data_type, ['primary', 'secondary', 'computed'], 'computed'),
      })),
      rawAnalysis: data.rawAnalysis || data.raw_analysis || '',
    };
  }

  /**
   * Get default analysis structure
   */
  private getDefaultAnalysis(rawContent: string): StructuredAnalysis {
    return {
      summary: 'Analysis completed but structured output parsing failed',
      score: 5,
      confidence: 3,
      findings: [],
      risks: [],
      recommendations: [],
      citations: [],
      rawAnalysis: rawContent,
    };
  }

  /**
   * Validate enum value
   */
  private validateEnum<T extends string>(value: any, allowed: T[], defaultValue: T): T {
    return allowed.includes(value) ? value : defaultValue;
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
