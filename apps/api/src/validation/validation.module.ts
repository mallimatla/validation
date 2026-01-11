/**
 * Validation Module
 * Core validation workflow management with research-backed validation framework
 */

import { Module, DynamicModule, Logger } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ValidationController } from './validation.controller';
import { ValidationService } from './validation.service';
import { ValidationProcessor } from './validation.processor';

// Import AI agents that extend BaseAnalysisAgent (validation framework)
import { MarcusAgent } from '../agents/marcus/marcus.agent';
import { SophiaAgent } from '../agents/sophia/sophia.agent';
import { DavidAgent } from '../agents/david/david.agent';
import { ElenaAgent } from '../agents/elena/elena.agent';
import { JamesAgent } from '../agents/james/james.agent';
import { RachelAgent } from '../agents/rachel/rachel.agent';
import { OmarAgent } from '../agents/omar/omar.agent';
import { NoraAgent } from '../agents/nora/nora.agent';
import { VictorAgent } from '../agents/victor/victor.agent';
// Note: VictoriaAgent (synthesis) and SentinelAgent (audit) don't extend BaseAnalysisAgent
// They use fallback data generation until refactored to use the framework

const logger = new Logger('ValidationModule');

// Check if Redis is configured
const isRedisConfigured = () => {
  return !!(process.env.REDIS_URL || process.env.REDIS_HOST);
};

// AI agents that implement BaseAnalysisAgent with validation framework
// Victoria, Sentinel, and ARIA use fallback (synthesis/audit roles)
const AI_AGENTS = [
  MarcusAgent,    // Market Intel - TAM/SAM/SOM, timing, kill signals
  SophiaAgent,    // Competition - 7 Powers framework, moat analysis
  DavidAgent,     // Financial - Rule of 40, T2D3, unit economics, burn multiple
  ElenaAgent,     // Customer - Sean Ellis test, NRR, DAU/MAU, PMF signals
  JamesAgent,     // Team - MIT founder research, team composition
  RachelAgent,    // Legal/Risk - IP, compliance, cap table
  OmarAgent,      // Technology - feasibility, scalability
  NoraAgent,      // Funding - landscape, comparables
  VictorAgent,    // Valuation - benchmarks, multiples
];

@Module({
  controllers: [ValidationController],
  providers: [ValidationService, ...AI_AGENTS],
  exports: [ValidationService],
})
export class ValidationModule {
  static register(): DynamicModule {
    const imports: any[] = [];
    const providers: any[] = [ValidationService, ...AI_AGENTS];

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

    logger.log(`Registered ${AI_AGENTS.length} AI agents with validation framework`);

    return {
      module: ValidationModule,
      imports,
      controllers: [ValidationController],
      providers,
      exports: [ValidationService],
    };
  }
}
