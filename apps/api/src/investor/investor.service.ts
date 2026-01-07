/**
 * Investor Service
 * Business logic for investor features
 *
 * IMPORTANT: This service is a placeholder until database migration is applied.
 * All methods return empty/default data. Once the investor tables are created
 * in the database, update this service to use actual Prisma queries.
 */

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  DealQueryDto,
  SaveDealDto,
  ExpressInterestDto,
  RequestMeetingDto,
  RespondMeetingDto,
  MakePublicDto,
} from './investor.dto';

@Injectable()
export class InvestorService {
  private readonly logger = new Logger(InvestorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Browse public deals (validations)
   * Note: Currently returns all completed validations as "public" until isPublic column is added
   */
  async browseDeals(query: DealQueryDto) {
    const {
      industry,
      stage,
      minScore = 0,
      sortBy = 'overallScore',
      sortOrder = 'desc',
      limit = 20,
      offset = 0,
    } = query;

    try {
      const where: any = {
        status: 'COMPLETE',
      };

      if (industry) {
        where.industry = industry;
      }

      if (stage) {
        where.stage = stage;
      }

      if (minScore > 0) {
        where.overallScore = { gte: minScore };
      }

      const [deals, total] = await Promise.all([
        this.prisma.validation.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: { [sortBy]: sortOrder },
          select: {
            id: true,
            title: true,
            description: true,
            industry: true,
            stage: true,
            businessModel: true,
            overallScore: true,
            recommendation: true,
            verdict: true,
            createdAt: true,
            completedAt: true,
          },
        }),
        this.prisma.validation.count({ where }),
      ]);

      // Add default investor fields
      const dealsWithDefaults = deals.map(d => ({
        ...d,
        viewCount: 0,
        saveCount: 0,
        interestCount: 0,
        allowMeetings: true,
        allowMessages: true,
        founderLinkedIn: null,
        agentReports: [],
      }));

      return {
        data: dealsWithDefaults,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      };
    } catch (error) {
      this.logger.error(`browseDeals failed: ${error.message}`);
      return {
        data: [],
        pagination: { total: 0, limit, offset, hasMore: false },
      };
    }
  }

  /**
   * Get top rated deals for featured section
   */
  async getTopDeals(limit: number = 6) {
    try {
      const deals = await this.prisma.validation.findMany({
        where: {
          status: 'COMPLETE',
          overallScore: { gte: 70 },
        },
        take: limit,
        orderBy: [
          { overallScore: 'desc' },
        ],
        select: {
          id: true,
          title: true,
          description: true,
          industry: true,
          stage: true,
          overallScore: true,
          recommendation: true,
          createdAt: true,
        },
      });

      // Add default investor fields
      return deals.map(d => ({
        ...d,
        viewCount: 0,
        saveCount: 0,
        interestCount: 0,
      }));
    } catch (error) {
      this.logger.warn(`getTopDeals: Error - ${error.message}`);
      return [];
    }
  }

  /**
   * Get deal details
   */
  async getDealDetails(dealId: string, investorId: string | null) {
    try {
      const deal = await this.prisma.validation.findUnique({
        where: { id: dealId },
        include: {
          agentReports: {
            select: {
              agentId: true,
              score: true,
              confidence: true,
              findings: true,
              recommendations: true,
            },
          },
        },
      });

      if (!deal) {
        throw new NotFoundException('Deal not found');
      }

      return {
        deal: {
          id: deal.id,
          title: deal.title,
          description: deal.description,
          industry: deal.industry,
          stage: deal.stage,
          businessModel: deal.businessModel,
          targetCustomer: deal.targetCustomer,
          overallScore: deal.overallScore,
          overallConfidence: deal.overallConfidence,
          recommendation: deal.recommendation,
          verdict: deal.verdict,
          executiveSummary: deal.executiveSummary,
          viewCount: 0,
          saveCount: 0,
          interestCount: 0,
          allowMeetings: true,
          allowMessages: true,
          founderLinkedIn: null,
          pitchDeckUrl: null,
          createdAt: deal.createdAt,
          completedAt: deal.completedAt,
        },
        agentReports: deal.agentReports,
        investorActions: null,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`getDealDetails: Error - ${error.message}`);
      throw new NotFoundException('Deal not found or unavailable');
    }
  }

  /**
   * Save a deal (placeholder - returns success but doesn't persist)
   */
  async saveDeal(investorId: string, dealId: string, dto: SaveDealDto) {
    this.logger.warn('saveDeal: Investor tables not yet created. Save not persisted.');
    return {
      id: `temp_${Date.now()}`,
      investorId,
      validationId: dealId,
      notes: dto.notes,
      tags: dto.tags || [],
      folder: dto.folder,
      savedAt: new Date(),
    };
  }

  /**
   * Unsave a deal (placeholder)
   */
  async unsaveDeal(investorId: string, dealId: string) {
    this.logger.warn('unsaveDeal: Investor tables not yet created.');
    return { message: 'Deal removed from saved list' };
  }

  /**
   * Get saved deals (placeholder - returns empty)
   */
  async getSavedDeals(investorId: string) {
    this.logger.warn('getSavedDeals: Investor tables not yet created.');
    return [];
  }

  /**
   * Express interest (placeholder)
   */
  async expressInterest(investorId: string, dealId: string, dto: ExpressInterestDto) {
    this.logger.warn('expressInterest: Investor tables not yet created. Interest not persisted.');
    return {
      id: `temp_${Date.now()}`,
      investorId,
      validationId: dealId,
      type: dto.type,
      message: dto.message,
      checkSize: dto.checkSize,
      createdAt: new Date(),
    };
  }

  /**
   * Get interested deals (placeholder - returns empty)
   */
  async getInterestedDeals(investorId: string) {
    this.logger.warn('getInterestedDeals: Investor tables not yet created.');
    return [];
  }

  /**
   * Request meeting (placeholder)
   */
  async requestMeeting(investorId: string, dealId: string, dto: RequestMeetingDto) {
    this.logger.warn('requestMeeting: Investor tables not yet created. Request not persisted.');
    return {
      id: `temp_${Date.now()}`,
      investorId,
      validationId: dealId,
      type: dto.type,
      message: dto.message,
      preferredTimes: dto.preferredTimes || [],
      calendlyLink: dto.calendlyLink,
      status: 'PENDING',
      createdAt: new Date(),
    };
  }

  /**
   * Get meeting requests (placeholder - returns empty)
   */
  async getMeetingRequests(investorId: string) {
    this.logger.warn('getMeetingRequests: Investor tables not yet created.');
    return [];
  }

  // ============================================================================
  // Founder-facing methods
  // ============================================================================

  /**
   * Make validation public (placeholder - not persisted)
   */
  async makeValidationPublic(userId: string, validationId: string, dto: MakePublicDto) {
    const validation = await this.prisma.validation.findUnique({
      where: { id: validationId },
    });

    if (!validation) {
      throw new NotFoundException('Validation not found');
    }

    if (validation.userId !== userId) {
      throw new ForbiddenException('Not authorized to modify this validation');
    }

    if (validation.status !== 'COMPLETE') {
      throw new BadRequestException('Can only make completed validations public');
    }

    this.logger.warn('makeValidationPublic: isPublic column not yet created. Changes not persisted.');

    return {
      ...validation,
      isPublic: true,
      pitchDeckUrl: dto.pitchDeckUrl,
      contactEmail: dto.contactEmail,
      allowMeetings: dto.allowMeetings ?? true,
      allowMessages: dto.allowMessages ?? true,
      founderLinkedIn: dto.founderLinkedIn,
    };
  }

  /**
   * Make validation private (placeholder)
   */
  async makeValidationPrivate(userId: string, validationId: string) {
    const validation = await this.prisma.validation.findUnique({
      where: { id: validationId },
    });

    if (!validation) {
      throw new NotFoundException('Validation not found');
    }

    if (validation.userId !== userId) {
      throw new ForbiddenException('Not authorized to modify this validation');
    }

    this.logger.warn('makeValidationPrivate: isPublic column not yet created. Changes not persisted.');

    return {
      ...validation,
      isPublic: false,
    };
  }

  /**
   * Get founder interests (placeholder - returns empty)
   */
  async getFounderInterests(userId: string) {
    this.logger.warn('getFounderInterests: Investor tables not yet created.');
    return [];
  }

  /**
   * Get founder meeting requests (placeholder - returns empty)
   */
  async getFounderMeetingRequests(userId: string) {
    this.logger.warn('getFounderMeetingRequests: Investor tables not yet created.');
    return [];
  }

  /**
   * Respond to meeting (placeholder)
   */
  async respondToMeeting(userId: string, meetingId: string, dto: RespondMeetingDto) {
    throw new NotFoundException('Meeting request not found - investor tables not yet created');
  }

  /**
   * Get founder engagement stats (returns real zeros until tables exist)
   */
  async getFounderEngagementStats(userId: string) {
    // Return actual zeros - no fake data
    // Once investor tables are created, this will return real counts
    return {
      totalViews: 0,
      totalSaves: 0,
      totalInterests: 0,
      totalMeetings: 0,
    };
  }
}
