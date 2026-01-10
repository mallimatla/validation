/**
 * PPTX Module
 * PowerPoint presentation generation from validation reports
 */

import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma/prisma.module';
import { PptxController } from './pptx.controller';
import { PptxService } from './pptx.service';

@Module({
  imports: [PrismaModule],
  controllers: [PptxController],
  providers: [PptxService],
  exports: [PptxService],
})
export class PptxModule {}
