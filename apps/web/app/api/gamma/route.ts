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

// Build presentation content from validation data
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
  const topRisks = allRisks.slice(0, 5);
  const topRecommendations = allRecommendations.filter(r => r.priority === 'critical' || r.priority === 'high').slice(0, 5);

  // Build agent scores section
  const agentScores = validation.agentReports?.map(report => {
    const normalizedScore = normalizeScore(report.score);
    return `- ${getAgentDisplayName(report.agentId)}: ${normalizedScore.toFixed(1)}/10 (Grade: ${getGrade(normalizedScore)})`;
  }).join('\n') || '';

  // Build market data section if available
  const marketAgent = validation.agentReports?.find(r => r.agentId === 'marcus');
  let marketSection = '';
  if (marketAgent?.marketData) {
    const formatCurrency = (v: number) => {
      if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
      if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
      return `$${v.toFixed(0)}`;
    };
    marketSection = `

Market Size Analysis:
- Total Addressable Market (TAM): ${formatCurrency(marketAgent.marketData.tam || 0)}
- Serviceable Addressable Market (SAM): ${formatCurrency(marketAgent.marketData.sam || 0)}
- Serviceable Obtainable Market (SOM): ${formatCurrency(marketAgent.marketData.som || 0)}
`;
  }

  // Build unit economics section if available
  const financeAgent = validation.agentReports?.find(r => r.agentId === 'david');
  let unitEconSection = '';
  if (financeAgent?.unitEconomics) {
    const ue = financeAgent.unitEconomics;
    const cac = ue.cac?.mid || 0;
    const ltv = ue.ltv?.mid || 0;
    const ratio = cac > 0 ? (ltv / cac).toFixed(1) : 'N/A';
    unitEconSection = `

Unit Economics:
- Customer Acquisition Cost (CAC): $${cac}
- Lifetime Value (LTV): $${ltv}
- LTV:CAC Ratio: ${ratio}x ${parseFloat(ratio as string) >= 3 ? '(Healthy)' : '(Needs Improvement)'}
`;
  }

  const content = `${validation.title} - Startup Validation Report

This is a comprehensive startup validation report powered by Startup Verdict's 12-agent AI system.

Executive Overview:
- Startup: ${validation.title}
- Description: ${validation.description}
- Overall Score: ${score.toFixed(1)}/10 (Grade: ${grade})
- Confidence Level: ${validation.overallConfidence || 0}%
- Agents Completed: ${validation.agentReports?.length || 0}/12

Validation Verdict:
${validation.verdict || 'Analysis in progress...'}

Executive Summary:
${validation.executiveSummary || 'Comprehensive analysis by 12 specialized AI agents covering market opportunity, competitive landscape, financial viability, technical feasibility, and more.'}

Agent Analysis Scores:
${agentScores}
${marketSection}
${unitEconSection}

SWOT Analysis:

Strengths:
${strengths.map(s => `- ${s.title}: ${s.description.substring(0, 100)}...`).join('\n') || '- No strengths identified yet'}

Weaknesses:
${weaknesses.map(w => `- ${w.title}: ${w.description.substring(0, 100)}...`).join('\n') || '- No weaknesses identified yet'}

Opportunities:
${opportunities.map(o => `- ${o.title}: ${o.description.substring(0, 100)}...`).join('\n') || '- No opportunities identified yet'}

Threats:
${threats.map(t => `- ${t.title}: ${t.description.substring(0, 100)}...`).join('\n') || '- No threats identified yet'}

Key Risks:
${topRisks.map(r => `- ${r.title} (${r.probability} probability, ${r.impact} impact): ${r.description.substring(0, 100)}...`).join('\n') || 'No significant risks identified.'}

Priority Recommendations:
${topRecommendations.map((r, i) => `${i + 1}. ${r.title} [${r.priority.toUpperCase()}] (${r.timeframe}): ${r.description.substring(0, 100)}...`).join('\n') || 'No recommendations yet.'}

Report ID: SVR-${validation.id.slice(0, 8).toUpperCase()}
Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
Powered by Startup Verdict - AI-Powered Validation Intelligence`;

  return content;
}

// Poll for generation completion
async function pollForCompletion(generationId: string, maxAttempts = 30): Promise<any> {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`${GAMMA_API_URL}/generations/${generationId}`, {
      method: 'GET',
      headers: {
        'X-API-KEY': GAMMA_API_KEY!,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to poll generation status: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 'completed' || data.status === 'success') {
      return data;
    }

    if (data.status === 'failed' || data.status === 'error') {
      throw new Error(data.error || 'Generation failed');
    }

    // Wait 2 seconds before next poll
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  throw new Error('Generation timed out');
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
      }),
    });

    if (!gammaResponse.ok) {
      const errorText = await gammaResponse.text();
      console.error('Gamma API error:', gammaResponse.status, errorText);

      // Return a more helpful error message
      return NextResponse.json({
        success: false,
        error: `Gamma API error: ${gammaResponse.status}`,
        details: errorText,
        fallbackContent: inputText,
        message: 'Could not generate presentation. Please check your Gamma API key and ensure you have a Pro subscription.',
      });
    }

    const gammaData = await gammaResponse.json();

    // If we got a generationId, we need to poll for completion
    if (gammaData.generationId) {
      try {
        const completedData = await pollForCompletion(gammaData.generationId);

        return NextResponse.json({
          success: true,
          presentationUrl: completedData.url || completedData.gammaUrl || completedData.viewUrl,
          editUrl: completedData.editUrl,
          generationId: gammaData.generationId,
        });
      } catch (pollError) {
        console.error('Polling error:', pollError);
        return NextResponse.json({
          success: false,
          error: 'Generation timed out or failed',
          generationId: gammaData.generationId,
          message: 'The presentation is being generated. Please check Gamma.app directly.',
        });
      }
    }

    // Direct response (if Gamma returns URL immediately)
    return NextResponse.json({
      success: true,
      presentationUrl: gammaData.url || gammaData.gammaUrl || gammaData.viewUrl,
      editUrl: gammaData.editUrl,
    });

  } catch (error) {
    console.error('Gamma presentation generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate presentation', details: String(error) },
      { status: 500 }
    );
  }
}
