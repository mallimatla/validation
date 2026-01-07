/**
 * Market Data Service
 * Fetches REAL market data from external sources
 *
 * Data Sources:
 * 1. Web Search (Serper, Brave, or Google Custom Search)
 * 2. News API for recent market news
 * 3. Google Trends for search interest
 * 4. Crunchbase for funding data (if available)
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface MarketSearchResult {
  title: string;
  snippet: string;
  url: string;
  source: string;
  date?: string;
}

export interface MarketNewsItem {
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
}

export interface CompetitorData {
  name: string;
  description: string;
  website: string;
  funding?: string;
  employees?: string;
  founded?: string;
}

export interface MarketResearchData {
  searchResults: MarketSearchResult[];
  newsItems: MarketNewsItem[];
  competitors: CompetitorData[];
  trendData: { keyword: string; interest: number; trend: 'rising' | 'stable' | 'declining' }[];
  citations: { claim: string; source: string; url: string; confidence: number }[];
}

@Injectable()
export class MarketDataService implements OnModuleInit {
  private readonly logger = new Logger(MarketDataService.name);

  // API Keys
  private serperApiKey: string | null = null;
  private newsApiKey: string | null = null;
  private braveApiKey: string | null = null;
  private crunchbaseApiKey: string | null = null;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.serperApiKey = this.configService.get<string>('SERPER_API_KEY') || null;
    this.newsApiKey = this.configService.get<string>('NEWS_API_KEY') || null;
    this.braveApiKey = this.configService.get<string>('BRAVE_API_KEY') || null;
    this.crunchbaseApiKey = this.configService.get<string>('CRUNCHBASE_API_KEY') || null;

    if (this.serperApiKey) this.logger.log('Serper API configured for web search');
    if (this.newsApiKey) this.logger.log('News API configured for market news');
    if (this.braveApiKey) this.logger.log('Brave Search API configured');
    if (this.crunchbaseApiKey) this.logger.log('Crunchbase API configured');

    if (!this.serperApiKey && !this.braveApiKey) {
      this.logger.warn('No search API configured - market research will use fallback data');
    }
  }

  /**
   * Check if real market data APIs are available
   */
  isAvailable(): boolean {
    return !!(this.serperApiKey || this.braveApiKey);
  }

  /**
   * Fetch comprehensive market research data
   */
  async fetchMarketResearch(
    industry: string,
    description: string,
    targetCustomer: string,
    geography: string[] = ['Global'],
  ): Promise<MarketResearchData> {
    this.logger.log(`Fetching market research for industry: ${industry}`);

    const results: MarketResearchData = {
      searchResults: [],
      newsItems: [],
      competitors: [],
      trendData: [],
      citations: [],
    };

    try {
      // Run all fetches in parallel for speed
      const [searchResults, newsItems, competitors] = await Promise.all([
        this.searchMarketData(industry, description, geography),
        this.fetchMarketNews(industry),
        this.searchCompetitors(description, industry),
      ]);

      results.searchResults = searchResults;
      results.newsItems = newsItems;
      results.competitors = competitors;

      // Build citations from search results
      results.citations = this.buildCitations(searchResults, newsItems);

      this.logger.log(`Market research complete: ${searchResults.length} search results, ${newsItems.length} news items, ${competitors.length} competitors`);
    } catch (error) {
      this.logger.error(`Market research failed: ${(error as Error).message}`);
    }

    return results;
  }

  /**
   * Search for market size and industry data
   */
  async searchMarketData(
    industry: string,
    description: string,
    geography: string[],
  ): Promise<MarketSearchResult[]> {
    const queries = [
      `${industry} market size TAM 2024 2025`,
      `${industry} market growth rate CAGR forecast`,
      `${industry} industry report research`,
      `${geography[0] || 'global'} ${industry} market analysis`,
    ];

    const allResults: MarketSearchResult[] = [];

    for (const query of queries) {
      try {
        const results = await this.performWebSearch(query);
        allResults.push(...results);
      } catch (error) {
        this.logger.warn(`Search failed for query "${query}": ${(error as Error).message}`);
      }
    }

    // Deduplicate by URL
    const uniqueResults = allResults.filter(
      (result, index, self) => index === self.findIndex(r => r.url === result.url)
    );

    return uniqueResults.slice(0, 15); // Top 15 results
  }

  /**
   * Perform web search using available API
   */
  private async performWebSearch(query: string): Promise<MarketSearchResult[]> {
    if (this.serperApiKey) {
      return this.searchWithSerper(query);
    } else if (this.braveApiKey) {
      return this.searchWithBrave(query);
    } else {
      // Return empty array - the LLM will need to work without web data
      this.logger.debug(`No search API - skipping query: ${query}`);
      return [];
    }
  }

  /**
   * Search using Serper API (Google Search)
   */
  private async searchWithSerper(query: string): Promise<MarketSearchResult[]> {
    try {
      const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': this.serperApiKey!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: query,
          num: 10,
        }),
      });

      if (!response.ok) {
        throw new Error(`Serper API error: ${response.status}`);
      }

      const data = await response.json();

      return (data.organic || []).map((item: any) => ({
        title: item.title,
        snippet: item.snippet,
        url: item.link,
        source: new URL(item.link).hostname.replace('www.', ''),
        date: item.date,
      }));
    } catch (error) {
      this.logger.error(`Serper search failed: ${(error as Error).message}`);
      return [];
    }
  }

  /**
   * Search using Brave Search API
   */
  private async searchWithBrave(query: string): Promise<MarketSearchResult[]> {
    try {
      const response = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'X-Subscription-Token': this.braveApiKey!,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Brave API error: ${response.status}`);
      }

      const data = await response.json();

      return (data.web?.results || []).map((item: any) => ({
        title: item.title,
        snippet: item.description,
        url: item.url,
        source: new URL(item.url).hostname.replace('www.', ''),
        date: item.age,
      }));
    } catch (error) {
      this.logger.error(`Brave search failed: ${(error as Error).message}`);
      return [];
    }
  }

  /**
   * Fetch recent market news
   */
  async fetchMarketNews(industry: string): Promise<MarketNewsItem[]> {
    if (!this.newsApiKey) {
      return [];
    }

    try {
      const response = await fetch(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(industry + ' market')}&sortBy=publishedAt&pageSize=10&language=en`,
        {
          headers: {
            'X-Api-Key': this.newsApiKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`News API error: ${response.status}`);
      }

      const data = await response.json();

      return (data.articles || []).map((article: any) => ({
        title: article.title,
        description: article.description,
        url: article.url,
        source: article.source?.name || 'Unknown',
        publishedAt: article.publishedAt,
      }));
    } catch (error) {
      this.logger.error(`News fetch failed: ${(error as Error).message}`);
      return [];
    }
  }

  /**
   * Search for competitors
   */
  async searchCompetitors(description: string, industry: string): Promise<CompetitorData[]> {
    // Search for competitors using web search
    const query = `${industry} startups companies competitors ${description.split(' ').slice(0, 5).join(' ')}`;

    if (this.serperApiKey) {
      try {
        const response = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: {
            'X-API-KEY': this.serperApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: query,
            num: 10,
          }),
        });

        if (!response.ok) {
          return [];
        }

        const data = await response.json();

        // Extract company names from search results
        return (data.organic || []).slice(0, 5).map((item: any) => ({
          name: this.extractCompanyName(item.title),
          description: item.snippet,
          website: item.link,
        }));
      } catch (error) {
        this.logger.error(`Competitor search failed: ${(error as Error).message}`);
        return [];
      }
    }

    return [];
  }

  /**
   * Extract company name from search result title
   */
  private extractCompanyName(title: string): string {
    // Remove common suffixes and extract company name
    const cleaned = title
      .replace(/\s*[-|:].*/g, '')
      .replace(/\s*(Inc\.|Corp\.|LLC|Ltd\.?|Company|Co\.).*$/i, '')
      .trim();
    return cleaned || title.split(' ').slice(0, 3).join(' ');
  }

  /**
   * Build citations from search and news results
   */
  private buildCitations(
    searchResults: MarketSearchResult[],
    newsItems: MarketNewsItem[],
  ): { claim: string; source: string; url: string; confidence: number }[] {
    const citations: { claim: string; source: string; url: string; confidence: number }[] = [];

    // Add citations from search results with market data
    for (const result of searchResults) {
      const marketDataMatch = this.extractMarketDataFromSnippet(result.snippet);
      if (marketDataMatch) {
        citations.push({
          claim: marketDataMatch,
          source: result.source,
          url: result.url,
          confidence: this.calculateSourceConfidence(result.source),
        });
      }
    }

    // Add citations from news
    for (const news of newsItems.slice(0, 3)) {
      citations.push({
        claim: news.title,
        source: news.source,
        url: news.url,
        confidence: 0.7,
      });
    }

    return citations.slice(0, 10); // Top 10 citations
  }

  /**
   * Extract market data mentions from snippet
   */
  private extractMarketDataFromSnippet(snippet: string): string | null {
    // Look for market size mentions
    const marketSizeMatch = snippet.match(/\$[\d.]+\s*(billion|million|trillion|B|M|T)/i);
    if (marketSizeMatch) {
      // Return a sentence around the market size
      const start = Math.max(0, snippet.indexOf(marketSizeMatch[0]) - 50);
      const end = Math.min(snippet.length, snippet.indexOf(marketSizeMatch[0]) + marketSizeMatch[0].length + 50);
      return snippet.slice(start, end).trim();
    }

    // Look for growth rate mentions
    const growthMatch = snippet.match(/(\d+\.?\d*)\s*%\s*(CAGR|growth|annually|year-over-year)/i);
    if (growthMatch) {
      const start = Math.max(0, snippet.indexOf(growthMatch[0]) - 40);
      const end = Math.min(snippet.length, snippet.indexOf(growthMatch[0]) + growthMatch[0].length + 40);
      return snippet.slice(start, end).trim();
    }

    return null;
  }

  /**
   * Calculate confidence based on source reputation
   */
  private calculateSourceConfidence(source: string): number {
    const highConfidence = ['gartner', 'mckinsey', 'statista', 'idc', 'grandviewresearch', 'fortunebusinessinsights', 'marketsandmarkets', 'mordorintelligence'];
    const mediumConfidence = ['forbes', 'bloomberg', 'reuters', 'techcrunch', 'crunchbase', 'cbinsights'];

    const sourceLower = source.toLowerCase();

    if (highConfidence.some(s => sourceLower.includes(s))) return 0.9;
    if (mediumConfidence.some(s => sourceLower.includes(s))) return 0.75;
    return 0.6;
  }

  /**
   * Parse market size from text
   */
  parseMarketSize(text: string): number | null {
    const match = text.match(/\$?([\d.]+)\s*(billion|million|trillion|B|M|T)/i);
    if (!match) return null;

    const value = parseFloat(match[1]);
    const unit = match[2].toLowerCase();

    const multipliers: Record<string, number> = {
      trillion: 1e12, t: 1e12,
      billion: 1e9, b: 1e9,
      million: 1e6, m: 1e6,
    };

    return value * (multipliers[unit] || 1);
  }

  /**
   * Parse growth rate from text
   */
  parseGrowthRate(text: string): number | null {
    const match = text.match(/([\d.]+)\s*%/);
    if (!match) return null;
    return parseFloat(match[1]) / 100;
  }
}
