/**
 * Users Controller
 * Handles user profile management including userType and profiles
 */

import {
  Controller,
  Get,
  Put,
  Body,
  Request,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { PrismaService } from '../common/prisma/prisma.service';

interface UpdateProfileDto {
  userType?: 'FOUNDER' | 'INVESTOR';
  company?: string;
  linkedInUrl?: string;
  founderProfile?: {
    bio?: string;
    lookingForCofounder?: boolean;
    openToInvestors?: boolean;
  };
  investorProfile?: {
    firmName?: string;
    firmType?: string;
    checkSizeMin?: number;
    checkSizeMax?: number;
    stages?: string[];
    industries?: string[];
    geography?: string[];
  };
}

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get current user profile
   */
  @Get('profile')
  async getProfile(@Request() req: any) {
    const userId = req.user.id;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        founderProfile: true,
        investorProfile: true,
        subscriptions: true,
      },
    });

    return user;
  }

  /**
   * Update user profile including userType and linked profiles
   */
  @Put('profile')
  async updateProfile(@Request() req: any, @Body() body: UpdateProfileDto) {
    const userId = req.user.id;

    this.logger.log(`Updating profile for user ${userId}, userType: ${body.userType}`);

    // Start a transaction to update user and create/update profiles atomically
    const result = await this.prisma.$transaction(async (tx) => {
      // Update base user fields
      const userData: any = {};
      if (body.userType) userData.userType = body.userType;
      if (body.company) userData.company = body.company;
      if (body.linkedInUrl) userData.linkedInUrl = body.linkedInUrl;

      // Update user
      const user = await tx.user.update({
        where: { id: userId },
        data: userData,
      });

      // Handle founder profile
      if (body.userType === 'FOUNDER' && body.founderProfile) {
        await tx.founderProfile.upsert({
          where: { userId },
          create: {
            userId,
            bio: body.founderProfile.bio || '',
            lookingForCofounder: body.founderProfile.lookingForCofounder || false,
            openToInvestors: body.founderProfile.openToInvestors ?? true,
          },
          update: {
            bio: body.founderProfile.bio,
            lookingForCofounder: body.founderProfile.lookingForCofounder,
            openToInvestors: body.founderProfile.openToInvestors,
          },
        });
        this.logger.log(`Created/updated founder profile for user ${userId}`);
      }

      // Handle investor profile
      if (body.userType === 'INVESTOR' && body.investorProfile) {
        await tx.investorProfile.upsert({
          where: { userId },
          create: {
            userId,
            firmName: body.investorProfile.firmName || '',
            firmType: body.investorProfile.firmType || 'angel',
            checkSizeMin: body.investorProfile.checkSizeMin || 0,
            checkSizeMax: body.investorProfile.checkSizeMax || 0,
            stages: body.investorProfile.stages || [],
            industries: body.investorProfile.industries || [],
            geography: body.investorProfile.geography || [],
          },
          update: {
            firmName: body.investorProfile.firmName,
            firmType: body.investorProfile.firmType,
            checkSizeMin: body.investorProfile.checkSizeMin,
            checkSizeMax: body.investorProfile.checkSizeMax,
            stages: body.investorProfile.stages,
            industries: body.investorProfile.industries,
            geography: body.investorProfile.geography,
          },
        });
        this.logger.log(`Created/updated investor profile for user ${userId}`);
      }

      // Fetch the complete updated user with profiles
      return tx.user.findUnique({
        where: { id: userId },
        include: {
          founderProfile: true,
          investorProfile: true,
        },
      });
    });

    return result;
  }

  /**
   * Get user subscription status
   */
  @Get('subscription')
  async getSubscription(@Request() req: any) {
    const userId = req.user.userId;

    const subscription = await this.prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE' },
    });

    return subscription || { plan: 'FREE', status: 'ACTIVE' };
  }
}
