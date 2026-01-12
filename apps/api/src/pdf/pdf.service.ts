/**
 * PDF Generation Service
 * Generates professional, marketing-quality PDF reports using pdfmake
 * with charts, tables, and beautiful layouts
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import PdfPrinter from 'pdfmake';
import { PrismaService } from '../common/prisma/prisma.service';

// Font definitions for pdfmake
const fonts = {
  Roboto: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
};

// Brand colors
const COLORS = {
  primary: '#1E3A5F',
  secondary: '#10B981',
  accent: '#F59E0B',
  danger: '#EF4444',
  warning: '#F59E0B',
  neutral: '#64748B',
  light: '#F1F5F9',
  white: '#FFFFFF',
  black: '#1E293B',
  lightGray: '#E2E8F0',
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
const AGENT_INFO: Record<string, { name: string; role: string; icon: string }> = {
  aria: { name: 'AI Orchestration', role: 'Coordination & Synthesis', icon: '🎯' },
  marcus: { name: 'Market Analysis', role: 'TAM/SAM/SOM Study', icon: '📊' },
  sophia: { name: 'Competitor Analysis', role: 'Competitive Landscape', icon: '🔍' },
  david: { name: 'Financial Analysis', role: 'Unit Economics', icon: '💰' },
  elena: { name: 'Customer Analysis', role: 'Product-Market Fit', icon: '👥' },
  james: { name: 'Team Assessment', role: 'Founder Evaluation', icon: '👔' },
  rachel: { name: 'Legal & Risk', role: 'Regulatory Analysis', icon: '⚖️' },
  omar: { name: 'Technical Analysis', role: 'Tech Feasibility', icon: '💻' },
  nora: { name: 'Funding Analysis', role: 'Investment Landscape', icon: '🚀' },
  victor: { name: 'Valuation', role: 'Company Valuation', icon: '📈' },
  victoria: { name: 'Final Synthesis', role: 'Recommendations', icon: '🏆' },
  sentinel: { name: 'Trust & Audit', role: 'Data Verification', icon: '🛡️' },
};

export interface PdfTemplate {
  name: string;
  description: string;
  style: 'executive' | 'detailed' | 'summary';
}

// Styles for the PDF
const styles: any = {
  header: { fontSize: 24, bold: true, color: COLORS.primary, margin: [0, 0, 0, 10] },
  subheader: { fontSize: 16, bold: true, color: COLORS.primary, margin: [0, 15, 0, 8] },
  sectionTitle: { fontSize: 14, bold: true, color: COLORS.primary, margin: [0, 10, 0, 5] },
  bodyText: { fontSize: 10, color: COLORS.black, lineHeight: 1.4 },
  smallText: { fontSize: 9, color: COLORS.neutral },
  boldText: { fontSize: 10, bold: true, color: COLORS.black },
  whiteText: { fontSize: 10, color: COLORS.white },
  whiteBoldText: { fontSize: 12, bold: true, color: COLORS.white },
  metricValue: { fontSize: 36, bold: true, color: COLORS.white, alignment: 'center' },
  metricLabel: { fontSize: 10, color: COLORS.white, alignment: 'center' },
  tableHeader: { fontSize: 10, bold: true, color: COLORS.white, fillColor: COLORS.primary },
};

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);
  private readonly printer: any;

  constructor(private readonly prisma: PrismaService) {
    this.printer = new PdfPrinter(fonts);
  }

  getTemplates(): PdfTemplate[] {
    return [
      { name: 'executive', description: 'Executive summary for sharing', style: 'executive' },
      { name: 'detailed', description: 'Full detailed report', style: 'detailed' },
      { name: 'summary', description: 'One-page summary', style: 'summary' },
    ];
  }

  async generatePdf(validationId: string, userId: string, template: string = 'executive'): Promise<Buffer> {
    this.logger.log(`Generating PDF for validation ${validationId} with template ${template}`);

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

    let docDefinition: any;

    switch (template) {
      case 'detailed':
        docDefinition = this.createDetailedDocument(validation);
        break;
      case 'summary':
        docDefinition = this.createSummaryDocument(validation);
        break;
      default:
        docDefinition = this.createExecutiveDocument(validation);
    }

    return new Promise((resolve, reject) => {
      try {
        const pdfDoc = this.printer.createPdfKitDocument(docDefinition);

        const chunks: Buffer[] = [];
        pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
        pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
        pdfDoc.on('error', reject);
        pdfDoc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Create Executive PDF - Professional multi-page report
   */
  private createExecutiveDocument(validation: any): any {
    const content: any[] = [];

    // ===== PAGE 1: Cover Page =====
    content.push(...this.createCoverPage(validation));

    // ===== PAGE 2: Metrics Dashboard =====
    content.push({ text: '', pageBreak: 'after' });
    content.push(...this.createMetricsDashboard(validation));

    // ===== PAGE 3: Agent Analysis =====
    content.push({ text: '', pageBreak: 'after' });
    content.push(...this.createAgentAnalysis(validation));

    // ===== PAGE 4: SWOT Analysis =====
    content.push({ text: '', pageBreak: 'after' });
    content.push(...this.createSWOTAnalysis(validation));

    // ===== PAGE 5: Recommendations =====
    content.push({ text: '', pageBreak: 'after' });
    content.push(...this.createRecommendationsPage(validation));

    return {
      pageSize: 'A4',
      pageMargins: [40, 60, 40, 60],
      styles,
      content,
      footer: (currentPage: number, pageCount: number) => ({
        columns: [
          { text: 'Validation Council | www.startupverdict.com', style: 'smallText', margin: [40, 0, 0, 0] },
          { text: `Page ${currentPage} of ${pageCount}`, style: 'smallText', alignment: 'right', margin: [0, 0, 40, 0] },
        ],
      }),
      header: (currentPage: number) => currentPage > 1 ? {
        text: 'VALIDATION COUNCIL',
        style: 'smallText',
        margin: [40, 20, 40, 0],
        color: COLORS.neutral,
      } : null,
    };
  }

  /**
   * Cover Page with branding
   */
  private createCoverPage(validation: any): any[] {
    const scoreColor = getScoreColor(validation.overallScore || 0);
    const verdictColor = getVerdictColor(validation.verdict || '');

    return [
      // Header bar
      {
        canvas: [
          { type: 'rect', x: -40, y: -60, w: 595, h: 180, color: COLORS.primary },
        ],
      },
      // Brand name
      { text: 'VALIDATION COUNCIL', fontSize: 12, bold: true, color: COLORS.white, margin: [0, -130, 0, 0] },
      // Title
      { text: validation.title || 'Startup Validation Report', fontSize: 28, bold: true, color: COLORS.white, margin: [0, 15, 0, 10] },
      // Subtitle
      { text: 'AI-Powered Startup Validation Report', fontSize: 12, color: '#CCCCCC', margin: [0, 0, 0, 5] },
      // Date
      { text: `Generated: ${new Date().toLocaleDateString()}`, fontSize: 10, color: '#999999', margin: [0, 0, 0, 40] },

      // Metrics cards
      {
        columns: [
          // Score card
          {
            width: 140,
            stack: [
              {
                canvas: [
                  { type: 'rect', x: 0, y: 0, w: 130, h: 90, r: 4, color: scoreColor },
                ],
              },
              { text: String(validation.overallScore || 0), fontSize: 42, bold: true, color: COLORS.white, alignment: 'center', margin: [0, -75, 0, 0] },
              { text: 'Overall Score', fontSize: 10, color: COLORS.white, alignment: 'center', margin: [0, 5, 0, 0] },
            ],
          },
          // Confidence card
          {
            width: 140,
            stack: [
              {
                canvas: [
                  { type: 'rect', x: 0, y: 0, w: 130, h: 90, r: 4, color: COLORS.primary },
                ],
              },
              { text: `${validation.overallConfidence || 0}%`, fontSize: 32, bold: true, color: COLORS.white, alignment: 'center', margin: [0, -70, 0, 0] },
              { text: 'Confidence', fontSize: 10, color: COLORS.white, alignment: 'center', margin: [0, 5, 0, 0] },
            ],
          },
          // Verdict card
          {
            width: '*',
            stack: [
              {
                canvas: [
                  { type: 'rect', x: 0, y: 0, w: 180, h: 90, r: 4, color: verdictColor },
                ],
              },
              { text: (validation.verdict || 'PENDING').replace(/_/g, ' '), fontSize: 16, bold: true, color: COLORS.white, alignment: 'center', margin: [0, -60, 0, 0] },
              { text: 'Verdict', fontSize: 10, color: COLORS.white, alignment: 'center', margin: [0, 10, 0, 0] },
            ],
          },
        ],
        columnGap: 15,
        margin: [0, 0, 0, 30],
      },

      // Executive Summary
      { text: 'Executive Summary', style: 'subheader' },
      this.createUnderline(COLORS.secondary, 40),
      { text: (validation.executiveSummary || 'Analysis in progress...').substring(0, 1000), style: 'bodyText', margin: [0, 10, 0, 0] },
    ];
  }

  /**
   * Metrics Dashboard with charts
   */
  private createMetricsDashboard(validation: any): any[] {
    const agents = validation.agentReports || [];
    const scoreColor = getScoreColor(validation.overallScore || 0);

    // Create score distribution chart data
    const highScores = agents.filter((a: any) => a.score >= 70).length;
    const medScores = agents.filter((a: any) => a.score >= 50 && a.score < 70).length;
    const lowScores = agents.filter((a: any) => a.score < 50).length;

    return [
      { text: 'Performance Dashboard', style: 'header' },
      this.createUnderline(COLORS.secondary, 50),

      // Main score display
      {
        columns: [
          {
            width: 200,
            stack: [
              { text: 'Overall Score', style: 'sectionTitle' },
              {
                canvas: [
                  { type: 'ellipse', x: 80, y: 80, r1: 70, r2: 70, color: scoreColor },
                ],
              },
              { text: String(validation.overallScore || 0), fontSize: 48, bold: true, color: COLORS.white, alignment: 'center', margin: [0, -105, 0, 0] },
              { text: '/100', fontSize: 14, color: COLORS.white, alignment: 'center', margin: [30, 0, 0, 0] },
            ],
          },
          {
            width: '*',
            stack: [
              { text: 'Score Distribution', style: 'sectionTitle' },
              // Score distribution bars
              this.createHorizontalBar('High (70+)', highScores, agents.length, COLORS.secondary),
              this.createHorizontalBar('Medium (50-69)', medScores, agents.length, COLORS.warning),
              this.createHorizontalBar('Low (<50)', lowScores, agents.length, COLORS.danger),
            ],
            margin: [20, 0, 0, 0],
          },
        ],
        margin: [0, 20, 0, 30],
      },

      // Agent score table
      { text: 'Agent Performance', style: 'sectionTitle', margin: [0, 20, 0, 10] },
      this.createAgentScoreTable(agents),
    ];
  }

  /**
   * Agent Analysis Grid
   */
  private createAgentAnalysis(validation: any): any[] {
    const agents = validation.agentReports || [];

    return [
      { text: 'AI Agent Analysis', style: 'header' },
      this.createUnderline(COLORS.secondary, 50),
      { text: 'Each AI agent specializes in a different aspect of startup validation', style: 'smallText', margin: [0, 5, 0, 20] },

      // Agent grid
      this.createAgentGrid(agents),
    ];
  }

  /**
   * SWOT Analysis
   */
  private createSWOTAnalysis(validation: any): any[] {
    const allFindings = validation.agentReports?.flatMap((r: any) => r.findings || []) || [];
    const strengths = allFindings.filter((f: any) => f.type === 'strength').slice(0, 4);
    const weaknesses = allFindings.filter((f: any) => f.type === 'weakness').slice(0, 4);
    const opportunities = allFindings.filter((f: any) => f.type === 'opportunity').slice(0, 4);
    const threats = allFindings.filter((f: any) => f.type === 'threat').slice(0, 4);

    return [
      { text: 'SWOT Analysis', style: 'header' },
      this.createUnderline(COLORS.secondary, 50),

      // SWOT Grid
      {
        columns: [
          {
            width: '50%',
            stack: [
              this.createSWOTBox('Strengths', strengths, COLORS.secondary),
              this.createSWOTBox('Opportunities', opportunities, COLORS.accent),
            ],
          },
          {
            width: '50%',
            stack: [
              this.createSWOTBox('Weaknesses', weaknesses, COLORS.danger),
              this.createSWOTBox('Threats', threats, COLORS.warning),
            ],
          },
        ],
        columnGap: 15,
        margin: [0, 20, 0, 0],
      },
    ];
  }

  /**
   * Recommendations Page
   */
  private createRecommendationsPage(validation: any): any[] {
    const recommendations = validation.agentReports?.flatMap((r: any) => r.recommendations || []).slice(0, 8) || [];
    const risks = validation.agentReports?.flatMap((r: any) => r.risks || []).slice(0, 5) || [];

    return [
      { text: 'Recommendations & Risks', style: 'header' },
      this.createUnderline(COLORS.secondary, 50),

      {
        columns: [
          {
            width: '55%',
            stack: [
              { text: 'Top Recommendations', style: 'sectionTitle', color: COLORS.secondary },
              ...recommendations.map((rec: any, i: number) => this.createRecommendationItem(rec, i + 1)),
            ],
          },
          {
            width: '45%',
            stack: [
              { text: 'Key Risks', style: 'sectionTitle', color: COLORS.danger },
              ...risks.map((risk: any) => this.createRiskItem(risk)),
            ],
          },
        ],
        columnGap: 20,
        margin: [0, 15, 0, 0],
      },

      // Call to Action
      { text: '', margin: [0, 30, 0, 0] },
      {
        canvas: [
          { type: 'rect', x: -40, y: 0, w: 595, h: 100, color: COLORS.primary },
        ],
      },
      { text: 'Ready to Move Forward?', fontSize: 20, bold: true, color: COLORS.white, alignment: 'center', margin: [0, -80, 0, 0] },
      { text: this.getCtaText(validation.verdict), fontSize: 11, color: '#CCCCCC', alignment: 'center', margin: [0, 10, 0, 0] },
    ];
  }

  // ============ Helper Methods ============

  private createUnderline(color: string, width: number): any {
    return {
      canvas: [
        { type: 'rect', x: 0, y: 0, w: width, h: 3, color },
      ],
      margin: [0, 0, 0, 5],
    };
  }

  private createHorizontalBar(label: string, value: number, total: number, color: string): any {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    const barWidth = Math.max(percentage * 2, 5);

    return {
      columns: [
        { width: 100, text: label, style: 'smallText' },
        {
          width: '*',
          stack: [
            {
              canvas: [
                { type: 'rect', x: 0, y: 0, w: 200, h: 16, r: 2, color: COLORS.lightGray },
                { type: 'rect', x: 0, y: 0, w: barWidth, h: 16, r: 2, color },
              ],
            },
          ],
        },
        { width: 40, text: `${value}`, style: 'boldText', alignment: 'right' },
      ],
      margin: [0, 5, 0, 5],
    };
  }

  private createAgentScoreTable(agents: any[]): any {
    const sortedAgents = [...agents].sort((a, b) => b.score - a.score);

    const tableBody = [
      [
        { text: 'Agent', style: 'tableHeader', fillColor: COLORS.primary },
        { text: 'Role', style: 'tableHeader', fillColor: COLORS.primary },
        { text: 'Score', style: 'tableHeader', fillColor: COLORS.primary, alignment: 'center' },
        { text: 'Confidence', style: 'tableHeader', fillColor: COLORS.primary, alignment: 'center' },
      ],
      ...sortedAgents.slice(0, 12).map((agent: any) => {
        const info = AGENT_INFO[agent.agentId] || { name: agent.agentId, role: '', icon: '' };
        const scoreColor = getScoreColor(agent.score);
        return [
          { text: info.name, style: 'bodyText' },
          { text: info.role, style: 'smallText' },
          { text: String(agent.score), style: 'boldText', alignment: 'center', color: scoreColor },
          { text: `${agent.confidence}%`, style: 'smallText', alignment: 'center' },
        ];
      }),
    ];

    return {
      table: {
        headerRows: 1,
        widths: ['30%', '35%', '15%', '20%'],
        body: tableBody,
      },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0,
        hLineColor: () => COLORS.lightGray,
        paddingTop: () => 6,
        paddingBottom: () => 6,
        paddingLeft: () => 8,
        paddingRight: () => 8,
      },
    };
  }

  private createAgentGrid(agents: any[]): any {
    const rows: any[][] = [];
    const agentsList = agents.slice(0, 12);

    for (let i = 0; i < agentsList.length; i += 3) {
      const row = agentsList.slice(i, i + 3).map((agent: any) => {
        const info = AGENT_INFO[agent.agentId] || { name: agent.agentId, role: '', icon: '📊' };
        const scoreColor = getScoreColor(agent.score);

        return {
          stack: [
            {
              canvas: [
                { type: 'rect', x: 0, y: 0, w: 155, h: 80, r: 4, lineColor: COLORS.lightGray, lineWidth: 1 },
              ],
            },
            // Score badge
            {
              canvas: [
                { type: 'rect', x: 110, y: -70, w: 35, h: 22, r: 2, color: scoreColor },
              ],
            },
            { text: String(agent.score), fontSize: 12, bold: true, color: COLORS.white, margin: [115, -22, 0, 0] },
            // Agent info
            { text: info.name, fontSize: 10, bold: true, color: COLORS.black, margin: [8, -50, 0, 0] },
            { text: info.role, fontSize: 8, color: COLORS.neutral, margin: [8, 3, 0, 0] },
            // Confidence bar
            {
              canvas: [
                { type: 'rect', x: 8, y: 0, w: 100, h: 6, r: 2, color: COLORS.lightGray },
                { type: 'rect', x: 8, y: 0, w: (agent.confidence || 0), h: 6, r: 2, color: COLORS.primary },
              ],
              margin: [0, 8, 0, 15],
            },
          ],
          width: 165,
        };
      });

      // Fill empty slots
      while (row.length < 3) {
        row.push({ stack: [], width: 165 } as any);
      }

      rows.push(row);
    }

    return {
      stack: rows.map((row) => ({
        columns: row,
        columnGap: 10,
        margin: [0, 0, 0, 12],
      })),
    };
  }

  private createSWOTBox(title: string, items: any[], color: string): any {
    return {
      stack: [
        {
          canvas: [
            { type: 'rect', x: 0, y: 0, w: 240, h: 150, r: 4, lineColor: color, lineWidth: 2 },
            { type: 'rect', x: 0, y: 0, w: 240, h: 28, r: 4, color },
          ],
        },
        { text: `${title} (${items.length})`, fontSize: 11, bold: true, color: COLORS.white, margin: [10, -145, 0, 0] },
        {
          stack: items.slice(0, 3).map((item: any) => ({
            text: `• ${(item.title || '').substring(0, 35)}`,
            fontSize: 9,
            color: COLORS.black,
            margin: [10, 8, 10, 0],
          })),
          margin: [0, 15, 0, 0],
        },
      ],
      margin: [0, 0, 0, 15],
    };
  }

  private createRecommendationItem(rec: any, index: number): any {
    return {
      columns: [
        {
          width: 24,
          stack: [
            {
              canvas: [
                { type: 'ellipse', x: 10, y: 10, r1: 10, r2: 10, color: COLORS.secondary },
              ],
            },
            { text: String(index), fontSize: 10, bold: true, color: COLORS.white, alignment: 'center', margin: [0, -17, 0, 0] },
          ],
        },
        {
          width: '*',
          stack: [
            { text: (rec.title || 'Action').substring(0, 45), fontSize: 10, bold: true, color: COLORS.black },
            { text: `${(rec.description || '').substring(0, 80)} | ${rec.timeframe || 'TBD'}`, fontSize: 8, color: COLORS.neutral, margin: [0, 2, 0, 0] },
          ],
          margin: [5, 0, 0, 0],
        },
      ],
      margin: [0, 8, 0, 0],
    };
  }

  private createRiskItem(risk: any): any {
    const probColor = risk.probability === 'high' ? COLORS.danger :
                      risk.probability === 'medium' ? COLORS.warning : COLORS.secondary;

    return {
      stack: [
        {
          canvas: [
            { type: 'rect', x: 0, y: 0, w: 4, h: 35, color: probColor },
          ],
        },
        { text: (risk.title || 'Risk').substring(0, 40), fontSize: 9, bold: true, color: COLORS.black, margin: [10, -32, 0, 0] },
        { text: (risk.description || '').substring(0, 70), fontSize: 8, color: COLORS.neutral, margin: [10, 2, 0, 0] },
      ],
      margin: [0, 8, 0, 0],
    };
  }

  private getCtaText(verdict: string): string {
    if (verdict === 'PROCEED') return 'Your startup idea shows strong potential. Move forward with confidence!';
    if (verdict === 'PROCEED_WITH_CAUTION') return 'Your idea has promise but needs refinement. Address identified risks before proceeding.';
    return 'Consider pivoting or addressing fundamental concerns before investing further resources.';
  }

  /**
   * Summary PDF - Single page overview
   */
  private createSummaryDocument(validation: any): any {
    const agents = validation.agentReports || [];
    const scoreColor = getScoreColor(validation.overallScore || 0);
    const verdictColor = getVerdictColor(validation.verdict || '');

    const content: any[] = [
      // Title
      { text: validation.title || 'Validation Report', style: 'header' },
      this.createUnderline(COLORS.secondary, 50),

      // Metrics row
      {
        columns: [
          {
            width: 150,
            stack: [
              { canvas: [{ type: 'rect', x: 0, y: 0, w: 140, h: 70, r: 4, color: scoreColor }] },
              { text: String(validation.overallScore || 0), fontSize: 36, bold: true, color: COLORS.white, alignment: 'center', margin: [0, -55, 0, 0] },
              { text: 'Score', fontSize: 10, color: COLORS.white, alignment: 'center' },
            ],
          },
          {
            width: 150,
            stack: [
              { canvas: [{ type: 'rect', x: 0, y: 0, w: 140, h: 70, r: 4, color: COLORS.primary }] },
              { text: `${validation.overallConfidence || 0}%`, fontSize: 28, bold: true, color: COLORS.white, alignment: 'center', margin: [0, -52, 0, 0] },
              { text: 'Confidence', fontSize: 10, color: COLORS.white, alignment: 'center' },
            ],
          },
          {
            width: '*',
            stack: [
              { canvas: [{ type: 'rect', x: 0, y: 0, w: 180, h: 70, r: 4, color: verdictColor }] },
              { text: (validation.verdict || 'PENDING').replace(/_/g, ' '), fontSize: 14, bold: true, color: COLORS.white, alignment: 'center', margin: [0, -48, 0, 0] },
              { text: 'Verdict', fontSize: 10, color: COLORS.white, alignment: 'center' },
            ],
          },
        ],
        columnGap: 10,
        margin: [0, 15, 0, 25],
      },

      // Summary
      { text: 'Summary', style: 'sectionTitle' },
      { text: (validation.executiveSummary || 'Analysis pending...').substring(0, 500), style: 'bodyText', margin: [0, 5, 0, 20] },

      // Agent scores
      { text: 'Agent Scores', style: 'sectionTitle' },
      ...agents.slice(0, 12).map((agent: any) => {
        const info = AGENT_INFO[agent.agentId] || { name: agent.agentId, role: '' };
        const barColor = getScoreColor(agent.score);
        const barWidth = (agent.score / 100) * 280;

        return {
          columns: [
            { width: 100, text: info.name, fontSize: 9, color: COLORS.black },
            {
              width: '*',
              canvas: [
                { type: 'rect', x: 0, y: 0, w: 280, h: 12, r: 2, color: COLORS.lightGray },
                { type: 'rect', x: 0, y: 0, w: barWidth, h: 12, r: 2, color: barColor },
              ],
            },
            { width: 35, text: String(agent.score), fontSize: 9, bold: true, color: COLORS.black, alignment: 'right' },
          ],
          margin: [0, 4, 0, 0],
        };
      }),
    ];

    return {
      pageSize: 'A4',
      pageMargins: [40, 40, 40, 40],
      styles,
      content,
      footer: {
        text: 'Validation Council | www.startupverdict.com',
        style: 'smallText',
        alignment: 'center',
        margin: [0, 10, 0, 0],
      },
    };
  }

  /**
   * Detailed PDF - Full report with all agents
   */
  private createDetailedDocument(validation: any): any {
    // Start with executive content
    const execDoc = this.createExecutiveDocument(validation);
    const content = [...execDoc.content];

    // Add individual agent pages
    const agents = validation.agentReports || [];

    agents.forEach((agent: any) => {
      content.push({ text: '', pageBreak: 'after' });
      content.push(...this.createAgentDetailPage(agent));
    });

    return {
      ...execDoc,
      content,
    };
  }

  private createAgentDetailPage(agent: any): any[] {
    const info = AGENT_INFO[agent.agentId] || { name: agent.agentId, role: '', icon: '📊' };
    const scoreColor = getScoreColor(agent.score);

    const findings = agent.findings || [];
    const recommendations = agent.recommendations || [];
    const risks = agent.risks || [];

    return [
      // Header
      {
        columns: [
          {
            width: '*',
            stack: [
              { text: info.name, style: 'header' },
              { text: info.role, style: 'smallText', color: COLORS.neutral },
            ],
          },
          {
            width: 70,
            stack: [
              { canvas: [{ type: 'rect', x: 0, y: 0, w: 60, h: 40, r: 4, color: scoreColor }] },
              { text: String(agent.score), fontSize: 22, bold: true, color: COLORS.white, alignment: 'center', margin: [0, -32, 0, 0] },
            ],
          },
        ],
      },

      // Confidence bar
      {
        columns: [
          { width: 80, text: `Confidence: ${agent.confidence}%`, style: 'smallText' },
          {
            width: '*',
            canvas: [
              { type: 'rect', x: 0, y: 0, w: 200, h: 10, r: 2, color: COLORS.lightGray },
              { type: 'rect', x: 0, y: 0, w: (agent.confidence || 0) * 2, h: 10, r: 2, color: COLORS.primary },
            ],
          },
        ],
        margin: [0, 15, 0, 20],
      },

      // Findings
      findings.length > 0 ? { text: 'Findings', style: 'sectionTitle' } : { text: '' },
      ...findings.slice(0, 6).map((f: any) => {
        const typeColor = f.type === 'strength' ? COLORS.secondary :
                         f.type === 'weakness' ? COLORS.danger :
                         f.type === 'opportunity' ? COLORS.accent : COLORS.neutral;
        return {
          stack: [
            { canvas: [{ type: 'rect', x: 0, y: 0, w: 4, h: 30, color: typeColor }] },
            { text: (f.title || '').substring(0, 60), fontSize: 10, bold: true, color: COLORS.black, margin: [10, -28, 0, 0] },
            { text: (f.description || '').substring(0, 120), fontSize: 9, color: COLORS.neutral, margin: [10, 2, 0, 0] },
          ],
          margin: [0, 5, 0, 5],
        };
      }),

      // Recommendations
      recommendations.length > 0 ? { text: 'Recommendations', style: 'sectionTitle', margin: [0, 15, 0, 5] } : { text: '' },
      ...recommendations.slice(0, 4).map((rec: any) => ({
        stack: [
          { canvas: [{ type: 'rect', x: 0, y: 0, w: 4, h: 30, color: COLORS.secondary }] },
          { text: (rec.title || '').substring(0, 60), fontSize: 10, bold: true, color: COLORS.black, margin: [10, -28, 0, 0] },
          { text: `${(rec.description || '').substring(0, 100)} (${rec.timeframe || ''})`, fontSize: 9, color: COLORS.neutral, margin: [10, 2, 0, 0] },
        ],
        margin: [0, 5, 0, 5],
      })),

      // Risks
      risks.length > 0 ? { text: 'Risks', style: 'sectionTitle', margin: [0, 15, 0, 5] } : { text: '' },
      ...risks.slice(0, 3).map((risk: any) => {
        const probColor = risk.probability === 'high' ? COLORS.danger :
                         risk.probability === 'medium' ? COLORS.warning : COLORS.secondary;
        return {
          stack: [
            { canvas: [{ type: 'rect', x: 0, y: 0, w: 4, h: 30, color: probColor }] },
            { text: (risk.title || '').substring(0, 60), fontSize: 10, bold: true, color: COLORS.black, margin: [10, -28, 0, 0] },
            { text: (risk.description || '').substring(0, 100), fontSize: 9, color: COLORS.neutral, margin: [10, 2, 0, 0] },
          ],
          margin: [0, 5, 0, 5],
        };
      }),
    ];
  }
}
