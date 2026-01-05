/**
 * Audit Controller
 * REST API for audit trail
 */

import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { AuditService } from './audit.service';

@ApiTags('audit')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('trail/:validationId')
  @ApiOperation({ summary: 'Get audit trail for a validation' })
  getTrail(@Param('validationId') validationId: string) {
    return this.auditService.getTrail(validationId);
  }

  @Get('trail/:validationId/verify')
  @ApiOperation({ summary: 'Verify audit trail integrity' })
  verifyTrail(@Param('validationId') validationId: string) {
    return this.auditService.verifyTrailIntegrity(validationId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get audit statistics' })
  getStats() {
    return this.auditService.getStats();
  }

  @Get('events')
  @ApiOperation({ summary: 'Query audit events' })
  @ApiQuery({ name: 'validationId', required: false })
  @ApiQuery({ name: 'eventType', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  queryEvents(
    @Query('validationId') validationId?: string,
    @Query('eventType') eventType?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.auditService.query({
      validationId,
      eventTypes: eventType ? [eventType] : undefined,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }
}
