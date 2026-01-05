/**
 * Evidence Controller
 * REST API for citations and snapshots
 */

import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { EvidenceService } from './evidence.service';
import { SnapshotService } from './snapshot.service';

@ApiTags('evidence')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('evidence')
export class EvidenceController {
  constructor(
    private readonly evidenceService: EvidenceService,
    private readonly snapshotService: SnapshotService,
  ) {}

  @Get('citations/:validationId')
  @ApiOperation({ summary: 'Get all citations for a validation' })
  getCitations(@Param('validationId') validationId: string) {
    return this.evidenceService.getCitationsForValidation(validationId);
  }

  @Get('citations/:validationId/verify')
  @ApiOperation({ summary: 'Verify all citations for a validation' })
  verifyCitations(@Param('validationId') validationId: string) {
    return this.evidenceService.verifyAllCitations(validationId);
  }

  @Get('citation/:citationId/verify')
  @ApiOperation({ summary: 'Verify a single citation' })
  verifyCitation(@Param('citationId') citationId: string) {
    return this.evidenceService.verifyCitation(citationId);
  }

  @Get('snapshot/:snapshotId')
  @ApiOperation({ summary: 'Get a snapshot' })
  getSnapshot(@Param('snapshotId') snapshotId: string) {
    return this.snapshotService.get(snapshotId);
  }

  @Get('snapshot/:snapshotId/verify')
  @ApiOperation({ summary: 'Verify snapshot integrity' })
  verifySnapshot(@Param('snapshotId') snapshotId: string) {
    return this.snapshotService.verifyIntegrity(snapshotId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get snapshot storage statistics' })
  getStats() {
    return this.snapshotService.getStats();
  }
}
