/**
 * User Types for The Validation Council
 * These types define users, subscriptions, and permissions
 */

// ============================================================================
// User Types
// ============================================================================

export type UserType = 'founder' | 'investor' | 'admin';

export interface User {
  id: string;
  email: string;
  name?: string;
  userType: UserType;
  avatarUrl?: string;
  company?: string;
  linkedInUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isVerified: boolean;
  settings: UserSettings;
}

export interface UserSettings {
  emailNotifications: boolean;
  weeklyDigest: boolean;
  marketingEmails: boolean;
  timezone?: string;
  language?: string;
}

// ============================================================================
// Founder Profile Types
// ============================================================================

export interface FounderProfile {
  userId: string;
  bio?: string;
  skills: string[];
  previousStartups?: PreviousStartup[];
  linkedInUrl?: string;
  githubUrl?: string;
  twitterUrl?: string;
  portfolio?: string;
  lookingForCofounder: boolean;
  openToInvestors: boolean;
}

export interface PreviousStartup {
  name: string;
  role: string;
  years: string;
  outcome: string;
  description?: string;
}

// ============================================================================
// Investor Profile Types
// ============================================================================

export interface InvestorProfile {
  userId: string;
  firmName?: string;
  firmType: 'angel' | 'vc' | 'family_office' | 'corporate' | 'accelerator' | 'other';
  checkSize: {
    min: number;
    max: number;
    currency: string;
  };
  stages: string[];
  industries: string[];
  geography: string[];
  portfolioCount?: number;
  linkedInUrl?: string;
  websiteUrl?: string;
  thesis?: string;
  dealFlow: DealFlowPreferences;
}

export interface DealFlowPreferences {
  minScore: number;
  industries: string[];
  stages: string[];
  excludeIndustries?: string[];
  preferredGeographies?: string[];
  notificationFrequency: 'immediate' | 'daily' | 'weekly';
  maxDealsPerWeek?: number;
}

// ============================================================================
// Subscription Types
// ============================================================================

export type SubscriptionPlan = 'free' | 'starter' | 'professional' | 'enterprise';
export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'expired' | 'trialing';

export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  usage: SubscriptionUsage;
}

export interface SubscriptionUsage {
  validationsUsed: number;
  validationsLimit: number;
  agentCreditsUsed: number;
  agentCreditsLimit: number;
  storageUsedMb: number;
  storageLimitMb: number;
  apiCallsUsed: number;
  apiCallsLimit: number;
}

export const PLAN_LIMITS: Record<SubscriptionPlan, Omit<SubscriptionUsage, 'validationsUsed' | 'agentCreditsUsed' | 'storageUsedMb' | 'apiCallsUsed'>> = {
  free: {
    validationsLimit: 1,
    agentCreditsLimit: 12,
    storageLimitMb: 100,
    apiCallsLimit: 100,
  },
  starter: {
    validationsLimit: 5,
    agentCreditsLimit: 60,
    storageLimitMb: 1000,
    apiCallsLimit: 1000,
  },
  professional: {
    validationsLimit: 20,
    agentCreditsLimit: 240,
    storageLimitMb: 5000,
    apiCallsLimit: 5000,
  },
  enterprise: {
    validationsLimit: -1, // Unlimited
    agentCreditsLimit: -1,
    storageLimitMb: -1,
    apiCallsLimit: -1,
  },
};

// ============================================================================
// Permission Types
// ============================================================================

export type Permission =
  | 'validation:create'
  | 'validation:read'
  | 'validation:delete'
  | 'validation:export'
  | 'validation:share'
  | 'agent:configure'
  | 'data:upload'
  | 'data:download'
  | 'report:pdf'
  | 'report:full'
  | 'investor:access'
  | 'investor:intro'
  | 'admin:users'
  | 'admin:agents'
  | 'admin:analytics'
  | 'admin:refunds';

export const PLAN_PERMISSIONS: Record<SubscriptionPlan, Permission[]> = {
  free: [
    'validation:create',
    'validation:read',
    'data:upload',
  ],
  starter: [
    'validation:create',
    'validation:read',
    'validation:export',
    'data:upload',
    'data:download',
    'report:pdf',
  ],
  professional: [
    'validation:create',
    'validation:read',
    'validation:delete',
    'validation:export',
    'validation:share',
    'data:upload',
    'data:download',
    'report:pdf',
    'report:full',
    'investor:access',
  ],
  enterprise: [
    'validation:create',
    'validation:read',
    'validation:delete',
    'validation:export',
    'validation:share',
    'agent:configure',
    'data:upload',
    'data:download',
    'report:pdf',
    'report:full',
    'investor:access',
    'investor:intro',
  ],
};

// ============================================================================
// API Key Types
// ============================================================================

export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  keyPrefix: string; // First 8 chars for identification
  keyHash: string;
  permissions: Permission[];
  lastUsedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  isActive: boolean;
}

// ============================================================================
// Session Types
// ============================================================================

export interface UserSession {
  userId: string;
  sessionId: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt: Date;
  expiresAt: Date;
  lastActivityAt: Date;
}
