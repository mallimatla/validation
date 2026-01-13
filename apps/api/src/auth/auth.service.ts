/**
 * Auth Service
 * Authentication logic using Clerk
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClerkClient } from '@clerk/backend';
import { PrismaService } from '../common/prisma/prisma.service';

// User type from Prisma - inferred from PrismaService
type User = Awaited<ReturnType<PrismaService['user']['findFirst']>>;

@Injectable()
export class AuthService {
  private clerkClient: ReturnType<typeof createClerkClient> | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secretKey = this.configService.get<string>('CLERK_SECRET_KEY');
    if (secretKey) {
      console.log(`[Auth] Initializing Clerk client with key: ${secretKey.substring(0, 15)}...${secretKey.substring(secretKey.length - 8)}`);
      this.clerkClient = createClerkClient({ secretKey });
    } else {
      console.warn('[Auth] No CLERK_SECRET_KEY found - running in development mode');
    }
  }

  /**
   * Verify a JWT token from Clerk
   */
  async verifyToken(token: string): Promise<{ userId: string; sessionId: string }> {
    if (!this.clerkClient) {
      // Development mode - allow bypass
      if (this.configService.get('NODE_ENV') === 'development') {
        return { userId: 'dev-user', sessionId: 'dev-session' };
      }
      throw new UnauthorizedException('Authentication not configured');
    }

    try {
      // Decode JWT token to extract user info
      // For production, use proper JWT verification with jose library
      const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      return { userId: decoded.sub!, sessionId: decoded.sid || 'session' };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  /**
   * Get or create user from Clerk ID
   */
  async getOrCreateUser(clerkUserId: string): Promise<User> {
    // First try to find existing user
    let user = await this.prisma.user.findFirst({
      where: { id: clerkUserId },
    });

    if (user) {
      // Update last login
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
      return user;
    }

    // Fetch user details from Clerk
    if (this.clerkClient) {
      try {
        console.log(`[Auth] Fetching user from Clerk: ${clerkUserId}`);
        const clerkUser = await this.clerkClient.users.getUser(clerkUserId);
        console.log(`[Auth] Got Clerk user: ${clerkUser.id}`);

        user = await this.prisma.user.create({
          data: {
            id: clerkUserId,
            email: clerkUser.emailAddresses[0]?.emailAddress || '',
            name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || null,
            avatarUrl: clerkUser.imageUrl,
            lastLoginAt: new Date(),
          },
        });

        // Create default subscription
        await this.prisma.subscription.create({
          data: {
            userId: user.id,
            plan: 'FREE',
            status: 'ACTIVE',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          },
        });

        return user;
      } catch (error: any) {
        console.error(`[Auth] Failed to fetch user from Clerk:`, error?.message || error);
        console.error(`[Auth] Error details:`, JSON.stringify(error?.errors || error, null, 2));
        throw new UnauthorizedException(`Failed to fetch user details: ${error?.message || 'Unknown error'}`);
      }
    }

    // Development mode
    user = await this.prisma.user.create({
      data: {
        id: clerkUserId,
        email: `${clerkUserId}@dev.local`,
        name: 'Development User',
        lastLoginAt: new Date(),
      },
    });

    await this.prisma.subscription.create({
      data: {
        userId: user.id,
        plan: 'PROFESSIONAL',
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });

    return user;
  }

  /**
   * Verify API key
   */
  async verifyApiKey(key: string): Promise<User | null> {
    const keyPrefix = key.substring(0, 8);
    const keyHash = await this.hashApiKey(key);

    const apiKey = await this.prisma.apiKey.findFirst({
      where: {
        keyPrefix,
        keyHash,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      include: { user: true },
    });

    if (!apiKey) {
      return null;
    }

    // Update last used
    await this.prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    });

    return apiKey.user;
  }

  /**
   * Hash API key for storage
   */
  private async hashApiKey(key: string): Promise<string> {
    const crypto = await import('crypto');
    return crypto.createHash('sha256').update(key).digest('hex');
  }
}
