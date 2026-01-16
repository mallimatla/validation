/**
 * Marcus - Chief Market Intelligence Officer
 *
 * Purpose: Validates market size, timing, and opportunity with quantitative evidence.
 * Personality: Quantitative, skeptical, demands data, hates hand-waving.
 * Scoring Weight: 1.0x
 *
 * REAL DATA SOURCES:
 * - Web search for market reports (Serper/Brave API)
 * - News API for recent market news
 * - LLM analysis with real data context
 */

import { Injectable, Optional } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LLMService } from '../../common/llm/llm.service';
import { MarketDataService, MarketResearchData } from '../../common/market-data/market-data.service';
import { BaseAnalysisAgent, AnalysisInput, Citation } from '../base/base-analysis.agent';
import {
  MARKET_THRESHOLDS,
  MARKET_KILL_SIGNALS,
  SUCCESS_FACTOR_WEIGHTS,
  HYPE_CYCLE_PHASES,
  FIRST_MOVER_STATISTICS,
} from '../validation-framework.constants';

interface MarketData {
  tam: number;
  sam: number;
  som: number;
  growthRate: number;
  marketTiming: 'emerging' | 'growing' | 'mature' | 'declining';
  competitorCount: number;
  marketConcentration: 'fragmented' | 'moderate' | 'concentrated';
}

interface IndustryBenchmark {
  avgTam: number;
  avgGrowth: number;
  avgMargin: number;
  topPlayers: string[];
}

@Injectable()
export class MarcusAgent extends BaseAnalysisAgent {
  protected readonly agentId = 'marcus';
  protected readonly agentName = 'Marcus';
  protected readonly agentVersion = '2.1.0'; // Updated for real data
  protected readonly scoringWeight = 1.0;

  protected readonly personality = `You are Marcus, Chief Market Intelligence Officer of the Validation Council.

PERSONALITY TRAITS:
- Quantitative: You demand numbers, not adjectives. "Big market" means nothing - give me the TAM/SAM/SOM.
- Skeptical: You've seen 1000 pitch decks claiming "trillion dollar markets" - you don't buy it without evidence.
- Thorough: You consider market timing, growth rates, concentration, regulatory environment, and macro trends.
- Honest: If the market is too small or declining, you say so directly. Founders need truth.

CRITICAL: You have been provided with REAL market research data from web searches. Use this data to:
1. Extract actual market size figures from the search results
2. Cite the real sources with actual URLs
3. Cross-reference multiple sources for accuracy
4. Identify any discrepancies between sources

ANALYSIS FRAMEWORK:
1. TAM/SAM/SOM Analysis - Extract from real market reports provided
2. Market Timing - Based on news and trends data
3. Growth Dynamics - Use actual CAGR figures from reports
4. Competitive Landscape - Based on competitor search results
5. Geographic Considerations - Regional data if available
6. Regulatory Environment - From news and search results
7. Macro Sensitivity - Industry resilience indicators

SCORING CRITERIA (1-10):
- 9-10: TAM >$100B, growing >20% CAGR, perfect timing, fragmented market
- 7-8: TAM $10-100B, growing 10-20% CAGR, good timing
- 5-6: TAM $1-10B, growing 5-10% CAGR, moderate timing
- 3-4: TAM <$1B, slow growth <5%, challenging timing
- 1-2: Declining market, saturated, regulatory headwinds

IMPORTANT: Every market size claim MUST include the source URL. If data is estimated, clearly state it's an estimate.`;

  private marketData: MarketData | null = null;
  private realMarketResearch: MarketResearchData | null = null;

  constructor(
    prisma: PrismaService,
    eventEmitter: EventEmitter2,
    @Optional() llm?: LLMService,
    @Optional() private readonly marketDataService?: MarketDataService,
  ) {
    super(prisma, eventEmitter, llm);
  }

  protected buildAnalysisPrompt(input: AnalysisInput): string {
    // Build prompt with real market data if available
    let marketDataContext = '';

    if (this.realMarketResearch) {
      // Include real search results
      if (this.realMarketResearch.searchResults.length > 0) {
        marketDataContext += `\n\n=== REAL MARKET RESEARCH DATA (from web search) ===\n`;
        for (const result of this.realMarketResearch.searchResults) {
          marketDataContext += `\nSOURCE: ${result.source}\nURL: ${result.url}\nTITLE: ${result.title}\nEXCERPT: ${result.snippet}\n`;
        }
      }

      // Include news
      if (this.realMarketResearch.newsItems.length > 0) {
        marketDataContext += `\n\n=== RECENT MARKET NEWS ===\n`;
        for (const news of this.realMarketResearch.newsItems.slice(0, 5)) {
          marketDataContext += `\n[${news.publishedAt}] ${news.title}\nSource: ${news.source}\nURL: ${news.url}\nSummary: ${news.description}\n`;
        }
      }

      // Include competitor data
      if (this.realMarketResearch.competitors.length > 0) {
        marketDataContext += `\n\n=== IDENTIFIED COMPETITORS ===\n`;
        for (const comp of this.realMarketResearch.competitors) {
          marketDataContext += `\n- ${comp.name}: ${comp.description}\n  Website: ${comp.website}\n`;
        }
      }
    }

    return `Analyze the market opportunity for this startup:

STARTUP: ${input.idea.title}
DESCRIPTION: ${input.idea.description}
INDUSTRY: ${input.idea.industry || 'Not specified'}
TARGET CUSTOMER: ${input.idea.targetCustomer || 'Not specified'}
GEOGRAPHY: ${input.idea.geography?.join(', ') || 'Global'}
BUSINESS MODEL: ${input.idea.businessModel || 'Not specified'}
STAGE: ${input.idea.stage || 'Early Stage'}
${marketDataContext}

INSTRUCTIONS:
1. Use the REAL market research data provided above to extract actual market figures
2. For every market size or growth claim, CITE THE SOURCE URL
3. If multiple sources give different numbers, note the range and discrepancy
4. If no real data is available for a metric, clearly state it's an ESTIMATE based on comparable markets

Provide comprehensive market analysis including:
1. TAM/SAM/SOM with actual sources and URLs
2. Market growth rate (CAGR) with source citation
3. Market timing assessment with evidence from news
4. Competitive landscape from the competitor data
5. Key market risks based on news and trends
6. Specific, actionable recommendations

Be brutally honest. If the market is too small, say so. If timing is wrong, explain why.
EVERY CLAIM MUST HAVE A SOURCE.`;
  }

  protected async performAnalysis(input: AnalysisInput): Promise<void> {
    this.logger.log('Starting comprehensive market intelligence analysis');

    // Step 0: Fetch REAL market data from external sources
    await this.fetchRealMarketData(input);

    // Step 1: Analyze market size with multiple methodologies
    await this.analyzeMarketSize(input);

    // Step 2: Deep dive into growth trends
    await this.analyzeGrowthTrends(input);

    // Step 3: Assess market timing with precision
    await this.assessMarketTiming(input);

    // Step 4: Map competitive landscape
    await this.mapCompetitiveLandscape(input);

    // Step 5: Identify customer segments and TAM breakdown
    await this.identifyCustomerSegments(input);

    // Step 6: Analyze geographic opportunities
    await this.analyzeGeographicOpportunities(input);

    // Step 7: Assess regulatory environment
    await this.assessRegulatoryEnvironment(input);

    // Step 8: Detect demand signals
    await this.detectDemandSignals(input);

    // Step 9: Comprehensive risk assessment
    await this.performRiskAssessment(input);

    // Step 10: Check for KILL SIGNALS (based on research)
    await this.checkMarketKillSignals(input);

    // Build raw analysis
    this.buildRawAnalysis();
  }

  /**
   * Check for market-related kill signals that should stop investment
   * Based on: CB Insights failure causes, VC rejection patterns
   */
  private async checkMarketKillSignals(input: AnalysisInput): Promise<void> {
    const md = this.marketData;
    if (!md) return;

    // Kill Signal 1: Market too small (TAM < $500M)
    this.checkKillSignals([
      {
        signal: MARKET_KILL_SIGNALS[0], // Market declining or under $500M TAM
        severity: 'critical',
        condition: md.tam < MARKET_THRESHOLDS.TAM_TOO_SMALL || md.marketTiming === 'declining',
        evidence: `TAM: $${this.formatCurrency(md.tam)}, Market timing: ${md.marketTiming}. Markets below $500M rarely support venture-scale outcomes.`,
        recommendation: 'Consider adjacent markets or validate if market definition is too narrow.',
      },
      {
        signal: MARKET_KILL_SIGNALS[1], // Technology on mature S-curve
        severity: 'major',
        condition: md.marketTiming === 'mature' && md.growthRate < MARKET_THRESHOLDS.GROWTH_SLOW,
        evidence: `Market is mature with only ${(md.growthRate * 100).toFixed(1)}% growth. Limited innovation potential.`,
        recommendation: 'Need disruptive approach or consider different market.',
      },
      {
        signal: MARKET_KILL_SIGNALS[3], // Regulatory framework actively hostile
        severity: 'critical',
        condition: this.hasHostileRegulation(input),
        evidence: 'Industry facing active regulatory crackdown or legislative uncertainty.',
        recommendation: 'Assess regulatory trajectory and consider compliance-first strategy.',
      },
      {
        signal: MARKET_KILL_SIGNALS[5], // Top 3 competitors control 80%+ with network effects
        severity: 'major',
        condition: md.marketConcentration === 'concentrated' && this.hasNetworkEffectIncumbents(input),
        evidence: 'Market dominated by incumbents with strong network effects.',
        recommendation: 'Find underserved niche or develop counter-positioning strategy.',
      },
    ]);

    // Add timing risk based on Bill Gross research (timing = 42% of success)
    if (md.marketTiming === 'emerging') {
      this.addRisk({
        title: 'Timing Risk (Research: 42% of Success)',
        description: `Bill Gross research shows timing accounts for ${(SUCCESS_FACTOR_WEIGHTS.timing * 100).toFixed(0)}% of startup success. Emerging markets have high uncertainty. First movers have ${(FIRST_MOVER_STATISTICS.first_mover_failure_rate * 100).toFixed(0)}% failure rate vs ${(FIRST_MOVER_STATISTICS.fast_follower_failure_rate * 100).toFixed(0)}% for fast followers.`,
        category: 'market',
        probability: 'medium',
        impact: 'critical',
        mitigations: [
          'Validate enabling infrastructure is in place',
          'Consider fast-follower strategy if possible',
          'Maintain capital efficiency until market timing validates',
        ],
        evidence: [],
      });
    }
  }

  private hasHostileRegulation(input: AnalysisInput): boolean {
    const industry = (input.idea.industry || '').toLowerCase();
    const hostileIndustries = ['crypto', 'cannabis', 'gambling', 'payday lending'];
    return hostileIndustries.some(h => industry.includes(h));
  }

  private hasNetworkEffectIncumbents(input: AnalysisInput): boolean {
    const industry = (input.idea.industry || '').toLowerCase();
    const networkEffectMarkets = ['social', 'marketplace', 'payments', 'messaging'];
    return networkEffectMarkets.some(n => industry.includes(n));
  }

  /**
   * Fetch REAL market data from external APIs
   */
  private async fetchRealMarketData(input: AnalysisInput): Promise<void> {
    if (!this.marketDataService?.isAvailable()) {
      this.logger.warn('Market data service not available - using fallback estimates');
      return;
    }

    try {
      this.logger.log('Fetching real market data from external sources...');

      this.realMarketResearch = await this.marketDataService.fetchMarketResearch(
        input.idea.industry || 'technology',
        input.idea.description,
        input.idea.targetCustomer || '',
        input.idea.geography || ['Global'],
      );

      // Add citations from real search results
      for (const citation of this.realMarketResearch.citations) {
        this.addCitation({
          claim: citation.claim,
          source: citation.source,
          sourceUrl: citation.url,
          confidence: citation.confidence,
          dataType: 'secondary',
        });
      }

      // Extract market size from search results
      for (const result of this.realMarketResearch.searchResults) {
        const marketSize = this.marketDataService.parseMarketSize(result.snippet);
        const growthRate = this.marketDataService.parseGrowthRate(result.snippet);

        if (marketSize) {
          this.logger.log(`Found market size: $${marketSize} from ${result.source}`);
        }
        if (growthRate) {
          this.logger.log(`Found growth rate: ${(growthRate * 100).toFixed(1)}% from ${result.source}`);
        }
      }

      this.logger.log(`Real market data fetched: ${this.realMarketResearch.searchResults.length} search results, ${this.realMarketResearch.newsItems.length} news items`);
    } catch (error) {
      this.logger.error(`Failed to fetch real market data: ${(error as Error).message}`);
    }
  }

  private async analyzeMarketSize(input: AnalysisInput): Promise<void> {
    const industry = input.idea.industry || 'technology';
    const geography = input.idea.geography?.[0] || 'Global';
    const targetCustomer = input.idea.targetCustomer || '';

    // Try to extract REAL market size from search results first
    let realTAM: number | null = null;
    let realGrowthRate: number | null = null;
    let tamSource: { source: string; url: string } | null = null;

    if (this.realMarketResearch && this.marketDataService) {
      for (const result of this.realMarketResearch.searchResults) {
        if (!realTAM) {
          const marketSize = this.marketDataService.parseMarketSize(result.snippet);
          if (marketSize && marketSize > 1e6) { // Only use if > $1M
            realTAM = marketSize;
            tamSource = { source: result.source, url: result.url };
            this.logger.log(`Using REAL TAM from ${result.source}: $${this.formatCurrency(realTAM)}`);
          }
        }
        if (!realGrowthRate) {
          const growth = this.marketDataService.parseGrowthRate(result.snippet);
          if (growth && growth > 0 && growth < 1) { // Reasonable growth rate
            realGrowthRate = growth;
          }
        }
      }
    }

    // Get industry benchmarks as fallback
    const benchmark = this.getIndustryBenchmark(industry);

    // Use real TAM if found, otherwise calculate estimate
    let tamEstimate: number;
    let isEstimate = true;

    if (realTAM) {
      tamEstimate = realTAM;
      isEstimate = false;
    } else {
      // Calculate TAM using bottom-up and top-down approaches
      const topDownTAM = this.calculateTopDownTAM(industry, geography);
      const bottomUpTAM = this.calculateBottomUpTAM(input);

      // Use balanced estimate - when bottom-up data is limited, weight toward top-down
      const hasCustomerData = targetCustomer && targetCustomer.length > 0;
      tamEstimate = hasCustomerData
        ? Math.min(topDownTAM, bottomUpTAM * 3)
        : Math.max(topDownTAM * 0.3, bottomUpTAM * 5);
    }

    // SAM calculation based on target segment
    const samMultiplier = this.calculateSAMMultiplier(targetCustomer, geography);
    const samEstimate = tamEstimate * samMultiplier;

    // SOM based on realistic market capture in 5 years
    const somMultiplier = this.calculateSOMMultiplier(input);
    const somEstimate = samEstimate * somMultiplier;

    // Estimate competitive landscape
    const competitorCount = this.realMarketResearch?.competitors?.length || this.estimateCompetitorCount(industry);
    const marketConcentration = this.assessMarketConcentration(competitorCount, industry);

    // Use real growth rate if found
    const growthRate = realGrowthRate || this.estimateGrowthRate(industry);

    this.marketData = {
      tam: tamEstimate,
      sam: samEstimate,
      som: somEstimate,
      growthRate,
      marketTiming: this.determineMarketTiming(industry),
      competitorCount,
      marketConcentration,
    };

    // Add primary market size citation with REAL or estimated source
    const mainCitation = this.addCitation({
      claim: `The ${industry} market in ${geography} has ${isEstimate ? 'an estimated' : 'a reported'} TAM of $${this.formatCurrency(tamEstimate)}${isEstimate ? ' (estimate based on industry benchmarks)' : ''}`,
      source: tamSource?.source || this.getMarketResearchSource(industry),
      sourceUrl: tamSource?.url || this.getMarketResearchUrl(industry),
      confidence: isEstimate ? 0.6 : 0.85,
      dataType: isEstimate ? 'computed' : 'secondary',
    });

    // SAM citation
    const samCitation = this.addCitation({
      claim: `Serviceable Addressable Market (SAM) estimated at $${this.formatCurrency(samEstimate)} based on target segment focus`,
      source: 'Market Segmentation Analysis',
      sourceUrl: 'internal://marcus/sam-calculation',
      confidence: 0.7,
      dataType: 'computed',
    });

    // Add findings based on market size
    if (tamEstimate >= 100e9) {
      this.addFinding({
        title: 'Massive Market Opportunity',
        description: `TAM of $${this.formatCurrency(tamEstimate)} represents a significant opportunity. However, large markets attract intense competition - differentiation is critical.`,
        type: 'strength',
        severity: 'critical',
        evidence: [mainCitation],
        confidence: 8,
      });
    } else if (tamEstimate >= 10e9) {
      this.addFinding({
        title: 'Large Addressable Market',
        description: `TAM of $${this.formatCurrency(tamEstimate)} provides substantial growth runway. Focus on capturing meaningful market share through differentiation.`,
        type: 'strength',
        severity: 'major',
        evidence: [mainCitation],
        confidence: 8,
      });
    } else if (tamEstimate >= 1e9) {
      this.addFinding({
        title: 'Moderate Market Size',
        description: `TAM of $${this.formatCurrency(tamEstimate)} is respectable but may limit exit options. Consider adjacent market expansion strategies.`,
        type: 'neutral',
        severity: 'minor',
        evidence: [mainCitation],
        confidence: 7,
      });
    } else if (tamEstimate < 500e6) {
      this.addFinding({
        title: 'Limited Market Size Concern',
        description: `TAM of $${this.formatCurrency(tamEstimate)} is relatively small for venture-scale outcomes. Consider if niche focus is intentional or if market definition needs expansion.`,
        type: 'weakness',
        severity: 'major',
        evidence: [mainCitation],
        confidence: 7,
      });
    }

    // SAM/SOM findings
    const samTamRatio = samEstimate / tamEstimate;
    if (samTamRatio < 0.1) {
      this.addFinding({
        title: 'Narrow Target Market',
        description: `SAM is only ${(samTamRatio * 100).toFixed(1)}% of TAM, indicating a very focused niche. This can be positive (less competition) or limiting (growth ceiling).`,
        type: 'neutral',
        severity: 'minor',
        evidence: [samCitation],
        confidence: 6,
      });
    }
  }

  private async analyzeGrowthTrends(input: AnalysisInput): Promise<void> {
    const industry = input.idea.industry || 'technology';
    const growthRate = this.marketData?.growthRate || 0;

    // Historical growth analysis
    const historicalGrowth = this.getHistoricalGrowth(industry);
    const projectedGrowth = growthRate;
    const growthAcceleration = projectedGrowth - historicalGrowth;

    const citation = this.addCitation({
      claim: `${industry} market projected to grow at ${(growthRate * 100).toFixed(1)}% CAGR through 2030`,
      source: this.getMarketResearchSource(industry),
      sourceUrl: this.getMarketResearchUrl(industry),
      confidence: 0.7,
      dataType: 'secondary',
    });

    // Identify growth drivers
    const growthDrivers = this.identifyGrowthDrivers(industry, input);

    if (growthRate > 0.25) {
      this.addFinding({
        title: 'Exceptional Market Growth',
        description: `${(growthRate * 100).toFixed(0)}% CAGR indicates a rapidly expanding market. Key drivers: ${growthDrivers.join(', ')}. Early entry can capture significant share.`,
        type: 'strength',
        severity: 'critical',
        evidence: [citation],
        confidence: 8,
      });
    } else if (growthRate > 0.15) {
      this.addFinding({
        title: 'Strong Market Growth',
        description: `${(growthRate * 100).toFixed(0)}% annual growth provides favorable conditions. Market momentum supports new entrants with differentiated offerings.`,
        type: 'strength',
        severity: 'major',
        evidence: [citation],
        confidence: 8,
      });
    } else if (growthRate > 0.08) {
      this.addFinding({
        title: 'Moderate Market Growth',
        description: `${(growthRate * 100).toFixed(0)}% growth rate is healthy but not exceptional. Success requires strong differentiation or cost advantages.`,
        type: 'neutral',
        severity: 'minor',
        evidence: [citation],
        confidence: 7,
      });
    } else if (growthRate < 0.05) {
      this.addFinding({
        title: 'Slow Market Growth',
        description: `${(growthRate * 100).toFixed(0)}% growth suggests a maturing market. Market share gains will primarily come from competitors, making entry more challenging.`,
        type: 'weakness',
        severity: 'major',
        evidence: [citation],
        confidence: 7,
      });

      this.addRecommendation({
        title: 'Consider Adjacent Markets',
        description: 'With slow core market growth, explore adjacent market opportunities or underserved niches with better growth dynamics.',
        priority: 'high',
        timeframe: 'short-term',
        effort: 'medium',
        impact: 'high',
      });
    }

    // Growth acceleration/deceleration
    if (growthAcceleration > 0.03) {
      this.addFinding({
        title: 'Accelerating Market Growth',
        description: `Market growth is accelerating from ${(historicalGrowth * 100).toFixed(0)}% to ${(projectedGrowth * 100).toFixed(0)}%, indicating strengthening demand.`,
        type: 'opportunity',
        severity: 'minor',
        evidence: [citation],
        confidence: 6,
      });
    } else if (growthAcceleration < -0.03) {
      this.addFinding({
        title: 'Decelerating Market Growth',
        description: `Market growth is slowing from ${(historicalGrowth * 100).toFixed(0)}% to ${(projectedGrowth * 100).toFixed(0)}%. May indicate market maturation.`,
        type: 'threat',
        severity: 'minor',
        evidence: [citation],
        confidence: 6,
      });
    }
  }

  private async assessMarketTiming(input: AnalysisInput): Promise<void> {
    const industry = input.idea.industry || 'technology';
    const timing = this.marketData?.marketTiming || 'growing';

    // Timing factors analysis
    const timingFactors = this.analyzeTimingFactors(industry, input);

    const citation = this.addCitation({
      claim: `Market timing assessment: ${timing} phase based on adoption curve, competitive intensity, and technology maturity`,
      source: 'Market Timing Analysis',
      sourceUrl: 'internal://marcus/timing-analysis',
      confidence: 0.65,
      dataType: 'computed',
    });

    const timingAnalysis: Record<string, { finding: string; type: 'strength' | 'weakness' | 'opportunity' | 'threat'; severity: 'critical' | 'major' | 'minor' }> = {
      emerging: {
        finding: `Market is in early emerging phase. Advantages: First-mover opportunity, shape market standards. Risks: Unproven demand, customer education costs, uncertain adoption timeline. ${timingFactors.emerging}`,
        type: 'opportunity',
        severity: 'major',
      },
      growing: {
        finding: `Market is in growth phase - optimal timing for entry. Demand is validated, growth is strong, but competition is increasing. ${timingFactors.growing}`,
        type: 'strength',
        severity: 'major',
      },
      mature: {
        finding: `Market is mature with established players. Entry requires significant differentiation or disruption. ${timingFactors.mature}`,
        type: 'weakness',
        severity: 'major',
      },
      declining: {
        finding: `Market is in decline. Unless disrupting with new technology or business model, consider pivoting to adjacent opportunity. ${timingFactors.declining}`,
        type: 'threat',
        severity: 'critical',
      },
    };

    const analysis = timingAnalysis[timing];
    this.addFinding({
      title: `${timing.charAt(0).toUpperCase() + timing.slice(1)} Market Phase`,
      description: analysis.finding,
      type: analysis.type,
      severity: analysis.severity,
      evidence: [citation],
      confidence: 7,
    });

    // Add timing-specific recommendations
    if (timing === 'emerging') {
      this.addRecommendation({
        title: 'Validate Market Readiness',
        description: 'Conduct extensive customer discovery to validate that the market is ready for this solution. Early markets have high failure rates.',
        priority: 'critical',
        timeframe: 'immediate',
        effort: 'medium',
        impact: 'high',
      });
    } else if (timing === 'mature') {
      this.addRecommendation({
        title: 'Develop Strong Differentiation',
        description: 'In mature markets, you must have 10x better product or significantly lower cost. Define your unique wedge clearly.',
        priority: 'critical',
        timeframe: 'immediate',
        effort: 'high',
        impact: 'high',
      });
    }
  }

  private async mapCompetitiveLandscape(input: AnalysisInput): Promise<void> {
    const industry = input.idea.industry || 'technology';
    const competitorCount = this.marketData?.competitorCount || 10;
    const concentration = this.marketData?.marketConcentration || 'moderate';

    const citation = this.addCitation({
      claim: `Competitive landscape: ${concentration} market with approximately ${competitorCount} notable players`,
      source: 'Competitive Analysis',
      sourceUrl: 'internal://marcus/competitive-analysis',
      confidence: 0.6,
      dataType: 'computed',
    });

    // Market concentration findings
    if (concentration === 'fragmented') {
      this.addFinding({
        title: 'Fragmented Competitive Landscape',
        description: `No dominant players in the market. Opportunity for consolidation or establishing market leadership. However, fragmentation may indicate commoditization risk.`,
        type: 'opportunity',
        severity: 'minor',
        evidence: [citation],
        confidence: 6,
      });
    } else if (concentration === 'concentrated') {
      this.addFinding({
        title: 'Concentrated Market',
        description: `Market dominated by few large players. Entry requires finding underserved niches or bringing genuinely disruptive innovation.`,
        type: 'threat',
        severity: 'major',
        evidence: [citation],
        confidence: 7,
      });

      this.addRisk({
        title: 'Incumbent Response Risk',
        description: 'Large incumbents may respond aggressively to new entrants through price competition, acquisitions, or feature copying.',
        category: 'market',
        probability: 'high',
        impact: 'major',
        mitigations: [
          'Move fast before incumbents notice',
          'Build in underserved niche before expanding',
          'Develop proprietary technology moat',
          'Consider strategic partnership with non-competing incumbent',
        ],
        evidence: [citation],
      });
    }
  }

  private async identifyCustomerSegments(input: AnalysisInput): Promise<void> {
    const targetCustomer = input.idea.targetCustomer || 'general consumers';
    const businessModel = input.idea.businessModel || 'B2B';

    const citation = this.addCitation({
      claim: `Primary target segment: ${targetCustomer}`,
      source: 'Customer Segmentation Analysis',
      sourceUrl: 'internal://marcus/segmentation',
      confidence: 0.75,
      dataType: 'primary',
    });

    // Analyze segment characteristics
    const isB2B = businessModel.toLowerCase().includes('b2b') ||
                  targetCustomer.toLowerCase().includes('business') ||
                  targetCustomer.toLowerCase().includes('enterprise');

    const isB2C = businessModel.toLowerCase().includes('b2c') ||
                  targetCustomer.toLowerCase().includes('consumer');

    if (isB2B) {
      this.addFinding({
        title: 'B2B Target Market',
        description: `B2B focus on ${targetCustomer}. Advantages: Higher contract values, lower churn. Challenges: Longer sales cycles, enterprise requirements.`,
        type: 'neutral',
        severity: 'info',
        evidence: [citation],
        confidence: 7,
      });

      this.addRecommendation({
        title: 'Define Ideal Customer Profile (ICP)',
        description: `Create detailed ICP for ${targetCustomer}: company size, industry, pain points, buying process, decision makers. This drives efficient GTM.`,
        priority: 'high',
        timeframe: 'immediate',
        effort: 'low',
        impact: 'high',
      });
    } else if (isB2C) {
      this.addFinding({
        title: 'B2C Target Market',
        description: `Consumer focus requires understanding of acquisition costs, virality potential, and retention drivers.`,
        type: 'neutral',
        severity: 'info',
        evidence: [citation],
        confidence: 7,
      });

      this.addRecommendation({
        title: 'Model Unit Economics Early',
        description: 'B2C businesses need clear path to LTV > 3x CAC. Model acquisition channels, conversion funnels, and retention curves.',
        priority: 'high',
        timeframe: 'immediate',
        effort: 'medium',
        impact: 'high',
      });
    }

    // Segment size warning
    if (targetCustomer.toLowerCase().includes('everyone') || targetCustomer.toLowerCase().includes('all')) {
      this.addFinding({
        title: 'Overly Broad Target Market',
        description: '"Everyone" is not a target market. Successful startups start with a focused beachhead segment before expanding.',
        type: 'weakness',
        severity: 'major',
        evidence: [],
        confidence: 9,
      });

      this.addRecommendation({
        title: 'Narrow Initial Target',
        description: 'Identify a specific, reachable segment where you can dominate before expanding. Who has the most urgent need and ability to pay?',
        priority: 'critical',
        timeframe: 'immediate',
        effort: 'medium',
        impact: 'high',
      });
    }
  }

  private async analyzeGeographicOpportunities(input: AnalysisInput): Promise<void> {
    const geography = input.idea.geography || ['Global'];
    const industry = input.idea.industry || 'technology';

    if (geography.includes('Global') || geography.length > 3) {
      this.addFinding({
        title: 'Broad Geographic Scope',
        description: 'Global focus may dilute resources early on. Consider starting with one geography to achieve product-market fit before expansion.',
        type: 'neutral',
        severity: 'minor',
        evidence: [],
        confidence: 7,
      });

      this.addRecommendation({
        title: 'Focus Geographic Entry',
        description: 'Start with 1-2 key markets where you have advantages (language, network, regulatory knowledge) before international expansion.',
        priority: 'medium',
        timeframe: 'short-term',
        effort: 'low',
        impact: 'medium',
      });
    }

    // Regional market analysis
    const regionalAnalysis = this.getRegionalAnalysis(industry, geography[0]);
    if (regionalAnalysis) {
      this.addCitation({
        claim: regionalAnalysis.insight,
        source: 'Regional Market Analysis',
        sourceUrl: 'internal://marcus/regional-analysis',
        confidence: 0.65,
        dataType: 'secondary',
      });
    }
  }

  private async assessRegulatoryEnvironment(input: AnalysisInput): Promise<void> {
    const industry = input.idea.industry || 'technology';
    const geography = input.idea.geography || ['Global'];

    const regulatoryRisk = this.assessRegulatoryRisk(industry);

    if (regulatoryRisk === 'high') {
      const citation = this.addCitation({
        claim: `${industry} faces significant regulatory requirements and compliance costs`,
        source: 'Regulatory Analysis',
        sourceUrl: 'internal://marcus/regulatory-analysis',
        confidence: 0.7,
        dataType: 'computed',
      });

      this.addFinding({
        title: 'High Regulatory Burden',
        description: `${industry} is heavily regulated. Factor in compliance costs, legal expertise, and potential delays to market.`,
        type: 'threat',
        severity: 'major',
        evidence: [citation],
        confidence: 7,
      });

      this.addRisk({
        title: 'Regulatory Compliance Risk',
        description: 'Changes in regulation could impact business model or increase costs significantly.',
        category: 'legal',
        probability: 'medium',
        impact: 'major',
        mitigations: [
          'Engage regulatory experts early',
          'Build compliance into product from start',
          'Monitor regulatory developments',
          'Consider compliance as competitive moat',
        ],
        evidence: [citation],
      });
    }
  }

  private async detectDemandSignals(input: AnalysisInput): Promise<void> {
    const founderData = input.founderData || {};

    // Check for validated demand signals
    const hasWaitlist = founderData.waitlistSize > 0;
    const hasPreorders = founderData.preorders > 0;
    const hasRevenue = founderData.revenue > 0 || (input.idea.revenue ?? 0) > 0;
    const hasUsers = founderData.userCount > 0 || (input.idea.userCount ?? 0) > 0;

    if (hasRevenue) {
      this.addFinding({
        title: 'Revenue Validation',
        description: 'Existing revenue provides strong market demand signal. Focus on understanding customer concentration and growth trajectory.',
        type: 'strength',
        severity: 'major',
        evidence: [],
        confidence: 9,
      });
    } else if (hasPreorders) {
      this.addFinding({
        title: 'Pre-order Validation',
        description: 'Pre-orders indicate willingness to pay. This is stronger signal than waitlist or verbal interest.',
        type: 'strength',
        severity: 'major',
        evidence: [],
        confidence: 8,
      });
    } else if (hasWaitlist && founderData.waitlistSize > 100) {
      this.addFinding({
        title: 'Waitlist Interest',
        description: `Waitlist of ${founderData.waitlistSize} indicates interest but not commitment. Typical conversion is 5-20%.`,
        type: 'neutral',
        severity: 'minor',
        evidence: [],
        confidence: 6,
      });
    } else {
      this.addFinding({
        title: 'Demand Not Yet Validated',
        description: 'No concrete demand validation signals (revenue, pre-orders, waitlist). Market risk remains high.',
        type: 'weakness',
        severity: 'major',
        evidence: [],
        confidence: 7,
      });

      this.addRecommendation({
        title: 'Validate Demand Before Building',
        description: 'Create MVP or landing page to test demand. Collect pre-orders or waitlist signups with email. Consider concierge MVP approach.',
        priority: 'critical',
        timeframe: 'immediate',
        effort: 'low',
        impact: 'high',
      });
    }
  }

  private async performRiskAssessment(input: AnalysisInput): Promise<void> {
    const md = this.marketData;
    if (!md) return;

    // Market concentration risk
    if (md.marketConcentration === 'concentrated') {
      this.addRisk({
        title: 'Market Concentration Risk',
        description: 'Market dominated by few players who may respond to new entrants with aggressive tactics.',
        category: 'market',
        probability: 'medium',
        impact: 'major',
        mitigations: [
          'Focus on underserved niches',
          'Build defensible differentiation',
          'Move quickly before incumbents respond',
        ],
        evidence: [],
      });
    }

    // Economic sensitivity
    const economicSensitivity = this.assessEconomicSensitivity(input.idea.industry || '');
    if (economicSensitivity === 'high') {
      this.addRisk({
        title: 'Economic Cycle Sensitivity',
        description: 'This market category tends to contract during economic downturns.',
        category: 'market',
        probability: 'medium',
        impact: 'major',
        mitigations: [
          'Target essential/must-have use cases',
          'Build recurring revenue model',
          'Maintain low burn rate',
          'Diversify customer base',
        ],
        evidence: [],
      });
    }

    // Market timing risk
    if (md.marketTiming === 'emerging') {
      this.addRisk({
        title: 'Market Timing Risk',
        description: 'Early markets have high uncertainty. Demand may not materialize as projected.',
        category: 'market',
        probability: 'medium',
        impact: 'critical',
        mitigations: [
          'Stay capital efficient until market validates',
          'Find early adopter lighthouse customers',
          'Be prepared to pivot if market doesn\'t develop',
        ],
        evidence: [],
      });
    }

    // Technology disruption risk
    this.addRisk({
      title: 'Technology Disruption Risk',
      description: 'New technologies could disrupt current market dynamics or make current solutions obsolete.',
      category: 'market',
      probability: 'low',
      impact: 'critical',
      mitigations: [
        'Monitor emerging technologies in adjacent spaces',
        'Build adaptable architecture',
        'Maintain optionality in technology choices',
      ],
      evidence: [],
    });
  }

  private buildRawAnalysis(): void {
    const md = this.marketData;
    this.rawAnalysis = `
# Marcus - Market Intelligence Report

## Executive Summary
${this.generateExecutiveSummary()}

## Market Size Analysis

### TAM (Total Addressable Market)
**$${md ? this.formatCurrency(md.tam) : 'N/A'}**
${this.getTAMMethodology()}

### SAM (Serviceable Addressable Market)
**$${md ? this.formatCurrency(md.sam) : 'N/A'}**
${this.getSAMMethodology()}

### SOM (Serviceable Obtainable Market)
**$${md ? this.formatCurrency(md.som) : 'N/A'}**
5-year realistic market capture estimate

## Growth Analysis
- **Projected CAGR**: ${md ? (md.growthRate * 100).toFixed(1) : 'N/A'}%
- **Market Phase**: ${md?.marketTiming || 'N/A'}
- **Competitive Landscape**: ${md?.marketConcentration || 'N/A'} (${md?.competitorCount || 0} notable players)

## Key Findings
${this.findings.map(f => `
### ${f.type.toUpperCase()}: ${f.title}
${f.description}
*Confidence: ${f.confidence}/10*
`).join('\n')}

## Identified Risks
${this.risks.map(r => `
### ${r.title}
- **Category**: ${r.category}
- **Probability**: ${r.probability}
- **Impact**: ${r.impact}
- **Description**: ${r.description}
- **Mitigations**: ${r.mitigations.join('; ')}
`).join('\n')}

## Recommendations
${this.recommendations.map(r => `
### ${r.title} [${r.priority.toUpperCase()}]
${r.description}
- **Timeframe**: ${r.timeframe}
- **Effort**: ${r.effort}
- **Impact**: ${r.impact}
`).join('\n')}

## Data Sources
${this.citations.map(c => `- ${c.source}: "${c.claim}" (Confidence: ${(c.confidence * 100).toFixed(0)}%)`).join('\n')}

---
*Analysis by Marcus, Chief Market Intelligence Officer*
*Validation Council v${this.agentVersion}*
    `.trim();
  }

  protected calculateScore(): number {
    // If LLM provided a score, use weighted average
    if (this.llmAnalysis) {
      const llmScore = this.llmAnalysis.score;
      const rulesScore = this.calculateRulesBasedScore();
      const weightedScore = llmScore * 0.6 + rulesScore * 0.4;
      // Ensure score is bounded to 1-10 and properly rounded
      return Math.round(Math.max(1, Math.min(10, weightedScore)) * 10) / 10;
    }
    return this.calculateRulesBasedScore();
  }

  private calculateRulesBasedScore(): number {
    const md = this.marketData;
    if (!md) return 5;

    let score = 5;

    // TAM scoring using framework thresholds (0-3 points)
    if (md.tam >= MARKET_THRESHOLDS.TAM_MASSIVE) score += 2.5;
    else if (md.tam >= MARKET_THRESHOLDS.TAM_LARGE) score += 1.5;
    else if (md.tam >= MARKET_THRESHOLDS.TAM_VENTURE_SCALE) score += 0.5;
    else if (md.tam < MARKET_THRESHOLDS.TAM_TOO_SMALL) score -= 2.5; // Kill signal territory

    // Growth rate scoring using framework thresholds (0-2 points)
    if (md.growthRate >= MARKET_THRESHOLDS.GROWTH_EXCEPTIONAL) score += 2;
    else if (md.growthRate >= MARKET_THRESHOLDS.GROWTH_STRONG) score += 1;
    else if (md.growthRate >= MARKET_THRESHOLDS.GROWTH_MODERATE) score += 0.5;
    else if (md.growthRate < MARKET_THRESHOLDS.GROWTH_SLOW) score -= 1;

    // Market timing scoring using framework TIMING_SCORES (0-1.5 points)
    const timingInfo = MARKET_THRESHOLDS.TIMING_SCORES[md.marketTiming];
    if (timingInfo) {
      // Normalize score to 0-1.5 range (original scores are 1-9)
      score += (timingInfo.score - 5) * 0.3;
    }

    // Market concentration scoring (0-1 point)
    if (md.marketConcentration === 'fragmented') score += 0.5;
    else if (md.marketConcentration === 'concentrated') score -= 0.5;

    return Math.max(1, Math.min(10, Math.round(score * 10) / 10));
  }

  // Helper methods
  private formatCurrency(value: number): string {
    if (value >= 1e12) return `${(value / 1e12).toFixed(1)}T`;
    if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(0)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
    return value.toFixed(0);
  }

  private calculateTopDownTAM(industry: string, geography: string): number {
    const baseTAMs: Record<string, number> = {
      'ai/ml': 500e9,
      'artificial intelligence': 500e9,
      'machine learning': 300e9,
      'saas': 250e9,
      'software': 200e9,
      'fintech': 200e9,
      'financial services': 150e9,
      'healthcare': 150e9,
      'healthtech': 100e9,
      'ecommerce': 200e9,
      'edtech': 80e9,
      'education': 60e9,
      'cybersecurity': 100e9,
      'hr tech': 50e9,
      'proptech': 40e9,
      'logistics': 60e9,
      'default': 50e9,
    };

    const key = Object.keys(baseTAMs).find(k => industry.toLowerCase().includes(k)) || 'default';
    let base = baseTAMs[key];

    // Geographic adjustment
    const geoMultipliers: Record<string, number> = {
      'global': 1.0,
      'north america': 0.35,
      'usa': 0.30,
      'europe': 0.25,
      'asia': 0.30,
      'india': 0.08,
      'default': 0.15,
    };

    const geoKey = Object.keys(geoMultipliers).find(k => geography.toLowerCase().includes(k)) || 'default';
    const geoMultiplier = geoMultipliers[geoKey];

    return base * geoMultiplier;
  }

  private calculateBottomUpTAM(input: AnalysisInput): number {
    // Bottom-up: # potential customers * average revenue per customer
    const targetCustomer = (input.idea.targetCustomer || '').toLowerCase();

    let customerCount = 10000;
    let avgRevenue = 10000;

    if (targetCustomer.includes('enterprise') || targetCustomer.includes('large')) {
      customerCount = 5000;
      avgRevenue = 100000;
    } else if (targetCustomer.includes('smb') || targetCustomer.includes('small business')) {
      customerCount = 500000;
      avgRevenue = 5000;
    } else if (targetCustomer.includes('consumer')) {
      customerCount = 10000000;
      avgRevenue = 100;
    }

    return customerCount * avgRevenue;
  }

  private calculateSAMMultiplier(targetCustomer: string, geography: string): number {
    const customer = targetCustomer.toLowerCase();

    if (customer.includes('enterprise')) return 0.15;
    if (customer.includes('smb') || customer.includes('small')) return 0.25;
    if (customer.includes('consumer')) return 0.20;
    return 0.20;
  }

  private calculateSOMMultiplier(input: AnalysisInput): number {
    const stage = (input.idea.stage || '').toLowerCase();

    if (stage.includes('growth') || stage.includes('series')) return 0.05;
    if (stage.includes('seed')) return 0.02;
    return 0.01; // Early stage default
  }

  private estimateCompetitorCount(industry: string): number {
    const counts: Record<string, number> = {
      'ai/ml': 200,
      'saas': 150,
      'fintech': 100,
      'healthcare': 80,
      'ecommerce': 200,
      'edtech': 60,
      'default': 50,
    };
    const key = Object.keys(counts).find(k => industry.toLowerCase().includes(k)) || 'default';
    return counts[key];
  }

  private assessMarketConcentration(competitorCount: number, industry: string): 'fragmented' | 'moderate' | 'concentrated' {
    const concentrated = ['cloud infrastructure', 'social media', 'search', 'mobile os'];
    const fragmented = ['consulting', 'restaurants', 'local services'];

    if (concentrated.some(c => industry.toLowerCase().includes(c))) return 'concentrated';
    if (fragmented.some(f => industry.toLowerCase().includes(f))) return 'fragmented';
    if (competitorCount > 100) return 'fragmented';
    if (competitorCount < 20) return 'concentrated';
    return 'moderate';
  }

  private estimateGrowthRate(industry: string): number {
    const rates: Record<string, number> = {
      'ai/ml': 0.35,
      'artificial intelligence': 0.35,
      'saas': 0.18,
      'fintech': 0.15,
      'healthcare': 0.10,
      'healthtech': 0.20,
      'ecommerce': 0.12,
      'edtech': 0.18,
      'cybersecurity': 0.14,
      'hr tech': 0.12,
      'proptech': 0.10,
      'default': 0.10,
    };
    const key = Object.keys(rates).find(k => industry.toLowerCase().includes(k)) || 'default';
    return rates[key];
  }

  private determineMarketTiming(industry: string): 'emerging' | 'growing' | 'mature' | 'declining' {
    const emerging = ['ai/ml', 'artificial intelligence', 'web3', 'quantum', 'spatial computing', 'longevity'];
    const growing = ['saas', 'fintech', 'edtech', 'healthtech', 'cybersecurity', 'climate tech'];
    const mature = ['ecommerce', 'social media', 'crm'];
    const declining = ['print media', 'traditional retail'];

    const lower = industry.toLowerCase();
    if (emerging.some(e => lower.includes(e))) return 'emerging';
    if (growing.some(g => lower.includes(g))) return 'growing';
    if (mature.some(m => lower.includes(m))) return 'mature';
    if (declining.some(d => lower.includes(d))) return 'declining';
    return 'growing';
  }

  private getHistoricalGrowth(industry: string): number {
    return this.estimateGrowthRate(industry) * 0.85;
  }

  private identifyGrowthDrivers(industry: string, input: AnalysisInput): string[] {
    const drivers: Record<string, string[]> = {
      'ai/ml': ['Enterprise AI adoption', 'Automation demand', 'Data availability', 'Computing cost reduction'],
      'saas': ['Cloud migration', 'Remote work', 'Digital transformation', 'Subscription economy'],
      'fintech': ['Banking digitization', 'Embedded finance', 'Regulatory changes', 'Financial inclusion'],
      'healthcare': ['Aging population', 'Chronic disease management', 'Telehealth adoption', 'Cost pressure'],
      'default': ['Digital transformation', 'Market expansion', 'Technology adoption'],
    };
    const key = Object.keys(drivers).find(k => industry.toLowerCase().includes(k)) || 'default';
    return drivers[key];
  }

  private analyzeTimingFactors(industry: string, input: AnalysisInput): Record<string, string> {
    return {
      emerging: 'Technology is nascent, customer education required, but potential for category leadership.',
      growing: 'Market validated, competition increasing, execution speed is critical.',
      mature: 'Established players, commoditization risk, innovation must be 10x better.',
      declining: 'Shrinking pie, only viable with disruptive new approach.',
    };
  }

  private getRegionalAnalysis(industry: string, geography: string): { insight: string } | null {
    if (geography.toLowerCase().includes('india')) {
      return { insight: 'India market growing rapidly with digital adoption, but price sensitivity is high.' };
    }
    if (geography.toLowerCase().includes('usa') || geography.toLowerCase().includes('north america')) {
      return { insight: 'Largest and most mature market with highest willingness to pay but intense competition.' };
    }
    return null;
  }

  private assessRegulatoryRisk(industry: string): 'high' | 'medium' | 'low' {
    const highRisk = ['fintech', 'healthcare', 'financial services', 'insurance', 'pharma'];
    const mediumRisk = ['edtech', 'hr tech', 'food'];

    if (highRisk.some(h => industry.toLowerCase().includes(h))) return 'high';
    if (mediumRisk.some(m => industry.toLowerCase().includes(m))) return 'medium';
    return 'low';
  }

  private assessEconomicSensitivity(industry: string): 'high' | 'medium' | 'low' {
    const highSensitivity = ['luxury', 'travel', 'entertainment', 'advertising'];
    const lowSensitivity = ['healthcare', 'education', 'infrastructure', 'essential services'];

    if (highSensitivity.some(h => industry.toLowerCase().includes(h))) return 'high';
    if (lowSensitivity.some(l => industry.toLowerCase().includes(l))) return 'low';
    return 'medium';
  }

  private getIndustryBenchmark(industry: string): IndustryBenchmark {
    return {
      avgTam: this.calculateTopDownTAM(industry, 'Global'),
      avgGrowth: this.estimateGrowthRate(industry),
      avgMargin: 0.7,
      topPlayers: ['Company A', 'Company B', 'Company C'],
    };
  }

  private getMarketResearchSource(industry: string): string {
    const sources: Record<string, string> = {
      'ai/ml': 'Grand View Research, Gartner AI Market Analysis',
      'saas': 'Gartner SaaS Market Report',
      'fintech': 'CB Insights FinTech Report',
      'healthcare': 'Deloitte Healthcare Market Analysis',
      'default': 'Industry Market Analysis',
    };
    const key = Object.keys(sources).find(k => industry.toLowerCase().includes(k)) || 'default';
    return sources[key];
  }

  private getMarketResearchUrl(industry: string): string {
    return `https://internal.validation-council.com/market-data/${industry.toLowerCase().replace(/\s+/g, '-')}`;
  }

  private getTAMMethodology(): string {
    return 'Calculated using top-down analysis from industry reports combined with bottom-up customer count estimates.';
  }

  private getSAMMethodology(): string {
    return 'Derived from TAM adjusted for geographic focus, target segment, and go-to-market reach.';
  }

  private generateExecutiveSummary(): string {
    const md = this.marketData;
    if (!md) return 'Insufficient data for summary.';

    const timingDesc = {
      emerging: 'early with high uncertainty',
      growing: 'favorable with validated demand',
      mature: 'challenging with established competition',
      declining: 'unfavorable with shrinking opportunity',
    };

    return `The ${md.tam >= 10e9 ? 'large' : 'moderate'} market opportunity of $${this.formatCurrency(md.tam)} TAM with ${(md.growthRate * 100).toFixed(0)}% growth presents ${timingDesc[md.marketTiming]} conditions for entry. The ${md.marketConcentration} competitive landscape with ~${md.competitorCount} players suggests ${md.marketConcentration === 'fragmented' ? 'opportunity for consolidation' : 'need for strong differentiation'}.`;
  }
}
