/**
 * PDF Generation Service
 * Generates professional, marketing-quality PDF reports using PDFKit
 * with charts, tables, and beautiful layouts
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
  lightGray: 'E2E8F0',
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

// Agent display names - functional roles (not internal names)
const AGENT_INFO: Record<string, { name: string; role: string }> = {
  aria: { name: 'AI Orchestration', role: 'Coordination & Synthesis' },
  marcus: { name: 'Market Analysis', role: 'TAM/SAM/SOM Study' },
  sophia: { name: 'Competitor Analysis', role: 'Competitive Landscape' },
  david: { name: 'Financial Analysis', role: 'Unit Economics' },
  elena: { name: 'Customer Analysis', role: 'Product-Market Fit' },
  james: { name: 'Team Assessment', role: 'Founder Evaluation' },
  rachel: { name: 'Legal & Risk', role: 'Regulatory Analysis' },
  omar: { name: 'Technical Analysis', role: 'Tech Feasibility' },
  nora: { name: 'Funding Analysis', role: 'Investment Landscape' },
  victor: { name: 'Valuation', role: 'Company Valuation' },
  victoria: { name: 'Final Synthesis', role: 'Recommendations' },
  sentinel: { name: 'Trust & Audit', role: 'Data Verification' },
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
   * Executive PDF - Clean, professional 5-page report
   */
  private generateExecutivePdf(doc: PDFKit.PDFDocument, validation: any) {
    const pageWidth = 495;
    const margin = 50;

    // ========== PAGE 1: Cover ==========
    doc.rect(0, 0, 595, 200).fill(`#${COLORS.primary}`);

    doc.font('Helvetica-Bold').fontSize(11).fillColor('#FFFFFF')
       .text('VALIDATION COUNCIL', margin, 40);

    doc.font('Helvetica-Bold').fontSize(28).fillColor('#FFFFFF')
       .text(validation.title || 'Startup Validation Report', margin, 80, { width: pageWidth });

    doc.font('Helvetica').fontSize(12).fillColor('#CCCCCC')
       .text('AI-Powered Startup Validation Report', margin, 140);

    doc.fontSize(10).fillColor('#999999')
       .text(`Generated: ${new Date().toLocaleDateString()}`, margin, 160);

    let y = 230;

    // Score box
    const scoreColor = getScoreColor(validation.overallScore || 0);
    doc.roundedRect(margin, y, 120, 90, 5).fill(`#${scoreColor}`);
    doc.font('Helvetica-Bold').fontSize(42).fillColor('#FFFFFF')
       .text(String(validation.overallScore || 0), margin, y + 15, { width: 120, align: 'center' });
    doc.font('Helvetica').fontSize(10)
       .text('Overall Score', margin, y + 65, { width: 120, align: 'center' });

    // Confidence box
    doc.roundedRect(margin + 140, y, 120, 90, 5).fill(`#${COLORS.primary}`);
    doc.font('Helvetica-Bold').fontSize(32).fillColor('#FFFFFF')
       .text(`${validation.overallConfidence || 0}%`, margin + 140, y + 20, { width: 120, align: 'center' });
    doc.font('Helvetica').fontSize(10)
       .text('Confidence', margin + 140, y + 65, { width: 120, align: 'center' });

    // Verdict box
    const verdictColor = getVerdictColor(validation.verdict || '');
    doc.roundedRect(margin + 280, y, 165, 90, 5).fill(`#${verdictColor}`);
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

    this.addFooter(doc, 1);

    // ========== PAGE 2: Performance Dashboard ==========
    doc.addPage();
    y = 50;

    doc.font('Helvetica-Bold').fontSize(18).fillColor(`#${COLORS.primary}`)
       .text('Performance Dashboard', margin, y);
    doc.rect(margin, y + 24, 50, 3).fill(`#${COLORS.secondary}`);

    y = 100;

    // Large score circle
    const circleX = margin + 80;
    const circleY = y + 80;
    doc.circle(circleX, circleY, 60).fill(`#${scoreColor}`);
    doc.font('Helvetica-Bold').fontSize(36).fillColor('#FFFFFF')
       .text(String(validation.overallScore || 0), circleX - 30, circleY - 18, { width: 60, align: 'center' });
    doc.font('Helvetica').fontSize(10)
       .text('/100', circleX - 15, circleY + 18, { width: 30, align: 'center' });

    // Score distribution
    const agents = validation.agentReports || [];
    const highScores = agents.filter((a: any) => a.score >= 70).length;
    const medScores = agents.filter((a: any) => a.score >= 50 && a.score < 70).length;
    const lowScores = agents.filter((a: any) => a.score < 50).length;

    const barX = margin + 200;
    doc.font('Helvetica-Bold').fontSize(12).fillColor(`#${COLORS.black}`)
       .text('Score Distribution', barX, y);

    y = 120;
    this.drawBar(doc, barX, y, 'High (70+)', highScores, agents.length, COLORS.secondary);
    this.drawBar(doc, barX, y + 30, 'Medium (50-69)', medScores, agents.length, COLORS.warning);
    this.drawBar(doc, barX, y + 60, 'Low (<50)', lowScores, agents.length, COLORS.danger);

    // Agent performance table
    y = 230;
    doc.font('Helvetica-Bold').fontSize(14).fillColor(`#${COLORS.primary}`)
       .text('Agent Performance', margin, y);

    y += 25;
    // Table header
    doc.rect(margin, y, pageWidth, 25).fill(`#${COLORS.primary}`);
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#FFFFFF')
       .text('Agent', margin + 10, y + 7)
       .text('Role', margin + 150, y + 7)
       .text('Score', margin + 350, y + 7)
       .text('Confidence', margin + 410, y + 7);

    y += 25;
    const sortedAgents = [...agents].sort((a: any, b: any) => b.score - a.score);
    sortedAgents.slice(0, 12).forEach((agent: any, i: number) => {
      const info = AGENT_INFO[agent.agentId] || { name: agent.agentId, role: '' };
      const rowY = y + i * 22;
      const agentScoreColor = getScoreColor(agent.score);

      if (i % 2 === 0) {
        doc.rect(margin, rowY, pageWidth, 22).fill(`#${COLORS.light}`);
      }

      doc.font('Helvetica').fontSize(9).fillColor(`#${COLORS.black}`)
         .text(info.name, margin + 10, rowY + 6)
         .text(info.role, margin + 150, rowY + 6);
      doc.font('Helvetica-Bold').fillColor(`#${agentScoreColor}`)
         .text(String(agent.score), margin + 350, rowY + 6);
      doc.font('Helvetica').fillColor(`#${COLORS.neutral}`)
         .text(`${agent.confidence}%`, margin + 410, rowY + 6);
    });

    this.addFooter(doc, 2);

    // ========== PAGE 3: Agent Grid ==========
    doc.addPage();
    y = 50;

    doc.font('Helvetica-Bold').fontSize(18).fillColor(`#${COLORS.primary}`)
       .text('AI Agent Analysis', margin, y);
    doc.rect(margin, y + 24, 50, 3).fill(`#${COLORS.secondary}`);
    doc.font('Helvetica').fontSize(10).fillColor(`#${COLORS.neutral}`)
       .text('Each AI agent specializes in a different aspect of startup validation', margin, y + 35);

    y = 100;
    const cardWidth = 150;
    const cardHeight = 60;
    const cols = 3;

    agents.slice(0, 12).forEach((report: any, i: number) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cardX = margin + col * (cardWidth + 15);
      const cardY = y + row * (cardHeight + 12);

      const info = AGENT_INFO[report.agentId] || { name: report.agentId, role: '' };
      const agentColor = getScoreColor(report.score);

      doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 4)
         .lineWidth(1).stroke(`#${COLORS.lightGray}`);

      // Score badge
      doc.roundedRect(cardX + cardWidth - 40, cardY + 8, 32, 20, 3).fill(`#${agentColor}`);
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#FFFFFF')
         .text(String(report.score), cardX + cardWidth - 40, cardY + 13, { width: 32, align: 'center' });

      doc.font('Helvetica-Bold').fontSize(10).fillColor(`#${COLORS.black}`)
         .text(info.name, cardX + 8, cardY + 10, { width: cardWidth - 50 });
      doc.font('Helvetica').fontSize(8).fillColor(`#${COLORS.neutral}`)
         .text(info.role, cardX + 8, cardY + 24, { width: cardWidth - 50 });

      // Confidence bar
      const confWidth = (report.confidence / 100) * 80;
      doc.rect(cardX + 8, cardY + 42, 80, 5).fill(`#${COLORS.lightGray}`);
      doc.rect(cardX + 8, cardY + 42, confWidth, 5).fill(`#${COLORS.primary}`);
    });

    this.addFooter(doc, 3);

    // ========== PAGE 4: SWOT ==========
    doc.addPage();
    y = 50;

    doc.font('Helvetica-Bold').fontSize(18).fillColor(`#${COLORS.primary}`)
       .text('SWOT Analysis', margin, y);
    doc.rect(margin, y + 24, 50, 3).fill(`#${COLORS.secondary}`);

    const allFindings = validation.agentReports?.flatMap((r: any) => r.findings || []) || [];
    const strengths = allFindings.filter((f: any) => f.type === 'strength').slice(0, 4);
    const weaknesses = allFindings.filter((f: any) => f.type === 'weakness').slice(0, 4);
    const opportunities = allFindings.filter((f: any) => f.type === 'opportunity').slice(0, 4);
    const threats = allFindings.filter((f: any) => f.type === 'threat').slice(0, 4);

    const boxWidth = 230;
    const boxHeight = 160;
    y = 90;

    // Strengths (top-left)
    this.drawSwotBox(doc, margin, y, boxWidth, boxHeight, 'Strengths', strengths, COLORS.secondary);
    // Weaknesses (top-right)
    this.drawSwotBox(doc, margin + boxWidth + 15, y, boxWidth, boxHeight, 'Weaknesses', weaknesses, COLORS.danger);
    // Opportunities (bottom-left)
    this.drawSwotBox(doc, margin, y + boxHeight + 15, boxWidth, boxHeight, 'Opportunities', opportunities, COLORS.accent);
    // Threats (bottom-right)
    this.drawSwotBox(doc, margin + boxWidth + 15, y + boxHeight + 15, boxWidth, boxHeight, 'Threats', threats, COLORS.warning);

    this.addFooter(doc, 4);

    // ========== PAGE 5: Recommendations ==========
    doc.addPage();
    y = 50;

    doc.font('Helvetica-Bold').fontSize(18).fillColor(`#${COLORS.primary}`)
       .text('Recommendations & Risks', margin, y);
    doc.rect(margin, y + 24, 50, 3).fill(`#${COLORS.secondary}`);

    const colWidth = (pageWidth - 20) / 2;

    // Recommendations (left)
    y = 90;
    doc.font('Helvetica-Bold').fontSize(14).fillColor(`#${COLORS.secondary}`)
       .text('Top Recommendations', margin, y);

    let recY = y + 25;
    const recs = validation.agentReports?.flatMap((r: any) => r.recommendations || []).slice(0, 6) || [];
    recs.forEach((rec: any, i: number) => {
      doc.circle(margin + 10, recY + 8, 10).fill(`#${COLORS.secondary}`);
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#FFFFFF')
         .text(String(i + 1), margin + 5, recY + 4, { width: 10, align: 'center' });

      doc.font('Helvetica-Bold').fontSize(9).fillColor(`#${COLORS.black}`)
         .text((rec.title || 'Action').substring(0, 35), margin + 28, recY + 2, { width: colWidth - 35 });
      doc.font('Helvetica').fontSize(8).fillColor(`#${COLORS.neutral}`)
         .text(`${(rec.description || '').substring(0, 60)} | ${rec.timeframe || 'TBD'}`, margin + 28, recY + 14, { width: colWidth - 35 });
      recY += 35;
    });

    // Risks (right)
    doc.font('Helvetica-Bold').fontSize(14).fillColor(`#${COLORS.danger}`)
       .text('Key Risks', margin + colWidth + 20, 90);

    let riskY = 115;
    const risks = validation.agentReports?.flatMap((r: any) => r.risks || []).slice(0, 6) || [];
    risks.forEach((risk: any) => {
      const probColor = risk.probability === 'high' ? COLORS.danger :
                        risk.probability === 'medium' ? COLORS.warning : COLORS.secondary;
      doc.rect(margin + colWidth + 20, riskY, 4, 30).fill(`#${probColor}`);
      doc.font('Helvetica-Bold').fontSize(9).fillColor(`#${COLORS.black}`)
         .text((risk.title || 'Risk').substring(0, 35), margin + colWidth + 30, riskY + 2, { width: colWidth - 35 });
      doc.font('Helvetica').fontSize(8).fillColor(`#${COLORS.neutral}`)
         .text((risk.description || '').substring(0, 70), margin + colWidth + 30, riskY + 14, { width: colWidth - 35 });
      riskY += 35;
    });

    // CTA section
    y = 500;
    doc.rect(0, y, 595, 120).fill(`#${COLORS.primary}`);

    doc.font('Helvetica-Bold').fontSize(20).fillColor('#FFFFFF')
       .text('Ready to Move Forward?', margin, y + 25, { width: pageWidth, align: 'center' });

    const ctaText = validation.verdict === 'PROCEED'
      ? 'Your startup idea shows strong potential. Move forward with confidence!'
      : validation.verdict === 'PROCEED_WITH_CAUTION'
      ? 'Your idea has promise but needs refinement. Address identified risks before proceeding.'
      : 'Consider pivoting or addressing fundamental concerns before investing further resources.';

    doc.font('Helvetica').fontSize(11).fillColor('#CCCCCC')
       .text(ctaText, margin, y + 55, { width: pageWidth, align: 'center' });

    doc.fontSize(9).fillColor('#888888')
       .text('www.startupverdict.com', margin, y + 90, { width: pageWidth, align: 'center' });

    this.addFooter(doc, 5);
  }

  /**
   * Summary PDF - Single page overview
   */
  private generateSummaryPdf(doc: PDFKit.PDFDocument, validation: any) {
    const pageWidth = 495;
    const margin = 50;
    let y = 50;

    doc.font('Helvetica-Bold').fontSize(20).fillColor(`#${COLORS.primary}`)
       .text(validation.title || 'Validation Report', margin, y, { width: pageWidth });
    doc.rect(margin, y + 28, 50, 3).fill(`#${COLORS.secondary}`);
    y += 50;

    // Metrics row
    const metricWidth = 150;
    const scoreColor = getScoreColor(validation.overallScore || 0);
    doc.roundedRect(margin, y, metricWidth, 60, 4).fill(`#${scoreColor}`);
    doc.font('Helvetica-Bold').fontSize(32).fillColor('#FFFFFF')
       .text(String(validation.overallScore || 0), margin, y + 8, { width: metricWidth, align: 'center' });
    doc.font('Helvetica').fontSize(10)
       .text('Overall Score', margin, y + 42, { width: metricWidth, align: 'center' });

    doc.roundedRect(margin + metricWidth + 15, y, metricWidth, 60, 4).fill(`#${COLORS.primary}`);
    doc.font('Helvetica-Bold').fontSize(26).fillColor('#FFFFFF')
       .text(`${validation.overallConfidence || 0}%`, margin + metricWidth + 15, y + 12, { width: metricWidth, align: 'center' });
    doc.font('Helvetica').fontSize(10)
       .text('Confidence', margin + metricWidth + 15, y + 42, { width: metricWidth, align: 'center' });

    const verdictColor = getVerdictColor(validation.verdict || '');
    doc.roundedRect(margin + (metricWidth + 15) * 2, y, metricWidth, 60, 4).fill(`#${verdictColor}`);
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#FFFFFF')
       .text((validation.verdict || 'PENDING').replace(/_/g, ' '), margin + (metricWidth + 15) * 2, y + 22, { width: metricWidth, align: 'center' });
    doc.font('Helvetica').fontSize(10)
       .text('Verdict', margin + (metricWidth + 15) * 2, y + 42, { width: metricWidth, align: 'center' });

    y += 80;

    doc.font('Helvetica-Bold').fontSize(12).fillColor(`#${COLORS.primary}`)
       .text('Summary', margin, y);
    y += 18;
    doc.font('Helvetica').fontSize(10).fillColor(`#${COLORS.black}`)
       .text((validation.executiveSummary || 'Analysis pending...').substring(0, 500), margin, y, { width: pageWidth, lineGap: 3 });

    y += 120;

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

      doc.rect(margin + 75, barY + 2, 300, 10).fill(`#${COLORS.lightGray}`);
      doc.rect(margin + 75, barY + 2, barWidth, 10).fill(`#${barColor}`);

      doc.font('Helvetica-Bold').fontSize(9).fillColor(`#${COLORS.black}`)
         .text(String(report.score), margin + 385, barY);
    });

    doc.font('Helvetica').fontSize(8).fillColor(`#${COLORS.neutral}`)
       .text('Generated by Validation Council | www.startupverdict.com', margin, 780, { width: pageWidth, align: 'center' });
  }

  /**
   * Detailed PDF - Full report with all agents
   */
  private generateDetailedPdf(doc: PDFKit.PDFDocument, validation: any) {
    this.generateExecutivePdf(doc, validation);

    const pageWidth = 495;
    const margin = 50;
    const agents = validation.agentReports || [];

    agents.forEach((report: any) => {
      doc.addPage();
      let y = 50;

      const info = AGENT_INFO[report.agentId] || { name: report.agentId, role: '' };
      const scoreColor = getScoreColor(report.score);

      // Header
      doc.font('Helvetica-Bold').fontSize(20).fillColor(`#${COLORS.primary}`)
         .text(`${info.name}`, margin, y);
      doc.font('Helvetica').fontSize(10).fillColor(`#${COLORS.neutral}`)
         .text(info.role, margin, y + 26);

      // Score badge
      doc.roundedRect(pageWidth - 10, y, 55, 35, 4).fill(`#${scoreColor}`);
      doc.font('Helvetica-Bold').fontSize(20).fillColor('#FFFFFF')
         .text(String(report.score), pageWidth - 10, y + 8, { width: 55, align: 'center' });

      y += 50;

      // Confidence bar
      doc.font('Helvetica').fontSize(10).fillColor(`#${COLORS.neutral}`)
         .text(`Confidence: ${report.confidence}%`, margin, y);
      doc.rect(margin + 90, y + 2, 150, 8).fill(`#${COLORS.lightGray}`);
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

          doc.rect(margin, y, 3, 28).fill(`#${typeColor}`);
          doc.font('Helvetica-Bold').fontSize(9).fillColor(`#${COLORS.black}`)
             .text((f.title || '').substring(0, 60), margin + 10, y + 2, { width: pageWidth - 20 });
          doc.font('Helvetica').fontSize(8).fillColor(`#${COLORS.neutral}`)
             .text((f.description || '').substring(0, 120), margin + 10, y + 14, { width: pageWidth - 20 });
          y += 35;
        });
      }

      y += 10;

      // Recommendations
      const recs = report.recommendations || [];
      if (recs.length > 0 && y < 600) {
        doc.font('Helvetica-Bold').fontSize(12).fillColor(`#${COLORS.black}`)
           .text('Recommendations', margin, y);
        y += 18;

        recs.slice(0, 3).forEach((rec: any) => {
          doc.rect(margin, y, 3, 28).fill(`#${COLORS.secondary}`);
          doc.font('Helvetica-Bold').fontSize(9).fillColor(`#${COLORS.black}`)
             .text((rec.title || '').substring(0, 60), margin + 10, y + 2, { width: pageWidth - 20 });
          doc.font('Helvetica').fontSize(8).fillColor(`#${COLORS.neutral}`)
             .text(`${(rec.description || '').substring(0, 80)} (${rec.timeframe || ''})`, margin + 10, y + 14, { width: pageWidth - 20 });
          y += 35;
        });
      }

      this.addFooter(doc, doc.bufferedPageRange().count);
    });
  }

  // Helper methods
  private addFooter(doc: PDFKit.PDFDocument, pageNum: number) {
    doc.font('Helvetica').fontSize(8).fillColor(`#${COLORS.neutral}`)
       .text('www.startupverdict.com', 50, 780)
       .text(`Page ${pageNum}`, 495, 780, { width: 50, align: 'right' });
  }

  private drawBar(doc: PDFKit.PDFDocument, x: number, y: number, label: string, value: number, total: number, color: string) {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    const barWidth = Math.max(percentage * 1.5, 3);

    doc.font('Helvetica').fontSize(9).fillColor(`#${COLORS.neutral}`)
       .text(label, x, y, { width: 90 });
    doc.rect(x + 95, y + 2, 150, 14).fill(`#${COLORS.lightGray}`);
    doc.rect(x + 95, y + 2, barWidth, 14).fill(`#${color}`);
    doc.font('Helvetica-Bold').fontSize(9).fillColor(`#${COLORS.black}`)
       .text(String(value), x + 255, y);
  }

  private drawSwotBox(doc: PDFKit.PDFDocument, x: number, y: number, w: number, h: number, title: string, items: any[], color: string) {
    doc.roundedRect(x, y, w, h, 4).lineWidth(2).stroke(`#${color}`);
    doc.roundedRect(x, y, w, 28, 4).fill(`#${color}`);

    doc.font('Helvetica-Bold').fontSize(11).fillColor('#FFFFFF')
       .text(`${title} (${items.length})`, x + 10, y + 8);

    let itemY = y + 38;
    items.slice(0, 3).forEach((item: any) => {
      doc.font('Helvetica').fontSize(9).fillColor(`#${COLORS.black}`)
         .text(`• ${(item.title || '').substring(0, 35)}`, x + 10, itemY, { width: w - 20 });
      itemY += 35;
    });
  }
}
