/**
 * PPTX Module
 * PowerPoint presentation generation from validation reports
 */

import { Module } from '@nestjs/common';
import { PptxController } from './pptx.controller';
import { PptxService } from './pptx.service';

@Module({
  controllers: [PptxController],
  providers: [PptxService],
  exports: [PptxService],
})
export class PptxModule {}
