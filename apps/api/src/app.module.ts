/**
 * Main Application Module
 * Registers all feature modules and providers
 */

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bull';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';

// Core modules
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';

// Feature modules
import { ValidationModule } from './validation/validation.module';
import { AgentsModule } from './agents/agents.module';
import { OrchestratorModule } from './orchestrator/orchestrator.module';
import { EvidenceModule } from './evidence/evidence.module';
import { AuditModule } from './audit/audit.module';
import { OutcomesModule } from './outcomes/outcomes.module';
import { UsersModule } from './users/users.module';
import { PaymentsModule } from './payments/payments.module';

// Health check
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Event system for inter-module communication
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 20,
      verboseMemoryLeak: true,
      ignoreErrors: false,
    }),

    // Redis-backed job queue
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
        },
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      }),
      inject: [ConfigService],
    }),

    // Redis-backed caching
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get('REDIS_URL');
        if (redisUrl) {
          return {
            store: redisStore,
            url: redisUrl,
            ttl: 60 * 60 * 1000, // 1 hour default TTL
          };
        }
        // Fallback to in-memory cache
        return {
          ttl: 60 * 60 * 1000,
        };
      },
      inject: [ConfigService],
    }),

    // Database
    PrismaModule,

    // Authentication
    AuthModule,

    // Core feature modules
    ValidationModule,
    AgentsModule,
    OrchestratorModule,
    EvidenceModule,
    AuditModule,
    OutcomesModule,
    UsersModule,
    PaymentsModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
