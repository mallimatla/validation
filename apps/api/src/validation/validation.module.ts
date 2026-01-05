/**
 * Validation Module
 * Core validation workflow management
 */

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ValidationController } from './validation.controller';
import { ValidationService } from './validation.service';
import { ValidationProcessor } from './validation.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'validations',
    }),
  ],
  controllers: [ValidationController],
  providers: [ValidationService, ValidationProcessor],
  exports: [ValidationService],
})
export class ValidationModule {}
