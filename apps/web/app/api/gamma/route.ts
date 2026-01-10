import { NextRequest, NextResponse } from 'next/server';

const GAMMA_API_KEY = process.env.GAMMA_API_KEY;
const GAMMA_API_URL = 'https://public-api.gamma.app/v1.0';

interface ValidationData {
  id: string;
  title: string;
  description: string;
  overallScore: number | null;
  overallConfidence: number | null;
  verdict: string | null;
  executiveSummary: string | null;
  agentReports: AgentReport[];
}

interface AgentReport {
  agentId: string;
  score: number;
  confidence: number;
  findings: Finding[];
  risks: Risk[];
  recommendations: Recommendation[];
  marketData?: any;
  unitEconomics?: any;
  scenarioAnalysis?: any;
  financialProjections?: any;
  competitors?: any[];
}

interface Finding {
  title: string;
  description: string;
  type: string;
}

interface Risk {
  title: string;
  description: string;
  probability: string;
  impact: string;
}

interface Recommendation {
  title: string;
  description: string;
  priority: string;
  timeframe: string;
}

interface Agent {
  id: string;
  name: string;
  role: string;
  description: string;
  investorGrade: boolean;
}

// Professional agent role names
const getAgentDisplayName = (agentId: string): string => {
  const roleMap: Record<string, string> = {
    'marcus': 'Market Intelligence',
    'sophia': 'Competitive Analysis',
    'david': 'Financial Analysis',
    'elena': 'Customer Insights',
    'james': 'Team Assessment',
    'rachel': 'Legal & Risk',
    'omar': 'Technical Feasibility',
    'nora': 'Funding Landscape',
    'victor': 'Valuation Analysis',
    'victoria': 'Executive Synthesis',
    'sentinel': 'Trust & Audit',
    'aria': 'AI Orchestration',
  };
  return roleMap[agentId] || agentId;
};

const normalizeScore = (score: number): number => {
  if (score > 10) return Math.min(10, score / 10);
  return Math.min(10, Math.max(0, score));
};

const getGrade = (score: number): string => {
  if (score >= 9) return 'A+';
  if (score >= 8) return 'A';
  if (score >= 7) return 'B+';
  if (score >= 6) return 'B';
  if (score >= 5) return 'C';
  if (score >= 4) return 'D';
  return 'F';
};

// Currency formatting helper
const formatCurrency = (v: number): string => {
  if (v >= 1e12) return `$${(v / 1e12).toFixed(1)}T`;
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
};

// Get verdict display text
const getVerdictDisplay = (verdict: string | null): string => {
  const verdictMap: Record<string, string> = {
    'PROCEED': 'STRONG PROCEED - High confidence investment opportunity',
    'PROCEED_WITH_CAUTION': 'PROCEED WITH CAUTION - Promising with notable risks',
    'PIVOT_RECOMMENDED': 'PIVOT RECOMMENDED - Significant changes needed',
    'DO_NOT_PROCEED': 'DO NOT PROCEED - Critical issues identified',
  };
  return verdictMap[verdict || ''] || verdict || 'Analysis in progress...';
};

// Build presentation content from validation data - Investor-Grade Format
function buildPresentationContent(validation: ValidationData, agents: Agent[]): string {
  const score = normalizeScore(validation.overallScore || 0);
  const grade = getGrade(score);

  const allFindings = validation.agentReports?.flatMap(r => r.findings || []) || [];
  const allRisks = validation.agentReports?.flatMap(r => r.risks || []) || [];
  const allRecommendations = validation.agentReports?.flatMap(r => r.recommendations || []) || [];

  const strengths = allFindings.filter(f => f.type === 'strength').slice(0, 5);
  const weaknesses = allFindings.filter(f => f.type === 'weakness').slice(0, 5);
  const opportunities = allFindings.filter(f => f.type === 'opportunity').slice(0, 5);
  const threats = allFindings.filter(f => f.type === 'threat').slice(0, 5);
  const highRisks = allRisks.filter(r => r.probability === 'high').slice(0, 3);
  const criticalActions = allRecommendations.filter(r => r.priority === 'critical' || r.priority === 'high').slice(0, 5);

  // Get agent reports
  const marketAgent = validation.agentReports?.find((r: any) => r.agentId === 'marcus');
  const financeAgent = validation.agentReports?.find((r: any) => r.agentId === 'david');
  const competitionAgent = validation.agentReports?.find((r: any) => r.agentId === 'sophia');
  const teamAgent = validation.agentReports?.find((r: any) => r.agentId === 'james');
  const valuationAgent = validation.agentReports?.find((r: any) => r.agentId === 'victor');
  const fundingAgent = validation.agentReports?.find((r: any) => r.agentId === 'nora');
  const techAgent = validation.agentReports?.find((r: any) => r.agentId === 'omar');

  // Build agent scorecard
  const agentScorecard = validation.agentReports?.map((report: any) => {
    const normalizedScore = normalizeScore(report.score);
    const status = normalizedScore >= 7 ? 'Strong' : normalizedScore >= 5 ? 'Moderate' : 'Weak';
    return `${getAgentDisplayName(report.agentId)}: ${normalizedScore.toFixed(1)}/10 [${status}]`;
  }).join('\n') || '';

  // Market opportunity section
  let marketSection = '';
  if (marketAgent?.marketData) {
    const md = marketAgent.marketData;
    const growthText = md.growthRate ? ` (${(md.growthRate * 100).toFixed(1)}% CAGR)` : '';
    marketSection = `
SLIDE: Market Opportunity

The market analysis reveals a substantial addressable opportunity with significant growth potential.

Total Addressable Market (TAM): ${formatCurrency(md.tam || 0)}${growthText}
Serviceable Addressable Market (SAM): ${formatCurrency(md.sam || 0)}
Serviceable Obtainable Market (SOM): ${formatCurrency(md.som || 0)} - 5-year realistic capture

Market Timing: ${md.marketTiming || 'Favorable conditions for market entry'}
Competitive Density: ${md.competitorCount ? `${md.competitorCount} identified competitors` : 'Analysis pending'}
`;
  }

  // Unit economics section
  let unitEconSection = '';
  if (financeAgent?.unitEconomics) {
    const ue = financeAgent.unitEconomics;
    const cac = ue.cac?.mid || 0;
    const ltv = ue.ltv?.mid || 0;
    const ratio = cac > 0 ? (ltv / cac) : 0;
    const ratioStatus = ratio >= 3 ? 'Healthy (Target: 3x+)' : ratio >= 2 ? 'Acceptable (Target: 3x)' : 'Below target';
    const payback = ue.paybackMonths?.mid || 0;
    const grossMargin = ue.grossMargin?.mid || 0;

    unitEconSection = `
SLIDE: Unit Economics & Financial Metrics

Understanding the core economics that drive profitability and scalability.

Customer Acquisition Cost (CAC): ${formatCurrency(cac)}
Customer Lifetime Value (LTV): ${formatCurrency(ltv)}
LTV:CAC Ratio: ${ratio.toFixed(1)}x - ${ratioStatus}
${payback ? `Payback Period: ${payback.toFixed(0)} months` : ''}
${grossMargin ? `Gross Margin: ${(grossMargin * 100).toFixed(0)}%` : ''}
${ue.churnRate?.mid ? `Monthly Churn: ${(ue.churnRate.mid * 100).toFixed(1)}%` : ''}
`;
  }

  // Financial projections section
  let projectionsSection = '';
  if (financeAgent?.financialProjections) {
    const fp = financeAgent.financialProjections;
    projectionsSection = `
SLIDE: Financial Projections

Forward-looking financial metrics based on current data and market conditions.

${fp.burnRate?.mid ? `Monthly Burn Rate: ${formatCurrency(fp.burnRate.mid)}` : ''}
${fp.runway?.mid ? `Runway: ${fp.runway.mid.toFixed(0)} months` : ''}
${fp.revenueMonth12?.mid ? `12-Month Revenue Projection: ${formatCurrency(fp.revenueMonth12.mid)}` : ''}
${fp.revenueMonth24?.mid ? `24-Month Revenue Projection: ${formatCurrency(fp.revenueMonth24.mid)}` : ''}
${fp.breakEvenMonths?.mid ? `Projected Break-even: ${fp.breakEvenMonths.mid.toFixed(0)} months` : ''}
`;
  }

  // Competitive landscape section
  let competitionSection = '';
  if (competitionAgent?.competitors && competitionAgent.competitors.length > 0) {
    const topCompetitors = competitionAgent.competitors.slice(0, 4);
    const competitorList = topCompetitors.map((c: any) => {
      let details = c.name;
      if (c.fundingRaised) details += ` - ${formatCurrency(c.fundingRaised)} raised`;
      if (c.stage) details += ` (${c.stage})`;
      return details;
    }).join('\n');

    competitionSection = `
SLIDE: Competitive Landscape

Key competitors and market positioning analysis.

Top Competitors Identified:
${competitorList}

Competitive Differentiation: Focus on unique value proposition and defensible moats.
`;
  }

  // Valuation section
  let valuationSection = '';
  if (valuationAgent?.scenarioAnalysis) {
    const sa = valuationAgent.scenarioAnalysis;
    valuationSection = `
SLIDE: Valuation Analysis

Multi-scenario valuation based on comparable transactions and financial modeling.

Bull Case: ${sa.bull?.description || 'Favorable market conditions'} (${(sa.bull?.probability * 100 || 0).toFixed(0)}% probability)
Base Case: ${sa.base?.description || 'Expected market conditions'} (${(sa.base?.probability * 100 || 0).toFixed(0)}% probability)
Bear Case: ${sa.bear?.description || 'Conservative assumptions'} (${(sa.bear?.probability * 100 || 0).toFixed(0)}% probability)
${sa.expectedValue ? `Expected Value: ${formatCurrency(sa.expectedValue)}` : ''}
`;
  }

  // Team assessment section
  let teamSection = '';
  if (teamAgent) {
    const teamFindings = teamAgent.findings?.slice(0, 3) || [];
    const teamStrengths = teamFindings.filter((f: any) => f.type === 'strength');
    const teamRisks = teamAgent.risks?.slice(0, 2) || [];

    teamSection = `
SLIDE: Team Assessment

Evaluation of founding team capability and execution potential.

${teamStrengths.length > 0 ? `Team Strengths:\n${teamStrengths.map((s: any) => `- ${s.title}`).join('\n')}` : ''}
${teamRisks.length > 0 ? `\nKey Team Risks:\n${teamRisks.map((r: any) => `- ${r.title}`).join('\n')}` : ''}

Team Score: ${normalizeScore(teamAgent.score).toFixed(1)}/10
`;
  }

  // Technical feasibility section
  let techSection = '';
  if (techAgent) {
    const techFindings = techAgent.findings?.slice(0, 3) || [];
    techSection = `
SLIDE: Technical Feasibility

Assessment of technical approach, scalability, and execution risk.

${techFindings.length > 0 ? `Key Technical Findings:\n${techFindings.map((f: any) => `- ${f.title}: ${f.description.substring(0, 80)}...`).join('\n')}` : ''}

Technical Score: ${normalizeScore(techAgent.score).toFixed(1)}/10
`;
  }

  // Build the complete presentation content
  const content = `${validation.title}
INVESTOR-GRADE STARTUP VALIDATION REPORT

Powered by Startup Verdict's 12-Agent AI Validation System

SLIDE: Executive Summary

${validation.title} has undergone comprehensive validation by 12 specialized AI agents analyzing market opportunity, competitive positioning, financial viability, team capability, and technical feasibility.

VERDICT: ${getVerdictDisplay(validation.verdict)}

Overall Score: ${score.toFixed(1)}/10 (Grade: ${grade})
Confidence Level: ${validation.overallConfidence || 0}%
Analysis Depth: ${validation.agentReports?.length || 0}/12 agents completed

${validation.executiveSummary || 'This validation provides a data-driven assessment across all critical investment dimensions.'}

SLIDE: Validation Scorecard

Agent-by-Agent Assessment Results:

${agentScorecard}

Each agent applies rigorous analysis methodologies to evaluate specific aspects of the business opportunity.
${marketSection}${unitEconSection}${projectionsSection}${competitionSection}${valuationSection}${teamSection}${techSection}
SLIDE: SWOT Analysis - Strengths

Key strengths identified across all analysis dimensions:

${strengths.length > 0 ? strengths.map(s => `${s.title}: ${s.description.substring(0, 120)}...`).join('\n\n') : 'Strength analysis pending...'}

SLIDE: SWOT Analysis - Weaknesses & Risks

Areas requiring attention and improvement:

${weaknesses.length > 0 ? weaknesses.map(w => `${w.title}: ${w.description.substring(0, 120)}...`).join('\n\n') : 'No critical weaknesses identified.'}

${highRisks.length > 0 ? `\nHigh-Priority Risks:\n${highRisks.map(r => `${r.title} (${r.impact} impact): ${r.description.substring(0, 100)}...`).join('\n')}` : ''}

SLIDE: Growth Opportunities

Market opportunities and expansion potential:

${opportunities.length > 0 ? opportunities.map(o => `${o.title}: ${o.description.substring(0, 120)}...`).join('\n\n') : 'Opportunity analysis in progress...'}

SLIDE: External Threats

Market and competitive threats to consider:

${threats.length > 0 ? threats.map(t => `${t.title}: ${t.description.substring(0, 120)}...`).join('\n\n') : 'Threat analysis in progress...'}

SLIDE: Action Plan

Priority recommendations for improving validation score and investment readiness:

${criticalActions.length > 0 ? criticalActions.map((r, i) => `${i + 1}. ${r.title} [${r.priority.toUpperCase()}]\nTimeframe: ${r.timeframe}\n${r.description.substring(0, 150)}...`).join('\n\n') : 'Action items being generated...'}

SLIDE: Investment Considerations

Key factors for investment decision:

Positive Indicators:
${strengths.slice(0, 3).map(s => `- ${s.title}`).join('\n') || '- Analysis pending'}

Watch Items:
${highRisks.slice(0, 3).map(r => `- ${r.title}`).join('\n') || '- No critical items'}

SLIDE: Next Steps

Recommended actions to advance this opportunity:

1. Address critical action items within specified timeframes
2. Schedule follow-up validation after implementing changes
3. Engage with specialist advisors in identified weak areas
4. Prepare detailed due diligence materials

Report ID: SVR-${validation.id.slice(0, 8).toUpperCase()}
Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

Startup Verdict - AI-Powered Investment Intelligence
www.startupverdict.com`;

  return content;
}

// Poll for generation completion - increased timeout to 3 minutes
async function pollForCompletion(generationId: string, maxAttempts = 60): Promise<any> {
  for (let i = 0; i < maxAttempts; i++) {
    console.log(`Polling attempt ${i + 1}/${maxAttempts} for generation ${generationId}`);

    const response = await fetch(`${GAMMA_API_URL}/generations/${generationId}`, {
      method: 'GET',
      headers: {
        'X-API-KEY': GAMMA_API_KEY!,
        'accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Poll request failed: ${response.status}`, errorText);
      throw new Error(`Failed to poll generation status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Poll response (attempt ${i + 1}):`, JSON.stringify(data, null, 2));

    // Check for completion - handle various status values
    const status = (data.status || '').toLowerCase();
    if (status === 'completed' || status === 'success' || status === 'done' || status === 'ready') {
      return data;
    }

    // Check if URL is already available even if status isn't "completed"
    if (data.url || data.gammaUrl || data.viewUrl || data.link) {
      console.log('URL found in poll response, returning data');
      return data;
    }

    if (status === 'failed' || status === 'error') {
      throw new Error(data.error || data.message || 'Generation failed');
    }

    // Wait 3 seconds before next poll
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  throw new Error('Generation timed out after 3 minutes');
}

export async function POST(request: NextRequest) {
  try {
    if (!GAMMA_API_KEY) {
      return NextResponse.json(
        { error: 'Gamma API key not configured' },
        { status: 500 }
      );
    }

    const { validation, agents } = await request.json();

    if (!validation) {
      return NextResponse.json(
        { error: 'Validation data is required' },
        { status: 400 }
      );
    }

    // Build the presentation content
    const inputText = buildPresentationContent(validation, agents || []);

    // Call Gamma API to generate presentation
    // Using the correct endpoint: https://public-api.gamma.app/v1.0/generations
    const gammaResponse = await fetch(`${GAMMA_API_URL}/generations`, {
      method: 'POST',
      headers: {
        'X-API-KEY': GAMMA_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputText: inputText,
        textMode: 'generate',
        format: 'presentation',
        numCards: 12,
        exportAs: 'pptx', // Export as downloadable PPTX file
        textOptions: {
          amount: 'detailed',
          tone: 'professional, data-driven',
          audience: 'investors, founders, VCs',
          language: 'en'
        },
        imageOptions: {
          source: 'pictographic',
        },
        cardOptions: {
          dimensions: '16x9'
        },
        sharingOptions: {
          externalAccess: 'view', // Allow external viewing
        }
      }),
    });

    const responseText = await gammaResponse.text();
    console.log('Gamma API response status:', gammaResponse.status);
    console.log('Gamma API response:', responseText);

    if (!gammaResponse.ok) {
      console.error('Gamma API error:', gammaResponse.status, responseText);

      // Return a more helpful error message based on status code
      let errorMessage = 'Could not generate presentation.';
      if (gammaResponse.status === 401) {
        errorMessage = 'Invalid API key. Please verify your Gamma API key.';
      } else if (gammaResponse.status === 403) {
        errorMessage = 'No API credits available. Please check your Gamma subscription.';
      } else if (gammaResponse.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      }

      return NextResponse.json({
        success: false,
        error: `Gamma API error: ${gammaResponse.status}`,
        details: responseText,
        message: errorMessage,
      });
    }

    let gammaData;
    try {
      gammaData = JSON.parse(responseText);
    } catch {
      console.error('Failed to parse Gamma response as JSON:', responseText);
      return NextResponse.json({
        success: false,
        error: 'Invalid response from Gamma API',
        details: responseText,
      });
    }

    console.log('Gamma API parsed data:', JSON.stringify(gammaData, null, 2));

    // v1.0 API returns the URL directly in the response
    // Check for various possible URL fields including export/download URLs
    const presentationUrl = gammaData.url
      || gammaData.gammaUrl
      || gammaData.viewUrl
      || gammaData.link
      || gammaData.shareUrl
      || gammaData.publicUrl
      || gammaData.exportUrl
      || gammaData.downloadUrl
      || gammaData.pptxUrl
      || gammaData.pdfUrl;

    const editUrl = gammaData.editUrl || gammaData.editorUrl;

    // Check for export object if exportAs was requested
    const exportUrl = gammaData.export?.url
      || gammaData.export?.downloadUrl
      || gammaData.exports?.pptx
      || gammaData.exports?.pdf;

    if (exportUrl) {
      return NextResponse.json({
        success: true,
        presentationUrl: exportUrl,
        downloadUrl: exportUrl,
        editUrl: editUrl,
        raw: gammaData,
      });
    }

    if (presentationUrl) {
      return NextResponse.json({
        success: true,
        presentationUrl: presentationUrl,
        editUrl: editUrl,
        raw: gammaData,
      });
    }

    // If we got a generationId or id, we need to poll for completion
    const generationId = gammaData.generationId || gammaData.id;
    if (generationId) {
      try {
        const completedData = await pollForCompletion(generationId);
        console.log('Poll completed data:', JSON.stringify(completedData, null, 2));

        // Check for export/download URLs first
        const completedExportUrl = completedData.export?.url
          || completedData.export?.downloadUrl
          || completedData.exports?.pptx
          || completedData.exports?.pdf
          || completedData.exportUrl
          || completedData.downloadUrl;

        const completedUrl = completedExportUrl
          || completedData.url
          || completedData.gammaUrl
          || completedData.viewUrl
          || completedData.link
          || completedData.shareUrl
          || completedData.publicUrl;

        return NextResponse.json({
          success: true,
          presentationUrl: completedUrl,
          downloadUrl: completedExportUrl || completedUrl,
          editUrl: completedData.editUrl || completedData.editorUrl,
          generationId: generationId,
          raw: completedData,
        });
      } catch (pollError) {
        console.error('Polling error:', pollError);

        // Try one more time to get the generation status
        try {
          const finalCheck = await fetch(`${GAMMA_API_URL}/generations/${generationId}`, {
            method: 'GET',
            headers: {
              'X-API-KEY': GAMMA_API_KEY!,
              'accept': 'application/json',
            },
          });
          if (finalCheck.ok) {
            const finalData = await finalCheck.json();
            console.log('Final check data:', JSON.stringify(finalData, null, 2));
            const finalExportUrl = finalData.export?.url || finalData.exportUrl || finalData.downloadUrl;
            const finalUrl = finalExportUrl || finalData.url || finalData.gammaUrl || finalData.viewUrl || finalData.link;
            if (finalUrl) {
              return NextResponse.json({
                success: true,
                presentationUrl: finalUrl,
                downloadUrl: finalExportUrl || finalUrl,
                editUrl: finalData.editUrl,
                generationId: generationId,
              });
            }
          }
        } catch (e) {
          console.error('Final check failed:', e);
        }

        return NextResponse.json({
          success: false,
          error: 'Generation is taking longer than expected',
          generationId: generationId,
          message: 'The presentation is still being generated. Please try again in a few moments.',
        });
      }
    }

    // If no URL and no generationId, return the raw response for debugging
    return NextResponse.json({
      success: false,
      error: 'Unexpected response format from Gamma',
      raw: gammaData,
      message: 'Unable to generate presentation. Please try again.',
    });

  } catch (error) {
    console.error('Gamma presentation generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate presentation',
        details: String(error),
        message: 'An unexpected error occurred. Please try again.'
      },
      { status: 500 }
    );
  }
}
