/**
 * Audit Service
 * Manages audit trail for accountability
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import * as crypto from 'crypto';

export interface AuditEventData {
  validationId: string;
  type: string;
  agentId?: string;
  data: Record<string, any>;
  previousEventId?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  private readonly signingSecret: string;

  constructor(private readonly prisma: PrismaService) {
    this.signingSecret = process.env.AUDIT_SIGNING_SECRET || 'development-secret';
  }

  /**
   * Log an audit event
   */
  async log(event: AuditEventData) {
    const signature = this.generateSignature(event);

    const auditEvent = await this.prisma.auditEvent.create({
      data: {
        validationId: event.validationId,
        type: event.type,
        agentId: event.agentId,
        metadata: event.data,
        signature,
        previousEventId: event.previousEventId,
      },
    });

    this.logger.debug(`Audit event logged: ${event.type} for ${event.validationId}`);
    return auditEvent;
  }

  /**
   * Get audit trail for a validation
   */
  async getTrail(validationId: string) {
    const events = await this.prisma.auditEvent.findMany({
      where: { validationId },
      orderBy: { createdAt: 'asc' },
    });

    return {
      validationId,
      events,
      eventCount: events.length,
      startTime: events[0]?.createdAt,
      endTime: events[events.length - 1]?.createdAt,
      hasErrors: events.some(e => e.type.includes('failed') || e.type.includes('error')),
    };
  }

  /**
   * Verify audit trail integrity
   */
  async verifyTrailIntegrity(validationId: string) {
    const events = await this.prisma.auditEvent.findMany({
      where: { validationId },
      orderBy: { createdAt: 'asc' },
    });

    const issues: Array<{ eventId: string; issue: string }> = [];

    for (const event of events) {
      const expectedSignature = this.generateSignature({
        validationId: event.validationId!,
        type: event.type,
        agentId: event.agentId || undefined,
        data: event.metadata as Record<string, any>,
        previousEventId: event.previousEventId || undefined,
      });

      if (event.signature !== expectedSignature) {
        issues.push({
          eventId: event.id,
          issue: 'Signature mismatch - event may have been tampered',
        });
      }
    }

    return {
      validationId,
      eventCount: events.length,
      verified: issues.length === 0,
      issues,
      verifiedAt: new Date(),
    };
  }

  /**
   * Get audit statistics
   */
  async getStats(params?: { startDate?: Date; endDate?: Date }) {
    const where: any = {};
    if (params?.startDate || params?.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = params.startDate;
      if (params.endDate) where.createdAt.lte = params.endDate;
    }

    const [totalEvents, eventsByType] = await Promise.all([
      this.prisma.auditEvent.count({ where }),
      this.prisma.auditEvent.groupBy({
        by: ['type'],
        where,
        _count: true,
      }),
    ]);

    return {
      totalEvents,
      eventsByType: eventsByType.reduce(
        (acc, item) => {
          acc[item.type] = item._count;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  }

  /**
   * Query audit events
   */
  async query(params: {
    validationId?: string;
    eventTypes?: string[];
    agentId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (params.validationId) where.validationId = params.validationId;
    if (params.eventTypes?.length) where.type = { in: params.eventTypes };
    if (params.agentId) where.agentId = params.agentId;
    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = params.startDate;
      if (params.endDate) where.createdAt.lte = params.endDate;
    }

    const [events, total] = await Promise.all([
      this.prisma.auditEvent.findMany({
        where,
        take: params.limit || 50,
        skip: params.offset || 0,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditEvent.count({ where }),
    ]);

    return {
      events,
      total,
      limit: params.limit || 50,
      offset: params.offset || 0,
    };
  }

  private generateSignature(event: AuditEventData): string {
    const payload = JSON.stringify({
      validationId: event.validationId,
      type: event.type,
      agentId: event.agentId,
      data: event.data,
      previousEventId: event.previousEventId,
    });

    return crypto.createHmac('sha256', this.signingSecret).update(payload).digest('hex');
  }
}
