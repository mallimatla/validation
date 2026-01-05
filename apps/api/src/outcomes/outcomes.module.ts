/**
 * Outcomes Module
 * Outcome tracking for accountability
 */

import { Module } from '@nestjs/common';
import { OutcomesService } from './outcomes.service';

@Module({
  providers: [OutcomesService],
  exports: [OutcomesService],
})
export class OutcomesModule {}
