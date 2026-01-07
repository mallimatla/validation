/**
 * Investor Service
 * Business logic for investor features
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
          // Get summary agent insights
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
  }

  /**
   * Get top rated deals for featured section
   */
  async getTopDeals(limit: number = 6) {
    const deals = await this.prisma.validation.findMany({
      where: {
        isPublic: true,
        status: 'COMPLETE',
        overallScore: { gte: 70 },
      },
      take: limit,
      orderBy: [
        { overallScore: 'desc' },
        { interestCount: 'desc' },
      ],
      select: {
        id: true,
        title: true,
        description: true,
        industry: true,
        stage: true,
        overallScore: true,
        recommendation: true,
        viewCount: true,
        saveCount: true,
        interestCount: true,
        createdAt: true,
      },
    });

    return deals;
  }

  /**
   * Get deal details and track view
   */
  async getDealDetails(dealId: string, investorId: string | null) {
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

    if (!deal.isPublic) {
      throw new ForbiddenException('This deal is not publicly available');
    }

    // Track the view
    await this.prisma.investorView.create({
      data: {
        investorId,
        validationId: dealId,
        source: 'browse',
      },
    });

    // Increment view count
    await this.prisma.validation.update({
      where: { id: dealId },
      data: { viewCount: { increment: 1 } },
    });

    // Check if investor has saved or expressed interest
    let investorActions = null;
    if (investorId) {
      const [saved, interest, meetingRequest] = await Promise.all([
        this.prisma.investorSave.findUnique({
          where: { investorId_validationId: { investorId, validationId: dealId } },
        }),
        this.prisma.investorInterest.findUnique({
          where: { investorId_validationId: { investorId, validationId: dealId } },
        }),
        this.prisma.meetingRequest.findUnique({
          where: { investorId_validationId: { investorId, validationId: dealId } },
        }),
      ]);

      investorActions = {
        isSaved: !!saved,
        hasExpressedInterest: !!interest,
        interestType: interest?.type,
        meetingRequestStatus: meetingRequest?.status,
      };
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
        viewCount: deal.viewCount,
        saveCount: deal.saveCount,
        interestCount: deal.interestCount,
        allowMeetings: deal.allowMeetings,
        allowMessages: deal.allowMessages,
        founderLinkedIn: deal.founderLinkedIn,
        pitchDeckUrl: deal.pitchDeckUrl,
        createdAt: deal.createdAt,
        completedAt: deal.completedAt,
      },
      agentReports: deal.agentReports,
      investorActions,
    };
  }

  /**
   * Save a deal to investor's list
   */
  async saveDeal(investorId: string, dealId: string, dto: SaveDealDto) {
    // Verify deal exists and is public
    const deal = await this.prisma.validation.findUnique({
      where: { id: dealId },
    });

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    if (!deal.isPublic) {
      throw new ForbiddenException('Cannot save a private deal');
    }

    // Check if already saved
    const existing = await this.prisma.investorSave.findUnique({
      where: { investorId_validationId: { investorId, validationId: dealId } },
    });

    if (existing) {
      // Update existing save
      return this.prisma.investorSave.update({
        where: { id: existing.id },
        data: {
          notes: dto.notes,
          tags: dto.tags || [],
          folder: dto.folder,
        },
      });
    }

    // Create new save
    const save = await this.prisma.investorSave.create({
      data: {
        investorId,
        validationId: dealId,
        notes: dto.notes,
        tags: dto.tags || [],
        folder: dto.folder,
      },
    });

    // Increment save count
    await this.prisma.validation.update({
      where: { id: dealId },
      data: { saveCount: { increment: 1 } },
    });

    this.logger.log(`Investor ${investorId} saved deal ${dealId}`);
    return save;
  }

  /**
   * Remove deal from saved list
   */
  async unsaveDeal(investorId: string, dealId: string) {
    const save = await this.prisma.investorSave.findUnique({
      where: { investorId_validationId: { investorId, validationId: dealId } },
    });

    if (!save) {
      throw new NotFoundException('Deal not found in saved list');
    }

    await this.prisma.investorSave.delete({
      where: { id: save.id },
    });

    // Decrement save count
    await this.prisma.validation.update({
      where: { id: dealId },
      data: { saveCount: { decrement: 1 } },
    });

    this.logger.log(`Investor ${investorId} unsaved deal ${dealId}`);
    return { message: 'Deal removed from saved list' };
  }

  /**
   * Get investor's saved deals
   */
  async getSavedDeals(investorId: string) {
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
            viewCount: true,
            saveCount: true,
            interestCount: true,
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
    }));
  }

  /**
   * Express interest in a deal
   */
  async expressInterest(investorId: string, dealId: string, dto: ExpressInterestDto) {
    // Verify deal exists and is public
    const deal = await this.prisma.validation.findUnique({
      where: { id: dealId },
    });

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    if (!deal.isPublic) {
      throw new ForbiddenException('Cannot express interest in a private deal');
    }

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

    // Increment interest count (only for positive interest types)
    if (dto.type !== 'PASSED') {
      await this.prisma.validation.update({
        where: { id: dealId },
        data: { interestCount: { increment: 1 } },
      });
    }

    this.logger.log(`Investor ${investorId} expressed ${dto.type} interest in deal ${dealId}`);
    return interest;
  }

  /**
   * Get deals where investor expressed interest
   */
  async getInterestedDeals(investorId: string) {
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
            allowMeetings: true,
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
    }));
  }

  /**
   * Request a meeting with founder
   */
  async requestMeeting(investorId: string, dealId: string, dto: RequestMeetingDto) {
    // Verify deal exists and is public
    const deal = await this.prisma.validation.findUnique({
      where: { id: dealId },
    });

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    if (!deal.isPublic) {
      throw new ForbiddenException('Cannot request meeting for a private deal');
    }

    if (!deal.allowMeetings) {
      throw new ForbiddenException('Founder has disabled meeting requests for this deal');
    }

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
  }

  /**
   * Get investor's meeting requests
   */
  async getMeetingRequests(investorId: string) {
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

    return this.prisma.validation.update({
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

    return this.prisma.validation.update({
      where: { id: validationId },
      data: { isPublic: false },
    });
  }

  /**
   * Get investor interests in founder's deals
   */
  async getFounderInterests(userId: string) {
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
  }

  /**
   * Get meeting requests for founder's deals
   */
  async getFounderMeetingRequests(userId: string) {
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
  }

  /**
   * Respond to a meeting request (founder action)
   */
  async respondToMeeting(userId: string, meetingId: string, dto: RespondMeetingDto) {
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

    return this.prisma.meetingRequest.update({
      where: { id: meetingId },
      data: {
        status: dto.status,
        founderResponse: dto.message,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        meetingLink: dto.meetingLink,
        respondedAt: new Date(),
      },
    });
  }

  /**
   * Get engagement stats for founder dashboard
   */
  async getFounderEngagementStats(userId: string) {
    const [totalViews, totalSaves, totalInterests, publicDeals] = await Promise.all([
      this.prisma.investorView.count({
        where: { validation: { userId } },
      }),
      this.prisma.investorSave.count({
        where: { validation: { userId } },
      }),
      this.prisma.investorInterest.count({
        where: { validation: { userId } },
      }),
      this.prisma.validation.count({
        where: { userId, isPublic: true },
      }),
    ]);

    // Get recent activity
    const recentInterests = await this.prisma.investorInterest.findMany({
      where: { validation: { userId } },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        validation: {
          select: { id: true, title: true },
        },
      },
    });

    return {
      totalViews,
      totalSaves,
      totalInterests,
      publicDeals,
      recentInterests,
    };
  }
}
