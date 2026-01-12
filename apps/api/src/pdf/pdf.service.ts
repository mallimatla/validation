/**
 * PDF Generation Service
 * Generates professional, marketing-quality PDF reports from validation results
 * Perfect for sharing on WhatsApp, email, etc.
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../common/prisma/prisma.service';

// Brand colors
const COLORS = {
  primary: '#1E3A5F',       // Dark blue
  secondary: '#10B981',     // Emerald green
  accent: '#F59E0B',        // Amber
  danger: '#EF4444',        // Red
  warning: '#F59E0B',       // Yellow/Amber
  neutral: '#64748B',       // Slate
  light: '#F1F5F9',         // Light gray
  white: '#FFFFFF',
  black: '#1E293B',
  gradient1: '#0F172A',     // Dark slate
  gradient2: '#1E3A5F',     // Primary dark
};

// Score to color mapping
const getScoreColor = (score: number): string => {
  if (score >= 70) return COLORS.secondary;
  if (score >= 50) return COLORS.warning;
  return COLORS.danger;
};

// Verdict color mapping
const getVerdictColor = (verdict: string): string => {
  if (verdict === 'PROCEED') return COLORS.secondary;
  if (verdict === 'PROCEED_WITH_CAUTION') return COLORS.warning;
  return COLORS.danger;
};

// Agent icons (using text since PDF doesn't support emojis well)
const AGENT_INFO: Record<string, { name: string; role: string }> = {
  aria: { name: 'Aria', role: 'Orchestrator' },
  marcus: { name: 'Marcus', role: 'Market Intel' },
  sophia: { name: 'Sophia', role: 'Competition' },
  david: { name: 'David', role: 'Financial' },
  elena: { name: 'Elena', role: 'Customer' },
  james: { name: 'James', role: 'Team' },
  rachel: { name: 'Rachel', role: 'Legal/Risk' },
  omar: { name: 'Omar', role: 'Technology' },
  nora: { name: 'Nora', role: 'Funding' },
  victor: { name: 'Victor', role: 'Valuation' },
  victoria: { name: 'Victoria', role: 'Synthesis' },
  sentinel: { name: 'Sentinel', role: 'Trust/Audit' },
};

export interface PdfTemplate {
  name: string;
  description: string;
  style: 'executive' | 'detailed' | 'summary';
}

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get available PDF templates
   */
  getTemplates(): PdfTemplate[] {
    return [
      {
        name: 'executive',
        description: 'Executive summary - perfect for sharing on WhatsApp',
        style: 'executive',
      },
      {
        name: 'detailed',
        description: 'Full detailed report with all agent analyses',
        style: 'detailed',
      },
      {
        name: 'summary',
        description: 'One-page summary with key metrics',
        style: 'summary',
      },
    ];
  }

  /**
   * Generate PDF from validation report
   */
  async generatePdf(
    validationId: string,
    userId: string,
    template: string = 'executive',
  ): Promise<Buffer> {
    this.logger.log(`Generating PDF for validation ${validationId} with template ${template}`);

    // Fetch validation with all related data
    const validation = await this.prisma.validation.findUnique({
      where: { id: validationId },
      include: {
        agentReports: true,
        citations: true,
        fatalFlaws: true,
        ninetyDayPlan: true,
      },
    });

    if (!validation) {
      throw new NotFoundException('Validation not found');
    }

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: {
        Title: `${validation.title} - Validation Report`,
        Author: 'Validation Council',
        Subject: 'Startup Validation Report',
        Creator: 'Validation Council AI Platform',
      },
    });

    // Collect buffer
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    // Generate based on template
    switch (template) {
      case 'detailed':
        await this.generateDetailedTemplate(doc, validation);
        break;
      case 'summary':
        await this.generateSummaryTemplate(doc, validation);
        break;
      default:
        await this.generateExecutiveTemplate(doc, validation);
    }

    // Finalize
    doc.end();

    // Return buffer when done
    return new Promise((resolve) => {
      doc.on('end', () => {
        const buffer = Buffer.concat(chunks);
        this.logger.log(`PDF generated successfully: ${buffer.length} bytes`);
        resolve(buffer);
      });
    });
  }

  /**
   * Draw subtle watermark/logo
   */
  private drawWatermark(doc: PDFKit.PDFDocument) {
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    // Save state
    doc.save();

    // Subtle diagonal watermark
    doc.opacity(0.03);
    doc.fontSize(80);
    doc.fillColor(COLORS.primary);
    doc.rotate(-45, { origin: [pageWidth / 2, pageHeight / 2] });
    doc.text('VALIDATION COUNCIL', 0, pageHeight / 2 - 40, {
      width: pageWidth * 1.5,
      align: 'center',
    });

    // Restore state
    doc.restore();
  }

  /**
   * Draw header with branding
   */
  private drawHeader(doc: PDFKit.PDFDocument, title?: string) {
    const pageWidth = doc.page.width - 100;

    // Header bar
    doc.rect(50, 30, pageWidth, 3).fill(COLORS.primary);

    // Brand text
    doc.fontSize(8)
       .fillColor(COLORS.neutral)
       .text('VALIDATION COUNCIL', 50, 38, { width: pageWidth, align: 'left' });

    if (title) {
      doc.fontSize(8)
         .fillColor(COLORS.neutral)
         .text(title, 50, 38, { width: pageWidth, align: 'right' });
    }
  }

  /**
   * Draw footer
   */
  private drawFooter(doc: PDFKit.PDFDocument, pageNum: number) {
    const pageWidth = doc.page.width - 100;
    const y = doc.page.height - 40;

    // Footer line
    doc.rect(50, y, pageWidth, 0.5).fill(COLORS.neutral);

    // Footer text
    doc.fontSize(8)
       .fillColor(COLORS.neutral)
       .text('www.startupverdict.com', 50, y + 5, { width: pageWidth / 2, align: 'left' })
       .text(`Page ${pageNum}`, 50 + pageWidth / 2, y + 5, { width: pageWidth / 2, align: 'right' });
  }

  /**
   * Draw score gauge (circular)
   */
  private drawScoreGauge(doc: PDFKit.PDFDocument, x: number, y: number, score: number, size: number = 80) {
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    const radius = size / 2 - 5;
    const innerRadius = radius * 0.7;

    // Background circle
    doc.circle(centerX, centerY, radius).fill(COLORS.light);

    // Score arc (simplified - draw a colored circle portion)
    const scoreColor = getScoreColor(score);
    const endAngle = (score / 100) * 360 - 90;

    // Draw arc using path
    doc.save();
    doc.circle(centerX, centerY, radius).fill(scoreColor);
    doc.circle(centerX, centerY, innerRadius).fill(COLORS.white);
    doc.restore();

    // Score text
    doc.fontSize(size * 0.35)
       .fillColor(COLORS.black)
       .text(String(score), centerX - size / 2, centerY - size * 0.15, {
         width: size,
         align: 'center',
       });

    // Label
    doc.fontSize(size * 0.12)
       .fillColor(COLORS.neutral)
       .text('SCORE', centerX - size / 2, centerY + size * 0.15, {
         width: size,
         align: 'center',
       });
  }

  /**
   * Draw metric card
   */
  private drawMetricCard(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    value: string,
    color: string = COLORS.primary,
  ) {
    // Card background
    doc.roundedRect(x, y, width, height, 5).fill(color);

    // Value
    doc.fontSize(24)
       .fillColor(COLORS.white)
       .text(value, x, y + height * 0.25, {
         width: width,
         align: 'center',
       });

    // Label
    doc.fontSize(9)
       .fillColor(COLORS.white)
       .opacity(0.8)
       .text(label, x, y + height * 0.65, {
         width: width,
         align: 'center',
       })
       .opacity(1);
  }

  /**
   * Draw progress bar
   */
  private drawProgressBar(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
    width: number,
    height: number,
    progress: number,
    color: string,
  ) {
    // Background
    doc.roundedRect(x, y, width, height, height / 2).fill(COLORS.light);

    // Progress
    const progressWidth = (progress / 100) * width;
    if (progressWidth > 0) {
      doc.roundedRect(x, y, progressWidth, height, height / 2).fill(color);
    }
  }

  /**
   * Executive Template - Marketing quality, WhatsApp-ready
   */
  private async generateExecutiveTemplate(doc: PDFKit.PDFDocument, validation: any) {
    const pageWidth = doc.page.width - 100;
    let pageNum = 1;

    // === PAGE 1: Cover Page ===
    this.drawWatermark(doc);

    // Dark header section
    doc.rect(0, 0, doc.page.width, 280).fill(COLORS.primary);

    // Brand
    doc.fontSize(12)
       .fillColor(COLORS.white)
       .opacity(0.7)
       .text('VALIDATION COUNCIL', 50, 50)
       .opacity(1);

    // Title
    doc.fontSize(32)
       .fillColor(COLORS.white)
       .text(validation.title || 'Startup Validation Report', 50, 100, {
         width: pageWidth,
       });

    // Subtitle
    doc.fontSize(14)
       .fillColor(COLORS.white)
       .opacity(0.8)
       .text('AI-Powered Startup Validation Report', 50, 160)
       .opacity(1);

    // Date
    doc.fontSize(10)
       .fillColor(COLORS.white)
       .opacity(0.6)
       .text(`Generated: ${new Date().toLocaleDateString('en-US', {
         year: 'numeric',
         month: 'long',
         day: 'numeric'
       })}`, 50, 190)
       .opacity(1);

    // Score section (on cover)
    const scoreY = 320;

    // Main score card
    const scoreColor = getScoreColor(validation.overallScore || 0);
    doc.roundedRect(50, scoreY, 140, 120, 10).fill(scoreColor);
    doc.fontSize(56)
       .fillColor(COLORS.white)
       .text(String(validation.overallScore || 0), 50, scoreY + 25, { width: 140, align: 'center' });
    doc.fontSize(12)
       .fillColor(COLORS.white)
       .opacity(0.9)
       .text('Overall Score', 50, scoreY + 90, { width: 140, align: 'center' })
       .opacity(1);

    // Confidence card
    doc.roundedRect(210, scoreY, 140, 120, 10).fill(COLORS.primary);
    doc.fontSize(40)
       .fillColor(COLORS.white)
       .text(`${validation.overallConfidence || 0}%`, 210, scoreY + 30, { width: 140, align: 'center' });
    doc.fontSize(12)
       .fillColor(COLORS.white)
       .opacity(0.9)
       .text('Confidence', 210, scoreY + 90, { width: 140, align: 'center' })
       .opacity(1);

    // Verdict card
    const verdictColor = getVerdictColor(validation.verdict || '');
    doc.roundedRect(370, scoreY, 175, 120, 10).fill(verdictColor);
    doc.fontSize(16)
       .fillColor(COLORS.white)
       .text((validation.verdict || 'PENDING').replace(/_/g, ' '), 370, scoreY + 45, { width: 175, align: 'center' });
    doc.fontSize(12)
       .fillColor(COLORS.white)
       .opacity(0.9)
       .text('Verdict', 370, scoreY + 90, { width: 175, align: 'center' })
       .opacity(1);

    // Executive Summary
    const summaryY = 470;
    doc.fontSize(16)
       .fillColor(COLORS.primary)
       .text('Executive Summary', 50, summaryY);

    doc.rect(50, summaryY + 25, 40, 3).fill(COLORS.secondary);

    doc.fontSize(11)
       .fillColor(COLORS.black)
       .text(validation.executiveSummary || 'Analysis in progress...', 50, summaryY + 40, {
         width: pageWidth,
         lineGap: 4,
       });

    // Footer
    this.drawFooter(doc, pageNum);

    // === PAGE 2: Agent Analysis ===
    doc.addPage();
    pageNum++;
    this.drawWatermark(doc);
    this.drawHeader(doc, validation.title);

    let y = 60;

    // Section title
    doc.fontSize(18)
       .fillColor(COLORS.primary)
       .text('AI Agent Analysis', 50, y);
    doc.rect(50, y + 25, 40, 3).fill(COLORS.secondary);
    y += 50;

    // Agent grid
    const agents = validation.agentReports || [];
    const cardWidth = (pageWidth - 20) / 3;
    const cardHeight = 70;

    agents.slice(0, 12).forEach((report: any, i: number) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const cardX = 50 + col * (cardWidth + 10);
      const cardY = y + row * (cardHeight + 10);

      const agentInfo = AGENT_INFO[report.agentId] || { name: report.agentId, role: '' };
      const agentScoreColor = getScoreColor(report.score);

      // Card background
      doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 5)
         .lineWidth(1)
         .stroke(COLORS.light);

      // Score indicator
      doc.roundedRect(cardX + cardWidth - 45, cardY + 10, 35, 25, 3).fill(agentScoreColor);
      doc.fontSize(12)
         .fillColor(COLORS.white)
         .text(String(report.score), cardX + cardWidth - 45, cardY + 16, { width: 35, align: 'center' });

      // Agent name
      doc.fontSize(11)
         .fillColor(COLORS.black)
         .text(agentInfo.name, cardX + 10, cardY + 12);

      // Role
      doc.fontSize(8)
         .fillColor(COLORS.neutral)
         .text(agentInfo.role, cardX + 10, cardY + 28);

      // Confidence bar
      this.drawProgressBar(doc, cardX + 10, cardY + 50, cardWidth - 60, 6, report.confidence || 0, COLORS.primary);
      doc.fontSize(7)
         .fillColor(COLORS.neutral)
         .text(`${report.confidence || 0}% conf`, cardX + cardWidth - 55, cardY + 47);
    });

    // Footer
    this.drawFooter(doc, pageNum);

    // === PAGE 3: Key Findings ===
    doc.addPage();
    pageNum++;
    this.drawWatermark(doc);
    this.drawHeader(doc, validation.title);

    y = 60;

    // Section title
    doc.fontSize(18)
       .fillColor(COLORS.primary)
       .text('Key Findings', 50, y);
    doc.rect(50, y + 25, 40, 3).fill(COLORS.secondary);
    y += 50;

    // Collect all findings
    const allFindings = validation.agentReports?.flatMap((r: any) =>
      (r.findings || []).map((f: any) => ({ ...f, agent: r.agentId }))
    ) || [];

    // Group by type
    const strengths = allFindings.filter((f: any) => f.type === 'strength').slice(0, 4);
    const weaknesses = allFindings.filter((f: any) => f.type === 'weakness').slice(0, 4);
    const opportunities = allFindings.filter((f: any) => f.type === 'opportunity').slice(0, 3);
    const threats = allFindings.filter((f: any) => f.type === 'threat').slice(0, 3);

    // Strengths section
    if (strengths.length > 0) {
      doc.fontSize(12)
         .fillColor(COLORS.secondary)
         .text('Strengths', 50, y);
      y += 18;

      strengths.forEach((f: any) => {
        doc.roundedRect(50, y, 4, 30, 2).fill(COLORS.secondary);
        doc.fontSize(10)
           .fillColor(COLORS.black)
           .text(f.title || 'Strength', 60, y + 2, { width: pageWidth - 20 });
        doc.fontSize(9)
           .fillColor(COLORS.neutral)
           .text(f.description || '', 60, y + 15, { width: pageWidth - 20 });
        y += 38;
      });
      y += 10;
    }

    // Weaknesses section
    if (weaknesses.length > 0) {
      doc.fontSize(12)
         .fillColor(COLORS.danger)
         .text('Weaknesses', 50, y);
      y += 18;

      weaknesses.forEach((f: any) => {
        doc.roundedRect(50, y, 4, 30, 2).fill(COLORS.danger);
        doc.fontSize(10)
           .fillColor(COLORS.black)
           .text(f.title || 'Weakness', 60, y + 2, { width: pageWidth - 20 });
        doc.fontSize(9)
           .fillColor(COLORS.neutral)
           .text(f.description || '', 60, y + 15, { width: pageWidth - 20 });
        y += 38;
      });
      y += 10;
    }

    // Check if we need new page
    if (y > 650) {
      doc.addPage();
      pageNum++;
      this.drawWatermark(doc);
      this.drawHeader(doc, validation.title);
      y = 60;
    }

    // Opportunities section
    if (opportunities.length > 0) {
      doc.fontSize(12)
         .fillColor(COLORS.accent)
         .text('Opportunities', 50, y);
      y += 18;

      opportunities.forEach((f: any) => {
        doc.roundedRect(50, y, 4, 30, 2).fill(COLORS.accent);
        doc.fontSize(10)
           .fillColor(COLORS.black)
           .text(f.title || 'Opportunity', 60, y + 2, { width: pageWidth - 20 });
        doc.fontSize(9)
           .fillColor(COLORS.neutral)
           .text(f.description || '', 60, y + 15, { width: pageWidth - 20 });
        y += 38;
      });
    }

    // Footer
    this.drawFooter(doc, pageNum);

    // === PAGE 4: Risks & Recommendations ===
    doc.addPage();
    pageNum++;
    this.drawWatermark(doc);
    this.drawHeader(doc, validation.title);

    y = 60;

    // Two columns
    const colWidth = (pageWidth - 20) / 2;

    // Risks section (left column)
    doc.fontSize(14)
       .fillColor(COLORS.danger)
       .text('Key Risks', 50, y);
    doc.rect(50, y + 20, 30, 2).fill(COLORS.danger);

    let riskY = y + 35;
    const allRisks = validation.agentReports?.flatMap((r: any) => r.risks || []).slice(0, 5) || [];

    allRisks.forEach((risk: any) => {
      const probColor = risk.probability === 'high' ? COLORS.danger :
                        risk.probability === 'medium' ? COLORS.warning : COLORS.secondary;

      doc.roundedRect(50, riskY, 4, 35, 2).fill(probColor);
      doc.fontSize(9)
         .fillColor(COLORS.black)
         .text(risk.title || 'Risk', 60, riskY + 2, { width: colWidth - 20 });
      doc.fontSize(8)
         .fillColor(COLORS.neutral)
         .text(risk.description || '', 60, riskY + 14, { width: colWidth - 20 });
      riskY += 45;
    });

    // Recommendations section (right column)
    doc.fontSize(14)
       .fillColor(COLORS.secondary)
       .text('Recommendations', 50 + colWidth + 20, y);
    doc.rect(50 + colWidth + 20, y + 20, 30, 2).fill(COLORS.secondary);

    let recY = y + 35;
    const allRecs = validation.agentReports?.flatMap((r: any) => r.recommendations || []).slice(0, 5) || [];

    allRecs.forEach((rec: any) => {
      doc.roundedRect(50 + colWidth + 20, recY, 4, 35, 2).fill(COLORS.secondary);
      doc.fontSize(9)
         .fillColor(COLORS.black)
         .text(rec.title || 'Action', 60 + colWidth + 20, recY + 2, { width: colWidth - 20 });
      doc.fontSize(8)
         .fillColor(COLORS.neutral)
         .text(`${rec.description || ''} (${rec.timeframe || 'TBD'})`, 60 + colWidth + 20, recY + 14, { width: colWidth - 20 });
      recY += 45;
    });

    // Footer
    this.drawFooter(doc, pageNum);

    // === FINAL PAGE: Call to Action ===
    doc.addPage();
    pageNum++;

    // Full page colored background
    doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLORS.primary);

    // CTA content
    const ctaY = doc.page.height / 2 - 100;

    doc.fontSize(28)
       .fillColor(COLORS.white)
       .text('Next Steps', 50, ctaY, { width: pageWidth, align: 'center' });

    const ctaText = validation.verdict === 'PROCEED'
      ? 'Your startup idea shows strong potential.\nMove forward with confidence!'
      : validation.verdict === 'PROCEED_WITH_CAUTION'
      ? 'Your idea has promise but needs refinement.\nAddress identified risks before proceeding.'
      : 'Consider pivoting or addressing fundamental concerns\nbefore investing further resources.';

    doc.fontSize(14)
       .fillColor(COLORS.white)
       .opacity(0.9)
       .text(ctaText, 50, ctaY + 50, { width: pageWidth, align: 'center', lineGap: 6 })
       .opacity(1);

    // Brand footer
    doc.fontSize(10)
       .fillColor(COLORS.white)
       .opacity(0.6)
       .text('Generated by Validation Council', 50, doc.page.height - 100, { width: pageWidth, align: 'center' })
       .text('www.startupverdict.com', 50, doc.page.height - 85, { width: pageWidth, align: 'center' })
       .opacity(1);
  }

  /**
   * Detailed Template - Full report with all agent analyses
   */
  private async generateDetailedTemplate(doc: PDFKit.PDFDocument, validation: any) {
    // Start with executive template
    await this.generateExecutiveTemplate(doc, validation);

    const pageWidth = doc.page.width - 100;
    let pageNum = 5;

    // Add individual agent pages
    for (const report of (validation.agentReports || [])) {
      doc.addPage();
      pageNum++;
      this.drawWatermark(doc);
      this.drawHeader(doc, validation.title);

      const agentInfo = AGENT_INFO[report.agentId] || { name: report.agentId, role: '' };
      let y = 60;

      // Agent header
      doc.fontSize(20)
         .fillColor(COLORS.primary)
         .text(`${agentInfo.name} - ${agentInfo.role}`, 50, y);

      // Score badge
      const scoreColor = getScoreColor(report.score);
      doc.roundedRect(pageWidth - 10, y, 60, 35, 5).fill(scoreColor);
      doc.fontSize(18)
         .fillColor(COLORS.white)
         .text(String(report.score), pageWidth - 10, y + 8, { width: 60, align: 'center' });

      y += 50;

      // Confidence
      doc.fontSize(10)
         .fillColor(COLORS.neutral)
         .text(`Confidence: ${report.confidence}%`, 50, y);
      this.drawProgressBar(doc, 130, y + 2, 150, 8, report.confidence || 0, COLORS.primary);
      y += 30;

      // Findings
      if (report.findings && report.findings.length > 0) {
        doc.fontSize(12)
           .fillColor(COLORS.black)
           .text('Findings', 50, y);
        y += 20;

        report.findings.slice(0, 5).forEach((f: any) => {
          const typeColor = f.type === 'strength' ? COLORS.secondary :
                           f.type === 'weakness' ? COLORS.danger :
                           f.type === 'opportunity' ? COLORS.accent : COLORS.neutral;

          doc.roundedRect(50, y, 4, 25, 2).fill(typeColor);
          doc.fontSize(10)
             .fillColor(COLORS.black)
             .text(f.title || '', 60, y + 2, { width: pageWidth - 20 });
          doc.fontSize(8)
             .fillColor(COLORS.neutral)
             .text(f.description || '', 60, y + 14, { width: pageWidth - 20 });
          y += 35;
        });
        y += 10;
      }

      // Recommendations
      if (report.recommendations && report.recommendations.length > 0 && y < 600) {
        doc.fontSize(12)
           .fillColor(COLORS.black)
           .text('Recommendations', 50, y);
        y += 20;

        report.recommendations.slice(0, 3).forEach((rec: any) => {
          doc.roundedRect(50, y, 4, 25, 2).fill(COLORS.secondary);
          doc.fontSize(10)
             .fillColor(COLORS.black)
             .text(rec.title || '', 60, y + 2, { width: pageWidth - 20 });
          doc.fontSize(8)
             .fillColor(COLORS.neutral)
             .text(`${rec.description || ''} (${rec.timeframe || ''})`, 60, y + 14, { width: pageWidth - 20 });
          y += 35;
        });
      }

      this.drawFooter(doc, pageNum);
    }
  }

  /**
   * Summary Template - One page overview
   */
  private async generateSummaryTemplate(doc: PDFKit.PDFDocument, validation: any) {
    const pageWidth = doc.page.width - 100;

    this.drawWatermark(doc);

    let y = 50;

    // Title
    doc.fontSize(22)
       .fillColor(COLORS.primary)
       .text(validation.title || 'Validation Report', 50, y, { width: pageWidth });
    y += 35;

    // Horizontal line
    doc.rect(50, y, 50, 3).fill(COLORS.secondary);
    y += 20;

    // Key metrics row
    const metricWidth = (pageWidth - 20) / 3;

    // Score
    const scoreColor = getScoreColor(validation.overallScore || 0);
    doc.roundedRect(50, y, metricWidth, 70, 5).fill(scoreColor);
    doc.fontSize(32)
       .fillColor(COLORS.white)
       .text(String(validation.overallScore || 0), 50, y + 12, { width: metricWidth, align: 'center' });
    doc.fontSize(10)
       .text('Overall Score', 50, y + 50, { width: metricWidth, align: 'center' });

    // Confidence
    doc.roundedRect(60 + metricWidth, y, metricWidth, 70, 5).fill(COLORS.primary);
    doc.fontSize(28)
       .fillColor(COLORS.white)
       .text(`${validation.overallConfidence || 0}%`, 60 + metricWidth, y + 15, { width: metricWidth, align: 'center' });
    doc.fontSize(10)
       .text('Confidence', 60 + metricWidth, y + 50, { width: metricWidth, align: 'center' });

    // Verdict
    const verdictColor = getVerdictColor(validation.verdict || '');
    doc.roundedRect(70 + metricWidth * 2, y, metricWidth, 70, 5).fill(verdictColor);
    doc.fontSize(14)
       .fillColor(COLORS.white)
       .text((validation.verdict || 'PENDING').replace(/_/g, ' '), 70 + metricWidth * 2, y + 25, { width: metricWidth, align: 'center' });
    doc.fontSize(10)
       .text('Verdict', 70 + metricWidth * 2, y + 50, { width: metricWidth, align: 'center' });

    y += 90;

    // Executive summary
    doc.fontSize(12)
       .fillColor(COLORS.primary)
       .text('Summary', 50, y);
    y += 18;

    doc.fontSize(10)
       .fillColor(COLORS.black)
       .text(validation.executiveSummary || 'Analysis pending...', 50, y, {
         width: pageWidth,
         lineGap: 3,
       });

    y += 100;

    // Agent scores (compact)
    doc.fontSize(12)
       .fillColor(COLORS.primary)
       .text('Agent Scores', 50, y);
    y += 18;

    const agents = validation.agentReports || [];
    agents.forEach((report: any, i: number) => {
      const agentInfo = AGENT_INFO[report.agentId] || { name: report.agentId, role: '' };
      const barY = y + i * 22;

      doc.fontSize(9)
         .fillColor(COLORS.black)
         .text(agentInfo.name, 50, barY, { width: 70 });

      this.drawProgressBar(doc, 120, barY + 3, 300, 10, report.score, getScoreColor(report.score));

      doc.fontSize(9)
         .fillColor(COLORS.black)
         .text(String(report.score), 430, barY);
    });

    // Footer with brand
    doc.fontSize(8)
       .fillColor(COLORS.neutral)
       .text('Generated by Validation Council | www.startupverdict.com', 50, doc.page.height - 50, {
         width: pageWidth,
         align: 'center',
       });
  }
}
