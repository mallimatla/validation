/**
 * ARIA Module
 * Orchestration and coordination services
 */

import { Module } from '@nestjs/common';
import { AriaAgent } from './aria.agent';
import { ExecutionPlanner } from './execution-planner';
import { ConflictDetector } from './conflict-detector';
import { DeliberationService } from './deliberation.service';
import { QualityGateService } from './quality-gate.service';

@Module({
  providers: [
    AriaAgent,
    ExecutionPlanner,
    ConflictDetector,
    DeliberationService,
    QualityGateService,
  ],
  exports: [
    AriaAgent,
    ExecutionPlanner,
    ConflictDetector,
    DeliberationService,
    QualityGateService,
  ],
})
export class AriaModule {}
