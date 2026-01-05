/**
 * Evidence Service
 * Manages citations and ensures trustworthiness
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { SnapshotService } from './snapshot.service';
import * as crypto from 'crypto';

export interface CreateCitationParams {
  validationId: string;
  agentReportId?: string;
  claim: string;
  source: string;
  sourceUrl: string;
  confidence: number;
  dataType: 'primary' | 'secondary' | 'computed';
  content?: string;
}

@Injectable()
export class EvidenceService {
  private readonly logger = new Logger(EvidenceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly snapshotService: SnapshotService,
  ) {}

  /**
   * Create a citation with optional snapshot
   */
  async createCitation(params: CreateCitationParams) {
    const { validationId, agentReportId, claim, source, sourceUrl, confidence, dataType, content } = params;

    let snapshotId: string | null = null;

    // Create snapshot if content provided
    if (content) {
      const snapshot = await this.snapshotService.create({
        originalUrl: sourceUrl,
        content,
        contentType: this.detectContentType(content),
      });
      snapshotId = snapshot.id;
    }

    const citation = await this.prisma.citation.create({
      data: {
        validationId,
        agentReportId,
        claim,
        source,
        sourceUrl,
        snapshotId,
        retrievedAt: new Date(),
        confidence,
        dataType,
        isValid: true,
        lastVerified: new Date(),
      },
    });

    this.logger.log(`Citation created: ${citation.id} for ${source}`);
    return citation;
  }

  /**
   * Verify a citation is still valid
   */
  async verifyCitation(citationId: string) {
    const citation = await this.prisma.citation.findUnique({
      where: { id: citationId },
      include: { snapshot: true },
    });

    if (!citation) {
      throw new NotFoundException('Citation not found');
    }

    // For computed citations, always valid
    if (citation.dataType === 'computed') {
      return { citationId, isValid: true, verifiedAt: new Date() };
    }

    // Verify snapshot integrity
    if (citation.snapshot) {
      const isValid = await this.snapshotService.verifyIntegrity(citation.snapshot.id);

      await this.prisma.citation.update({
        where: { id: citationId },
        data: {
          isValid,
          lastVerified: new Date(),
        },
      });

      return { citationId, isValid, verifiedAt: new Date() };
    }

    return { citationId, isValid: true, verifiedAt: new Date() };
  }

  /**
   * Get all citations for a validation
   */
  async getCitationsForValidation(validationId: string) {
    return this.prisma.citation.findMany({
      where: { validationId },
      include: {
        snapshot: {
          select: {
            id: true,
            originalUrl: true,
            contentType: true,
            capturedAt: true,
            storageUrl: true,
          },
        },
      },
      orderBy: { retrievedAt: 'desc' },
    });
  }

  /**
   * Get citations for an agent report
   */
  async getCitationsForAgent(agentReportId: string) {
    return this.prisma.citation.findMany({
      where: { agentReportId },
      include: { snapshot: true },
    });
  }

  /**
   * Check if validation meets citation requirements
   */
  async checkCitationRequirements(validationId: string): Promise<{
    meets: boolean;
    total: number;
    byType: Record<string, number>;
    byAgent: Record<string, number>;
  }> {
    const citations = await this.prisma.citation.findMany({
      where: { validationId },
      include: { agentReport: true },
    });

    const byType = citations.reduce(
      (acc, c) => {
        acc[c.dataType] = (acc[c.dataType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const byAgent = citations.reduce(
      (acc, c) => {
        const agentId = c.agentReport?.agentId || 'unknown';
        acc[agentId] = (acc[agentId] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const MIN_CITATIONS = 10; // Minimum total citations
    const MIN_PER_AGENT = 1;  // Minimum per agent

    const meetsTotal = citations.length >= MIN_CITATIONS;
    const meetsPerAgent = Object.values(byAgent).every(count => count >= MIN_PER_AGENT);

    return {
      meets: meetsTotal && meetsPerAgent,
      total: citations.length,
      byType,
      byAgent,
    };
  }

  /**
   * Batch verify all citations for a validation
   */
  async verifyAllCitations(validationId: string) {
    const citations = await this.prisma.citation.findMany({
      where: { validationId },
    });

    const results = await Promise.all(
      citations.map(c => this.verifyCitation(c.id)),
    );

    const valid = results.filter(r => r.isValid).length;
    const invalid = results.filter(r => !r.isValid).length;

    return {
      validationId,
      total: results.length,
      valid,
      invalid,
      validityRate: results.length > 0 ? valid / results.length : 1,
      verifiedAt: new Date(),
    };
  }

  private detectContentType(content: string): 'html' | 'json' | 'pdf' | 'text' | 'image' {
    if (content.startsWith('<!DOCTYPE html') || content.startsWith('<html')) {
      return 'html';
    }
    if (content.startsWith('{') || content.startsWith('[')) {
      try {
        JSON.parse(content);
        return 'json';
      } catch {
        return 'text';
      }
    }
    if (content.startsWith('%PDF')) {
      return 'pdf';
    }
    return 'text';
  }
}
