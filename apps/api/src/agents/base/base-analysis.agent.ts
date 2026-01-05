/**
 * Base Analysis Agent
 * Abstract base class for all analysis agents in the Validation Council
 */

import { Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

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
  };
  founderData: Record<string, any>;
  previousAgentOutputs?: Map<string, any>;
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
  protected readonly logger: Logger;

  protected findings: Finding[] = [];
  protected citations: Citation[] = [];
  protected risks: Risk[] = [];
  protected recommendations: Recommendation[] = [];
  protected rawAnalysis: string = '';

  constructor(
    protected readonly prisma: PrismaService,
    protected readonly eventEmitter: EventEmitter2,
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
      // Run the specific agent's analysis
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
      };

      // Store agent report
      await this.storeAgentReport(output);

      this.logger.log(`Analysis complete: score=${score}, confidence=${confidence}`);

      return output;
    } catch (error) {
      this.logger.error(`Analysis failed: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Abstract method - each agent implements their analysis logic
   */
  protected abstract performAnalysis(input: AnalysisInput): Promise<void>;

  /**
   * Calculate the final score (1-10)
   */
  protected abstract calculateScore(): number;

  /**
   * Calculate confidence level (1-10)
   */
  protected calculateConfidence(): number {
    // Base confidence on citation count and data quality
    const citationScore = Math.min(10, this.citations.length * 1.5);
    const findingScore = Math.min(10, this.findings.length * 2);

    return Math.round((citationScore + findingScore) / 2);
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
        findings: output.findings,
        risks: output.risks,
        recommendations: output.recommendations,
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
      timestamp: Date.now(),
    });
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }
}
