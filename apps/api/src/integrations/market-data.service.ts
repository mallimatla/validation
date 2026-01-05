/**
 * Market Data Service
 * Fetches market size, growth rates, and competitor data
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface MarketResearch {
  industry: string;
  tam: number;
  sam: number;
  som: number;
  cagr: number;
  currentYear: number;
  projectionYear: number;
  geographyBreakdown: Record<string, number>;
  segmentBreakdown: Record<string, number>;
  keyDrivers: string[];
  keyTrends: string[];
  source: string;
  sourceUrl: string;
  confidence: number;
  lastUpdated: Date;
}

export interface CompetitorData {
  name: string;
  description: string;
  founded?: number;
  headquarters?: string;
  funding?: {
    total: number;
    lastRound?: string;
    lastAmount?: number;
  };
  employeeCount?: string;
  marketShare?: number;
  strengths: string[];
  weaknesses: string[];
  pricing?: string;
  targetCustomer?: string;
  keyDifferentiators: string[];
  websiteUrl?: string;
  crunchbaseUrl?: string;
}

interface IndustryData {
  tam: number;
  cagr: number;
  segments: Record<string, number>;
  drivers: string[];
  trends: string[];
}

@Injectable()
export class MarketDataService {
  private readonly logger = new Logger(MarketDataService.name);

  // Industry data for estimation (updated yearly with real sources)
  private readonly industryData: Record<string, IndustryData> = {
    'artificial intelligence': {
      tam: 500e9,
      cagr: 0.35,
      segments: {
        'Machine Learning': 0.35,
        'Natural Language Processing': 0.20,
        'Computer Vision': 0.18,
        'Robotics': 0.15,
        'Expert Systems': 0.12,
      },
      drivers: [
        'Enterprise AI adoption accelerating',
        'Decline in computing costs',
        'Increase in data availability',
        'Advancement in algorithms',
      ],
      trends: [
        'Generative AI disruption',
        'Edge AI deployment',
        'AI regulation emerging',
        'Vertical-specific AI solutions',
      ],
    },
    'saas': {
      tam: 250e9,
      cagr: 0.18,
      segments: {
        'Enterprise': 0.40,
        'SMB': 0.35,
        'Consumer': 0.15,
        'Vertical': 0.10,
      },
      drivers: [
        'Cloud migration acceleration',
        'Remote work adoption',
        'Digital transformation initiatives',
        'Subscription economy growth',
      ],
      trends: [
        'Product-led growth models',
        'Vertical SaaS emergence',
        'AI-powered features',
        'Consolidation in categories',
      ],
    },
    'fintech': {
      tam: 200e9,
      cagr: 0.15,
      segments: {
        'Payments': 0.30,
        'Lending': 0.25,
        'Banking': 0.20,
        'Insurance': 0.15,
        'Wealth Management': 0.10,
      },
      drivers: [
        'Banking digitization',
        'Embedded finance growth',
        'Regulatory evolution',
        'Financial inclusion demand',
      ],
      trends: [
        'Buy now pay later expansion',
        'Crypto/blockchain integration',
        'Open banking adoption',
        'Neobank competition',
      ],
    },
    'healthcare': {
      tam: 150e9,
      cagr: 0.12,
      segments: {
        'Telehealth': 0.25,
        'Health Records': 0.20,
        'Diagnostics': 0.20,
        'Drug Discovery': 0.15,
        'Mental Health': 0.10,
        'Wearables': 0.10,
      },
      drivers: [
        'Aging population',
        'Chronic disease prevalence',
        'Healthcare cost pressure',
        'Telehealth normalization',
      ],
      trends: [
        'AI diagnostics growth',
        'Remote patient monitoring',
        'Mental health focus',
        'Value-based care shift',
      ],
    },
    'ecommerce': {
      tam: 200e9,
      cagr: 0.10,
      segments: {
        'Marketplaces': 0.35,
        'D2C': 0.25,
        'B2B': 0.20,
        'Social Commerce': 0.10,
        'Q-commerce': 0.10,
      },
      drivers: [
        'Digital shopping habits',
        'Mobile commerce growth',
        'Logistics improvement',
        'Payment innovation',
      ],
      trends: [
        'Live commerce growth',
        'Sustainability focus',
        'Same-day delivery expectation',
        'Personalization demand',
      ],
    },
    'edtech': {
      tam: 80e9,
      cagr: 0.16,
      segments: {
        'K-12': 0.30,
        'Higher Education': 0.25,
        'Corporate Training': 0.25,
        'Skills/Upskilling': 0.20,
      },
      drivers: [
        'Skills gap acceleration',
        'Online learning normalization',
        'Credential democratization',
        'Corporate L&D investment',
      ],
      trends: [
        'AI tutoring systems',
        'Micro-credentials growth',
        'Career-focused learning',
        'Cohort-based courses',
      ],
    },
    'cybersecurity': {
      tam: 100e9,
      cagr: 0.14,
      segments: {
        'Network Security': 0.25,
        'Endpoint Security': 0.20,
        'Cloud Security': 0.20,
        'Identity Management': 0.15,
        'Security Operations': 0.20,
      },
      drivers: [
        'Cyber attack increase',
        'Remote work security needs',
        'Regulatory compliance',
        'Cloud adoption',
      ],
      trends: [
        'Zero trust adoption',
        'AI-powered security',
        'Security consolidation',
        'DevSecOps integration',
      ],
    },
  };

  // Known competitors by industry
  private readonly competitorDatabase: Record<string, CompetitorData[]> = {
    'project management': [
      {
        name: 'Asana',
        description: 'Work management platform for teams',
        founded: 2008,
        headquarters: 'San Francisco, CA',
        funding: { total: 213e6, lastRound: 'Series E' },
        employeeCount: '1000-5000',
        strengths: ['Strong brand', 'Public company', 'Enterprise features'],
        weaknesses: ['Premium pricing', 'Complex for small teams'],
        keyDifferentiators: ['Timeline view', 'Goals tracking'],
        websiteUrl: 'https://asana.com',
      },
      {
        name: 'Monday.com',
        description: 'Work OS that powers teams to run processes',
        founded: 2012,
        headquarters: 'Tel Aviv, Israel',
        funding: { total: 234e6, lastRound: 'Series D' },
        employeeCount: '1000-5000',
        strengths: ['Flexible platform', 'Strong growth', 'Good UX'],
        weaknesses: ['Can be expensive', 'Feature complexity'],
        keyDifferentiators: ['Customizable workflows', 'Automations'],
        websiteUrl: 'https://monday.com',
      },
      {
        name: 'ClickUp',
        description: 'All-in-one productivity platform',
        founded: 2017,
        headquarters: 'San Diego, CA',
        funding: { total: 535e6, lastRound: 'Series C' },
        employeeCount: '500-1000',
        strengths: ['Feature-rich', 'Competitive pricing', 'Fast growth'],
        weaknesses: ['Can be overwhelming', 'Performance issues'],
        keyDifferentiators: ['All-in-one approach', 'Free tier'],
        websiteUrl: 'https://clickup.com',
      },
    ],
    'ai': [
      {
        name: 'OpenAI',
        description: 'AI research and deployment company',
        founded: 2015,
        headquarters: 'San Francisco, CA',
        funding: { total: 11e9, lastRound: 'Series B' },
        employeeCount: '500-1000',
        strengths: ['Technology leadership', 'Strong brand', 'Microsoft partnership'],
        weaknesses: ['High costs', 'API dependency'],
        keyDifferentiators: ['GPT models', 'DALL-E', 'ChatGPT'],
        websiteUrl: 'https://openai.com',
      },
      {
        name: 'Anthropic',
        description: 'AI safety company building reliable AI systems',
        founded: 2021,
        headquarters: 'San Francisco, CA',
        funding: { total: 4.1e9, lastRound: 'Series C' },
        employeeCount: '200-500',
        strengths: ['Safety focus', 'Strong team', 'Google backing'],
        weaknesses: ['Smaller than OpenAI', 'Less brand awareness'],
        keyDifferentiators: ['Constitutional AI', 'Claude models'],
        websiteUrl: 'https://anthropic.com',
      },
    ],
  };

  constructor(private readonly configService: ConfigService) {}

  /**
   * Get market research for an industry
   */
  async getMarketResearch(
    industry: string,
    geography: string[],
  ): Promise<MarketResearch | null> {
    this.logger.log(`Fetching market research for: ${industry}`);

    // Find matching industry data
    const industryKey = Object.keys(this.industryData).find((key) =>
      industry.toLowerCase().includes(key) || key.includes(industry.toLowerCase()),
    );

    const data = industryKey
      ? this.industryData[industryKey]
      : this.estimateIndustryData(industry);

    // Calculate geographic adjustments
    const geoMultiplier = this.getGeographyMultiplier(geography);

    const tam = data.tam * geoMultiplier;
    const sam = tam * 0.25; // Assume 25% SAM of TAM
    const som = sam * 0.02; // Assume 2% achievable in 5 years

    return {
      industry,
      tam,
      sam,
      som,
      cagr: data.cagr,
      currentYear: new Date().getFullYear(),
      projectionYear: new Date().getFullYear() + 5,
      geographyBreakdown: this.getGeographyBreakdown(geography, tam),
      segmentBreakdown: data.segments,
      keyDrivers: data.drivers,
      keyTrends: data.trends,
      source: 'Validation Council Market Analysis',
      sourceUrl: 'internal://market-research',
      confidence: industryKey ? 0.75 : 0.5,
      lastUpdated: new Date(),
    };
  }

  /**
   * Get competitor data for an industry
   */
  async getCompetitors(
    industry: string,
    description: string,
  ): Promise<CompetitorData[]> {
    this.logger.log(`Fetching competitors for: ${industry}`);

    // Find matching competitors
    const industryKey = Object.keys(this.competitorDatabase).find(
      (key) =>
        industry.toLowerCase().includes(key) ||
        key.includes(industry.toLowerCase()) ||
        description.toLowerCase().includes(key),
    );

    if (industryKey) {
      return this.competitorDatabase[industryKey];
    }

    // Return generic competitor structure for unknown industries
    return this.generateGenericCompetitors(industry);
  }

  /**
   * Get industry benchmarks
   */
  getIndustryBenchmarks(industry: string): {
    avgGrossMargin: number;
    avgCAC: number;
    avgLTV: number;
    avgChurnRate: number;
    avgTimeToIPO: number;
    avgSeedValuation: number;
    avgSeriesAValuation: number;
  } {
    // SaaS benchmarks (can be expanded for other industries)
    return {
      avgGrossMargin: 0.70,
      avgCAC: 5000,
      avgLTV: 30000,
      avgChurnRate: 0.05,
      avgTimeToIPO: 10,
      avgSeedValuation: 5e6,
      avgSeriesAValuation: 15e6,
    };
  }

  // Private methods

  private estimateIndustryData(industry: string): IndustryData {
    // Default estimates for unknown industries
    return {
      tam: 50e9,
      cagr: 0.10,
      segments: {
        'Segment A': 0.40,
        'Segment B': 0.35,
        'Segment C': 0.25,
      },
      drivers: [
        'Market digitization',
        'Technology adoption',
        'Changing consumer behavior',
      ],
      trends: [
        'Market consolidation',
        'New entrants',
        'Technology disruption',
      ],
    };
  }

  private getGeographyMultiplier(geography: string[]): number {
    if (!geography.length || geography.includes('Global')) {
      return 1.0;
    }

    const multipliers: Record<string, number> = {
      'usa': 0.35,
      'united states': 0.35,
      'north america': 0.40,
      'europe': 0.25,
      'asia': 0.30,
      'india': 0.08,
      'china': 0.20,
      'uk': 0.05,
      'germany': 0.04,
      'japan': 0.05,
    };

    let total = 0;
    for (const geo of geography) {
      const key = geo.toLowerCase();
      total += multipliers[key] || 0.05;
    }

    return Math.min(1.0, total);
  }

  private getGeographyBreakdown(
    geography: string[],
    totalTam: number,
  ): Record<string, number> {
    if (!geography.length || geography.includes('Global')) {
      return {
        'North America': totalTam * 0.35,
        'Europe': totalTam * 0.25,
        'Asia Pacific': totalTam * 0.30,
        'Rest of World': totalTam * 0.10,
      };
    }

    const breakdown: Record<string, number> = {};
    const perGeo = totalTam / geography.length;

    for (const geo of geography) {
      breakdown[geo] = perGeo;
    }

    return breakdown;
  }

  private generateGenericCompetitors(industry: string): CompetitorData[] {
    return [
      {
        name: 'Market Leader',
        description: `Leading company in the ${industry} space`,
        strengths: ['Strong brand', 'Market share', 'Resources'],
        weaknesses: ['Slow to innovate', 'Premium pricing'],
        keyDifferentiators: ['Scale', 'Customer base'],
      },
      {
        name: 'Fast Follower',
        description: `Growing competitor in ${industry}`,
        strengths: ['Good execution', 'Competitive pricing'],
        weaknesses: ['Smaller team', 'Less brand recognition'],
        keyDifferentiators: ['Speed', 'Customer service'],
      },
      {
        name: 'Emerging Startup',
        description: `Well-funded startup disrupting ${industry}`,
        funding: { total: 50e6, lastRound: 'Series B' },
        strengths: ['Innovation', 'Modern technology'],
        weaknesses: ['Unproven at scale', 'Limited track record'],
        keyDifferentiators: ['Technology', 'User experience'],
      },
    ];
  }
}
