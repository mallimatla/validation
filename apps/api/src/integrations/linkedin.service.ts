/**
 * LinkedIn Service
 * Fetches founder and company profile data from LinkedIn
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface FounderProfile {
  name: string;
  headline: string;
  linkedInUrl: string;
  currentRole?: string;
  currentCompany?: string;
  location?: string;
  connections?: number;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: string[];
  recommendations?: number;
  isVerified: boolean;
}

export interface ExperienceEntry {
  title: string;
  company: string;
  duration: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  isCurrentRole: boolean;
}

export interface EducationEntry {
  school: string;
  degree?: string;
  field?: string;
  startYear?: number;
  endYear?: number;
}

export interface CompanyProfile {
  name: string;
  linkedInUrl: string;
  industry: string;
  employeeCount: string;
  employeeCountRange?: { min: number; max: number };
  headquarters?: string;
  founded?: number;
  description?: string;
  specialties: string[];
  websiteUrl?: string;
  followers?: number;
}

@Injectable()
export class LinkedInService {
  private readonly logger = new Logger(LinkedInService.name);
  private readonly apiKey: string | null;

  constructor(private readonly configService: ConfigService) {
    // LinkedIn API requires OAuth - this would use a service like Proxycurl or similar
    this.apiKey = this.configService.get('PROXYCURL_API_KEY') || null;

    if (this.apiKey) {
      this.logger.log('LinkedIn data service configured (via Proxycurl)');
    } else {
      this.logger.warn('LinkedIn API not configured - using estimated data');
    }
  }

  /**
   * Get founder profile from LinkedIn URL
   */
  async getFounderProfile(linkedInUrl: string): Promise<FounderProfile | null> {
    this.logger.log(`Fetching LinkedIn profile: ${linkedInUrl}`);

    if (this.apiKey) {
      return this.fetchFromApi(linkedInUrl);
    }

    return this.estimateFounderProfile(linkedInUrl);
  }

  /**
   * Get company profile from LinkedIn
   */
  async getCompanyProfile(companyName: string): Promise<CompanyProfile | undefined> {
    this.logger.log(`Fetching LinkedIn company: ${companyName}`);

    if (this.apiKey) {
      return this.fetchCompanyFromApi(companyName);
    }

    return this.estimateCompanyProfile(companyName);
  }

  /**
   * Calculate founder credibility score
   */
  calculateFounderScore(profile: FounderProfile): {
    score: number;
    breakdown: Record<string, number>;
    flags: string[];
  } {
    const breakdown: Record<string, number> = {
      experience: 0,
      education: 0,
      network: 0,
      domain_expertise: 0,
      startup_experience: 0,
    };
    const flags: string[] = [];

    // Experience scoring
    const totalYears = profile.experience.reduce((years, exp) => {
      const duration = this.parseDuration(exp.duration);
      return years + duration;
    }, 0);

    if (totalYears >= 10) {
      breakdown.experience = 25;
    } else if (totalYears >= 5) {
      breakdown.experience = 15;
    } else if (totalYears >= 2) {
      breakdown.experience = 8;
    } else {
      breakdown.experience = 3;
      flags.push('Limited professional experience');
    }

    // Startup experience
    const startupRoles = profile.experience.filter(
      (exp) =>
        exp.title.toLowerCase().includes('founder') ||
        exp.title.toLowerCase().includes('ceo') ||
        exp.title.toLowerCase().includes('co-founder'),
    );

    if (startupRoles.length >= 2) {
      breakdown.startup_experience = 20;
    } else if (startupRoles.length === 1) {
      breakdown.startup_experience = 12;
    } else {
      breakdown.startup_experience = 0;
      flags.push('First-time founder');
    }

    // Education scoring
    const topSchools = ['stanford', 'mit', 'harvard', 'yale', 'berkeley', 'iit', 'iim'];
    const hasTopSchool = profile.education.some((edu) =>
      topSchools.some((school) => edu.school.toLowerCase().includes(school)),
    );

    if (hasTopSchool) {
      breakdown.education = 15;
    } else if (profile.education.length > 0) {
      breakdown.education = 8;
    }

    // Network scoring
    if (profile.connections && profile.connections >= 500) {
      breakdown.network = 10;
    } else if (profile.connections && profile.connections >= 200) {
      breakdown.network = 5;
    }

    // Domain expertise (based on skills)
    const relevantSkillCount = profile.skills.length;
    if (relevantSkillCount >= 20) {
      breakdown.domain_expertise = 15;
    } else if (relevantSkillCount >= 10) {
      breakdown.domain_expertise = 10;
    } else {
      breakdown.domain_expertise = 5;
    }

    const score = Object.values(breakdown).reduce((a, b) => a + b, 0);

    return { score, breakdown, flags };
  }

  /**
   * Assess team composition
   */
  assessTeamComposition(founders: FounderProfile[]): {
    hasBusinessExpertise: boolean;
    hasTechnicalExpertise: boolean;
    hasDomainExpertise: boolean;
    complementarySkills: boolean;
    flags: string[];
  } {
    const flags: string[] = [];

    const allSkills = founders.flatMap((f) => f.skills.map((s) => s.toLowerCase()));
    const allTitles = founders.flatMap((f) =>
      f.experience.map((e) => e.title.toLowerCase()),
    );

    const technicalKeywords = [
      'engineering', 'developer', 'software', 'cto', 'architect',
      'data science', 'machine learning', 'ai',
    ];
    const businessKeywords = [
      'business', 'marketing', 'sales', 'ceo', 'coo', 'strategy',
      'growth', 'product',
    ];
    const domainKeywords = [
      'healthcare', 'fintech', 'finance', 'education', 'retail',
      'enterprise', 'consumer',
    ];

    const hasTechnicalExpertise =
      technicalKeywords.some((k) =>
        allSkills.some((s) => s.includes(k)) ||
        allTitles.some((t) => t.includes(k)),
      );

    const hasBusinessExpertise =
      businessKeywords.some((k) =>
        allSkills.some((s) => s.includes(k)) ||
        allTitles.some((t) => t.includes(k)),
      );

    const hasDomainExpertise =
      domainKeywords.some((k) =>
        allSkills.some((s) => s.includes(k)) ||
        allTitles.some((t) => t.includes(k)),
      );

    if (!hasTechnicalExpertise) {
      flags.push('No clear technical expertise on founding team');
    }

    if (!hasBusinessExpertise) {
      flags.push('No clear business/GTM expertise on founding team');
    }

    const complementarySkills = hasTechnicalExpertise && hasBusinessExpertise;

    if (founders.length === 1) {
      flags.push('Solo founder - consider finding co-founder');
    }

    return {
      hasBusinessExpertise,
      hasTechnicalExpertise,
      hasDomainExpertise,
      complementarySkills,
      flags,
    };
  }

  // Private methods

  private async fetchFromApi(linkedInUrl: string): Promise<FounderProfile | null> {
    try {
      const response = await fetch(
        'https://nubela.co/proxycurl/api/v2/linkedin',
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
          method: 'GET',
        },
      );

      if (!response.ok) {
        this.logger.warn(`Proxycurl API error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      return this.mapApiResponseToProfile(data);
    } catch (error) {
      this.logger.error(`LinkedIn API error: ${(error as Error).message}`);
      return null;
    }
  }

  private async fetchCompanyFromApi(companyName: string): Promise<CompanyProfile | undefined> {
    try {
      const response = await fetch(
        `https://nubela.co/proxycurl/api/linkedin/company?url=https://www.linkedin.com/company/${companyName.toLowerCase().replace(/\s+/g, '-')}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        },
      );

      if (!response.ok) return undefined;

      const data = await response.json();
      return this.mapCompanyApiResponse(data);
    } catch (error) {
      return undefined;
    }
  }

  private mapApiResponseToProfile(data: any): FounderProfile {
    return {
      name: `${data.first_name} ${data.last_name}`,
      headline: data.headline || '',
      linkedInUrl: data.public_identifier
        ? `https://linkedin.com/in/${data.public_identifier}`
        : '',
      currentRole: data.occupation,
      location: data.city || data.country,
      connections: data.connections || 0,
      experience: (data.experiences || []).map((exp: any) => ({
        title: exp.title || '',
        company: exp.company || '',
        duration: exp.duration || '',
        startDate: exp.starts_at
          ? `${exp.starts_at.year}-${exp.starts_at.month}`
          : undefined,
        endDate: exp.ends_at
          ? `${exp.ends_at.year}-${exp.ends_at.month}`
          : undefined,
        description: exp.description,
        isCurrentRole: !exp.ends_at,
      })),
      education: (data.education || []).map((edu: any) => ({
        school: edu.school || '',
        degree: edu.degree_name,
        field: edu.field_of_study,
        startYear: edu.starts_at?.year,
        endYear: edu.ends_at?.year,
      })),
      skills: data.skills || [],
      recommendations: data.recommendations?.length,
      isVerified: true,
    };
  }

  private mapCompanyApiResponse(data: any): CompanyProfile {
    return {
      name: data.name || '',
      linkedInUrl: data.linkedin_internal_id
        ? `https://linkedin.com/company/${data.linkedin_internal_id}`
        : '',
      industry: data.industry || '',
      employeeCount: data.company_size || '',
      employeeCountRange: data.company_size_on_linkedin
        ? {
            min: data.company_size_on_linkedin - 100,
            max: data.company_size_on_linkedin + 100,
          }
        : undefined,
      headquarters: data.hq
        ? `${data.hq.city}, ${data.hq.country}`
        : undefined,
      founded: data.founded_year,
      description: data.description,
      specialties: data.specialities || [],
      websiteUrl: data.website,
      followers: data.follower_count,
    };
  }

  private estimateFounderProfile(linkedInUrl: string): FounderProfile {
    // Extract username from URL for mock data
    const username = linkedInUrl.split('/in/')[1]?.replace('/', '') || 'unknown';

    return {
      name: username.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      headline: 'Founder & CEO',
      linkedInUrl,
      currentRole: 'Founder',
      experience: [
        {
          title: 'Founder',
          company: 'Current Startup',
          duration: '1 year',
          isCurrentRole: true,
        },
        {
          title: 'Product Manager',
          company: 'Previous Company',
          duration: '3 years',
          isCurrentRole: false,
        },
      ],
      education: [
        {
          school: 'University',
          degree: 'Bachelor\'s',
          field: 'Computer Science',
        },
      ],
      skills: ['Leadership', 'Product Management', 'Strategy'],
      isVerified: false,
    };
  }

  private estimateCompanyProfile(companyName: string): CompanyProfile {
    return {
      name: companyName,
      linkedInUrl: `https://linkedin.com/company/${companyName.toLowerCase().replace(/\s+/g, '-')}`,
      industry: 'Technology',
      employeeCount: '11-50',
      specialties: [],
      isVerified: false,
    } as any;
  }

  private parseDuration(duration: string): number {
    const years = duration.match(/(\d+)\s*year/i);
    const months = duration.match(/(\d+)\s*month/i);

    let totalYears = 0;
    if (years) totalYears += parseInt(years[1]);
    if (months) totalYears += parseInt(months[1]) / 12;

    return totalYears;
  }
}
