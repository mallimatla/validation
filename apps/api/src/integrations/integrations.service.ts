/**
 * Integrations Service
 * Orchestrates external data fetching for enhanced validation accuracy
 */

import { Injectable, Logger } from '@nestjs/common';
import { CrunchbaseService, CompanyData, FundingRound } from './crunchbase.service';
import { LinkedInService, CompanyProfile, FounderProfile } from './linkedin.service';
import { MarketDataService, MarketResearch, CompetitorData } from './market-data.service';
import { NewsService, NewsArticle, SentimentAnalysis } from './news.service';

export interface ExternalValidationData {
  company?: CompanyData;
  competitors: CompetitorData[];
  marketResearch?: MarketResearch;
  founders: FounderProfile[];
  linkedInCompany?: CompanyProfile;
  news: NewsArticle[];
  sentiment?: SentimentAnalysis;
  fundingHistory: FundingRound[];
  dataQuality: {
    hasCompanyData: boolean;
    hasMarketData: boolean;
    hasFounderData: boolean;
    hasNewsData: boolean;
    overallConfidence: number;
  };
}

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(
    private readonly crunchbase: CrunchbaseService,
    private readonly linkedin: LinkedInService,
    private readonly marketData: MarketDataService,
    private readonly news: NewsService,
  ) {}

  /**
   * Fetch all external data for a validation
   */
  async fetchValidationData(params: {
    companyName?: string;
    industry: string;
    geography: string[];
    founderNames?: string[];
    founderLinkedIns?: string[];
    description: string;
  }): Promise<ExternalValidationData> {
    this.logger.log(`Fetching external data for: ${params.companyName || 'unnamed company'}`);

    const startTime = Date.now();

    // Fetch data in parallel where possible
    const [
      companyData,
      marketResearch,
      competitorData,
      newsData,
    ] = await Promise.all([
      params.companyName ? this.crunchbase.getCompanyData(params.companyName) : null,
      this.marketData.getMarketResearch(params.industry, params.geography),
      this.marketData.getCompetitors(params.industry, params.description),
      this.news.searchNews(params.companyName || params.industry, params.industry),
    ]);

    // Fetch founder data (may need sequential LinkedIn calls)
    const founders: FounderProfile[] = [];
    if (params.founderLinkedIns?.length) {
      for (const linkedInUrl of params.founderLinkedIns) {
        const profile = await this.linkedin.getFounderProfile(linkedInUrl);
        if (profile) founders.push(profile);
      }
    }

    // Fetch LinkedIn company data
    const linkedInCompany = params.companyName
      ? await this.linkedin.getCompanyProfile(params.companyName)
      : undefined;

    // Get sentiment analysis if we have news
    const sentiment = newsData.length > 0
      ? await this.news.analyzeSentiment(newsData)
      : undefined;

    // Get funding history if company exists
    const fundingHistory = companyData
      ? await this.crunchbase.getFundingRounds(params.companyName!)
      : [];

    // Calculate data quality metrics
    const dataQuality = this.calculateDataQuality({
      hasCompanyData: !!companyData,
      hasMarketData: !!marketResearch,
      hasFounderData: founders.length > 0,
      hasNewsData: newsData.length > 0,
    });

    this.logger.log(`External data fetch completed in ${Date.now() - startTime}ms`);

    return {
      company: companyData || undefined,
      competitors: competitorData,
      marketResearch: marketResearch || undefined,
      founders,
      linkedInCompany,
      news: newsData,
      sentiment,
      fundingHistory,
      dataQuality,
    };
  }

  /**
   * Calculate data quality metrics
   */
  private calculateDataQuality(flags: {
    hasCompanyData: boolean;
    hasMarketData: boolean;
    hasFounderData: boolean;
    hasNewsData: boolean;
  }): ExternalValidationData['dataQuality'] {
    const weights = {
      company: 0.3,
      market: 0.3,
      founder: 0.25,
      news: 0.15,
    };

    let confidence = 0;
    if (flags.hasCompanyData) confidence += weights.company;
    if (flags.hasMarketData) confidence += weights.market;
    if (flags.hasFounderData) confidence += weights.founder;
    if (flags.hasNewsData) confidence += weights.news;

    return {
      ...flags,
      overallConfidence: Math.round(confidence * 100) / 100,
    };
  }

  /**
   * Verify a specific claim with external data
   */
  async verifyClaim(claim: {
    type: 'funding' | 'market_size' | 'competitor' | 'team' | 'news';
    assertion: string;
    companyName?: string;
    value?: number;
  }): Promise<{
    verified: boolean;
    confidence: number;
    source: string;
    sourceUrl: string;
    actualValue?: any;
  }> {
    this.logger.log(`Verifying claim: ${claim.type} - ${claim.assertion}`);

    switch (claim.type) {
      case 'funding':
        return this.verifyFundingClaim(claim);
      case 'market_size':
        return this.verifyMarketSizeClaim(claim);
      case 'competitor':
        return this.verifyCompetitorClaim(claim);
      case 'team':
        return this.verifyTeamClaim(claim);
      case 'news':
        return this.verifyNewsClaim(claim);
      default:
        return {
          verified: false,
          confidence: 0,
          source: 'unknown',
          sourceUrl: '',
        };
    }
  }

  private async verifyFundingClaim(claim: any): Promise<any> {
    if (!claim.companyName) {
      return { verified: false, confidence: 0, source: 'N/A', sourceUrl: '' };
    }

    const fundingData = await this.crunchbase.getFundingRounds(claim.companyName);
    const totalFunding = fundingData.reduce((sum, r) => sum + (r.amount || 0), 0);

    if (claim.value && totalFunding > 0) {
      const tolerance = 0.2; // 20% tolerance
      const verified = Math.abs(totalFunding - claim.value) / claim.value < tolerance;
      return {
        verified,
        confidence: 0.85,
        source: 'Crunchbase',
        sourceUrl: `https://www.crunchbase.com/organization/${claim.companyName.toLowerCase().replace(/\s+/g, '-')}`,
        actualValue: totalFunding,
      };
    }

    return {
      verified: fundingData.length > 0,
      confidence: 0.75,
      source: 'Crunchbase',
      sourceUrl: `https://www.crunchbase.com/organization/${claim.companyName.toLowerCase().replace(/\s+/g, '-')}`,
      actualValue: totalFunding,
    };
  }

  private async verifyMarketSizeClaim(claim: any): Promise<any> {
    const marketData = await this.marketData.getMarketResearch(
      claim.assertion.split(' ')[0], // Extract industry from assertion
      ['Global'],
    );

    if (marketData && claim.value) {
      const tolerance = 0.3; // 30% tolerance for market size estimates
      const verified = Math.abs(marketData.tam - claim.value) / claim.value < tolerance;
      return {
        verified,
        confidence: 0.7,
        source: marketData.source,
        sourceUrl: marketData.sourceUrl,
        actualValue: marketData.tam,
      };
    }

    return {
      verified: !!marketData,
      confidence: 0.6,
      source: marketData?.source || 'Market Analysis',
      sourceUrl: marketData?.sourceUrl || '',
      actualValue: marketData?.tam,
    };
  }

  private async verifyCompetitorClaim(claim: any): Promise<any> {
    const competitors = await this.marketData.getCompetitors(
      claim.assertion,
      claim.assertion,
    );

    const mentioned = claim.assertion.toLowerCase();
    const found = competitors.some((c) =>
      mentioned.includes(c.name.toLowerCase()),
    );

    return {
      verified: found,
      confidence: 0.7,
      source: 'Market Research',
      sourceUrl: 'internal://market-research/competitors',
      actualValue: competitors.map((c) => c.name),
    };
  }

  private async verifyTeamClaim(claim: any): Promise<any> {
    // Team claims require LinkedIn verification
    return {
      verified: false,
      confidence: 0.5,
      source: 'LinkedIn',
      sourceUrl: '',
      actualValue: 'Requires LinkedIn profile verification',
    };
  }

  private async verifyNewsClaim(claim: any): Promise<any> {
    const news = await this.news.searchNews(
      claim.companyName || claim.assertion,
      '',
    );

    const mentioned = claim.assertion.toLowerCase();
    const found = news.some(
      (n) =>
        n.title.toLowerCase().includes(mentioned) ||
        n.summary.toLowerCase().includes(mentioned),
    );

    return {
      verified: found,
      confidence: found ? 0.8 : 0.4,
      source: 'News Sources',
      sourceUrl: news[0]?.url || '',
      actualValue: news.slice(0, 3).map((n) => n.title),
    };
  }
}
