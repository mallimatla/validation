/**
 * Validation Controller
 * REST API endpoints for validation workflows
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard, Public } from '../auth/auth.guard';
import { ValidationService } from './validation.service';
import { CreateValidationDto, UpdateValidationDto, ValidationQueryDto } from './validation.dto';

@ApiTags('validations')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('validations')
export class ValidationController {
  constructor(private readonly validationService: ValidationService) {}

  @Post()
  @Public()
  @ApiOperation({ summary: 'Create a new validation request' })
  @ApiResponse({ status: 201, description: 'Validation created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async create(@Body() dto: CreateValidationDto, @Request() req: any) {
    // Use anonymous user ID if not authenticated
    const userId = req.user?.id || 'anonymous';
    return this.validationService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all validations for the user' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  async findAll(@Query() query: ValidationQueryDto, @Request() req: any) {
    try {
      if (!req.user?.id) {
        return { validations: [], total: 0, limit: 10, offset: 0 };
      }
      return this.validationService.findAll(req.user.id, query);
    } catch (error: any) {
      console.error('[Validations] Error fetching validations:', error?.message);
      // Return empty list on error rather than 500
      return { validations: [], total: 0, limit: 10, offset: 0 };
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific validation' })
  @ApiResponse({ status: 200, description: 'Validation found' })
  @ApiResponse({ status: 404, description: 'Validation not found' })
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.validationService.findOne(id, req.user.id);
  }

  @Get(':id/progress')
  @ApiOperation({ summary: 'Get validation progress' })
  async getProgress(@Param('id') id: string, @Request() req: any) {
    return this.validationService.getProgress(id, req.user.id);
  }

  @Get(':id/report')
  @ApiOperation({ summary: 'Get full validation report' })
  async getReport(@Param('id') id: string, @Request() req: any) {
    return this.validationService.getReport(id, req.user.id);
  }

  @Get(':id/citations')
  @ApiOperation({ summary: 'Get all citations for a validation' })
  async getCitations(@Param('id') id: string, @Request() req: any) {
    return this.validationService.getCitations(id, req.user.id);
  }

  @Get(':id/audit-trail')
  @ApiOperation({ summary: 'Get audit trail for a validation' })
  async getAuditTrail(@Param('id') id: string, @Request() req: any) {
    return this.validationService.getAuditTrail(id, req.user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update validation (before processing)' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateValidationDto,
    @Request() req: any,
  ) {
    return this.validationService.update(id, req.user.id, dto);
  }

  @Post(':id/start')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Start processing a validation' })
  async start(@Param('id') id: string, @Request() req: any) {
    return this.validationService.startProcessing(id, req.user.id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a validation in progress' })
  async cancel(@Param('id') id: string, @Request() req: any) {
    return this.validationService.cancel(id, req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a validation' })
  async remove(@Param('id') id: string, @Request() req: any) {
    return this.validationService.remove(id, req.user.id);
  }

  @Post(':id/challenge')
  @ApiOperation({ summary: 'Challenge a finding' })
  async challengeFinding(
    @Param('id') id: string,
    @Body() body: { findingId: string; reason: string },
    @Request() req: any,
  ) {
    return this.validationService.challengeFinding(id, req.user.id, body);
  }
}
