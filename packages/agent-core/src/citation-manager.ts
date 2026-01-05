/**
 * CitationManager - Manages citations and evidence for all agent claims
 *
 * Core responsibility: Ensure every claim has verifiable evidence
 *
 * Features:
 * - Citation creation with snapshot storage
 * - Citation verification
 * - Source reliability tracking
 * - Citation chain management
 */

import {
  Citation,
  Snapshot,
  DataType,
  generateId,
  hashContent,
  isValidUrl,
} from '@validation-council/shared';

// ============================================================================
// Types
// ============================================================================

export interface CreateCitationParams {
  claim: string;
  source: string;
  sourceUrl: string;
  confidence: number;
  dataType: DataType;
  content?: string;
  metadata?: Record<string, unknown>;
}

export interface VerificationResult {
  citationId: string;
  isValid: boolean;
  verifiedAt: Date;
  issues?: string[];
}

export interface SnapshotStorage {
  store(snapshot: Omit<Snapshot, 'id' | 'storageUrl'>): Promise<Snapshot>;
  retrieve(snapshotId: string): Promise<Snapshot | null>;
  delete(snapshotId: string): Promise<boolean>;
}

// ============================================================================
// In-Memory Snapshot Storage (for development)
// ============================================================================

export class InMemorySnapshotStorage implements SnapshotStorage {
  private snapshots: Map<string, Snapshot> = new Map();

  async store(snapshot: Omit<Snapshot, 'id' | 'storageUrl'>): Promise<Snapshot> {
    const id = generateId('snap');
    const fullSnapshot: Snapshot = {
      ...snapshot,
      id,
      storageUrl: `memory://${id}`,
    };
    this.snapshots.set(id, fullSnapshot);
    return fullSnapshot;
  }

  async retrieve(snapshotId: string): Promise<Snapshot | null> {
    return this.snapshots.get(snapshotId) || null;
  }

  async delete(snapshotId: string): Promise<boolean> {
    return this.snapshots.delete(snapshotId);
  }
}

// ============================================================================
// Citation Manager
// ============================================================================

export class CitationManager {
  private citations: Map<string, Citation> = new Map();
  private snapshotStorage: SnapshotStorage;
  private _validationId?: string;

  constructor(snapshotStorage?: SnapshotStorage) {
    this.snapshotStorage = snapshotStorage || new InMemorySnapshotStorage();
  }

  /**
   * Set the current validation ID for context
   */
  setValidationId(validationId: string): void {
    this._validationId = validationId;
  }

  /**
   * Create a new citation with optional snapshot
   */
  async createCitation(params: CreateCitationParams): Promise<Citation> {
    const {
      claim,
      source,
      sourceUrl,
      confidence,
      dataType,
      content,
      metadata,
    } = params;

    // Validate URL if provided
    if (sourceUrl && !isValidUrl(sourceUrl) && !sourceUrl.startsWith('internal://')) {
      throw new Error(`Invalid source URL: ${sourceUrl}`);
    }

    // Create snapshot if content provided
    let snapshotUrl = '';
    let snapshotHash = '';

    if (content) {
      const snapshot = await this.snapshotStorage.store({
        originalUrl: sourceUrl,
        content,
        contentType: this.detectContentType(content),
        contentHash: hashContent(content),
        capturedAt: new Date(),
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        metadata,
      });

      snapshotUrl = snapshot.storageUrl;
      snapshotHash = snapshot.contentHash;
    }

    // Create citation
    const citation: Citation = {
      id: generateId('cite'),
      claim,
      source,
      sourceUrl,
      snapshotUrl,
      snapshotHash,
      retrievedAt: new Date(),
      confidence,
      dataType,
      isValid: true,
      lastVerified: new Date(),
    };

    this.citations.set(citation.id, citation);
    return citation;
  }

  /**
   * Create a citation from computed data (not from external source)
   */
  async createComputedCitation(params: {
    claim: string;
    computation: string;
    inputs: string[];
    confidence: number;
  }): Promise<Citation> {
    const { claim, computation, inputs, confidence } = params;

    const citation: Citation = {
      id: generateId('cite'),
      claim,
      source: 'Computed',
      sourceUrl: `internal://computed/${generateId()}`,
      snapshotUrl: '',
      snapshotHash: hashContent(JSON.stringify({ computation, inputs })),
      retrievedAt: new Date(),
      confidence,
      dataType: 'computed',
      isValid: true,
      lastVerified: new Date(),
    };

    this.citations.set(citation.id, citation);
    return citation;
  }

  /**
   * Verify a citation is still valid
   */
  async verifyCitation(citationId: string): Promise<boolean> {
    const citation = this.citations.get(citationId);
    if (!citation) {
      return false;
    }

    // For computed citations, always valid
    if (citation.dataType === 'computed') {
      return true;
    }

    // If we have a snapshot, verify it exists and hash matches
    if (citation.snapshotUrl) {
      const snapshotId = this.extractSnapshotId(citation.snapshotUrl);
      if (snapshotId) {
        const snapshot = await this.snapshotStorage.retrieve(snapshotId);
        if (!snapshot) {
          citation.isValid = false;
          return false;
        }
        if (snapshot.contentHash !== citation.snapshotHash) {
          citation.isValid = false;
          return false;
        }
      }
    }

    citation.lastVerified = new Date();
    citation.isValid = true;
    return true;
  }

  /**
   * Verify all citations
   */
  async verifyAllCitations(): Promise<VerificationResult[]> {
    const results: VerificationResult[] = [];

    for (const citation of this.citations.values()) {
      const isValid = await this.verifyCitation(citation.id);
      results.push({
        citationId: citation.id,
        isValid,
        verifiedAt: new Date(),
        issues: isValid ? undefined : ['Citation verification failed'],
      });
    }

    return results;
  }

  /**
   * Get a citation by ID
   */
  getCitation(citationId: string): Citation | undefined {
    return this.citations.get(citationId);
  }

  /**
   * Get all citations
   */
  getAllCitations(): Citation[] {
    return Array.from(this.citations.values());
  }

  /**
   * Get citations by data type
   */
  getCitationsByType(dataType: DataType): Citation[] {
    return Array.from(this.citations.values()).filter(
      (c) => c.dataType === dataType
    );
  }

  /**
   * Get citations for a specific claim
   */
  getCitationsForClaim(claim: string): Citation[] {
    return Array.from(this.citations.values()).filter((c) =>
      c.claim.toLowerCase().includes(claim.toLowerCase())
    );
  }

  /**
   * Check if minimum citation requirements are met
   */
  meetsCitationRequirements(minCitations: number = 3): {
    meets: boolean;
    count: number;
    required: number;
  } {
    const count = this.citations.size;
    return {
      meets: count >= minCitations,
      count,
      required: minCitations,
    };
  }

  /**
   * Get citation statistics
   */
  getStats(): {
    total: number;
    byType: Record<DataType, number>;
    averageConfidence: number;
    valid: number;
    invalid: number;
  } {
    const citations = Array.from(this.citations.values());

    const byType: Record<DataType, number> = {
      primary: 0,
      secondary: 0,
      computed: 0,
    };

    let totalConfidence = 0;
    let valid = 0;
    let invalid = 0;

    for (const citation of citations) {
      byType[citation.dataType]++;
      totalConfidence += citation.confidence;
      if (citation.isValid) {
        valid++;
      } else {
        invalid++;
      }
    }

    return {
      total: citations.length,
      byType,
      averageConfidence:
        citations.length > 0 ? totalConfidence / citations.length : 0,
      valid,
      invalid,
    };
  }

  /**
   * Clear all citations (for testing)
   */
  clear(): void {
    this.citations.clear();
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Detect content type from content string
   */
  private detectContentType(
    content: string
  ): 'html' | 'json' | 'pdf' | 'text' | 'image' {
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

  /**
   * Extract snapshot ID from storage URL
   */
  private extractSnapshotId(storageUrl: string): string | null {
    if (storageUrl.startsWith('memory://')) {
      return storageUrl.replace('memory://', '');
    }
    // Add other storage URL patterns as needed
    return null;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createCitationManager(
  snapshotStorage?: SnapshotStorage
): CitationManager {
  return new CitationManager(snapshotStorage);
}
