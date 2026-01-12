/**
 * PDF Generation Controller
 * REST API endpoints for PDF generation
 */

import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  UseGuards,
  Request,
  HttpStatus,
  Logger,
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
import { PdfService } from './pdf.service';

@ApiTags('pdf')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('pdf')
export class PdfController {
  private readonly logger = new Logger(PdfController.name);

  constructor(private readonly pdfService: PdfService) {}

  /**
   * Get available PDF templates
   */
  @Get('templates')
  @Public()
  @ApiOperation({ summary: 'Get available PDF templates' })
  @ApiResponse({ status: 200, description: 'List of available templates' })
  getTemplates() {
    return {
      templates: this.pdfService.getTemplates(),
      message: 'Choose a template for your PDF report',
    };
  }

  /**
   * Generate and download PDF for a validation
   */
  @Get('validation/:id')
  @Public()
  @ApiOperation({ summary: 'Generate PDF from validation report' })
  @ApiQuery({ name: 'template', required: false, enum: ['executive', 'detailed', 'summary'] })
  @ApiResponse({ status: 200, description: 'PDF file download' })
  @ApiResponse({ status: 404, description: 'Validation not found' })
  async downloadPdf(
    @Param('id') id: string,
    @Query('template') template: string = 'executive',
    @Request() req: any,
    @Res() res: Response,
  ) {
    const userId = req.user?.id || 'anonymous';

    try {
      this.logger.log(`Generating PDF for validation ${id} with template ${template}`);

      const buffer = await this.pdfService.generatePdf(id, userId, template);

      // Set headers for file download
      const filename = `validation-report-${id}-${template}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length);

      this.logger.log(`PDF generated successfully: ${buffer.length} bytes`);

      res.status(HttpStatus.OK).send(buffer);
    } catch (error) {
      this.logger.error(`Failed to generate PDF: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Preview PDF metadata (without generating full PDF)
   */
  @Get('validation/:id/preview')
  @Public()
  @ApiOperation({ summary: 'Get PDF preview metadata' })
  async previewPdf(
    @Param('id') id: string,
    @Query('template') template: string = 'executive',
  ) {
    const templates = this.pdfService.getTemplates();
    const selectedTemplate = templates.find(t => t.name === template) || templates[0];

    return {
      validationId: id,
      template: selectedTemplate,
      downloadUrl: `/api/v1/pdf/validation/${id}?template=${template}`,
      estimatedPages: template === 'detailed' ? 15 : template === 'summary' ? 1 : 5,
      features: [
        'Professional branded design',
        'Executive summary with key metrics',
        'AI agent analysis results',
        'SWOT findings breakdown',
        'Risks and recommendations',
        'Subtle watermark branding',
      ],
    };
  }
}
