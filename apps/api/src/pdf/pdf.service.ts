/**
 * PDF Generation Service
 * Generates professional, marketing-quality PDF reports
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../common/prisma/prisma.service';

// Brand colors (hex without #)
const COLORS = {
  primary: '1E3A5F',
  secondary: '10B981',
  accent: 'F59E0B',
  danger: 'EF4444',
  warning: 'F59E0B',
  neutral: '64748B',
  light: 'F1F5F9',
  white: 'FFFFFF',
  black: '1E293B',
};

const getScoreColor = (score: number): string => {
  if (score >= 70) return COLORS.secondary;
  if (score >= 50) return COLORS.warning;
  return COLORS.danger;
};

const getVerdictColor = (verdict: string): string => {
  if (verdict === 'PROCEED') return COLORS.secondary;
  if (verdict === 'PROCEED_WITH_CAUTION') return COLORS.warning;
  return COLORS.danger;
};

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

  getTemplates(): PdfTemplate[] {
    return [
      { name: 'executive', description: 'Executive summary for sharing', style: 'executive' },
      { name: 'detailed', description: 'Full detailed report', style: 'detailed' },
      { name: 'summary', description: 'One-page summary', style: 'summary' },
    ];
  }

  async generatePdf(validationId: string, userId: string, template: string = 'executive'): Promise<Buffer> {
    this.logger.log(`Generating PDF for validation ${validationId}`);

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

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      bufferPages: true,
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    switch (template) {
      case 'detailed':
        this.generateDetailedPdf(doc, validation);
        break;
      case 'summary':
        this.generateSummaryPdf(doc, validation);
        break;
      default:
        this.generateExecutivePdf(doc, validation);
    }

    doc.end();

    return new Promise((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    });
  }

  /**
   * Executive PDF - Clean, professional 4-page report
   */
  private generateExecutivePdf(doc: PDFKit.PDFDocument, validation: any) {
    const pageWidth = 495; // A4 width minus margins
    const margin = 50;

    // ========== PAGE 1: Cover ==========
    // Header bar
    doc.rect(0, 0, 595, 200).fill(`#${COLORS.primary}`);

    // Brand
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#FFFFFF')
       .text('VALIDATION COUNCIL', margin, 40);

    // Title
    doc.font('Helvetica-Bold').fontSize(28).fillColor('#FFFFFF')
       .text(validation.title || 'Startup Validation Report', margin, 80, { width: pageWidth });

    // Subtitle
    doc.font('Helvetica').fontSize(12).fillColor('#CCCCCC')
       .text('AI-Powered Startup Validation Report', margin, 140);

    // Date
    doc.fontSize(10).fillColor('#999999')
       .text(`Generated: ${new Date().toLocaleDateString()}`, margin, 160);

    // Score section
    let y = 230;

    // Score box
    const scoreColor = getScoreColor(validation.overallScore || 0);
    doc.rect(margin, y, 120, 90).fill(`#${scoreColor}`);
    doc.font('Helvetica-Bold').fontSize(42).fillColor('#FFFFFF')
       .text(String(validation.overallScore || 0), margin, y + 15, { width: 120, align: 'center' });
    doc.font('Helvetica').fontSize(10)
       .text('Overall Score', margin, y + 65, { width: 120, align: 'center' });

    // Confidence box
    doc.rect(margin + 140, y, 120, 90).fill(`#${COLORS.primary}`);
    doc.font('Helvetica-Bold').fontSize(32).fillColor('#FFFFFF')
       .text(`${validation.overallConfidence || 0}%`, margin + 140, y + 20, { width: 120, align: 'center' });
    doc.font('Helvetica').fontSize(10)
       .text('Confidence', margin + 140, y + 65, { width: 120, align: 'center' });

    // Verdict box
    const verdictColor = getVerdictColor(validation.verdict || '');
    doc.rect(margin + 280, y, 165, 90).fill(`#${verdictColor}`);
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#FFFFFF')
       .text((validation.verdict || 'PENDING').replace(/_/g, ' '), margin + 280, y + 35, { width: 165, align: 'center' });
    doc.font('Helvetica').fontSize(10)
       .text('Verdict', margin + 280, y + 65, { width: 165, align: 'center' });

    // Executive Summary section
    y = 350;
    doc.font('Helvetica-Bold').fontSize(16).fillColor(`#${COLORS.primary}`)
       .text('Executive Summary', margin, y);

    doc.rect(margin, y + 22, 40, 3).fill(`#${COLORS.secondary}`);

    y += 40;
    const summary = validation.executiveSummary || 'Analysis in progress...';
    doc.font('Helvetica').fontSize(11).fillColor(`#${COLORS.black}`)
       .text(summary.substring(0, 800), margin, y, { width: pageWidth, lineGap: 4 });

    // Footer
    this.addFooter(doc, 1);

    // ========== PAGE 2: Agent Analysis ==========
    doc.addPage();
    y = 50;

    doc.font('Helvetica-Bold').fontSize(18).fillColor(`#${COLORS.primary}`)
       .text('AI Agent Analysis', margin, y);
    doc.rect(margin, y + 24, 40, 3).fill(`#${COLORS.secondary}`);

    y = 100;

    const agents = validation.agentReports || [];
    const cardWidth = 150;
    const cardHeight = 55;
    const cols = 3;

    agents.slice(0, 12).forEach((report: any, i: number) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cardX = margin + col * (cardWidth + 12);
      const cardY = y + row * (cardHeight + 10);

      const info = AGENT_INFO[report.agentId] || { name: report.agentId, role: '' };
      const agentColor = getScoreColor(report.score);

      // Card border
      doc.rect(cardX, cardY, cardWidth, cardHeight).lineWidth(1).stroke(`#${COLORS.light}`);

      // Score badge
      doc.rect(cardX + cardWidth - 38, cardY + 8, 30, 20).fill(`#${agentColor}`);
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#FFFFFF')
         .text(String(report.score), cardX + cardWidth - 38, cardY + 13, { width: 30, align: 'center' });

      // Agent name
      doc.font('Helvetica-Bold').fontSize(10).fillColor(`#${COLORS.black}`)
         .text(info.name, cardX + 8, cardY + 10);

      // Role
      doc.font('Helvetica').fontSize(8).fillColor(`#${COLORS.neutral}`)
         .text(info.role, cardX + 8, cardY + 24);

      // Confidence bar
      const confWidth = (report.confidence / 100) * 90;
      doc.rect(cardX + 8, cardY + 40, 90, 5).fill(`#${COLORS.light}`);
      doc.rect(cardX + 8, cardY + 40, confWidth, 5).fill(`#${COLORS.primary}`);
    });

    this.addFooter(doc, 2);

    // ========== PAGE 3: Findings ==========
    doc.addPage();
    y = 50;

    doc.font('Helvetica-Bold').fontSize(18).fillColor(`#${COLORS.primary}`)
       .text('Key Findings', margin, y);
    doc.rect(margin, y + 24, 40, 3).fill(`#${COLORS.secondary}`);

    y = 100;

    const allFindings = validation.agentReports?.flatMap((r: any) => r.findings || []) || [];
    const strengths = allFindings.filter((f: any) => f.type === 'strength').slice(0, 4);
    const weaknesses = allFindings.filter((f: any) => f.type === 'weakness').slice(0, 4);

    // Strengths
    if (strengths.length > 0) {
      doc.font('Helvetica-Bold').fontSize(12).fillColor(`#${COLORS.secondary}`)
         .text('Strengths', margin, y);
      y += 18;

      strengths.forEach((f: any) => {
        doc.rect(margin, y, 4, 28).fill(`#${COLORS.secondary}`);
        doc.font('Helvetica-Bold').fontSize(10).fillColor(`#${COLORS.black}`)
           .text(f.title || 'Strength', margin + 12, y + 2, { width: pageWidth - 20 });
        doc.font('Helvetica').fontSize(9).fillColor(`#${COLORS.neutral}`)
           .text((f.description || '').substring(0, 150), margin + 12, y + 15, { width: pageWidth - 20 });
        y += 35;
      });
      y += 10;
    }

    // Weaknesses
    if (weaknesses.length > 0) {
      doc.font('Helvetica-Bold').fontSize(12).fillColor(`#${COLORS.danger}`)
         .text('Weaknesses', margin, y);
      y += 18;

      weaknesses.forEach((f: any) => {
        doc.rect(margin, y, 4, 28).fill(`#${COLORS.danger}`);
        doc.font('Helvetica-Bold').fontSize(10).fillColor(`#${COLORS.black}`)
           .text(f.title || 'Weakness', margin + 12, y + 2, { width: pageWidth - 20 });
        doc.font('Helvetica').fontSize(9).fillColor(`#${COLORS.neutral}`)
           .text((f.description || '').substring(0, 150), margin + 12, y + 15, { width: pageWidth - 20 });
        y += 35;
      });
    }

    this.addFooter(doc, 3);

    // ========== PAGE 4: Risks & Recommendations ==========
    doc.addPage();
    y = 50;

    const colWidth = (pageWidth - 20) / 2;

    // Risks (left)
    doc.font('Helvetica-Bold').fontSize(14).fillColor(`#${COLORS.danger}`)
       .text('Key Risks', margin, y);
    doc.rect(margin, y + 18, 30, 2).fill(`#${COLORS.danger}`);

    let riskY = y + 30;
    const risks = validation.agentReports?.flatMap((r: any) => r.risks || []).slice(0, 5) || [];

    risks.forEach((risk: any) => {
      const probColor = risk.probability === 'high' ? COLORS.danger :
                        risk.probability === 'medium' ? COLORS.warning : COLORS.secondary;
      doc.rect(margin, riskY, 3, 30).fill(`#${probColor}`);
      doc.font('Helvetica-Bold').fontSize(9).fillColor(`#${COLORS.black}`)
         .text((risk.title || 'Risk').substring(0, 40), margin + 10, riskY + 2, { width: colWidth - 20 });
      doc.font('Helvetica').fontSize(8).fillColor(`#${COLORS.neutral}`)
         .text((risk.description || '').substring(0, 80), margin + 10, riskY + 14, { width: colWidth - 20 });
      riskY += 38;
    });

    // Recommendations (right)
    doc.font('Helvetica-Bold').fontSize(14).fillColor(`#${COLORS.secondary}`)
       .text('Recommendations', margin + colWidth + 20, y);
    doc.rect(margin + colWidth + 20, y + 18, 30, 2).fill(`#${COLORS.secondary}`);

    let recY = y + 30;
    const recs = validation.agentReports?.flatMap((r: any) => r.recommendations || []).slice(0, 5) || [];

    recs.forEach((rec: any) => {
      doc.rect(margin + colWidth + 20, recY, 3, 30).fill(`#${COLORS.secondary}`);
      doc.font('Helvetica-Bold').fontSize(9).fillColor(`#${COLORS.black}`)
         .text((rec.title || 'Action').substring(0, 40), margin + colWidth + 30, recY + 2, { width: colWidth - 20 });
      doc.font('Helvetica').fontSize(8).fillColor(`#${COLORS.neutral}`)
         .text(`${(rec.description || '').substring(0, 60)} (${rec.timeframe || 'TBD'})`, margin + colWidth + 30, recY + 14, { width: colWidth - 20 });
      recY += 38;
    });

    this.addFooter(doc, 4);

    // ========== PAGE 5: CTA ==========
    doc.addPage();

    // Full blue background
    doc.rect(0, 0, 595, 842).fill(`#${COLORS.primary}`);

    doc.font('Helvetica-Bold').fontSize(28).fillColor('#FFFFFF')
       .text('Next Steps', margin, 280, { width: pageWidth, align: 'center' });

    const ctaText = validation.verdict === 'PROCEED'
      ? 'Your startup idea shows strong potential.\nMove forward with confidence!'
      : validation.verdict === 'PROCEED_WITH_CAUTION'
      ? 'Your idea has promise but needs refinement.\nAddress identified risks before proceeding.'
      : 'Consider pivoting or addressing fundamental concerns\nbefore investing further resources.';

    doc.font('Helvetica').fontSize(14).fillColor('#CCCCCC')
       .text(ctaText, margin, 330, { width: pageWidth, align: 'center', lineGap: 6 });

    doc.font('Helvetica').fontSize(10).fillColor('#888888')
       .text('Generated by Validation Council', margin, 700, { width: pageWidth, align: 'center' })
       .text('www.startupverdict.com', margin, 715, { width: pageWidth, align: 'center' });
  }

  /**
   * Summary PDF - Single page overview
   */
  private generateSummaryPdf(doc: PDFKit.PDFDocument, validation: any) {
    const pageWidth = 495;
    const margin = 50;
    let y = 50;

    // Title
    doc.font('Helvetica-Bold').fontSize(20).fillColor(`#${COLORS.primary}`)
       .text(validation.title || 'Validation Report', margin, y, { width: pageWidth });

    doc.rect(margin, y + 28, 50, 3).fill(`#${COLORS.secondary}`);
    y += 50;

    // Metrics row
    const metricWidth = 150;

    // Score
    const scoreColor = getScoreColor(validation.overallScore || 0);
    doc.rect(margin, y, metricWidth, 60).fill(`#${scoreColor}`);
    doc.font('Helvetica-Bold').fontSize(32).fillColor('#FFFFFF')
       .text(String(validation.overallScore || 0), margin, y + 8, { width: metricWidth, align: 'center' });
    doc.font('Helvetica').fontSize(10)
       .text('Overall Score', margin, y + 42, { width: metricWidth, align: 'center' });

    // Confidence
    doc.rect(margin + metricWidth + 15, y, metricWidth, 60).fill(`#${COLORS.primary}`);
    doc.font('Helvetica-Bold').fontSize(26).fillColor('#FFFFFF')
       .text(`${validation.overallConfidence || 0}%`, margin + metricWidth + 15, y + 12, { width: metricWidth, align: 'center' });
    doc.font('Helvetica').fontSize(10)
       .text('Confidence', margin + metricWidth + 15, y + 42, { width: metricWidth, align: 'center' });

    // Verdict
    const verdictColor = getVerdictColor(validation.verdict || '');
    doc.rect(margin + (metricWidth + 15) * 2, y, metricWidth, 60).fill(`#${verdictColor}`);
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#FFFFFF')
       .text((validation.verdict || 'PENDING').replace(/_/g, ' '), margin + (metricWidth + 15) * 2, y + 22, { width: metricWidth, align: 'center' });
    doc.font('Helvetica').fontSize(10)
       .text('Verdict', margin + (metricWidth + 15) * 2, y + 42, { width: metricWidth, align: 'center' });

    y += 80;

    // Summary
    doc.font('Helvetica-Bold').fontSize(12).fillColor(`#${COLORS.primary}`)
       .text('Summary', margin, y);
    y += 18;

    doc.font('Helvetica').fontSize(10).fillColor(`#${COLORS.black}`)
       .text((validation.executiveSummary || 'Analysis pending...').substring(0, 500), margin, y, { width: pageWidth, lineGap: 3 });

    y += 120;

    // Agent scores
    doc.font('Helvetica-Bold').fontSize(12).fillColor(`#${COLORS.primary}`)
       .text('Agent Scores', margin, y);
    y += 20;

    const agents = validation.agentReports || [];
    agents.forEach((report: any, i: number) => {
      const info = AGENT_INFO[report.agentId] || { name: report.agentId, role: '' };
      const barY = y + i * 22;
      const barColor = getScoreColor(report.score);
      const barWidth = (report.score / 100) * 300;

      doc.font('Helvetica').fontSize(9).fillColor(`#${COLORS.black}`)
         .text(info.name, margin, barY, { width: 70 });

      doc.rect(margin + 75, barY + 2, 300, 10).fill(`#${COLORS.light}`);
      doc.rect(margin + 75, barY + 2, barWidth, 10).fill(`#${barColor}`);

      doc.font('Helvetica-Bold').fontSize(9).fillColor(`#${COLORS.black}`)
         .text(String(report.score), margin + 385, barY);
    });

    // Footer
    doc.font('Helvetica').fontSize(8).fillColor(`#${COLORS.neutral}`)
       .text('Generated by Validation Council | www.startupverdict.com', margin, 780, { width: pageWidth, align: 'center' });
  }

  /**
   * Detailed PDF - Full report with all agents
   */
  private generateDetailedPdf(doc: PDFKit.PDFDocument, validation: any) {
    // First generate executive summary pages
    this.generateExecutivePdf(doc, validation);

    const pageWidth = 495;
    const margin = 50;

    // Add individual agent pages
    const agents = validation.agentReports || [];

    agents.forEach((report: any) => {
      doc.addPage();
      let y = 50;

      const info = AGENT_INFO[report.agentId] || { name: report.agentId, role: '' };
      const scoreColor = getScoreColor(report.score);

      // Header
      doc.font('Helvetica-Bold').fontSize(20).fillColor(`#${COLORS.primary}`)
         .text(`${info.name} - ${info.role}`, margin, y);

      // Score badge
      doc.rect(pageWidth - 10, y, 55, 30).fill(`#${scoreColor}`);
      doc.font('Helvetica-Bold').fontSize(18).fillColor('#FFFFFF')
         .text(String(report.score), pageWidth - 10, y + 6, { width: 55, align: 'center' });

      y += 45;

      // Confidence bar
      doc.font('Helvetica').fontSize(10).fillColor(`#${COLORS.neutral}`)
         .text(`Confidence: ${report.confidence}%`, margin, y);
      doc.rect(margin + 90, y + 2, 150, 8).fill(`#${COLORS.light}`);
      doc.rect(margin + 90, y + 2, (report.confidence / 100) * 150, 8).fill(`#${COLORS.primary}`);

      y += 30;

      // Findings
      const findings = report.findings || [];
      if (findings.length > 0) {
        doc.font('Helvetica-Bold').fontSize(12).fillColor(`#${COLORS.black}`)
           .text('Findings', margin, y);
        y += 18;

        findings.slice(0, 6).forEach((f: any) => {
          const typeColor = f.type === 'strength' ? COLORS.secondary :
                           f.type === 'weakness' ? COLORS.danger :
                           f.type === 'opportunity' ? COLORS.accent : COLORS.neutral;

          doc.rect(margin, y, 3, 25).fill(`#${typeColor}`);
          doc.font('Helvetica-Bold').fontSize(9).fillColor(`#${COLORS.black}`)
             .text((f.title || '').substring(0, 60), margin + 10, y + 2, { width: pageWidth - 20 });
          doc.font('Helvetica').fontSize(8).fillColor(`#${COLORS.neutral}`)
             .text((f.description || '').substring(0, 120), margin + 10, y + 13, { width: pageWidth - 20 });
          y += 32;
        });
      }

      y += 15;

      // Recommendations
      const recs = report.recommendations || [];
      if (recs.length > 0 && y < 650) {
        doc.font('Helvetica-Bold').fontSize(12).fillColor(`#${COLORS.black}`)
           .text('Recommendations', margin, y);
        y += 18;

        recs.slice(0, 3).forEach((rec: any) => {
          doc.rect(margin, y, 3, 25).fill(`#${COLORS.secondary}`);
          doc.font('Helvetica-Bold').fontSize(9).fillColor(`#${COLORS.black}`)
             .text((rec.title || '').substring(0, 60), margin + 10, y + 2, { width: pageWidth - 20 });
          doc.font('Helvetica').fontSize(8).fillColor(`#${COLORS.neutral}`)
             .text(`${(rec.description || '').substring(0, 80)} (${rec.timeframe || ''})`, margin + 10, y + 13, { width: pageWidth - 20 });
          y += 32;
        });
      }

      this.addFooter(doc, doc.bufferedPageRange().count);
    });
  }

  private addFooter(doc: PDFKit.PDFDocument, pageNum: number) {
    doc.font('Helvetica').fontSize(8).fillColor(`#${COLORS.neutral}`)
       .text('www.startupverdict.com', 50, 780)
       .text(`Page ${pageNum}`, 495, 780, { width: 50, align: 'right' });
  }
}
