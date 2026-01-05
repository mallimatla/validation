/**
 * LLM Service
 * Multi-provider AI integration with OpenAI as primary
 * Supports structured outputs, retries, and fallbacks
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
}

export interface LLMResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string;
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
}

@Injectable()
export class LLMService implements OnModuleInit {
  private readonly logger = new Logger(LLMService.name);
  private openaiApiKey: string | null = null;
  private anthropicApiKey: string | null = null;
  private defaultModel = 'gpt-4o';

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY') || null;
    this.anthropicApiKey = this.configService.get<string>('ANTHROPIC_API_KEY') || null;

    if (this.openaiApiKey) {
      this.logger.log('OpenAI API configured successfully');
    }
    if (this.anthropicApiKey) {
      this.logger.log('Anthropic API configured as fallback');
    }
    if (!this.openaiApiKey && !this.anthropicApiKey) {
      this.logger.warn('No LLM API keys configured - using mock responses');
    }
  }

  /**
   * Check if LLM is available
   */
  isAvailable(): boolean {
    return !!(this.openaiApiKey || this.anthropicApiKey);
  }

  /**
   * Complete a chat conversation
   */
  async complete(
    messages: LLMMessage[],
    options: LLMCompletionOptions = {},
  ): Promise<LLMResponse> {
    const {
      model = this.defaultModel,
      temperature = 0.7,
      maxTokens = 4096,
      systemPrompt,
      jsonMode = false,
      retries = 3,
    } = options;

    const allMessages: LLMMessage[] = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        if (this.openaiApiKey) {
          return await this.callOpenAI(allMessages, {
            model,
            temperature,
            maxTokens,
            jsonMode,
          });
        } else if (this.anthropicApiKey) {
          return await this.callAnthropic(allMessages, {
            model: 'claude-3-5-sonnet-20241022',
            temperature,
            maxTokens,
          });
        } else {
          // Mock response for development without API keys
          return this.getMockResponse(allMessages);
        }
      } catch (error) {
        this.logger.warn(`LLM call attempt ${attempt} failed: ${(error as Error).message}`);
        if (attempt === retries) {
          throw error;
        }
        await this.sleep(Math.pow(2, attempt) * 1000);
      }
    }

    throw new Error('LLM completion failed after all retries');
  }

  /**
   * Perform structured analysis with JSON output
   */
  async analyzeStructured(
    prompt: string,
    context: Record<string, any>,
    agentPersonality: string,
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

    const response = await this.complete(
      [{ role: 'user', content: userPrompt }],
      {
        systemPrompt,
        temperature: 0.3,
        maxTokens: 8192,
        jsonMode: true,
      },
    );

    try {
      // Parse JSON from response, handling potential markdown code blocks
      let jsonStr = response.content;
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }

      const parsed = JSON.parse(jsonStr.trim());
      return this.validateAndNormalizeAnalysis(parsed);
    } catch (error) {
      this.logger.error(`Failed to parse LLM response: ${(error as Error).message}`);
      // Return a default structure if parsing fails
      return this.getDefaultAnalysis(response.content);
    }
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
   * Call OpenAI API
   */
  private async callOpenAI(
    messages: LLMMessage[],
    options: { model: string; temperature: number; maxTokens: number; jsonMode: boolean },
  ): Promise<LLMResponse> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: options.model,
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
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      },
      finishReason: choice.finish_reason,
    };
  }

  /**
   * Call Anthropic API (fallback)
   */
  private async callAnthropic(
    messages: LLMMessage[],
    options: { model: string; temperature: number; maxTokens: number },
  ): Promise<LLMResponse> {
    // Extract system message if present
    const systemMessage = messages.find((m) => m.role === 'system');
    const chatMessages = messages.filter((m) => m.role !== 'system');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.anthropicApiKey!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: options.model,
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
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    return {
      content: data.content[0].text,
      model: data.model,
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      },
      finishReason: data.stop_reason,
    };
  }

  /**
   * Mock response for development
   */
  private getMockResponse(messages: LLMMessage[]): LLMResponse {
    const lastMessage = messages[messages.length - 1];
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
            description: 'Configure OPENAI_API_KEY to enable real analysis',
            type: 'neutral',
            severity: 'info',
            confidence: 10,
          },
        ],
        risks: [],
        recommendations: [
          {
            title: 'Configure LLM API',
            description: 'Add OPENAI_API_KEY to environment variables',
            priority: 'critical',
            timeframe: 'immediate',
            effort: 'low',
            impact: 'high',
          },
        ],
        citations: [],
        rawAnalysis: '# Mock Analysis\n\nThis is a placeholder response. Configure the OpenAI API key to enable real AI-powered analysis.',
      });
    } else {
      content = 'Mock response - Configure OPENAI_API_KEY for real analysis.';
    }

    return {
      content,
      model: 'mock',
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
