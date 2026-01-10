/**
 * PPTX Generation Service
 * Generates professional PowerPoint presentations from validation reports
 * Uses PptxGenJS (open-source) - completely free!
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import PptxGenJS from 'pptxgenjs';
import { PrismaService } from '../common/prisma/prisma.service';

// Color palette for professional presentations
const COLORS = {
  primary: '1E3A5F',      // Dark blue
  secondary: '2ECC71',    // Green
  accent: 'F39C12',       // Orange
  danger: 'E74C3C',       // Red
  warning: 'F1C40F',      // Yellow
  neutral: '95A5A6',      // Gray
  white: 'FFFFFF',
  black: '2C3E50',
  lightBg: 'F8FAFC',
  darkBg: '1A1A2E',
};

// Score to color mapping
const getScoreColor = (score: number): string => {
  if (score >= 70) return COLORS.secondary;
  if (score >= 50) return COLORS.warning;
  return COLORS.danger;
};

// Agent icons/emojis for visual representation
const AGENT_ICONS: Record<string, string> = {
  aria: '🎯',
  marcus: '📊',
  sophia: '🔍',
  david: '💰',
  elena: '👥',
  james: '👔',
  rachel: '⚖️',
  omar: '💻',
  nora: '🚀',
  victor: '📈',
  victoria: '🏆',
  sentinel: '🛡️',
};

// Agent descriptions
const AGENT_DESCRIPTIONS: Record<string, string> = {
  aria: 'Orchestrator - Coordinates all agents',
  marcus: 'Market Intelligence - TAM/SAM/SOM analysis',
  sophia: 'Competition - Competitive landscape',
  david: 'Financial - Unit economics & projections',
  elena: 'Customer - User validation & PMF',
  james: 'Team - Founder & team assessment',
  rachel: 'Legal/Risk - Regulatory & legal analysis',
  omar: 'Technology - Tech stack & feasibility',
  nora: 'Funding - Investment landscape',
  victor: 'Valuation - Company valuation',
  victoria: 'Synthesis - Final recommendations',
  sentinel: 'Trust/Audit - Data verification',
};

export interface PptxTemplate {
  name: string;
  description: string;
  style: 'professional' | 'modern' | 'minimal' | 'investor';
}

@Injectable()
export class PptxService {
  private readonly logger = new Logger(PptxService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get available PPTX templates
   */
  getTemplates(): PptxTemplate[] {
    return [
      {
        name: 'professional',
        description: 'Professional corporate style with dark blue theme',
        style: 'professional',
      },
      {
        name: 'modern',
        description: 'Modern gradient style with vibrant colors',
        style: 'modern',
      },
      {
        name: 'minimal',
        description: 'Clean minimal design with lots of whitespace',
        style: 'minimal',
      },
      {
        name: 'investor',
        description: 'Investor-focused pitch deck format',
        style: 'investor',
      },
    ];
  }

  /**
   * Generate PPTX from validation report
   */
  async generatePptx(
    validationId: string,
    userId: string,
    template: string = 'professional',
  ): Promise<Buffer> {
    this.logger.log(`Generating PPTX for validation ${validationId} with template ${template}`);

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

    // Create presentation based on template
    const pptx = new PptxGenJS();

    // Set presentation properties
    pptx.author = 'Validation Council';
    pptx.title = `${validation.title} - Validation Report`;
    pptx.subject = 'Startup Validation Report';
    pptx.company = 'Validation Council';

    // Generate slides based on template style
    switch (template) {
      case 'modern':
        await this.generateModernTemplate(pptx, validation);
        break;
      case 'minimal':
        await this.generateMinimalTemplate(pptx, validation);
        break;
      case 'investor':
        await this.generateInvestorTemplate(pptx, validation);
        break;
      default:
        await this.generateProfessionalTemplate(pptx, validation);
    }

    // Generate buffer
    const buffer = await pptx.write({ outputType: 'nodebuffer' }) as Buffer;
    this.logger.log(`PPTX generated successfully: ${buffer.length} bytes`);

    return buffer;
  }

  /**
   * Professional Template - Corporate Dark Blue Theme
   */
  private async generateProfessionalTemplate(pptx: PptxGenJS, validation: any) {
    // Define master slide
    pptx.defineSlideMaster({
      title: 'PROFESSIONAL_MASTER',
      background: { color: COLORS.white },
      objects: [
        { rect: { x: 0, y: 0, w: '100%', h: 0.6, fill: { color: COLORS.primary } } },
        { text: { text: 'VALIDATION COUNCIL', options: { x: 0.5, y: 0.15, w: 3, h: 0.3, fontSize: 12, color: COLORS.white, bold: true } } },
      ],
    });

    // Slide 1: Title Slide
    const titleSlide = pptx.addSlide();
    titleSlide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: COLORS.primary } });
    titleSlide.addText('VALIDATION COUNCIL', { x: 0.5, y: 0.5, w: 9, h: 0.5, fontSize: 14, color: COLORS.white, bold: true });
    titleSlide.addText(validation.title, { x: 0.5, y: 2, w: 9, h: 1.5, fontSize: 36, color: COLORS.white, bold: true });
    titleSlide.addText('Startup Validation Report', { x: 0.5, y: 3.5, w: 9, h: 0.5, fontSize: 18, color: COLORS.white });
    titleSlide.addText(`Generated: ${new Date().toLocaleDateString()}`, { x: 0.5, y: 4.5, w: 9, h: 0.3, fontSize: 12, color: COLORS.neutral });

    // Slide 2: Executive Summary
    const summarySlide = pptx.addSlide({ masterName: 'PROFESSIONAL_MASTER' });
    summarySlide.addText('Executive Summary', { x: 0.5, y: 0.8, w: 9, h: 0.6, fontSize: 28, color: COLORS.primary, bold: true });

    // Score card
    const scoreColor = getScoreColor(validation.overallScore || 0);
    summarySlide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.6, w: 2.5, h: 1.8, fill: { color: scoreColor }, shadow: { type: 'outer', blur: 3, offset: 2, angle: 45, opacity: 0.3 } });
    summarySlide.addText(`${validation.overallScore || 'N/A'}`, { x: 0.5, y: 1.8, w: 2.5, h: 1, fontSize: 48, color: COLORS.white, bold: true, align: 'center' });
    summarySlide.addText('Overall Score', { x: 0.5, y: 2.8, w: 2.5, h: 0.4, fontSize: 12, color: COLORS.white, align: 'center' });

    // Confidence card
    summarySlide.addShape(pptx.ShapeType.rect, { x: 3.2, y: 1.6, w: 2.5, h: 1.8, fill: { color: COLORS.primary }, shadow: { type: 'outer', blur: 3, offset: 2, angle: 45, opacity: 0.3 } });
    summarySlide.addText(`${validation.overallConfidence || 'N/A'}%`, { x: 3.2, y: 1.8, w: 2.5, h: 1, fontSize: 48, color: COLORS.white, bold: true, align: 'center' });
    summarySlide.addText('Confidence', { x: 3.2, y: 2.8, w: 2.5, h: 0.4, fontSize: 12, color: COLORS.white, align: 'center' });

    // Verdict card
    const verdictColor = validation.verdict === 'PROCEED' ? COLORS.secondary : validation.verdict === 'PROCEED_WITH_CAUTION' ? COLORS.warning : COLORS.danger;
    summarySlide.addShape(pptx.ShapeType.rect, { x: 5.9, y: 1.6, w: 3.5, h: 1.8, fill: { color: verdictColor }, shadow: { type: 'outer', blur: 3, offset: 2, angle: 45, opacity: 0.3 } });
    summarySlide.addText(validation.verdict?.replace(/_/g, ' ') || 'PENDING', { x: 5.9, y: 2, w: 3.5, h: 0.8, fontSize: 24, color: COLORS.white, bold: true, align: 'center' });
    summarySlide.addText('Verdict', { x: 5.9, y: 2.8, w: 3.5, h: 0.4, fontSize: 12, color: COLORS.white, align: 'center' });

    // Executive summary text
    summarySlide.addText(validation.executiveSummary || 'Analysis pending...', { x: 0.5, y: 3.7, w: 9, h: 1.5, fontSize: 12, color: COLORS.black, valign: 'top' });

    // Slide 3: The 12 Agents Overview
    const agentsSlide = pptx.addSlide({ masterName: 'PROFESSIONAL_MASTER' });
    agentsSlide.addText('The 12 AI Agents', { x: 0.5, y: 0.8, w: 9, h: 0.6, fontSize: 28, color: COLORS.primary, bold: true });

    const agentRows = [
      ['aria', 'marcus', 'sophia', 'david'],
      ['elena', 'james', 'rachel', 'omar'],
      ['nora', 'victor', 'victoria', 'sentinel'],
    ];

    agentRows.forEach((row, rowIndex) => {
      row.forEach((agentId, colIndex) => {
        const report = validation.agentReports?.find((r: any) => r.agentId === agentId);
        const x = 0.5 + colIndex * 2.4;
        const y = 1.5 + rowIndex * 1.6;

        agentsSlide.addShape(pptx.ShapeType.rect, {
          x, y, w: 2.2, h: 1.4,
          fill: { color: COLORS.lightBg },
          line: { color: report ? getScoreColor(report.score) : COLORS.neutral, width: 2 }
        });
        agentsSlide.addText(`${AGENT_ICONS[agentId]} ${agentId.charAt(0).toUpperCase() + agentId.slice(1)}`, {
          x, y: y + 0.1, w: 2.2, h: 0.4, fontSize: 11, color: COLORS.black, bold: true, align: 'center'
        });
        agentsSlide.addText(report ? `Score: ${report.score}` : 'Pending', {
          x, y: y + 0.5, w: 2.2, h: 0.3, fontSize: 10, color: report ? getScoreColor(report.score) : COLORS.neutral, align: 'center', bold: true
        });
        agentsSlide.addText(AGENT_DESCRIPTIONS[agentId]?.split(' - ')[1] || '', {
          x, y: y + 0.9, w: 2.2, h: 0.4, fontSize: 8, color: COLORS.neutral, align: 'center'
        });
      });
    });

    // Generate individual agent slides
    for (const report of (validation.agentReports || [])) {
      this.addAgentSlide(pptx, report, 'PROFESSIONAL_MASTER');
    }

    // Slide: Key Findings
    const findingsSlide = pptx.addSlide({ masterName: 'PROFESSIONAL_MASTER' });
    findingsSlide.addText('Key Findings', { x: 0.5, y: 0.8, w: 9, h: 0.6, fontSize: 28, color: COLORS.primary, bold: true });

    let findingY = 1.5;
    const allFindings = validation.agentReports?.flatMap((r: any) =>
      (r.findings || []).slice(0, 1).map((f: any) => ({ ...f, agent: r.agentId }))
    ).slice(0, 6) || [];

    allFindings.forEach((finding: any) => {
      const typeColor = finding.type === 'strength' ? COLORS.secondary : finding.type === 'opportunity' ? COLORS.accent : COLORS.neutral;
      findingsSlide.addShape(pptx.ShapeType.rect, { x: 0.5, y: findingY, w: 0.15, h: 0.6, fill: { color: typeColor } });
      findingsSlide.addText(`${AGENT_ICONS[finding.agent] || ''} ${finding.title}`, { x: 0.8, y: findingY, w: 8.7, h: 0.3, fontSize: 12, color: COLORS.black, bold: true });
      findingsSlide.addText(finding.description, { x: 0.8, y: findingY + 0.3, w: 8.7, h: 0.3, fontSize: 10, color: COLORS.neutral });
      findingY += 0.75;
    });

    // Slide: Risks & Recommendations
    const risksSlide = pptx.addSlide({ masterName: 'PROFESSIONAL_MASTER' });
    risksSlide.addText('Risks & Recommendations', { x: 0.5, y: 0.8, w: 9, h: 0.6, fontSize: 28, color: COLORS.primary, bold: true });

    // Risks section
    risksSlide.addText('⚠️ Key Risks', { x: 0.5, y: 1.5, w: 4.2, h: 0.4, fontSize: 16, color: COLORS.danger, bold: true });
    let riskY = 1.9;
    const allRisks = validation.agentReports?.flatMap((r: any) => r.risks || []).slice(0, 4) || [];
    allRisks.forEach((risk: any) => {
      risksSlide.addText(`• ${risk.title}`, { x: 0.5, y: riskY, w: 4.2, h: 0.35, fontSize: 10, color: COLORS.black, bold: true });
      risksSlide.addText(risk.description, { x: 0.7, y: riskY + 0.3, w: 4, h: 0.3, fontSize: 9, color: COLORS.neutral });
      riskY += 0.7;
    });

    // Recommendations section
    risksSlide.addText('✅ Recommendations', { x: 5, y: 1.5, w: 4.5, h: 0.4, fontSize: 16, color: COLORS.secondary, bold: true });
    let recY = 1.9;
    const allRecs = validation.agentReports?.flatMap((r: any) => r.recommendations || []).slice(0, 4) || [];
    allRecs.forEach((rec: any) => {
      risksSlide.addText(`• ${rec.title}`, { x: 5, y: recY, w: 4.5, h: 0.35, fontSize: 10, color: COLORS.black, bold: true });
      risksSlide.addText(`${rec.description} (${rec.timeframe})`, { x: 5.2, y: recY + 0.3, w: 4.3, h: 0.3, fontSize: 9, color: COLORS.neutral });
      recY += 0.7;
    });

    // Final slide: Call to Action
    const ctaSlide = pptx.addSlide();
    ctaSlide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: COLORS.primary } });
    ctaSlide.addText('Next Steps', { x: 0.5, y: 1.5, w: 9, h: 0.8, fontSize: 36, color: COLORS.white, bold: true, align: 'center' });
    ctaSlide.addText(validation.verdict === 'PROCEED'
      ? 'Your startup idea shows strong potential.\nLet\'s move forward with confidence!'
      : validation.verdict === 'PROCEED_WITH_CAUTION'
      ? 'Your idea has potential but needs refinement.\nAddress the identified risks before proceeding.'
      : 'Consider pivoting or addressing fundamental concerns\nbefore investing further resources.',
      { x: 0.5, y: 2.5, w: 9, h: 1.2, fontSize: 18, color: COLORS.white, align: 'center' }
    );
    ctaSlide.addText('Generated by Validation Council\nwww.startupverdict.com', { x: 0.5, y: 4.2, w: 9, h: 0.6, fontSize: 12, color: COLORS.neutral, align: 'center' });
  }

  /**
   * Modern Template - Gradient & Vibrant
   */
  private async generateModernTemplate(pptx: PptxGenJS, validation: any) {
    // Modern gradient-style presentation
    pptx.defineSlideMaster({
      title: 'MODERN_MASTER',
      background: { color: COLORS.darkBg },
    });

    // Title Slide with gradient effect
    const titleSlide = pptx.addSlide();
    titleSlide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: COLORS.darkBg } });
    titleSlide.addShape(pptx.ShapeType.rect, { x: 0, y: 3.5, w: '100%', h: 2, fill: { color: COLORS.primary } });
    titleSlide.addText('✨ VALIDATION COUNCIL', { x: 0.5, y: 0.5, w: 9, h: 0.5, fontSize: 14, color: COLORS.accent, bold: true });
    titleSlide.addText(validation.title, { x: 0.5, y: 1.5, w: 9, h: 1.5, fontSize: 40, color: COLORS.white, bold: true });
    titleSlide.addText('AI-Powered Startup Validation', { x: 0.5, y: 3.8, w: 9, h: 0.5, fontSize: 20, color: COLORS.white });

    // Metrics Slide
    const metricsSlide = pptx.addSlide({ masterName: 'MODERN_MASTER' });
    metricsSlide.addText('📊 Key Metrics', { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 32, color: COLORS.white, bold: true });

    // Large metric cards
    const metrics = [
      { label: 'Overall Score', value: `${validation.overallScore || 0}`, color: getScoreColor(validation.overallScore || 0) },
      { label: 'Confidence', value: `${validation.overallConfidence || 0}%`, color: COLORS.primary },
      { label: 'Agents', value: '12', color: COLORS.accent },
    ];

    metrics.forEach((metric, i) => {
      const x = 0.5 + i * 3.2;
      metricsSlide.addShape(pptx.ShapeType.rect, { x, y: 1.2, w: 3, h: 2.2, fill: { color: metric.color }, shadow: { type: 'outer', blur: 8, offset: 4, angle: 45, opacity: 0.4 } });
      metricsSlide.addText(metric.value, { x, y: 1.4, w: 3, h: 1.2, fontSize: 56, color: COLORS.white, bold: true, align: 'center' });
      metricsSlide.addText(metric.label, { x, y: 2.7, w: 3, h: 0.5, fontSize: 14, color: COLORS.white, align: 'center' });
    });

    // Verdict banner
    const verdictColor = validation.verdict === 'PROCEED' ? COLORS.secondary : validation.verdict === 'PROCEED_WITH_CAUTION' ? COLORS.warning : COLORS.danger;
    metricsSlide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 3.8, w: 9, h: 1.2, fill: { color: verdictColor } });
    metricsSlide.addText(`🎯 VERDICT: ${validation.verdict?.replace(/_/g, ' ') || 'PENDING'}`, { x: 0.5, y: 4, w: 9, h: 0.8, fontSize: 24, color: COLORS.white, bold: true, align: 'center' });

    // Agent grid slide
    const agentsSlide = pptx.addSlide({ masterName: 'MODERN_MASTER' });
    agentsSlide.addText('🤖 The 12 AI Agents', { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 28, color: COLORS.white, bold: true });

    const agents = validation.agentReports || [];
    agents.forEach((report: any, i: number) => {
      const x = 0.3 + (i % 4) * 2.45;
      const y = 1.1 + Math.floor(i / 4) * 1.5;
      const scoreColor = getScoreColor(report.score);

      agentsSlide.addShape(pptx.ShapeType.rect, { x, y, w: 2.3, h: 1.3, fill: { color: COLORS.primary }, line: { color: scoreColor, width: 3 } });
      agentsSlide.addText(`${AGENT_ICONS[report.agentId] || '🔹'} ${report.agentId}`, { x, y: y + 0.15, w: 2.3, h: 0.4, fontSize: 12, color: COLORS.white, bold: true, align: 'center' });
      agentsSlide.addText(`${report.score}`, { x, y: y + 0.55, w: 2.3, h: 0.5, fontSize: 28, color: scoreColor, bold: true, align: 'center' });
    });

    // Add individual agent slides
    for (const report of agents) {
      this.addModernAgentSlide(pptx, report);
    }

    // Thank you slide
    const endSlide = pptx.addSlide({ masterName: 'MODERN_MASTER' });
    endSlide.addText('🚀', { x: 0, y: 1.5, w: '100%', h: 1, fontSize: 72, align: 'center' });
    endSlide.addText('Ready to Build?', { x: 0, y: 2.8, w: '100%', h: 0.8, fontSize: 40, color: COLORS.white, bold: true, align: 'center' });
    endSlide.addText('www.startupverdict.com', { x: 0, y: 4, w: '100%', h: 0.5, fontSize: 16, color: COLORS.accent, align: 'center' });
  }

  /**
   * Minimal Template - Clean & Simple
   */
  private async generateMinimalTemplate(pptx: PptxGenJS, validation: any) {
    pptx.defineSlideMaster({
      title: 'MINIMAL_MASTER',
      background: { color: COLORS.white },
    });

    // Simple title
    const titleSlide = pptx.addSlide();
    titleSlide.addText(validation.title, { x: 0.5, y: 2, w: 9, h: 1, fontSize: 36, color: COLORS.black, bold: true });
    titleSlide.addText('Validation Report', { x: 0.5, y: 3, w: 9, h: 0.5, fontSize: 16, color: COLORS.neutral });
    titleSlide.addShape(pptx.ShapeType.line, { x: 0.5, y: 3.6, w: 2, h: 0, line: { color: COLORS.primary, width: 3 } });

    // Score slide - minimal
    const scoreSlide = pptx.addSlide({ masterName: 'MINIMAL_MASTER' });
    scoreSlide.addText(`${validation.overallScore || '—'}`, { x: 0.5, y: 1, w: 9, h: 2, fontSize: 120, color: getScoreColor(validation.overallScore || 0), bold: true, align: 'center' });
    scoreSlide.addText('Overall Score', { x: 0.5, y: 3, w: 9, h: 0.5, fontSize: 18, color: COLORS.neutral, align: 'center' });
    scoreSlide.addText(validation.verdict?.replace(/_/g, ' ') || '', { x: 0.5, y: 3.8, w: 9, h: 0.5, fontSize: 24, color: COLORS.black, bold: true, align: 'center' });

    // Agents list - simple
    const agentsSlide = pptx.addSlide({ masterName: 'MINIMAL_MASTER' });
    agentsSlide.addText('Agent Scores', { x: 0.5, y: 0.5, w: 9, h: 0.6, fontSize: 24, color: COLORS.black, bold: true });

    (validation.agentReports || []).forEach((report: any, i: number) => {
      const y = 1.2 + i * 0.38;
      agentsSlide.addText(`${report.agentId.charAt(0).toUpperCase() + report.agentId.slice(1)}`, { x: 0.5, y, w: 3, h: 0.35, fontSize: 12, color: COLORS.black });
      agentsSlide.addShape(pptx.ShapeType.rect, { x: 3.5, y: y + 0.08, w: (report.score / 100) * 4, h: 0.2, fill: { color: getScoreColor(report.score) } });
      agentsSlide.addText(`${report.score}`, { x: 8, y, w: 1, h: 0.35, fontSize: 12, color: COLORS.black, bold: true });
    });

    // Summary slide
    const summarySlide = pptx.addSlide({ masterName: 'MINIMAL_MASTER' });
    summarySlide.addText('Summary', { x: 0.5, y: 0.5, w: 9, h: 0.6, fontSize: 24, color: COLORS.black, bold: true });
    summarySlide.addText(validation.executiveSummary || 'Analysis complete.', { x: 0.5, y: 1.3, w: 9, h: 3, fontSize: 14, color: COLORS.black, valign: 'top' });
  }

  /**
   * Investor Template - Pitch Deck Style
   */
  private async generateInvestorTemplate(pptx: PptxGenJS, validation: any) {
    pptx.defineSlideMaster({
      title: 'INVESTOR_MASTER',
      background: { color: COLORS.white },
      objects: [
        { rect: { x: 0, y: 5, w: '100%', h: 0.5, fill: { color: COLORS.primary } } },
      ],
    });

    // Title slide
    const titleSlide = pptx.addSlide();
    titleSlide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: COLORS.primary } });
    titleSlide.addText(validation.title, { x: 0.5, y: 1.8, w: 9, h: 1.2, fontSize: 42, color: COLORS.white, bold: true });
    titleSlide.addText('Investment Validation Report', { x: 0.5, y: 3.2, w: 9, h: 0.5, fontSize: 18, color: COLORS.white });
    titleSlide.addText('Powered by 12 AI Agents', { x: 0.5, y: 4, w: 9, h: 0.4, fontSize: 14, color: COLORS.neutral });

    // Investment Thesis slide
    const thesisSlide = pptx.addSlide({ masterName: 'INVESTOR_MASTER' });
    thesisSlide.addText('Investment Thesis', { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 28, color: COLORS.primary, bold: true });

    // Key metrics row
    const keyMetrics = [
      { label: 'Score', value: `${validation.overallScore}/100`, icon: '📊' },
      { label: 'Confidence', value: `${validation.overallConfidence}%`, icon: '🎯' },
      { label: 'Verdict', value: validation.verdict?.replace(/_/g, ' '), icon: '✅' },
    ];

    keyMetrics.forEach((m, i) => {
      thesisSlide.addText(`${m.icon} ${m.label}`, { x: 0.5 + i * 3.2, y: 1, w: 3, h: 0.4, fontSize: 12, color: COLORS.neutral });
      thesisSlide.addText(m.value || '—', { x: 0.5 + i * 3.2, y: 1.4, w: 3, h: 0.6, fontSize: 24, color: COLORS.primary, bold: true });
    });

    thesisSlide.addShape(pptx.ShapeType.line, { x: 0.5, y: 2.2, w: 9, h: 0, line: { color: COLORS.neutral, width: 0.5 } });
    thesisSlide.addText(validation.executiveSummary || 'Comprehensive AI analysis completed.', { x: 0.5, y: 2.4, w: 9, h: 2, fontSize: 14, color: COLORS.black });

    // Market Analysis (Marcus)
    const marcusReport = validation.agentReports?.find((r: any) => r.agentId === 'marcus');
    if (marcusReport) {
      const marketSlide = pptx.addSlide({ masterName: 'INVESTOR_MASTER' });
      marketSlide.addText('📊 Market Analysis', { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 28, color: COLORS.primary, bold: true });
      marketSlide.addText(`Market Score: ${marcusReport.score}/100`, { x: 0.5, y: 1, w: 9, h: 0.4, fontSize: 18, color: getScoreColor(marcusReport.score), bold: true });

      let y = 1.6;
      (marcusReport.findings || []).forEach((f: any) => {
        marketSlide.addText(`• ${f.title}: ${f.description}`, { x: 0.5, y, w: 9, h: 0.5, fontSize: 12, color: COLORS.black });
        y += 0.5;
      });
    }

    // Financial Analysis (David)
    const davidReport = validation.agentReports?.find((r: any) => r.agentId === 'david');
    if (davidReport) {
      const finSlide = pptx.addSlide({ masterName: 'INVESTOR_MASTER' });
      finSlide.addText('💰 Financial Analysis', { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 28, color: COLORS.primary, bold: true });
      finSlide.addText(`Financial Score: ${davidReport.score}/100`, { x: 0.5, y: 1, w: 9, h: 0.4, fontSize: 18, color: getScoreColor(davidReport.score), bold: true });

      let y = 1.6;
      (davidReport.findings || []).forEach((f: any) => {
        finSlide.addText(`• ${f.title}: ${f.description}`, { x: 0.5, y, w: 9, h: 0.5, fontSize: 12, color: COLORS.black });
        y += 0.5;
      });
    }

    // Competition (Sophia)
    const sophiaReport = validation.agentReports?.find((r: any) => r.agentId === 'sophia');
    if (sophiaReport) {
      const compSlide = pptx.addSlide({ masterName: 'INVESTOR_MASTER' });
      compSlide.addText('🔍 Competitive Landscape', { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 28, color: COLORS.primary, bold: true });
      compSlide.addText(`Competition Score: ${sophiaReport.score}/100`, { x: 0.5, y: 1, w: 9, h: 0.4, fontSize: 18, color: getScoreColor(sophiaReport.score), bold: true });

      let y = 1.6;
      (sophiaReport.findings || []).forEach((f: any) => {
        compSlide.addText(`• ${f.title}: ${f.description}`, { x: 0.5, y, w: 9, h: 0.5, fontSize: 12, color: COLORS.black });
        y += 0.5;
      });
    }

    // Risk Assessment
    const riskSlide = pptx.addSlide({ masterName: 'INVESTOR_MASTER' });
    riskSlide.addText('⚠️ Risk Assessment', { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 28, color: COLORS.primary, bold: true });

    const allRisks = validation.agentReports?.flatMap((r: any) => r.risks || []).slice(0, 5) || [];
    allRisks.forEach((risk: any, i: number) => {
      const y = 1 + i * 0.8;
      const probColor = risk.probability === 'high' ? COLORS.danger : risk.probability === 'medium' ? COLORS.warning : COLORS.secondary;
      riskSlide.addShape(pptx.ShapeType.rect, { x: 0.5, y, w: 0.1, h: 0.6, fill: { color: probColor } });
      riskSlide.addText(risk.title, { x: 0.8, y, w: 8.7, h: 0.35, fontSize: 12, color: COLORS.black, bold: true });
      riskSlide.addText(risk.description, { x: 0.8, y: y + 0.35, w: 8.7, h: 0.25, fontSize: 10, color: COLORS.neutral });
    });

    // Call to Action
    const ctaSlide = pptx.addSlide();
    ctaSlide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: COLORS.primary } });
    ctaSlide.addText('Ready to Invest?', { x: 0.5, y: 1.5, w: 9, h: 1, fontSize: 42, color: COLORS.white, bold: true, align: 'center' });

    const ctaText = validation.verdict === 'PROCEED'
      ? '✅ This opportunity shows strong fundamentals'
      : validation.verdict === 'PROCEED_WITH_CAUTION'
      ? '⚠️ Promising, but due diligence recommended'
      : '🔴 Significant concerns identified';

    ctaSlide.addText(ctaText, { x: 0.5, y: 2.8, w: 9, h: 0.6, fontSize: 20, color: COLORS.white, align: 'center' });
    ctaSlide.addText('Contact: www.startupverdict.com', { x: 0.5, y: 4.2, w: 9, h: 0.5, fontSize: 14, color: COLORS.neutral, align: 'center' });
  }

  /**
   * Add individual agent slide (Professional template)
   */
  private addAgentSlide(pptx: PptxGenJS, report: any, masterName: string) {
    const slide = pptx.addSlide({ masterName });
    const agentName = report.agentId.charAt(0).toUpperCase() + report.agentId.slice(1);

    // Header
    slide.addText(`${AGENT_ICONS[report.agentId] || '🔹'} ${agentName} Analysis`, {
      x: 0.5, y: 0.8, w: 7, h: 0.6, fontSize: 24, color: COLORS.primary, bold: true
    });

    // Score badge
    slide.addShape(pptx.ShapeType.rect, { x: 8, y: 0.7, w: 1.5, h: 0.8, fill: { color: getScoreColor(report.score) } });
    slide.addText(`${report.score}`, { x: 8, y: 0.8, w: 1.5, h: 0.6, fontSize: 24, color: COLORS.white, bold: true, align: 'center' });

    // Findings
    slide.addText('Key Findings', { x: 0.5, y: 1.6, w: 4, h: 0.4, fontSize: 14, color: COLORS.black, bold: true });
    let y = 2;
    (report.findings || []).slice(0, 3).forEach((f: any) => {
      const typeIcon = f.type === 'strength' ? '✅' : f.type === 'opportunity' ? '💡' : '📌';
      slide.addText(`${typeIcon} ${f.title}`, { x: 0.5, y, w: 4.3, h: 0.3, fontSize: 10, color: COLORS.black, bold: true });
      slide.addText(f.description, { x: 0.7, y: y + 0.3, w: 4.1, h: 0.4, fontSize: 9, color: COLORS.neutral });
      y += 0.75;
    });

    // Recommendations
    slide.addText('Recommendations', { x: 5, y: 1.6, w: 4.5, h: 0.4, fontSize: 14, color: COLORS.black, bold: true });
    let recY = 2;
    (report.recommendations || []).slice(0, 2).forEach((rec: any) => {
      slide.addText(`→ ${rec.title}`, { x: 5, y: recY, w: 4.5, h: 0.3, fontSize: 10, color: COLORS.secondary, bold: true });
      slide.addText(`${rec.description} (${rec.timeframe})`, { x: 5.2, y: recY + 0.3, w: 4.3, h: 0.4, fontSize: 9, color: COLORS.neutral });
      recY += 0.75;
    });
  }

  /**
   * Add individual agent slide (Modern template)
   */
  private addModernAgentSlide(pptx: PptxGenJS, report: any) {
    const slide = pptx.addSlide({ masterName: 'MODERN_MASTER' });
    const agentName = report.agentId.charAt(0).toUpperCase() + report.agentId.slice(1);

    slide.addText(`${AGENT_ICONS[report.agentId] || '🔹'} ${agentName}`, {
      x: 0.5, y: 0.3, w: 6, h: 0.6, fontSize: 28, color: COLORS.white, bold: true
    });
    slide.addText(AGENT_DESCRIPTIONS[report.agentId] || '', {
      x: 0.5, y: 0.9, w: 6, h: 0.4, fontSize: 12, color: COLORS.neutral
    });

    // Large score
    slide.addShape(pptx.ShapeType.rect, { x: 7.5, y: 0.2, w: 2, h: 1.2, fill: { color: getScoreColor(report.score) } });
    slide.addText(`${report.score}`, { x: 7.5, y: 0.35, w: 2, h: 0.8, fontSize: 42, color: COLORS.white, bold: true, align: 'center' });

    // Findings cards
    let y = 1.5;
    (report.findings || []).slice(0, 4).forEach((f: any) => {
      slide.addShape(pptx.ShapeType.rect, { x: 0.5, y, w: 9, h: 0.9, fill: { color: COLORS.primary } });
      slide.addText(f.title, { x: 0.7, y: y + 0.1, w: 8.6, h: 0.35, fontSize: 12, color: COLORS.white, bold: true });
      slide.addText(f.description, { x: 0.7, y: y + 0.45, w: 8.6, h: 0.35, fontSize: 10, color: COLORS.neutral });
      y += 1;
    });
  }
}
