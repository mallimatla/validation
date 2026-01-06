/**
 * Validation Module
 * Core validation workflow management
 */

import { Module, DynamicModule, Logger } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ValidationController } from './validation.controller';
import { ValidationService } from './validation.service';
import { ValidationProcessor } from './validation.processor';

const logger = new Logger('ValidationModule');

// Check if Redis is configured
const isRedisConfigured = () => {
  return !!(process.env.REDIS_URL || process.env.REDIS_HOST);
};

@Module({
  controllers: [ValidationController],
  providers: [ValidationService],
  exports: [ValidationService],
})
export class ValidationModule {
  static register(): DynamicModule {
    const imports: any[] = [];
    const providers: any[] = [ValidationService];

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

    return {
      module: ValidationModule,
      imports,
      controllers: [ValidationController],
      providers,
      exports: [ValidationService],
    };
  }
}
