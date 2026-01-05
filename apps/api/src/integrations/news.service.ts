/**
 * News Service
 * Fetches and analyzes news for market intelligence
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface NewsArticle {
  title: string;
  url: string;
  source: string;
  publishedAt: Date;
  summary: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  relevanceScore: number;
  imageUrl?: string;
}

export interface SentimentAnalysis {
  overall: 'positive' | 'negative' | 'neutral' | 'mixed';
  score: number; // -1 to 1
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  keyTopics: string[];
  trendDirection: 'improving' | 'declining' | 'stable';
}

@Injectable()
export class NewsService {
  private readonly logger = new Logger(NewsService.name);
  private readonly newsApiKey: string | null;
  private readonly baseUrl = 'https://newsapi.org/v2';

  constructor(private readonly configService: ConfigService) {
    this.newsApiKey = this.configService.get('NEWS_API_KEY') || null;

    if (this.newsApiKey) {
      this.logger.log('News API configured');
    } else {
      this.logger.warn('News API not configured - using mock data');
    }
  }

  /**
   * Search for news about a company or industry
   */
  async searchNews(query: string, industry: string): Promise<NewsArticle[]> {
    this.logger.log(`Searching news for: ${query}`);

    if (this.newsApiKey) {
      return this.fetchFromApi(query);
    }

    return this.getMockNews(query, industry);
  }

  /**
   * Analyze sentiment of news articles
   */
  async analyzeSentiment(articles: NewsArticle[]): Promise<SentimentAnalysis> {
    if (articles.length === 0) {
      return {
        overall: 'neutral',
        score: 0,
        positiveCount: 0,
        negativeCount: 0,
        neutralCount: 0,
        keyTopics: [],
        trendDirection: 'stable',
      };
    }

    // Count sentiments
    const sentiments = articles.reduce(
      (acc, article) => {
        const sentiment = article.sentiment || this.analyzeSingleArticle(article.title + ' ' + article.summary);
        acc[sentiment]++;
        return acc;
      },
      { positive: 0, negative: 0, neutral: 0 } as Record<string, number>,
    );

    // Calculate overall score
    const total = articles.length;
    const score = (sentiments.positive - sentiments.negative) / total;

    // Determine overall sentiment
    let overall: 'positive' | 'negative' | 'neutral' | 'mixed';
    if (Math.abs(score) < 0.1) {
      overall = sentiments.positive > 0 && sentiments.negative > 0 ? 'mixed' : 'neutral';
    } else if (score > 0) {
      overall = 'positive';
    } else {
      overall = 'negative';
    }

    // Extract key topics
    const keyTopics = this.extractKeyTopics(articles);

    // Determine trend
    const trendDirection = this.calculateTrend(articles);

    return {
      overall,
      score: Math.round(score * 100) / 100,
      positiveCount: sentiments.positive,
      negativeCount: sentiments.negative,
      neutralCount: sentiments.neutral,
      keyTopics,
      trendDirection,
    };
  }

  /**
   * Get trending topics in an industry
   */
  async getTrendingTopics(industry: string): Promise<string[]> {
    // In production, this would use real news API
    const trendsByIndustry: Record<string, string[]> = {
      'ai': ['ChatGPT', 'GPT-4', 'AI regulation', 'Generative AI', 'AI safety'],
      'fintech': ['Digital payments', 'Neobanks', 'Crypto regulation', 'BNPL'],
      'healthcare': ['Telehealth', 'AI diagnostics', 'Mental health', 'Drug pricing'],
      'saas': ['PLG', 'AI features', 'Consolidation', 'Remote work tools'],
      'ecommerce': ['Social commerce', 'Same-day delivery', 'Sustainability'],
    };

    const key = Object.keys(trendsByIndustry).find((k) =>
      industry.toLowerCase().includes(k),
    );

    return key ? trendsByIndustry[key] : ['Market growth', 'Competition', 'Technology'];
  }

  // Private methods

  private async fetchFromApi(query: string): Promise<NewsArticle[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/everything?q=${encodeURIComponent(query)}&sortBy=relevancy&pageSize=10&language=en`,
        {
          headers: {
            'X-Api-Key': this.newsApiKey!,
          },
        },
      );

      if (!response.ok) {
        this.logger.warn(`News API error: ${response.status}`);
        return [];
      }

      const data = await response.json();

      return (data.articles || []).map((article: any) => ({
        title: article.title || '',
        url: article.url || '',
        source: article.source?.name || '',
        publishedAt: new Date(article.publishedAt),
        summary: article.description || '',
        sentiment: this.analyzeSingleArticle(
          (article.title || '') + ' ' + (article.description || ''),
        ),
        relevanceScore: 0.8,
        imageUrl: article.urlToImage,
      }));
    } catch (error) {
      this.logger.error(`News API error: ${(error as Error).message}`);
      return [];
    }
  }

  private getMockNews(query: string, industry: string): NewsArticle[] {
    const now = new Date();

    return [
      {
        title: `${industry} market sees continued growth in 2024`,
        url: 'https://example.com/news/1',
        source: 'TechCrunch',
        publishedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        summary: `The ${industry} sector continues to show strong growth with new innovations driving adoption across enterprises.`,
        sentiment: 'positive',
        relevanceScore: 0.9,
      },
      {
        title: `Major players compete for market share in ${industry}`,
        url: 'https://example.com/news/2',
        source: 'Forbes',
        publishedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        summary: `Competition intensifies as established companies and startups battle for dominance in the growing ${industry} market.`,
        sentiment: 'neutral',
        relevanceScore: 0.8,
      },
      {
        title: `Investors pour millions into ${industry} startups`,
        url: 'https://example.com/news/3',
        source: 'VentureBeat',
        publishedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        summary: `VC funding in ${industry} reaches new highs as investors bet on the next generation of companies.`,
        sentiment: 'positive',
        relevanceScore: 0.85,
      },
    ];
  }

  private analyzeSingleArticle(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = [
      'growth', 'success', 'increase', 'profit', 'gain', 'improve',
      'innovation', 'milestone', 'breakthrough', 'leader', 'expand',
      'opportunity', 'funding', 'investment', 'partnership',
    ];

    const negativeWords = [
      'decline', 'loss', 'fail', 'struggle', 'layoff', 'cut',
      'challenge', 'concern', 'risk', 'threat', 'problem',
      'shutdown', 'closure', 'bankruptcy', 'lawsuit',
    ];

    const lowerText = text.toLowerCase();

    const positiveCount = positiveWords.filter((w) => lowerText.includes(w)).length;
    const negativeCount = negativeWords.filter((w) => lowerText.includes(w)).length;

    if (positiveCount > negativeCount + 1) return 'positive';
    if (negativeCount > positiveCount + 1) return 'negative';
    return 'neutral';
  }

  private extractKeyTopics(articles: NewsArticle[]): string[] {
    const allText = articles.map((a) => a.title + ' ' + a.summary).join(' ').toLowerCase();

    const commonTopics = [
      'funding', 'growth', 'ai', 'technology', 'market', 'competition',
      'acquisition', 'ipo', 'regulation', 'innovation', 'partnership',
    ];

    return commonTopics
      .filter((topic) => allText.includes(topic))
      .slice(0, 5);
  }

  private calculateTrend(articles: NewsArticle[]): 'improving' | 'declining' | 'stable' {
    if (articles.length < 3) return 'stable';

    // Sort by date
    const sorted = [...articles].sort(
      (a, b) => a.publishedAt.getTime() - b.publishedAt.getTime(),
    );

    // Compare sentiment of recent vs older articles
    const midpoint = Math.floor(sorted.length / 2);
    const olderArticles = sorted.slice(0, midpoint);
    const newerArticles = sorted.slice(midpoint);

    const olderPositive = olderArticles.filter((a) => a.sentiment === 'positive').length;
    const newerPositive = newerArticles.filter((a) => a.sentiment === 'positive').length;

    const olderRatio = olderPositive / olderArticles.length;
    const newerRatio = newerPositive / newerArticles.length;

    if (newerRatio - olderRatio > 0.2) return 'improving';
    if (olderRatio - newerRatio > 0.2) return 'declining';
    return 'stable';
  }
}
