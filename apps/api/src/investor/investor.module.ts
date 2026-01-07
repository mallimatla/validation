/**
 * Investor Module
 * Handles investor features: browsing deals, saving, expressing interest, meetings
 */

import { Module } from '@nestjs/common';
import { InvestorController } from './investor.controller';
import { InvestorService } from './investor.service';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InvestorController],
  providers: [InvestorService],
  exports: [InvestorService],
})
export class InvestorModule {}
