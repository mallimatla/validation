import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { InvestorService } from './investor.service';

interface DiscoveryQueryDto {
  stages?: string;
  industries?: string;
  minScore?: string;
  geography?: string;
  sortBy?: 'matchScore' | 'score' | 'createdAt';
  page?: string;
  limit?: string;
}

interface IntroRequestDto {
  message: string;
}

@Controller('investor')
@UseGuards(AuthGuard)
export class InvestorController {
  constructor(private readonly investorService: InvestorService) {}

  /**
   * Get investor's own profile
   */
  @Get('profile')
  async getProfile(@Request() req: any) {
    return this.investorService.getInvestorProfile(req.user.userId);
  }

  /**
   * Discover validated startups
   * GET /investor/discover?stages=Seed,Series A&industries=AI/ML,SaaS&minScore=60&sortBy=matchScore
   */
  @Get('discover')
  async discoverStartups(
    @Request() req: any,
    @Query() query: DiscoveryQueryDto,
  ) {
    const filters = {
      stages: query.stages ? query.stages.split(',') : undefined,
      industries: query.industries ? query.industries.split(',') : undefined,
      geography: query.geography ? query.geography.split(',') : undefined,
      minScore: query.minScore ? parseInt(query.minScore) : undefined,
      sortBy: query.sortBy,
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 20,
    };

    return this.investorService.discoverStartups(req.user.userId, filters);
  }

  /**
   * Get detailed validation for investor view
   */
  @Get('validation/:id')
  async getValidationDetails(
    @Request() req: any,
    @Param('id') validationId: string,
  ) {
    return this.investorService.getValidationDetails(req.user.userId, validationId);
  }

  /**
   * Get investor's shortlist
   */
  @Get('shortlist')
  async getShortlist(@Request() req: any) {
    return this.investorService.getShortlist(req.user.userId);
  }

  /**
   * Add to shortlist
   */
  @Post('shortlist/:validationId')
  async addToShortlist(
    @Request() req: any,
    @Param('validationId') validationId: string,
  ) {
    await this.investorService.addToShortlist(req.user.userId, validationId);
    return { success: true, message: 'Added to shortlist' };
  }

  /**
   * Remove from shortlist
   */
  @Delete('shortlist/:validationId')
  async removeFromShortlist(
    @Request() req: any,
    @Param('validationId') validationId: string,
  ) {
    await this.investorService.removeFromShortlist(req.user.userId, validationId);
    return { success: true, message: 'Removed from shortlist' };
  }

  /**
   * Get intro requests
   */
  @Get('intros')
  async getIntroRequests(@Request() req: any) {
    return this.investorService.getIntroRequests(req.user.userId);
  }

  /**
   * Request introduction to founder
   */
  @Post('intros/:validationId')
  async requestIntro(
    @Request() req: any,
    @Param('validationId') validationId: string,
    @Body() body: IntroRequestDto,
  ) {
    return this.investorService.requestIntro(
      req.user.userId,
      validationId,
      body.message,
    );
  }
}
