import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface DiscoveryFilters {
  stages?: string[];
  industries?: string[];
  minScore?: number;
  maxScore?: number;
  geography?: string[];
  sortBy?: 'matchScore' | 'score' | 'createdAt';
  page?: number;
  limit?: number;
}

export interface StartupForInvestor {
  id: string;
  title: string;
  description: string;
  industry: string;
  stage: string;
  score: number;
  confidence: number;
  verdict: string;
  geography: string[];
  founderName: string;
  founderAvatar: string;
  matchScore: number;
  isShortlisted: boolean;
  createdAt: Date;
  highlights: string[];
  fundingAsk?: string;
}

@Injectable()
export class InvestorService {
  private readonly logger = new Logger(InvestorService.name);

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Get investor profile with thesis matching criteria
   * Returns null if user is not an investor (allows graceful handling)
   */
  async getInvestorProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { investorProfile: true },
    });

    if (!user) {
      this.logger.warn(`User not found: ${userId}`);
      return null;
    }

    // If user is not an investor, return null to allow frontend to handle redirect
    if (user.userType !== 'INVESTOR') {
      this.logger.log(`User ${userId} is not an investor (type: ${user.userType})`);
      return null;
    }

    return user.investorProfile;
  }

  /**
   * Discover validated startups matching investor criteria
   */
  async discoverStartups(
    investorId: string,
    filters: DiscoveryFilters,
  ): Promise<{ data: StartupForInvestor[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 20, sortBy = 'matchScore', minScore = 0 } = filters;
    const skip = (page - 1) * limit;

    // Get investor profile for thesis matching (may be null for non-investors)
    const investorProfile = await this.getInvestorProfile(investorId);

    // If no investor profile, return empty results (user needs to set up profile)
    if (!investorProfile) {
      this.logger.log(`No investor profile for user ${investorId}, returning empty results`);
      return { data: [], total: 0, page, limit };
    }

    // Get investor's shortlisted validations
    const shortlistedIds = await this.getShortlistedIds(investorId);

    // Build where clause for public/completed validations
    const where: any = {
      status: 'COMPLETE',
      overallScore: { gte: minScore },
      // Only show validations where founder opted in for investor visibility
      user: {
        founderProfile: {
          openToInvestors: true,
        },
      },
    };

    // Apply industry filter
    if (filters.industries && filters.industries.length > 0) {
      where.industry = { in: filters.industries };
    }

    // Apply stage filter
    if (filters.stages && filters.stages.length > 0) {
      where.stage = { in: filters.stages };
    }

    // Get total count
    const total = await this.prisma.validation.count({ where });

    // Get validations with related data
    const validations = await this.prisma.validation.findMany({
      where,
      skip,
      take: limit,
      orderBy: sortBy === 'createdAt'
        ? { createdAt: 'desc' }
        : { overallScore: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            company: true,
            founderProfile: true,
          },
        },
        agentReports: {
          select: {
            agentId: true,
            score: true,
            findings: true,
          },
        },
      },
    });

    // Transform to investor-facing format with match scores
    const startups: StartupForInvestor[] = validations.map((v: any) => {
      const matchScore = this.calculateMatchScore(v, investorProfile);
      const highlights = this.extractHighlights(v);

      return {
        id: v.id,
        title: v.title,
        description: v.description,
        industry: v.industry || 'Technology',
        stage: v.stage || 'Seed',
        score: v.overallScore || 0,
        confidence: v.overallConfidence || 0,
        verdict: v.verdict || 'PROCEED',
        geography: v.geography || [],
        founderName: v.user?.name || 'Anonymous Founder',
        founderAvatar: v.user?.avatarUrl || '',
        matchScore,
        isShortlisted: shortlistedIds.has(v.id),
        createdAt: v.createdAt,
        highlights,
        fundingAsk: (v.founderData as any)?.fundingAsk,
      };
    });

    // Sort by match score if requested
    if (sortBy === 'matchScore') {
      startups.sort((a, b) => b.matchScore - a.matchScore);
    }

    return { data: startups, total, page, limit };
  }

  /**
   * Calculate match score between startup and investor thesis
   */
  private calculateMatchScore(validation: any, investorProfile: any): number {
    if (!investorProfile) return 50; // Default match for investors without profile

    let score = 0;
    let factors = 0;

    // Industry match (40 points)
    if (investorProfile.industries && investorProfile.industries.length > 0) {
      factors++;
      if (investorProfile.industries.includes(validation.industry)) {
        score += 40;
      } else {
        score += 10; // Partial credit
      }
    }

    // Stage match (30 points)
    if (investorProfile.stages && investorProfile.stages.length > 0) {
      factors++;
      if (investorProfile.stages.includes(validation.stage)) {
        score += 30;
      } else {
        score += 5;
      }
    }

    // Geography match (20 points)
    if (investorProfile.geography && investorProfile.geography.length > 0 && validation.geography) {
      factors++;
      const hasMatch = validation.geography.some((g: string) =>
        investorProfile.geography.includes(g)
      );
      if (hasMatch) {
        score += 20;
      } else {
        score += 5;
      }
    }

    // Validation score bonus (10 points)
    factors++;
    if (validation.overallScore >= 80) score += 10;
    else if (validation.overallScore >= 70) score += 7;
    else if (validation.overallScore >= 60) score += 5;
    else score += 2;

    // Normalize to 100 if we have factors
    return factors > 0 ? Math.round(score / factors * (100 / 25)) : 50;
  }

  /**
   * Extract key highlights from validation
   */
  private extractHighlights(validation: any): string[] {
    const highlights: string[] = [];

    // Add score-based highlights
    if (validation.overallScore >= 80) {
      highlights.push('Top 10% score');
    } else if (validation.overallScore >= 70) {
      highlights.push('Strong validation');
    }

    // Extract from agent findings
    const agentReports = validation.agentReports || [];
    for (const report of agentReports) {
      const findings = report.findings || [];
      for (const finding of findings) {
        if (finding.type === 'strength' && finding.severity === 'critical') {
          highlights.push(finding.title);
          if (highlights.length >= 3) break;
        }
      }
      if (highlights.length >= 3) break;
    }

    // Add default highlights if needed
    if (highlights.length < 2) {
      if (validation.verdict === 'PROCEED') highlights.push('Recommended to proceed');
      if ((validation.founderData as any)?.hasRevenue) highlights.push('Has revenue');
      if ((validation.founderData as any)?.hasPriorExit) highlights.push('Repeat founder');
    }

    return highlights.slice(0, 3);
  }

  /**
   * Get IDs of startups shortlisted by investor
   */
  private async getShortlistedIds(investorId: string): Promise<Set<string>> {
    const profile = await this.prisma.investorProfile.findUnique({
      where: { userId: investorId },
      include: { shortlist: true },
    });

    if (!profile) return new Set();

    return new Set(profile.shortlist.map(s => s.validationId));
  }

  /**
   * Add startup to investor's shortlist
   */
  async addToShortlist(investorId: string, validationId: string): Promise<void> {
    // Verify investor
    const investorProfile = await this.getInvestorProfile(investorId);

    if (!investorProfile) {
      throw new ForbiddenException('Investor profile not found');
    }

    // Verify validation exists and is public
    const validation = await this.prisma.validation.findUnique({
      where: { id: validationId },
      include: {
        user: {
          include: { founderProfile: true },
        },
      },
    });

    if (!validation) {
      throw new NotFoundException('Validation not found');
    }

    if (validation.status !== 'COMPLETE') {
      throw new ForbiddenException('Cannot shortlist incomplete validation');
    }

    // Save to shortlist table (upsert to avoid duplicates)
    await this.prisma.investorShortlist.upsert({
      where: {
        investorProfileId_validationId: {
          investorProfileId: investorProfile.id,
          validationId,
        },
      },
      create: {
        investorProfileId: investorProfile.id,
        validationId,
      },
      update: {}, // No update needed, just ensure it exists
    });

    this.logger.log(`Investor ${investorId} shortlisted validation ${validationId}`);

    this.eventEmitter.emit('investor.shortlisted', {
      investorId,
      validationId,
      founderId: validation.userId,
    });
  }

  /**
   * Remove startup from investor's shortlist
   */
  async removeFromShortlist(investorId: string, validationId: string): Promise<void> {
    const investorProfile = await this.getInvestorProfile(investorId);

    if (!investorProfile) {
      throw new ForbiddenException('Investor profile not found');
    }

    await this.prisma.investorShortlist.deleteMany({
      where: {
        investorProfileId: investorProfile.id,
        validationId,
      },
    });

    this.logger.log(`Investor ${investorId} removed ${validationId} from shortlist`);
  }

  /**
   * Get investor's shortlisted startups
   */
  async getShortlist(investorId: string): Promise<StartupForInvestor[]> {
    const investorProfile = await this.getInvestorProfile(investorId);

    if (!investorProfile) {
      return [];
    }

    // Get shortlisted validation IDs
    const shortlistEntries = await this.prisma.investorShortlist.findMany({
      where: { investorProfileId: investorProfile.id },
      orderBy: { addedAt: 'desc' },
    });

    if (shortlistEntries.length === 0) {
      return [];
    }

    // Get full validation data
    const validations = await this.prisma.validation.findMany({
      where: {
        id: { in: shortlistEntries.map(s => s.validationId) },
        status: 'COMPLETE',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            company: true,
            founderProfile: true,
          },
        },
        agentReports: {
          select: {
            agentId: true,
            score: true,
            findings: true,
          },
        },
      },
    });

    // Transform to investor-facing format
    return validations.map((v: any) => {
      const matchScore = this.calculateMatchScore(v, investorProfile);
      const highlights = this.extractHighlights(v);

      return {
        id: v.id,
        title: v.title,
        description: v.description,
        industry: v.industry || 'Technology',
        stage: v.stage || 'Seed',
        score: v.overallScore || 0,
        confidence: v.overallConfidence || 0,
        verdict: v.verdict || 'PROCEED',
        geography: v.geography || [],
        founderName: v.user?.name || 'Anonymous Founder',
        founderAvatar: v.user?.avatarUrl || '',
        matchScore,
        isShortlisted: true,
        createdAt: v.createdAt,
        highlights,
        fundingAsk: (v.founderData as any)?.fundingAsk,
      };
    });
  }

  /**
   * Request introduction to founder
   */
  async requestIntro(
    investorId: string,
    validationId: string,
    message: string,
  ): Promise<{ id: string; status: string }> {
    // Verify investor
    const investorProfile = await this.getInvestorProfile(investorId);

    // Get investor user details
    const investor = await this.prisma.user.findUnique({
      where: { id: investorId },
      include: { investorProfile: true },
    });

    // Verify validation and get founder
    const validation = await this.prisma.validation.findUnique({
      where: { id: validationId },
      include: {
        user: {
          include: { founderProfile: true },
        },
      },
    });

    if (!validation) {
      throw new NotFoundException('Validation not found');
    }

    if (!validation.userId) {
      throw new ForbiddenException('Cannot contact anonymous validation');
    }

    // Create intro request
    const introRequest = await this.prisma.investorIntroRequest.create({
      data: {
        investorProfileId: investorProfile!.id,
        validationId,
        message,
        status: 'pending',
      },
    });

    this.eventEmitter.emit('investor.intro_requested', {
      investorId,
      investorName: investor?.name,
      investorFirm: investorProfile?.firmName,
      founderId: validation.userId,
      validationId,
      validationTitle: validation.title,
      message,
    });

    this.logger.log(`Intro request created: ${introRequest.id}`);

    return {
      id: introRequest.id,
      status: 'pending',
    };
  }

  /**
   * Get investor's intro requests
   */
  async getIntroRequests(investorId: string): Promise<any[]> {
    const investorProfile = await this.getInvestorProfile(investorId);

    if (!investorProfile) {
      return [];
    }

    const requests = await this.prisma.investorIntroRequest.findMany({
      where: { investorProfileId: investorProfile.id },
      orderBy: { requestedAt: 'desc' },
    });

    // Fetch validation details for each request
    const enrichedRequests = await Promise.all(
      requests.map(async (req: any) => {
        const validation = await this.prisma.validation.findUnique({
          where: { id: req.validationId },
          select: {
            id: true,
            title: true,
            industry: true,
            stage: true,
            overallScore: true,
            user: {
              select: {
                name: true,
                avatarUrl: true,
              },
            },
          },
        });
        return { ...req, validation };
      })
    );

    return enrichedRequests;
  }

  /**
   * Get full validation details for investor (if they have access)
   */
  async getValidationDetails(investorId: string, validationId: string): Promise<any> {
    await this.getInvestorProfile(investorId);

    const validation = await this.prisma.validation.findUnique({
      where: { id: validationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            company: true,
            linkedInUrl: true,
            founderProfile: true,
          },
        },
        agentReports: true,
      },
    });

    if (!validation) {
      throw new NotFoundException('Validation not found');
    }

    // Check if validation is public
    if (
      validation.status !== 'COMPLETE' ||
      !validation.user?.founderProfile?.openToInvestors
    ) {
      throw new ForbiddenException('This validation is not available for investors');
    }

    return validation;
  }
}
