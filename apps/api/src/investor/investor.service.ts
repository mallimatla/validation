/**
 * Investor Service
 * Business logic for investor features
 *
 * Note: Some features require database migration to be applied.
 * Service gracefully handles missing tables/columns.
 */

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
  ConflictException,
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
      // Try to query with investor fields first
      const where: any = {
        isPublic: true,
        status: 'COMPLETE',
        overallScore: { gte: minScore },
      };

      if (industry) {
        where.industry = industry;
      }

      if (stage) {
        where.stage = stage;
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
            viewCount: true,
            saveCount: true,
            interestCount: true,
            allowMeetings: true,
            allowMessages: true,
            founderLinkedIn: true,
            createdAt: true,
            completedAt: true,
            agentReports: {
              select: {
                agentId: true,
                score: true,
              },
            },
          },
        }),
        this.prisma.validation.count({ where }),
      ]);

      return {
        data: deals,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      };
    } catch (error) {
      // If investor columns don't exist yet, fall back to basic query
      this.logger.warn(`browseDeals: Falling back to basic query - ${error.message}`);

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
      } catch (fallbackError) {
        this.logger.error(`browseDeals fallback failed: ${fallbackError.message}`);
        return {
          data: [],
          pagination: { total: 0, limit, offset, hasMore: false },
        };
      }
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
   * Get deal details and track view
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

      // Return deal with default investor fields if columns don't exist
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
          viewCount: (deal as any).viewCount || 0,
          saveCount: (deal as any).saveCount || 0,
          interestCount: (deal as any).interestCount || 0,
          allowMeetings: (deal as any).allowMeetings ?? true,
          allowMessages: (deal as any).allowMessages ?? true,
          founderLinkedIn: (deal as any).founderLinkedIn || null,
          pitchDeckUrl: (deal as any).pitchDeckUrl || null,
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
   * Save a deal to investor's list
   */
  async saveDeal(investorId: string, dealId: string, dto: SaveDealDto) {
    try {
      // Check if InvestorSave table exists by trying a simple query
      const save = await this.prisma.investorSave.create({
        data: {
          investorId,
          validationId: dealId,
          notes: dto.notes,
          tags: dto.tags || [],
          folder: dto.folder,
        },
      });

      // Try to increment save count
      try {
        await this.prisma.validation.update({
          where: { id: dealId },
          data: { saveCount: { increment: 1 } },
        });
      } catch (e) {
        // saveCount column might not exist yet
      }

      this.logger.log(`Investor ${investorId} saved deal ${dealId}`);
      return save;
    } catch (error) {
      if (error.code === 'P2002') {
        // Already saved - update instead
        const existing = await this.prisma.investorSave.findUnique({
          where: { investorId_validationId: { investorId, validationId: dealId } },
        });
        if (existing) {
          return this.prisma.investorSave.update({
            where: { id: existing.id },
            data: {
              notes: dto.notes,
              tags: dto.tags || [],
              folder: dto.folder,
            },
          });
        }
      }
      this.logger.error(`saveDeal: Error - ${error.message}`);
      throw new BadRequestException('Unable to save deal. Database migration may be required.');
    }
  }

  /**
   * Remove deal from saved list
   */
  async unsaveDeal(investorId: string, dealId: string) {
    try {
      const save = await this.prisma.investorSave.findUnique({
        where: { investorId_validationId: { investorId, validationId: dealId } },
      });

      if (!save) {
        throw new NotFoundException('Deal not found in saved list');
      }

      await this.prisma.investorSave.delete({
        where: { id: save.id },
      });

      // Try to decrement save count
      try {
        await this.prisma.validation.update({
          where: { id: dealId },
          data: { saveCount: { decrement: 1 } },
        });
      } catch (e) {
        // saveCount column might not exist yet
      }

      this.logger.log(`Investor ${investorId} unsaved deal ${dealId}`);
      return { message: 'Deal removed from saved list' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`unsaveDeal: Error - ${error.message}`);
      throw new BadRequestException('Unable to unsave deal. Database migration may be required.');
    }
  }

  /**
   * Get investor's saved deals
   */
  async getSavedDeals(investorId: string) {
    try {
      const saves = await this.prisma.investorSave.findMany({
        where: { investorId },
        include: {
          validation: {
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
          },
        },
        orderBy: { savedAt: 'desc' },
      });

      return saves.map((s) => ({
        ...s.validation,
        savedAt: s.savedAt,
        notes: s.notes,
        tags: s.tags,
        folder: s.folder,
        viewCount: 0,
        saveCount: 0,
        interestCount: 0,
      }));
    } catch (error) {
      this.logger.warn(`getSavedDeals: Table may not exist yet - ${error.message}`);
      return [];
    }
  }

  /**
   * Express interest in a deal
   */
  async expressInterest(investorId: string, dealId: string, dto: ExpressInterestDto) {
    try {
      // Check if already expressed interest
      const existing = await this.prisma.investorInterest.findUnique({
        where: { investorId_validationId: { investorId, validationId: dealId } },
      });

      if (existing) {
        // Update existing interest
        return this.prisma.investorInterest.update({
          where: { id: existing.id },
          data: {
            type: dto.type,
            message: dto.message,
            checkSize: dto.checkSize,
          },
        });
      }

      // Create new interest
      const interest = await this.prisma.investorInterest.create({
        data: {
          investorId,
          validationId: dealId,
          type: dto.type,
          message: dto.message,
          checkSize: dto.checkSize,
        },
      });

      // Try to increment interest count
      if (dto.type !== 'PASSED') {
        try {
          await this.prisma.validation.update({
            where: { id: dealId },
            data: { interestCount: { increment: 1 } },
          });
        } catch (e) {
          // interestCount column might not exist yet
        }
      }

      this.logger.log(`Investor ${investorId} expressed ${dto.type} interest in deal ${dealId}`);
      return interest;
    } catch (error) {
      this.logger.error(`expressInterest: Error - ${error.message}`);
      throw new BadRequestException('Unable to express interest. Database migration may be required.');
    }
  }

  /**
   * Get deals where investor expressed interest
   */
  async getInterestedDeals(investorId: string) {
    try {
      const interests = await this.prisma.investorInterest.findMany({
        where: { investorId },
        include: {
          validation: {
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
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return interests.map((i) => ({
        ...i.validation,
        interestType: i.type,
        interestMessage: i.message,
        checkSize: i.checkSize,
        expressedAt: i.createdAt,
        allowMeetings: true,
      }));
    } catch (error) {
      this.logger.warn(`getInterestedDeals: Table may not exist yet - ${error.message}`);
      return [];
    }
  }

  /**
   * Request a meeting with founder
   */
  async requestMeeting(investorId: string, dealId: string, dto: RequestMeetingDto) {
    try {
      // Check if already requested
      const existing = await this.prisma.meetingRequest.findUnique({
        where: { investorId_validationId: { investorId, validationId: dealId } },
      });

      if (existing) {
        throw new ConflictException('Meeting request already exists for this deal');
      }

      const meeting = await this.prisma.meetingRequest.create({
        data: {
          investorId,
          validationId: dealId,
          type: dto.type,
          message: dto.message,
          preferredTimes: dto.preferredTimes || [],
          calendlyLink: dto.calendlyLink,
          status: 'PENDING',
        },
      });

      this.logger.log(`Investor ${investorId} requested ${dto.type} meeting for deal ${dealId}`);
      return meeting;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`requestMeeting: Error - ${error.message}`);
      throw new BadRequestException('Unable to request meeting. Database migration may be required.');
    }
  }

  /**
   * Get investor's meeting requests
   */
  async getMeetingRequests(investorId: string) {
    try {
      const meetings = await this.prisma.meetingRequest.findMany({
        where: { investorId },
        include: {
          validation: {
            select: {
              id: true,
              title: true,
              industry: true,
              overallScore: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return meetings;
    } catch (error) {
      this.logger.warn(`getMeetingRequests: Table may not exist yet - ${error.message}`);
      return [];
    }
  }

  // ============================================================================
  // Founder-facing methods
  // ============================================================================

  /**
   * Make a validation public for investors
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

    try {
      return await this.prisma.validation.update({
        where: { id: validationId },
        data: {
          isPublic: true,
          pitchDeckUrl: dto.pitchDeckUrl,
          contactEmail: dto.contactEmail,
          allowMeetings: dto.allowMeetings ?? true,
          allowMessages: dto.allowMessages ?? true,
          founderLinkedIn: dto.founderLinkedIn,
        },
      });
    } catch (error) {
      this.logger.error(`makeValidationPublic: Error - ${error.message}`);
      throw new BadRequestException('Unable to make validation public. Database migration may be required.');
    }
  }

  /**
   * Make a validation private
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

    try {
      return await this.prisma.validation.update({
        where: { id: validationId },
        data: { isPublic: false },
      });
    } catch (error) {
      this.logger.error(`makeValidationPrivate: Error - ${error.message}`);
      throw new BadRequestException('Unable to make validation private. Database migration may be required.');
    }
  }

  /**
   * Get investor interests in founder's deals
   */
  async getFounderInterests(userId: string) {
    try {
      const interests = await this.prisma.investorInterest.findMany({
        where: {
          validation: { userId },
        },
        include: {
          validation: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return interests;
    } catch (error) {
      this.logger.warn(`getFounderInterests: Table may not exist yet - ${error.message}`);
      return [];
    }
  }

  /**
   * Get meeting requests for founder's deals
   */
  async getFounderMeetingRequests(userId: string) {
    try {
      const meetings = await this.prisma.meetingRequest.findMany({
        where: {
          validation: { userId },
        },
        include: {
          validation: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return meetings;
    } catch (error) {
      this.logger.warn(`getFounderMeetingRequests: Table may not exist yet - ${error.message}`);
      return [];
    }
  }

  /**
   * Respond to a meeting request (founder action)
   */
  async respondToMeeting(userId: string, meetingId: string, dto: RespondMeetingDto) {
    try {
      const meeting = await this.prisma.meetingRequest.findUnique({
        where: { id: meetingId },
        include: {
          validation: {
            select: { userId: true },
          },
        },
      });

      if (!meeting) {
        throw new NotFoundException('Meeting request not found');
      }

      if (meeting.validation.userId !== userId) {
        throw new ForbiddenException('Not authorized to respond to this meeting request');
      }

      return await this.prisma.meetingRequest.update({
        where: { id: meetingId },
        data: {
          status: dto.status,
          founderResponse: dto.message,
          scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
          meetingLink: dto.meetingLink,
          respondedAt: new Date(),
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error(`respondToMeeting: Error - ${error.message}`);
      throw new BadRequestException('Unable to respond to meeting. Database migration may be required.');
    }
  }

  /**
   * Get engagement stats for founder dashboard
   */
  async getFounderEngagementStats(userId: string) {
    try {
      const [totalViews, totalSaves, totalInterests, publicDeals] = await Promise.all([
        this.prisma.investorView.count({
          where: { validation: { userId } },
        }).catch(() => 0),
        this.prisma.investorSave.count({
          where: { validation: { userId } },
        }).catch(() => 0),
        this.prisma.investorInterest.count({
          where: { validation: { userId } },
        }).catch(() => 0),
        this.prisma.validation.count({
          where: { userId, isPublic: true },
        }).catch(() => 0),
      ]);

      // Get recent activity
      let recentInterests: any[] = [];
      try {
        recentInterests = await this.prisma.investorInterest.findMany({
          where: { validation: { userId } },
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            validation: {
              select: { id: true, title: true },
            },
          },
        });
      } catch (e) {
        // Table might not exist
      }

      return {
        totalViews,
        totalSaves,
        totalInterests,
        publicDeals,
        recentInterests,
      };
    } catch (error) {
      this.logger.warn(`getFounderEngagementStats: Error - ${error.message}`);
      return {
        totalViews: 0,
        totalSaves: 0,
        totalInterests: 0,
        publicDeals: 0,
        recentInterests: [],
      };
    }
  }
}
