import { NextRequest, NextResponse } from 'next/server';

const GAMMA_API_KEY = process.env.GAMMA_API_KEY;
const GAMMA_API_URL = 'https://api.gamma.app/v1';

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
    return `- ${getAgentDisplayName(report.agentId)}: ${normalizedScore.toFixed(1)}/10 (${getGrade(normalizedScore)})`;
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
## Market Size Analysis

- **Total Addressable Market (TAM):** ${formatCurrency(marketAgent.marketData.tam || 0)}
- **Serviceable Addressable Market (SAM):** ${formatCurrency(marketAgent.marketData.sam || 0)}
- **Serviceable Obtainable Market (SOM):** ${formatCurrency(marketAgent.marketData.som || 0)}
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
## Unit Economics

- **Customer Acquisition Cost (CAC):** $${cac}
- **Lifetime Value (LTV):** $${ltv}
- **LTV:CAC Ratio:** ${ratio}x ${parseFloat(ratio as string) >= 3 ? '(Healthy)' : '(Needs Improvement)'}
`;
  }

  const content = `
# ${validation.title}
## Startup Validation Report

Create a professional investor-grade presentation for this startup validation. The presentation should be visually stunning, use modern design, and include data visualizations.

---

# Executive Overview

**Startup:** ${validation.title}

**Description:** ${validation.description}

**Overall Score:** ${score.toFixed(1)}/10 (Grade: ${grade})

**Confidence Level:** ${validation.overallConfidence || 0}%

**Agents Completed:** ${validation.agentReports?.length || 0}/12

---

# Validation Verdict

${validation.verdict || 'Analysis in progress...'}

---

# Executive Summary

${validation.executiveSummary || 'Comprehensive analysis by 12 specialized AI agents covering market opportunity, competitive landscape, financial viability, technical feasibility, and more.'}

---

# Agent Analysis Scores

${agentScores}

---
${marketSection}
---
${unitEconSection}
---

# SWOT Analysis

## Strengths
${strengths.map(s => `- **${s.title}:** ${s.description.substring(0, 100)}...`).join('\n') || '- No strengths identified yet'}

## Weaknesses
${weaknesses.map(w => `- **${w.title}:** ${w.description.substring(0, 100)}...`).join('\n') || '- No weaknesses identified yet'}

## Opportunities
${opportunities.map(o => `- **${o.title}:** ${o.description.substring(0, 100)}...`).join('\n') || '- No opportunities identified yet'}

## Threats
${threats.map(t => `- **${t.title}:** ${t.description.substring(0, 100)}...`).join('\n') || '- No threats identified yet'}

---

# Key Risks

${topRisks.map(r => `### ${r.title}
- **Probability:** ${r.probability}
- **Impact:** ${r.impact}
- ${r.description.substring(0, 150)}...`).join('\n\n') || 'No significant risks identified.'}

---

# Priority Recommendations

${topRecommendations.map((r, i) => `### ${i + 1}. ${r.title}
- **Priority:** ${r.priority.toUpperCase()}
- **Timeframe:** ${r.timeframe}
- ${r.description.substring(0, 150)}...`).join('\n\n') || 'No recommendations yet.'}

---

# Conclusion

This validation report was generated by Startup Verdict's 12-agent AI validation system.

**Report ID:** SVR-${validation.id.slice(0, 8).toUpperCase()}

**Generated:** ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

---

Make this presentation visually stunning with:
- Modern, professional design
- Data visualizations for scores and metrics
- Color-coded sections (green for strengths, red for risks, blue for recommendations)
- Clean typography and spacing
- Include the Startup Verdict branding
`;

  return content;
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
    const content = buildPresentationContent(validation, agents || []);

    // Call Gamma API to generate presentation
    const gammaResponse = await fetch(`${GAMMA_API_URL}/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GAMMA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: content,
        format: 'presentation',
        style: 'professional',
        theme: 'modern',
        title: `${validation.title} - Validation Report`,
      }),
    });

    if (!gammaResponse.ok) {
      const errorText = await gammaResponse.text();
      console.error('Gamma API error:', errorText);

      // If Gamma API fails, return a fallback with the content
      return NextResponse.json({
        success: false,
        error: 'Gamma API returned an error',
        fallbackContent: content,
        message: 'Could not generate presentation. The content is available for manual creation.',
      });
    }

    const gammaData = await gammaResponse.json();

    return NextResponse.json({
      success: true,
      presentationUrl: gammaData.url || gammaData.presentation_url,
      presentationId: gammaData.id || gammaData.presentation_id,
      editUrl: gammaData.edit_url,
    });

  } catch (error) {
    console.error('Gamma presentation generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate presentation', details: String(error) },
      { status: 500 }
    );
  }
}
