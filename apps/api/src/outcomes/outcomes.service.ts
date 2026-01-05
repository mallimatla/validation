/**
 * Outcomes Service
 * Tracks validation outcomes for accuracy measurement
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class OutcomesService {
  private readonly logger = new Logger(OutcomesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async recordOutcome(validationId: string, data: {
    outcomeType: string;
    outcomeDate?: Date;
    details?: Record<string, any>;
    verificationSource?: string;
    verificationUrl?: string;
  }) {
    return this.prisma.outcome.create({
      data: {
        validationId,
        outcomeType: data.outcomeType,
        outcomeDate: data.outcomeDate,
        details: data.details || {},
        verificationSource: data.verificationSource,
        verificationUrl: data.verificationUrl,
        verified: !!data.verificationSource,
        verifiedAt: data.verificationSource ? new Date() : null,
      },
    });
  }

  async getOutcomes(validationId: string) {
    return this.prisma.outcome.findMany({
      where: { validationId },
      orderBy: { reportedAt: 'desc' },
    });
  }

  async scheduleFollowUps(validationId: string, userId: string) {
    const months = [3, 6, 12, 18, 24];
    const now = new Date();

    const followUps = months.map(m => ({
      validationId,
      userId,
      scheduledFor: new Date(now.getTime() + m * 30 * 24 * 60 * 60 * 1000),
      monthsAfterValidation: m,
    }));

    await this.prisma.followUp.createMany({ data: followUps });
    return followUps;
  }

  async getPlatformStats() {
    const [total, outcomes, byType] = await Promise.all([
      this.prisma.validation.count({ where: { status: 'COMPLETE' } }),
      this.prisma.outcome.count(),
      this.prisma.outcome.groupBy({ by: ['outcomeType'], _count: true }),
    ]);

    return {
      totalValidations: total,
      outcomesCollected: outcomes,
      collectionRate: total > 0 ? outcomes / total : 0,
      outcomeDistribution: byType.reduce(
        (acc: Record<string, any>, item: { outcomeType: string; _count: any }) => { acc[item.outcomeType] = item._count; return acc; },
        {} as Record<string, number>,
      ),
    };
  }
}
