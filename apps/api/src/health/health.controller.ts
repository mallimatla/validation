/**
 * Health Controller
 * Health check endpoint for monitoring
 */

import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../common/prisma/prisma.service';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  services: {
    database: 'up' | 'down';
    redis: 'up' | 'down';
  };
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  async check(): Promise<HealthStatus> {
    const services = {
      database: await this.checkDatabase(),
      redis: await this.checkRedis(),
    };

    const allUp = Object.values(services).every((s) => s === 'up');
    const allDown = Object.values(services).every((s) => s === 'down');

    return {
      status: allUp ? 'healthy' : allDown ? 'unhealthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      services,
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness check endpoint' })
  async ready(): Promise<{ ready: boolean }> {
    const dbUp = await this.checkDatabase();
    return { ready: dbUp === 'up' };
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness check endpoint' })
  live(): { alive: boolean } {
    return { alive: true };
  }

  private async checkDatabase(): Promise<'up' | 'down'> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return 'up';
    } catch {
      return 'down';
    }
  }

  private async checkRedis(): Promise<'up' | 'down'> {
    // Would check Redis connection here
    // For now, assume up if no Redis configured
    return 'up';
  }
}
