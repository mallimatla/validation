/**
 * Investor Controller
 * REST API endpoints for investor features
 */

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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard, Public } from '../auth/auth.guard';
import { InvestorService } from './investor.service';
import {
  DealQueryDto,
  SaveDealDto,
  ExpressInterestDto,
  RequestMeetingDto,
  RespondMeetingDto,
  MakePublicDto,
} from './investor.dto';

@ApiTags('investor')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('investor')
export class InvestorController {
  constructor(private readonly investorService: InvestorService) {}

  // ============================================================================
  // Public Deal Browsing
  // ============================================================================

  @Get('deals')
  @Public()
  @ApiOperation({ summary: 'Browse public deals' })
  @ApiResponse({ status: 200, description: 'List of public deals' })
  async browseDeals(@Query() query: DealQueryDto) {
    return this.investorService.browseDeals(query);
  }

  @Get('deals/top')
  @Public()
  @ApiOperation({ summary: 'Get top rated deals' })
  @ApiResponse({ status: 200, description: 'Top rated deals' })
  async getTopDeals(@Query('limit') limit?: number) {
    return this.investorService.getTopDeals(limit);
  }

  @Get('deals/:id')
  @Public()
  @ApiOperation({ summary: 'Get deal details and track view' })
  @ApiResponse({ status: 200, description: 'Deal details' })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  async getDealDetails(@Param('id') id: string, @Request() req: any) {
    const investorId = req.user?.id || null;
    return this.investorService.getDealDetails(id, investorId);
  }

  // ============================================================================
  // Investor Actions (require auth)
  // ============================================================================

  @Post('deals/:id/save')
  @ApiOperation({ summary: 'Save a deal to your list' })
  @ApiResponse({ status: 201, description: 'Deal saved' })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  async saveDeal(
    @Param('id') id: string,
    @Body() dto: SaveDealDto,
    @Request() req: any,
  ) {
    return this.investorService.saveDeal(req.user.id, id, dto);
  }

  @Delete('deals/:id/save')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove deal from saved list' })
  @ApiResponse({ status: 200, description: 'Deal removed from saved list' })
  @ApiResponse({ status: 404, description: 'Deal not found in saved list' })
  async unsaveDeal(@Param('id') id: string, @Request() req: any) {
    return this.investorService.unsaveDeal(req.user.id, id);
  }

  @Get('saved')
  @ApiOperation({ summary: 'Get your saved deals' })
  @ApiResponse({ status: 200, description: 'List of saved deals' })
  async getSavedDeals(@Request() req: any) {
    return this.investorService.getSavedDeals(req.user.id);
  }

  @Post('deals/:id/interest')
  @ApiOperation({ summary: 'Express interest in a deal' })
  @ApiResponse({ status: 201, description: 'Interest expressed' })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  async expressInterest(
    @Param('id') id: string,
    @Body() dto: ExpressInterestDto,
    @Request() req: any,
  ) {
    return this.investorService.expressInterest(req.user.id, id, dto);
  }

  @Get('interests')
  @ApiOperation({ summary: 'Get deals you expressed interest in' })
  @ApiResponse({ status: 200, description: 'List of interested deals' })
  async getInterestedDeals(@Request() req: any) {
    return this.investorService.getInterestedDeals(req.user.id);
  }

  @Post('deals/:id/meeting')
  @ApiOperation({ summary: 'Request a meeting with founder' })
  @ApiResponse({ status: 201, description: 'Meeting request sent' })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  @ApiResponse({ status: 409, description: 'Meeting request already exists' })
  async requestMeeting(
    @Param('id') id: string,
    @Body() dto: RequestMeetingDto,
    @Request() req: any,
  ) {
    return this.investorService.requestMeeting(req.user.id, id, dto);
  }

  @Get('meetings')
  @ApiOperation({ summary: 'Get your meeting requests' })
  @ApiResponse({ status: 200, description: 'List of meeting requests' })
  async getMeetingRequests(@Request() req: any) {
    return this.investorService.getMeetingRequests(req.user.id);
  }

  // ============================================================================
  // Founder Endpoints (manage their deals' visibility)
  // ============================================================================

  @Post('founder/deals/:id/public')
  @ApiOperation({ summary: 'Make a validation public for investors' })
  @ApiResponse({ status: 200, description: 'Validation made public' })
  @ApiResponse({ status: 404, description: 'Validation not found' })
  async makePublic(
    @Param('id') id: string,
    @Body() dto: MakePublicDto,
    @Request() req: any,
  ) {
    return this.investorService.makeValidationPublic(req.user.id, id, dto);
  }

  @Delete('founder/deals/:id/public')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Make a validation private' })
  @ApiResponse({ status: 200, description: 'Validation made private' })
  @ApiResponse({ status: 404, description: 'Validation not found' })
  async makePrivate(@Param('id') id: string, @Request() req: any) {
    return this.investorService.makeValidationPrivate(req.user.id, id);
  }

  @Get('founder/interests')
  @ApiOperation({ summary: 'Get investor interests in your deals' })
  @ApiResponse({ status: 200, description: 'List of investor interests' })
  async getFounderInterests(@Request() req: any) {
    return this.investorService.getFounderInterests(req.user.id);
  }

  @Get('founder/meetings')
  @ApiOperation({ summary: 'Get meeting requests for your deals' })
  @ApiResponse({ status: 200, description: 'List of meeting requests' })
  async getFounderMeetingRequests(@Request() req: any) {
    return this.investorService.getFounderMeetingRequests(req.user.id);
  }

  @Post('founder/meetings/:id/respond')
  @ApiOperation({ summary: 'Respond to a meeting request' })
  @ApiResponse({ status: 200, description: 'Response recorded' })
  @ApiResponse({ status: 404, description: 'Meeting request not found' })
  async respondToMeeting(
    @Param('id') id: string,
    @Body() dto: RespondMeetingDto,
    @Request() req: any,
  ) {
    return this.investorService.respondToMeeting(req.user.id, id, dto);
  }

  @Get('founder/stats')
  @ApiOperation({ summary: 'Get engagement stats for your deals' })
  @ApiResponse({ status: 200, description: 'Engagement statistics' })
  async getFounderStats(@Request() req: any) {
    return this.investorService.getFounderEngagementStats(req.user.id);
  }
}
