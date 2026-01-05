/**
 * Rachel - Chief Risk & Compliance Officer
 *
 * Purpose: Identifies legal landmines and compliance requirements.
 * Personality: Cautious, detail-obsessed, spots landmines others miss.
 * Scoring Weight: 0.8x
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BaseAnalysisAgent, AnalysisInput, Citation } from '../base/base-analysis.agent';

interface RegulatoryRequirement {
  name: string;
  category: string;
  complexity: 'low' | 'medium' | 'high';
  estimatedCost: number;
  timeToComply: number; // months
}

interface LegalAnalysis {
  patentRisks: number;
  trademarkRisks: number;
  regulatoryBurden: 'low' | 'medium' | 'high';
  complianceCost: number;
  requirements: RegulatoryRequirement[];
}

@Injectable()
export class RachelAgent extends BaseAnalysisAgent {
  protected readonly agentId = 'rachel';
  protected readonly agentName = 'Rachel';
  protected readonly agentVersion = '1.0.0';
  protected readonly scoringWeight = 0.8;

  private legalAnalysis: LegalAnalysis | null = null;

  constructor(prisma: PrismaService, eventEmitter: EventEmitter2) {
    super(prisma, eventEmitter);
  }

  protected async performAnalysis(input: AnalysisInput): Promise<void> {
    this.logger.log('Starting legal/risk analysis');

    // Step 1: Patent screening
    await this.screenPatents(input);

    // Step 2: Trademark checking
    await this.checkTrademarks(input);

    // Step 3: Regulatory mapping
    await this.mapRegulations(input);

    // Step 4: Data privacy analysis
    await this.analyzeDataPrivacy(input);

    // Step 5: Liability assessment
    await this.assessLiability(input);

    // Step 6: Generate mitigation strategies
    await this.generateMitigations(input);

    this.buildRawAnalysis();
  }

  private async screenPatents(input: AnalysisInput): Promise<void> {
    const solution = input.idea.solution || input.idea.description;
    const industry = input.idea.industry?.toLowerCase() || 'technology';

    // High-patent-risk industries
    const highRiskIndustries = ['biotech', 'pharma', 'hardware', 'semiconductor'];
    const mediumRiskIndustries = ['ai', 'ml', 'fintech', 'medical'];

    let patentRisk = 0;

    if (highRiskIndustries.some(i => industry.includes(i))) {
      patentRisk = 0.7;
    } else if (mediumRiskIndustries.some(i => industry.includes(i))) {
      patentRisk = 0.4;
    } else {
      patentRisk = 0.2;
    }

    // Check for patent-triggering keywords
    const patentKeywords = ['novel', 'patent', 'proprietary', 'algorithm', 'invention'];
    if (patentKeywords.some(k => solution.toLowerCase().includes(k))) {
      patentRisk += 0.1;
    }

    if (!this.legalAnalysis) {
      this.legalAnalysis = {
        patentRisks: patentRisk,
        trademarkRisks: 0,
        regulatoryBurden: 'low',
        complianceCost: 0,
        requirements: [],
      };
    } else {
      this.legalAnalysis.patentRisks = patentRisk;
    }

    const citation = this.addCitation({
      claim: `Patent risk assessment: ${(patentRisk * 100).toFixed(0)}%`,
      source: 'Patent Analysis',
      sourceUrl: 'internal://rachel/patent-screening',
      confidence: 0.6,
      dataType: 'computed',
    });

    if (patentRisk > 0.5) {
      this.addFinding({
        title: 'Elevated Patent Risk',
        description: `${industry} has significant patent activity - freedom to operate study recommended`,
        type: 'threat',
        severity: 'major',
        evidence: [citation],
        confidence: 6,
      });

      this.addRisk({
        title: 'Patent Infringement Risk',
        description: 'Technology space has active patent holders who may assert rights',
        category: 'legal',
        probability: 'medium',
        impact: 'major',
        mitigations: [
          'Conduct freedom-to-operate analysis',
          'Design around known patents',
          'Consider defensive patent filing',
        ],
        evidence: [citation],
      });

      this.addRecommendation({
        title: 'Patent Search',
        description: 'Engage patent attorney for prior art search before significant development',
        priority: 'high',
        timeframe: 'immediate',
        effort: 'medium',
        impact: 'high',
      });
    }
  }

  private async checkTrademarks(input: AnalysisInput): Promise<void> {
    const title = input.idea.title;

    // Simple trademark risk assessment
    const commonWords = ['the', 'ai', 'app', 'tech', 'cloud', 'digital', 'smart'];
    const hasCommonName = commonWords.some(w => title.toLowerCase().includes(w));

    const trademarkRisk = hasCommonName ? 0.4 : 0.2;

    if (this.legalAnalysis) {
      this.legalAnalysis.trademarkRisks = trademarkRisk;
    }

    const citation = this.addCitation({
      claim: `Trademark conflict risk: ${(trademarkRisk * 100).toFixed(0)}%`,
      source: 'Trademark Analysis',
      sourceUrl: 'internal://rachel/trademark-check',
      confidence: 0.5,
      dataType: 'computed',
    });

    this.addRecommendation({
      title: 'Trademark Search',
      description: `Conduct USPTO trademark search for "${title}" before launch`,
      priority: 'medium',
      timeframe: 'short-term',
      effort: 'low',
      impact: 'medium',
    });
  }

  private async mapRegulations(input: AnalysisInput): Promise<void> {
    const industry = input.idea.industry?.toLowerCase() || 'technology';
    const geography = input.idea.geography || ['United States'];
    const requirements: RegulatoryRequirement[] = [];

    // Industry-specific regulations
    if (industry.includes('health') || industry.includes('medical')) {
      requirements.push({
        name: 'HIPAA Compliance',
        category: 'Healthcare',
        complexity: 'high',
        estimatedCost: 50000,
        timeToComply: 6,
      });
    }

    if (industry.includes('fintech') || industry.includes('finance')) {
      requirements.push({
        name: 'Financial Regulations (SOX, PCI-DSS)',
        category: 'Finance',
        complexity: 'high',
        estimatedCost: 100000,
        timeToComply: 12,
      });
    }

    if (industry.includes('food') || industry.includes('beverage')) {
      requirements.push({
        name: 'FDA Compliance',
        category: 'Food Safety',
        complexity: 'high',
        estimatedCost: 75000,
        timeToComply: 9,
      });
    }

    // Geography-specific regulations
    if (geography.includes('Europe') || geography.includes('Global')) {
      requirements.push({
        name: 'GDPR Compliance',
        category: 'Data Privacy',
        complexity: 'medium',
        estimatedCost: 25000,
        timeToComply: 3,
      });
    }

    if (geography.includes('California') || geography.includes('United States')) {
      requirements.push({
        name: 'CCPA Compliance',
        category: 'Data Privacy',
        complexity: 'medium',
        estimatedCost: 15000,
        timeToComply: 2,
      });
    }

    // Default requirement
    requirements.push({
      name: 'Terms of Service & Privacy Policy',
      category: 'General',
      complexity: 'low',
      estimatedCost: 5000,
      timeToComply: 1,
    });

    const totalCost = requirements.reduce((sum, r) => sum + r.estimatedCost, 0);
    const burden = totalCost > 100000 ? 'high' : totalCost > 30000 ? 'medium' : 'low';

    if (this.legalAnalysis) {
      this.legalAnalysis.requirements = requirements;
      this.legalAnalysis.complianceCost = totalCost;
      this.legalAnalysis.regulatoryBurden = burden;
    }

    const citation = this.addCitation({
      claim: `${requirements.length} regulatory requirements identified, est. cost: $${(totalCost / 1000).toFixed(0)}K`,
      source: 'Regulatory Mapping',
      sourceUrl: 'internal://rachel/regulatory-map',
      confidence: 0.7,
      dataType: 'computed',
    });

    if (burden === 'high') {
      this.addFinding({
        title: 'High Regulatory Burden',
        description: `Significant compliance requirements: ${requirements.map(r => r.name).join(', ')}`,
        type: 'weakness',
        severity: 'major',
        evidence: [citation],
        confidence: 7,
      });
    } else {
      this.addFinding({
        title: 'Manageable Compliance',
        description: 'Regulatory requirements are standard for this type of business',
        type: 'neutral',
        severity: 'info',
        evidence: [citation],
        confidence: 7,
      });
    }
  }

  private async analyzeDataPrivacy(input: AnalysisInput): Promise<void> {
    const desc = (input.idea.description + (input.idea.solution || '')).toLowerCase();
    const handlesPersonalData = ['user data', 'personal', 'customer data', 'profile', 'account'].some(k => desc.includes(k));

    if (handlesPersonalData) {
      const citation = this.addCitation({
        claim: 'Application handles personal/user data',
        source: 'Data Privacy Analysis',
        sourceUrl: 'internal://rachel/privacy-analysis',
        confidence: 0.7,
        dataType: 'computed',
      });

      this.addRisk({
        title: 'Data Privacy Risk',
        description: 'Handling personal data requires compliance with privacy regulations',
        category: 'legal',
        probability: 'high',
        impact: 'moderate',
        mitigations: [
          'Implement privacy by design',
          'Create clear data retention policies',
          'Ensure proper consent mechanisms',
        ],
        evidence: [citation],
      });
    }
  }

  private async assessLiability(input: AnalysisInput): Promise<void> {
    const desc = (input.idea.description + (input.idea.solution || '')).toLowerCase();

    // Check for high-liability areas
    const highLiabilityKeywords = ['health', 'medical', 'financial advice', 'autonomous', 'safety', 'critical'];
    const hasHighLiability = highLiabilityKeywords.some(k => desc.includes(k));

    if (hasHighLiability) {
      this.addRisk({
        title: 'Product Liability Risk',
        description: 'Product operates in area with potential for significant liability claims',
        category: 'legal',
        probability: 'low',
        impact: 'critical',
        mitigations: [
          'Obtain appropriate insurance coverage',
          'Include proper disclaimers and terms',
          'Consider forming LLC or corporation for liability protection',
        ],
        evidence: [],
      });

      this.addRecommendation({
        title: 'Liability Insurance',
        description: 'Obtain professional liability and errors & omissions insurance',
        priority: 'high',
        timeframe: 'short-term',
        effort: 'low',
        impact: 'high',
      });
    }
  }

  private async generateMitigations(input: AnalysisInput): Promise<void> {
    // Already generated inline, but add general recommendations
    this.addRecommendation({
      title: 'Legal Entity Setup',
      description: 'Form proper legal entity (LLC or C-Corp) before accepting investment',
      priority: 'high',
      timeframe: 'immediate',
      effort: 'medium',
      impact: 'high',
    });
  }

  private buildRawAnalysis(): void {
    const l = this.legalAnalysis;
    this.rawAnalysis = `
# Rachel - Legal & Risk Report

## Risk Assessment
- **Patent Risk**: ${l ? (l.patentRisks * 100).toFixed(0) : 0}%
- **Trademark Risk**: ${l ? (l.trademarkRisks * 100).toFixed(0) : 0}%
- **Regulatory Burden**: ${l?.regulatoryBurden || 'Unknown'}
- **Est. Compliance Cost**: $${l ? (l.complianceCost / 1000).toFixed(0) : 0}K

## Regulatory Requirements
${l?.requirements.map(r => `- **${r.name}** (${r.category}): $${(r.estimatedCost / 1000).toFixed(0)}K, ${r.timeToComply} months`).join('\n') || 'None identified'}

## Key Findings
${this.findings.map(f => `- **${f.title}**: ${f.description}`).join('\n')}

## Legal Risks
${this.risks.map(r => `- **${r.title}** [${r.probability}/${r.impact}]: ${r.description}`).join('\n')}

## Recommendations
${this.recommendations.map(r => `- **${r.title}**: ${r.description}`).join('\n')}
    `.trim();
  }

  protected calculateScore(): number {
    const l = this.legalAnalysis;
    if (!l) return 7;

    let score = 8;

    // Patent risk impact
    score -= l.patentRisks * 2;

    // Regulatory burden impact
    if (l.regulatoryBurden === 'high') score -= 1.5;
    else if (l.regulatoryBurden === 'medium') score -= 0.5;

    // Number of critical risks
    const criticalRisks = this.risks.filter(r => r.impact === 'critical').length;
    score -= criticalRisks * 0.5;

    return Math.max(1, Math.min(10, Math.round(score * 10) / 10));
  }
}
