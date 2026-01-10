/**
 * PPTX Controller
 * REST API endpoints for PowerPoint generation
 */

import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Res,
  UseGuards,
  Request,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Response } from 'express';
import { AuthGuard, Public } from '../auth/auth.guard';
import { PptxService } from './pptx.service';

@ApiTags('pptx')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('pptx')
export class PptxController {
  constructor(private readonly pptxService: PptxService) {}

  @Get('templates')
  @Public()
  @ApiOperation({ summary: 'Get available PPTX templates' })
  @ApiResponse({ status: 200, description: 'List of available templates' })
  getTemplates() {
    return {
      templates: this.pptxService.getTemplates(),
      message: 'Choose a template for your presentation',
    };
  }

  @Get('validation/:id')
  @Public()
  @ApiOperation({ summary: 'Generate PPTX from validation report' })
  @ApiQuery({ name: 'template', required: false, enum: ['professional', 'modern', 'minimal', 'investor'] })
  @ApiResponse({ status: 200, description: 'PPTX file download' })
  @ApiResponse({ status: 404, description: 'Validation not found' })
  async generatePptx(
    @Param('id') id: string,
    @Query('template') template: string = 'professional',
    @Request() req: any,
    @Res() res: Response,
  ) {
    const userId = req.user?.id || 'anonymous';

    // Generate PPTX
    const buffer = await this.pptxService.generatePptx(id, userId, template);

    // Set response headers for file download
    const filename = `validation-report-${id}-${template}.pptx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);

    // Send file
    res.status(HttpStatus.OK).send(buffer);
  }

  @Get('validation/:id/preview')
  @Public()
  @ApiOperation({ summary: 'Get PPTX preview metadata (without generating full file)' })
  @ApiQuery({ name: 'template', required: false, enum: ['professional', 'modern', 'minimal', 'investor'] })
  async getPreview(
    @Param('id') id: string,
    @Query('template') template: string = 'professional',
  ) {
    const templates = this.pptxService.getTemplates();
    const selectedTemplate = templates.find(t => t.name === template) || templates[0];

    return {
      validationId: id,
      template: selectedTemplate,
      downloadUrl: `/api/v1/pptx/validation/${id}?template=${template}`,
      estimatedSlides: 15,
      features: [
        'Executive Summary with scores',
        '12 Agent Analysis slides',
        'Key Findings visualization',
        'Risk Assessment',
        'Recommendations',
        'Call to Action',
      ],
    };
  }
}
