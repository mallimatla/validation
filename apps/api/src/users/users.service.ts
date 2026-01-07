/**
 * Users Service
 * Handles user profile and onboarding logic
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { OnboardingDto, UpdateUserDto, UpdateProfileDto, UserType } from './users.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async updateProfile(id: string, data: { name?: string; company?: string }) {
    return this.prisma.user.update({ where: { id }, data });
  }

  async getSubscription(userId: string) {
    return this.prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE' },
    });
  }

  /**
   * Get user profile by ID with full details
   */
  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        founderProfile: true,
        investorProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      company: user.company,
      linkedInUrl: user.linkedInUrl,
      userType: user.userType,
      isVerified: user.isVerified,
      credits: user.credits,
      createdAt: user.createdAt,
      subscription: user.subscriptions[0] ? {
        plan: user.subscriptions[0].plan,
        status: user.subscriptions[0].status,
        validationsUsed: user.subscriptions[0].validationsUsed,
        currentPeriodEnd: user.subscriptions[0].currentPeriodEnd,
      } : null,
      founderProfile: user.founderProfile,
      investorProfile: user.investorProfile,
    };
  }

  /**
   * Complete user onboarding with role selection
   */
  async completeOnboarding(userId: string, data: OnboardingDto) {
    if (data.userType === UserType.INVESTOR && data.founderProfile && !data.investorProfile) {
      throw new BadRequestException('Investor type requires investor profile data');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          userType: data.userType,
          company: data.founderProfile?.company || data.investorProfile?.firmName,
          linkedInUrl: data.founderProfile?.linkedInUrl,
        },
      });

      if (data.userType === UserType.FOUNDER && data.founderProfile) {
        await tx.founderProfile.upsert({
          where: { userId },
          create: {
            userId,
            bio: data.founderProfile.bio,
            skills: data.founderProfile.skills || [],
            githubUrl: data.founderProfile.githubUrl,
            twitterUrl: data.founderProfile.twitterUrl,
            lookingForCofounder: data.founderProfile.lookingForCofounder ?? false,
            openToInvestors: data.founderProfile.openToInvestors ?? true,
          },
          update: {
            bio: data.founderProfile.bio,
            skills: data.founderProfile.skills || [],
            githubUrl: data.founderProfile.githubUrl,
            twitterUrl: data.founderProfile.twitterUrl,
            lookingForCofounder: data.founderProfile.lookingForCofounder,
            openToInvestors: data.founderProfile.openToInvestors,
          },
        });
      }

      if (data.userType === UserType.INVESTOR && data.investorProfile) {
        await tx.investorProfile.upsert({
          where: { userId },
          create: {
            userId,
            firmName: data.investorProfile.firmName,
            firmType: data.investorProfile.firmType || 'angel',
            checkSizeMin: data.investorProfile.checkSizeMin || 0,
            checkSizeMax: data.investorProfile.checkSizeMax || 0,
            stages: data.investorProfile.stages || [],
            industries: data.investorProfile.industries || [],
            geography: data.investorProfile.geography || [],
            thesis: data.investorProfile.thesis,
            websiteUrl: data.investorProfile.websiteUrl,
          },
          update: {
            firmName: data.investorProfile.firmName,
            firmType: data.investorProfile.firmType,
            checkSizeMin: data.investorProfile.checkSizeMin,
            checkSizeMax: data.investorProfile.checkSizeMax,
            stages: data.investorProfile.stages || [],
            industries: data.investorProfile.industries || [],
            geography: data.investorProfile.geography || [],
            thesis: data.investorProfile.thesis,
            websiteUrl: data.investorProfile.websiteUrl,
          },
        });
      }

      return this.getUserProfile(userId);
    });
  }

  /**
   * Update user basic info
   */
  async updateUser(userId: string, data: UpdateUserDto) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        company: data.company,
        linkedInUrl: data.linkedInUrl,
        avatarUrl: data.avatarUrl,
      },
    });

    return this.getUserProfile(userId);
  }

  /**
   * Update user profile (founder or investor)
   */
  async updateUserProfile(userId: string, data: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.userType === 'FOUNDER' && data.founderProfile) {
      await this.prisma.founderProfile.update({
        where: { userId },
        data: {
          bio: data.founderProfile.bio,
          skills: data.founderProfile.skills,
          githubUrl: data.founderProfile.githubUrl,
          twitterUrl: data.founderProfile.twitterUrl,
          lookingForCofounder: data.founderProfile.lookingForCofounder,
          openToInvestors: data.founderProfile.openToInvestors,
        },
      });
    }

    if (user.userType === 'INVESTOR' && data.investorProfile) {
      await this.prisma.investorProfile.update({
        where: { userId },
        data: {
          firmName: data.investorProfile.firmName,
          firmType: data.investorProfile.firmType,
          checkSizeMin: data.investorProfile.checkSizeMin,
          checkSizeMax: data.investorProfile.checkSizeMax,
          stages: data.investorProfile.stages,
          industries: data.investorProfile.industries,
          geography: data.investorProfile.geography,
          thesis: data.investorProfile.thesis,
          websiteUrl: data.investorProfile.websiteUrl,
        },
      });
    }

    return this.getUserProfile(userId);
  }

  /**
   * Switch user type
   */
  async switchUserType(userId: string, newType: UserType) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { userType: newType },
    });

    return this.getUserProfile(userId);
  }

  /**
   * Get subscription usage and limits
   */
  async getSubscriptionUsage(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        validations: {
          where: {
            createdAt: {
              gte: new Date(new Date().setDate(1)),
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const subscription = user.subscriptions[0];
    const plan = subscription?.plan || 'FREE';

    const limits = {
      FREE: { validationsPerMonth: 1, canGoPublic: false, canContactFounders: false },
      STARTER: { validationsPerMonth: 5, canGoPublic: true, canContactFounders: true },
      PROFESSIONAL: { validationsPerMonth: -1, canGoPublic: true, canContactFounders: true },
      ENTERPRISE: { validationsPerMonth: -1, canGoPublic: true, canContactFounders: true },
    };

    const planLimits = limits[plan as keyof typeof limits] || limits.FREE;

    return {
      plan,
      userType: user.userType,
      limits: planLimits,
      usage: {
        validationsThisMonth: user.validations.length,
        validationsRemaining: planLimits.validationsPerMonth === -1
          ? 'unlimited'
          : Math.max(0, planLimits.validationsPerMonth - user.validations.length),
      },
      canCreateValidation: planLimits.validationsPerMonth === -1 || user.validations.length < planLimits.validationsPerMonth,
    };
  }
}
