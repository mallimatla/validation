/**
 * Base Analysis Agent
 * Abstract base class for all analysis agents in the Validation Council
 * Enhanced with LLM integration for AI-powered analysis
 */

import { Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LLMService, StructuredAnalysis } from '../../common/llm/llm.service';

export interface AnalysisInput {
  validationId: string;
  idea: {
    title: string;
    description: string;
    problemStatement?: string;
    solution?: string;
    targetCustomer?: string;
    industry?: string;
    businessModel?: string;
    stage?: string;
    geography?: string[];
    askAmount?: number;
    useOfFunds?: string;
    revenue?: number;
    userCount?: number;
    growthRate?: number;
  };
  founderData: Record<string, any>;
  previousAgentOutputs?: Map<string, any>;
  externalData?: Record<string, any>;
  fundingContext?: {
    targetStage?: string;
    currentMRR?: number;
    currentUsers?: number;
    hasProduct?: boolean;
    growthRate?: number;
    requestedValuation?: number;
  };
  marketContext?: {
    tamEstimate?: number;
    samEstimate?: number;
    somEstimate?: number;
  };
}

export interface Finding {
  id: string;
  title: string;
  description: string;
  type: 'strength' | 'weakness' | 'opportunity' | 'threat' | 'neutral';
  severity: 'critical' | 'major' | 'minor' | 'info';
  evidence: Citation[];
  confidence: number;
}

export interface Citation {
  id: string;
  claim: string;
  source: string;
  sourceUrl: string;
  confidence: number;
  dataType: 'primary' | 'secondary' | 'computed';
}

export interface Risk {
  id: string;
  title: string;
  description: string;
  category: string;
  probability: 'high' | 'medium' | 'low';
  impact: 'critical' | 'major' | 'moderate' | 'minor';
  mitigations: string[];
  evidence: Citation[];
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  timeframe: 'immediate' | 'short-term' | 'medium-term' | 'long-term';
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
}

export interface AnalysisOutput {
  agentId: string;
  agentVersion: string;
  validationId: string;
  score: number;
  confidence: number;
  findings: Finding[];
  citations: Citation[];
  risks: Risk[];
  recommendations: Recommendation[];
  rawAnalysis: string;
  executionTimeMs: number;
  metadata?: Record<string, any>;
}

export abstract class BaseAnalysisAgent {
  protected abstract readonly agentId: string;
  protected abstract readonly agentName: string;
  protected abstract readonly agentVersion: string;
  protected abstract readonly scoringWeight: number;
  protected abstract readonly personality: string;
  protected readonly logger: Logger;

  protected findings: Finding[] = [];
  protected citations: Citation[] = [];
  protected risks: Risk[] = [];
  protected recommendations: Recommendation[] = [];
  protected rawAnalysis: string = '';
  protected llmAnalysis: StructuredAnalysis | null = null;
  protected analysisScore: number = 5;

  constructor(
    protected readonly prisma: PrismaService,
    protected readonly eventEmitter: EventEmitter2,
    protected readonly llm?: LLMService,
  ) {
    this.logger = new Logger(this.constructor.name);
  }

  /**
   * Main analysis entry point
   */
  async analyze(input: AnalysisInput): Promise<AnalysisOutput> {
    const startTime = Date.now();
    this.reset();

    this.logger.log(`Starting analysis for validation ${input.validationId}`);

    try {
      // Emit start event
      this.eventEmitter.emit('agent.analysis.started', {
        agentId: this.agentId,
        validationId: input.validationId,
      });

      // Run AI-powered analysis if LLM is available
      if (this.llm?.isAvailable()) {
        await this.performAIAnalysis(input);
      }

      // Run the specific agent's analysis (can supplement or replace AI)
      await this.performAnalysis(input);

      // Calculate final score
      const score = this.calculateScore();
      const confidence = this.calculateConfidence();

      // Build output
      const output: AnalysisOutput = {
        agentId: this.agentId,
        agentVersion: this.agentVersion,
        validationId: input.validationId,
        score,
        confidence,
        findings: this.findings,
        citations: this.citations,
        risks: this.risks,
        recommendations: this.recommendations,
        rawAnalysis: this.rawAnalysis,
        executionTimeMs: Date.now() - startTime,
        metadata: {
          usedLLM: this.llm?.isAvailable() ?? false,
          agentName: this.agentName,
          scoringWeight: this.scoringWeight,
        },
      };

      // NOTE: Agent report storage is handled by ValidationService
      // to ensure consistent score transformation (1-10 to 0-100 scale)
      // await this.storeAgentReport(output);

      // Emit completion event
      this.eventEmitter.emit('agent.analysis.completed', {
        agentId: this.agentId,
        validationId: input.validationId,
        score,
        confidence,
        executionTimeMs: output.executionTimeMs,
      });

      this.logger.log(`Analysis complete: score=${score}, confidence=${confidence}`);

      return output;
    } catch (error) {
      this.logger.error(`Analysis failed: ${(error as Error).message}`);

      // Emit error event
      this.eventEmitter.emit('agent.analysis.failed', {
        agentId: this.agentId,
        validationId: input.validationId,
        error: (error as Error).message,
      });

      throw error;
    }
  }

  /**
   * Perform AI-powered analysis using LLM
   */
  protected async performAIAnalysis(input: AnalysisInput): Promise<void> {
    if (!this.llm) return;

    try {
      const prompt = this.buildAnalysisPrompt(input);
      const context = this.buildAnalysisContext(input);

      this.llmAnalysis = await this.llm.analyzeStructured(
        prompt,
        context,
        this.personality,
      );

      // Merge LLM findings into agent findings
      this.mergeLLMAnalysis(this.llmAnalysis);
    } catch (error) {
      this.logger.warn(`AI analysis failed, falling back to rules-based: ${(error as Error).message}`);
    }
  }

  /**
   * Build the analysis prompt for the LLM
   */
  protected abstract buildAnalysisPrompt(input: AnalysisInput): string;

  /**
   * Build context object for LLM analysis
   */
  protected buildAnalysisContext(input: AnalysisInput): Record<string, any> {
    return {
      idea: input.idea,
      founderData: input.founderData,
      previousAnalyses: input.previousAgentOutputs
        ? Object.fromEntries(input.previousAgentOutputs)
        : {},
      externalData: input.externalData || {},
    };
  }

  /**
   * Merge LLM analysis into agent's findings
   */
  protected mergeLLMAnalysis(analysis: StructuredAnalysis): void {
    // Add findings from LLM
    for (const finding of analysis.findings) {
      const citation = analysis.citations.find((c) =>
        finding.description.toLowerCase().includes(c.claim.toLowerCase().slice(0, 30))
      );

      this.addFinding({
        title: finding.title,
        description: finding.description,
        type: finding.type,
        severity: finding.severity,
        evidence: citation
          ? [
              this.addCitation({
                claim: citation.claim,
                source: citation.source,
                sourceUrl: citation.sourceUrl,
                confidence: citation.confidence,
                dataType: citation.dataType,
              }),
            ]
          : [],
        confidence: finding.confidence,
      });
    }

    // Add risks from LLM
    for (const risk of analysis.risks) {
      this.addRisk({
        title: risk.title,
        description: risk.description,
        category: risk.category,
        probability: risk.probability,
        impact: risk.impact,
        mitigations: risk.mitigations,
        evidence: [],
      });
    }

    // Add recommendations from LLM
    for (const rec of analysis.recommendations) {
      this.addRecommendation({
        title: rec.title,
        description: rec.description,
        priority: rec.priority,
        timeframe: rec.timeframe,
        effort: rec.effort,
        impact: rec.impact,
      });
    }

    // Add remaining citations
    for (const citation of analysis.citations) {
      const exists = this.citations.some((c) => c.claim === citation.claim);
      if (!exists) {
        this.addCitation({
          claim: citation.claim,
          source: citation.source,
          sourceUrl: citation.sourceUrl,
          confidence: citation.confidence,
          dataType: citation.dataType,
        });
      }
    }

    // Update raw analysis and score
    this.rawAnalysis = analysis.rawAnalysis || this.rawAnalysis;
    this.analysisScore = analysis.score;
  }

  /**
   * Abstract method - each agent implements their analysis logic
   */
  protected abstract performAnalysis(input: AnalysisInput): Promise<void>;

  /**
   * Calculate the final score (1-10)
   */
  protected calculateScore(): number {
    // Prefer LLM score if available, otherwise use agent's calculation
    if (this.llmAnalysis) {
      return this.llmAnalysis.score;
    }
    return this.analysisScore;
  }

  /**
   * Calculate confidence level (1-10)
   */
  protected calculateConfidence(): number {
    // Base confidence on citation count and data quality
    const citationScore = Math.min(10, this.citations.length * 1.2);
    const findingScore = Math.min(10, this.findings.length * 1.5);
    const llmBonus = this.llmAnalysis ? 2 : 0;

    const avgCitationConfidence = this.citations.length > 0
      ? this.citations.reduce((sum, c) => sum + c.confidence, 0) / this.citations.length * 10
      : 0;

    return Math.min(10, Math.round((citationScore + findingScore + avgCitationConfidence + llmBonus) / 4));
  }

  /**
   * Reset state for new analysis
   */
  protected reset(): void {
    this.findings = [];
    this.citations = [];
    this.risks = [];
    this.recommendations = [];
    this.rawAnalysis = '';
    this.llmAnalysis = null;
    this.analysisScore = 5;
  }

  /**
   * Add a finding
   */
  protected addFinding(finding: Omit<Finding, 'id'>): void {
    this.findings.push({
      ...finding,
      id: this.generateId('finding'),
    });
  }

  /**
   * Add a citation
   */
  protected addCitation(citation: Omit<Citation, 'id'>): Citation {
    const fullCitation = {
      ...citation,
      id: this.generateId('cite'),
    };
    this.citations.push(fullCitation);
    return fullCitation;
  }

  /**
   * Add a risk
   */
  protected addRisk(risk: Omit<Risk, 'id'>): void {
    this.risks.push({
      ...risk,
      id: this.generateId('risk'),
    });
  }

  /**
   * Add a recommendation
   */
  protected addRecommendation(rec: Omit<Recommendation, 'id'>): void {
    this.recommendations.push({
      ...rec,
      id: this.generateId('rec'),
    });
  }

  /**
   * Generate unique ID
   */
  protected generateId(prefix: string): string {
    return `${prefix}-${this.agentId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Store agent report in database
   */
  protected async storeAgentReport(output: AnalysisOutput): Promise<void> {
    await this.prisma.agentReport.create({
      data: {
        validationId: output.validationId,
        agentId: output.agentId,
        agentVersion: output.agentVersion,
        score: output.score,
        confidence: output.confidence,
        findings: output.findings as any,
        risks: output.risks as any,
        recommendations: output.recommendations as any,
        rawAnalysis: output.rawAnalysis,
        citationCount: output.citations.length,
        executionTimeMs: output.executionTimeMs,
        signature: this.generateSignature(output),
      },
    });

    // Store citations
    for (const citation of output.citations) {
      await this.prisma.citation.create({
        data: {
          validationId: output.validationId,
          claim: citation.claim,
          source: citation.source,
          sourceUrl: citation.sourceUrl,
          retrievedAt: new Date(),
          confidence: citation.confidence,
          dataType: citation.dataType,
        },
      });
    }

    // Create audit event
    await this.prisma.auditEvent.create({
      data: {
        type: 'AGENT_ANALYSIS_COMPLETED',
        entityType: 'AgentReport',
        entityId: output.validationId,
        agentId: output.agentId,
        metadata: {
          score: output.score,
          confidence: output.confidence,
          findingsCount: output.findings.length,
          citationsCount: output.citations.length,
          executionTimeMs: output.executionTimeMs,
        },
      },
    });
  }

  /**
   * Generate signature for tamper detection
   */
  protected generateSignature(output: AnalysisOutput): string {
    const crypto = require('crypto');
    const secret = process.env.AGENT_SIGNING_SECRET || 'development-secret';
    const data = JSON.stringify({
      agentId: output.agentId,
      validationId: output.validationId,
      score: output.score,
      confidence: output.confidence,
      findingsCount: output.findings.length,
      timestamp: Date.now(),
    });
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }
}
