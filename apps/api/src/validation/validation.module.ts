/**
 * Validation Module
 * Core validation workflow management
 *
 * Includes all investor-grade agents (v3.0)
 */

import { Module, DynamicModule, Logger } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ValidationController } from './validation.controller';
import { ValidationService } from './validation.service';
import { ValidationProcessor } from './validation.processor';
import { MarcusAgent } from '../agents/marcus/marcus.agent';
import { SophiaAgent } from '../agents/sophia/sophia.agent';
import { DavidAgent } from '../agents/david/david.agent';
import { JamesAgent } from '../agents/james/james.agent';
import { RachelAgent } from '../agents/rachel/rachel.agent';
import { OmarAgent } from '../agents/omar/omar.agent';
import { NoraAgent } from '../agents/nora/nora.agent';
import { VictorAgent } from '../agents/victor/victor.agent';

const logger = new Logger('ValidationModule');

// All investor-grade agents
const INVESTOR_GRADE_AGENTS = [
  MarcusAgent,
  SophiaAgent,
  DavidAgent,
  JamesAgent,
  RachelAgent,
  OmarAgent,
  NoraAgent,
  VictorAgent,
];

// Check if Redis is configured
const isRedisConfigured = () => {
  return !!(process.env.REDIS_URL || process.env.REDIS_HOST);
};

@Module({
  controllers: [ValidationController],
  providers: [ValidationService, ...INVESTOR_GRADE_AGENTS],
  exports: [ValidationService],
})
export class ValidationModule {
  static register(): DynamicModule {
    const imports: any[] = [];
    const providers: any[] = [ValidationService, ...INVESTOR_GRADE_AGENTS];

    if (isRedisConfigured()) {
      logger.log('Redis configured - enabling job queue');
      imports.push(
        BullModule.registerQueue({
          name: 'validations',
        }),
      );
      providers.push(ValidationProcessor);
    } else {
      logger.warn('Redis not configured - job queue disabled');
    }

    logger.log(`Loaded ${INVESTOR_GRADE_AGENTS.length} investor-grade agents (v3.0)`);

    return {
      module: ValidationModule,
      imports,
      controllers: [ValidationController],
      providers,
      exports: [ValidationService],
    };
  }
}
