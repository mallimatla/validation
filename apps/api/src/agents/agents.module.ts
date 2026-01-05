/**
 * Agents Module
 * Registers all 12 Validation Council agents
 */

import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma/prisma.module';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';

// ARIA - Orchestrator
import { AriaAgent } from './aria/aria.agent';
import { ExecutionPlanner } from './aria/execution-planner';
import { ConflictDetector } from './aria/conflict-detector';
import { DeliberationService } from './aria/deliberation.service';
import { QualityGateService } from './aria/quality-gate.service';

// Analysis Agents
import { MarcusAgent } from './marcus/marcus.agent';
import { SophiaAgent } from './sophia/sophia.agent';
import { DavidAgent } from './david/david.agent';
import { ElenaAgent } from './elena/elena.agent';
import { JamesAgent } from './james/james.agent';
import { RachelAgent } from './rachel/rachel.agent';
import { OmarAgent } from './omar/omar.agent';
import { NoraAgent } from './nora/nora.agent';
import { VictorAgent } from './victor/victor.agent';

// Special Agents
import { VictoriaAgent } from './victoria/victoria.agent';
import { SentinelAgent } from './sentinel/sentinel.agent';

const analysisAgents = [
  MarcusAgent,
  SophiaAgent,
  DavidAgent,
  ElenaAgent,
  JamesAgent,
  RachelAgent,
  OmarAgent,
  NoraAgent,
  VictorAgent,
];

const specialAgents = [
  VictoriaAgent,
  SentinelAgent,
];

const ariaServices = [
  AriaAgent,
  ExecutionPlanner,
  ConflictDetector,
  DeliberationService,
  QualityGateService,
];

@Module({
  imports: [PrismaModule],
  controllers: [AgentsController],
  providers: [
    AgentsService,
    ...ariaServices,
    ...analysisAgents,
    ...specialAgents,
  ],
  exports: [
    AgentsService,
    ...ariaServices,
    ...analysisAgents,
    ...specialAgents,
  ],
})
export class AgentsModule {}
