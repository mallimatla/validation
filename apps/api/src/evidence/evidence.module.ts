/**
 * Evidence Module
 * Citation and snapshot management
 */

import { Module } from '@nestjs/common';
import { EvidenceController } from './evidence.controller';
import { EvidenceService } from './evidence.service';
import { SnapshotService } from './snapshot.service';

@Module({
  controllers: [EvidenceController],
  providers: [EvidenceService, SnapshotService],
  exports: [EvidenceService, SnapshotService],
})
export class EvidenceModule {}
