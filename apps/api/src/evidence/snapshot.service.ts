/**
 * Snapshot Service
 * Manages evidence snapshots for citations
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import * as crypto from 'crypto';

interface CreateSnapshotParams {
  originalUrl: string;
  content: string;
  contentType: 'html' | 'json' | 'pdf' | 'text' | 'image';
  metadata?: Record<string, any>;
}

@Injectable()
export class SnapshotService {
  private readonly logger = new Logger(SnapshotService.name);
  private readonly expiryDays: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.expiryDays = this.configService.get<number>('SNAPSHOT_EXPIRY_DAYS', 90);
  }

  /**
   * Create a snapshot of content
   */
  async create(params: CreateSnapshotParams) {
    const { originalUrl, content, contentType, metadata } = params;

    // Generate content hash for integrity verification
    const contentHash = this.hashContent(content);

    // Check for existing snapshot with same hash
    const existing = await this.prisma.snapshot.findFirst({
      where: { contentHash },
    });

    if (existing) {
      this.logger.log(`Using existing snapshot: ${existing.id}`);
      return existing;
    }

    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.expiryDays);

    // For now, store content directly (in production, would upload to S3)
    const storageUrl = `memory://${contentHash}`;

    const snapshot = await this.prisma.snapshot.create({
      data: {
        originalUrl,
        content: this.truncateContent(content),
        contentType,
        contentHash,
        storageUrl,
        capturedAt: new Date(),
        expiresAt,
      },
    });

    this.logger.log(`Snapshot created: ${snapshot.id} for ${originalUrl}`);
    return snapshot;
  }

  /**
   * Retrieve a snapshot
   */
  async get(snapshotId: string) {
    const snapshot = await this.prisma.snapshot.findUnique({
      where: { id: snapshotId },
    });

    if (!snapshot) {
      throw new NotFoundException('Snapshot not found');
    }

    return snapshot;
  }

  /**
   * Verify snapshot integrity
   */
  async verifyIntegrity(snapshotId: string): Promise<boolean> {
    const snapshot = await this.get(snapshotId);

    // Check if expired
    if (new Date() > snapshot.expiresAt) {
      this.logger.warn(`Snapshot expired: ${snapshotId}`);
      return false;
    }

    // Verify content hash
    const currentHash = this.hashContent(snapshot.content);
    if (currentHash !== snapshot.contentHash) {
      this.logger.error(`Snapshot integrity check failed: ${snapshotId}`);
      return false;
    }

    return true;
  }

  /**
   * Clean up expired snapshots
   */
  async cleanupExpired(): Promise<number> {
    const result = await this.prisma.snapshot.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    this.logger.log(`Cleaned up ${result.count} expired snapshots`);
    return result.count;
  }

  /**
   * Get storage statistics
   */
  async getStats() {
    const [total, expired, byType] = await Promise.all([
      this.prisma.snapshot.count(),
      this.prisma.snapshot.count({ where: { expiresAt: { lt: new Date() } } }),
      this.prisma.snapshot.groupBy({
        by: ['contentType'],
        _count: true,
      }),
    ]);

    return {
      total,
      active: total - expired,
      expired,
      byType: byType.reduce(
        (acc: Record<string, any>, item: { contentType: string; _count: any }) => {
          acc[item.contentType] = item._count;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  }

  private hashContent(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  private truncateContent(content: string, maxLength: number = 100000): string {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '\n... [truncated]';
  }
}
