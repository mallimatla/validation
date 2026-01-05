/**
 * Crunchbase Service
 * Fetches company, funding, and investor data from Crunchbase API
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface CompanyData {
  name: string;
  description: string;
  foundedDate?: string;
  employeeCount?: string;
  totalFunding?: number;
  lastFundingDate?: string;
  lastFundingType?: string;
  lastFundingAmount?: number;
  headquarters?: string;
  website?: string;
  categories: string[];
  investors: string[];
  founders: string[];
  status: 'operating' | 'acquired' | 'closed' | 'ipo';
  crunchbaseUrl: string;
}

export interface FundingRound {
  type: string;
  date: string;
  amount: number | null;
  currency: string;
  investors: string[];
  leadInvestor?: string;
  preMoneyValuation?: number;
  postMoneyValuation?: number;
}

export interface InvestorData {
  name: string;
  type: string;
  investmentCount: number;
  portfolio: string[];
  headquarters?: string;
  website?: string;
}

@Injectable()
export class CrunchbaseService {
  private readonly logger = new Logger(CrunchbaseService.name);
  private readonly apiKey: string | null;
  private readonly baseUrl = 'https://api.crunchbase.com/api/v4';

  // Mock data for development/demo (when API key not available)
  private readonly mockCompanies: Map<string, CompanyData> = new Map();

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get('CRUNCHBASE_API_KEY') || null;

    if (this.apiKey) {
      this.logger.log('Crunchbase API configured');
    } else {
      this.logger.warn('Crunchbase API not configured - using mock data');
      this.initializeMockData();
    }
  }

  /**
   * Get company data from Crunchbase
   */
  async getCompanyData(companyName: string): Promise<CompanyData | null> {
    this.logger.log(`Fetching company data for: ${companyName}`);

    if (this.apiKey) {
      return this.fetchFromApi(companyName);
    }

    return this.getMockCompanyData(companyName);
  }

  /**
   * Get funding rounds for a company
   */
  async getFundingRounds(companyName: string): Promise<FundingRound[]> {
    this.logger.log(`Fetching funding rounds for: ${companyName}`);

    if (this.apiKey) {
      return this.fetchFundingFromApi(companyName);
    }

    return this.getMockFundingRounds(companyName);
  }

  /**
   * Get investor data
   */
  async getInvestorData(investorName: string): Promise<InvestorData | null> {
    this.logger.log(`Fetching investor data for: ${investorName}`);

    if (this.apiKey) {
      return this.fetchInvestorFromApi(investorName);
    }

    return this.getMockInvestorData(investorName);
  }

  /**
   * Search for similar companies
   */
  async searchSimilarCompanies(
    industry: string,
    stage: string,
    location?: string,
  ): Promise<CompanyData[]> {
    this.logger.log(`Searching similar companies in ${industry}`);

    if (this.apiKey) {
      return this.searchFromApi(industry, stage, location);
    }

    return this.getMockSimilarCompanies(industry);
  }

  // Private methods for API calls

  private async fetchFromApi(companyName: string): Promise<CompanyData | null> {
    try {
      const searchUrl = `${this.baseUrl}/searches/organizations`;
      const response = await fetch(searchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-cb-user-key': this.apiKey!,
        },
        body: JSON.stringify({
          field_ids: [
            'identifier',
            'short_description',
            'founded_on',
            'num_employees_enum',
            'funding_total',
            'last_funding_type',
            'last_funding_at',
            'location_identifiers',
            'website_url',
            'categories',
            'investor_identifiers',
            'founder_identifiers',
            'operating_status',
          ],
          query: [
            {
              type: 'predicate',
              field_id: 'identifier',
              operator_id: 'contains',
              values: [companyName],
            },
          ],
          limit: 1,
        }),
      });

      if (!response.ok) {
        this.logger.warn(`Crunchbase API error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      const company = data.entities?.[0]?.properties;

      if (!company) return null;

      return this.mapApiResponseToCompanyData(company);
    } catch (error) {
      this.logger.error(`Crunchbase API error: ${(error as Error).message}`);
      return null;
    }
  }

  private async fetchFundingFromApi(companyName: string): Promise<FundingRound[]> {
    try {
      // First get the company UUID
      const company = await this.fetchFromApi(companyName);
      if (!company) return [];

      const response = await fetch(
        `${this.baseUrl}/entities/organizations/${companyName.toLowerCase().replace(/\s+/g, '-')}/funding_rounds`,
        {
          headers: {
            'X-cb-user-key': this.apiKey!,
          },
        },
      );

      if (!response.ok) return [];

      const data = await response.json();
      return (data.entities || []).map(this.mapApiFundingRound);
    } catch (error) {
      this.logger.error(`Funding rounds API error: ${(error as Error).message}`);
      return [];
    }
  }

  private async fetchInvestorFromApi(investorName: string): Promise<InvestorData | null> {
    // Similar implementation for investor lookup
    return null;
  }

  private async searchFromApi(
    industry: string,
    stage: string,
    location?: string,
  ): Promise<CompanyData[]> {
    return [];
  }

  private mapApiResponseToCompanyData(company: any): CompanyData {
    return {
      name: company.identifier?.value || '',
      description: company.short_description || '',
      foundedDate: company.founded_on,
      employeeCount: company.num_employees_enum,
      totalFunding: company.funding_total?.value_usd,
      lastFundingType: company.last_funding_type,
      lastFundingDate: company.last_funding_at,
      headquarters: company.location_identifiers?.[0]?.value,
      website: company.website_url,
      categories: (company.categories || []).map((c: any) => c.value),
      investors: (company.investor_identifiers || []).map((i: any) => i.value),
      founders: (company.founder_identifiers || []).map((f: any) => f.value),
      status: company.operating_status || 'operating',
      crunchbaseUrl: `https://www.crunchbase.com/organization/${company.identifier?.permalink}`,
    };
  }

  private mapApiFundingRound(round: any): FundingRound {
    return {
      type: round.properties?.investment_type || '',
      date: round.properties?.announced_on || '',
      amount: round.properties?.money_raised?.value_usd || null,
      currency: round.properties?.money_raised?.currency || 'USD',
      investors: (round.properties?.investor_identifiers || []).map(
        (i: any) => i.value,
      ),
      leadInvestor: round.properties?.lead_investor_identifiers?.[0]?.value,
      preMoneyValuation: round.properties?.pre_money_valuation?.value_usd,
      postMoneyValuation: round.properties?.post_money_valuation?.value_usd,
    };
  }

  // Mock data methods for development

  private initializeMockData() {
    // Add some mock companies for testing
    this.mockCompanies.set('stripe', {
      name: 'Stripe',
      description: 'Financial infrastructure platform for internet businesses',
      foundedDate: '2010-01-01',
      employeeCount: '5001-10000',
      totalFunding: 8700000000,
      lastFundingType: 'Series I',
      lastFundingDate: '2023-03-15',
      lastFundingAmount: 6500000000,
      headquarters: 'San Francisco, California',
      website: 'https://stripe.com',
      categories: ['Fintech', 'Payments', 'SaaS'],
      investors: ['Sequoia Capital', 'Andreessen Horowitz', 'General Catalyst'],
      founders: ['Patrick Collison', 'John Collison'],
      status: 'operating',
      crunchbaseUrl: 'https://www.crunchbase.com/organization/stripe',
    });

    this.mockCompanies.set('notion', {
      name: 'Notion',
      description: 'All-in-one workspace for notes, tasks, wikis, and databases',
      foundedDate: '2016-01-01',
      employeeCount: '501-1000',
      totalFunding: 343000000,
      lastFundingType: 'Series C',
      lastFundingDate: '2021-10-08',
      lastFundingAmount: 275000000,
      headquarters: 'San Francisco, California',
      website: 'https://notion.so',
      categories: ['Productivity', 'SaaS', 'Collaboration'],
      investors: ['Index Ventures', 'Coatue Management'],
      founders: ['Ivan Zhao', 'Simon Last'],
      status: 'operating',
      crunchbaseUrl: 'https://www.crunchbase.com/organization/notion',
    });
  }

  private getMockCompanyData(companyName: string): CompanyData | null {
    const key = companyName.toLowerCase().replace(/\s+/g, '');
    return this.mockCompanies.get(key) || null;
  }

  private getMockFundingRounds(companyName: string): FundingRound[] {
    // Return mock funding rounds
    return [
      {
        type: 'Seed',
        date: '2020-01-15',
        amount: 2000000,
        currency: 'USD',
        investors: ['Angel Investors'],
      },
      {
        type: 'Series A',
        date: '2021-06-01',
        amount: 15000000,
        currency: 'USD',
        investors: ['VC Fund A', 'VC Fund B'],
        leadInvestor: 'VC Fund A',
      },
    ];
  }

  private getMockInvestorData(investorName: string): InvestorData | null {
    return {
      name: investorName,
      type: 'Venture Capital',
      investmentCount: 150,
      portfolio: ['Company A', 'Company B', 'Company C'],
      headquarters: 'San Francisco, CA',
      website: 'https://example.com',
    };
  }

  private getMockSimilarCompanies(industry: string): CompanyData[] {
    return Array.from(this.mockCompanies.values()).filter((c) =>
      c.categories.some((cat) =>
        cat.toLowerCase().includes(industry.toLowerCase()),
      ),
    );
  }
}
