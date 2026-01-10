/**
 * Main Application Module
 * Registers all feature modules and providers
 */

import { Module, Logger, DynamicModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bull';
import { CacheModule } from '@nestjs/cache-manager';

const logger = new Logger('AppModule');

// Core modules
import { PrismaModule } from './common/prisma/prisma.module';
import { LLMModule } from './common/llm/llm.module';
import { MarketDataModule } from './common/market-data/market-data.module';
import { IntegrationsModule } from './integrations/integrations.module';
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
import { PptxModule } from './pptx/pptx.module';

// Health check
import { HealthController } from './health/health.controller';

// Check if Redis is configured at module load time
const isRedisConfigured = !!(process.env.REDIS_URL || process.env.REDIS_HOST);

// Conditionally include Bull module
const conditionalBullModule = isRedisConfigured
  ? [
      BullModule.forRootAsync({
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => {
          const redisUrl = configService.get('REDIS_URL');
          const redisHost = configService.get('REDIS_HOST');

          logger.log('Configuring Bull with Redis...');

          return {
            redis: redisUrl
              ? redisUrl
              : {
                  host: redisHost || 'localhost',
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
          };
        },
        inject: [ConfigService],
      }),
    ]
  : [];

if (!isRedisConfigured) {
  logger.warn('Redis not configured - Bull job queue disabled');
}

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

    // Conditionally include Bull module
    ...conditionalBullModule,

    // In-memory caching (Redis support can be added via env vars)
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get('REDIS_URL');
        if (redisUrl) {
          try {
            // Dynamic import to avoid loading redis dependencies when not needed
            const { redisStore } = await import('cache-manager-redis-yet');
            logger.log('Configuring Redis cache...');
            return {
              store: redisStore,
              url: redisUrl,
              ttl: 60 * 60 * 1000, // 1 hour default TTL
            };
          } catch (error) {
            logger.warn('Failed to configure Redis cache, using in-memory:', error);
          }
        }
        // Fallback to in-memory cache
        logger.log('Using in-memory cache');
        return {
          ttl: 60 * 60 * 1000,
        };
      },
      inject: [ConfigService],
    }),

    // Database
    PrismaModule,

    // AI/LLM Services
    LLMModule,

    // Market Data Services
    MarketDataModule,

    // External Data Integrations
    IntegrationsModule,

    // Authentication
    AuthModule,

    // Core feature modules
    ValidationModule.register(),
    AgentsModule,
    OrchestratorModule,
    EvidenceModule,
    AuditModule,
    OutcomesModule,
    UsersModule,
    PaymentsModule,
    PptxModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
