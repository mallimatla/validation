/**
 * Shared Constants for The Validation Council
 */

// ============================================================================
// Agent Constants
// ============================================================================

export const AGENT_NAMES = {
  aria: 'ARIA',
  marcus: 'Marcus',
  sophia: 'Sophia',
  david: 'David',
  elena: 'Elena',
  james: 'James',
  rachel: 'Rachel',
  omar: 'Omar',
  nora: 'Nora',
  victor: 'Victor',
  victoria: 'Victoria',
  sentinel: 'Sentinel',
} as const;

export const AGENT_ROLES = {
  aria: 'Chief Orchestration Officer',
  marcus: 'Chief Market Intelligence Officer',
  sophia: 'Chief Competitive Strategy Officer',
  david: 'Chief Financial Officer',
  elena: 'Chief Customer Validation Officer',
  james: 'Chief Talent Officer',
  rachel: 'Chief Risk & Compliance Officer',
  omar: 'Chief Technology Officer',
  nora: 'Chief Funding & Comparables Officer',
  victor: 'Chief Valuation Officer',
  victoria: 'Chief Strategic Synthesizer',
  sentinel: 'Chief Trust & Audit Officer',
} as const;

// ============================================================================
// Scoring Constants
// ============================================================================

export const SCORE_THRESHOLDS = {
  EXCELLENT: 9,
  GOOD: 7,
  FAIR: 5,
  POOR: 3,
  CRITICAL: 1,
} as const;

export const CONFIDENCE_THRESHOLDS = {
  HIGH: 8,
  MEDIUM: 5,
  LOW: 3,
} as const;

// ============================================================================
// Quality Constants
// ============================================================================

export const MIN_CITATIONS_PER_CLAIM = 1;
export const MIN_CITATIONS_PER_AGENT = 3;
export const DELIBERATION_THRESHOLD = 0.2; // 20% disagreement triggers deliberation
export const HUMAN_REVIEW_THRESHOLD = 4; // Score below this triggers human review

// ============================================================================
// Evidence Constants
// ============================================================================

export const SNAPSHOT_EXPIRY_DAYS = 90;
export const MAX_SNAPSHOT_SIZE_MB = 10;
export const CITATION_VERIFICATION_INTERVAL_HOURS = 24;

// ============================================================================
// Rate Limiting Constants
// ============================================================================

export const RATE_LIMITS = {
  validationsPerHour: {
    free: 1,
    starter: 5,
    professional: 20,
    enterprise: 100,
  },
  apiCallsPerMinute: {
    free: 10,
    starter: 60,
    professional: 300,
    enterprise: 1000,
  },
} as const;

// ============================================================================
// Timeout Constants
// ============================================================================

export const TIMEOUTS = {
  agentExecution: 5 * 60 * 1000, // 5 minutes
  dataFetch: 30 * 1000, // 30 seconds
  deliberation: 10 * 60 * 1000, // 10 minutes
  totalValidation: 30 * 60 * 1000, // 30 minutes
} as const;

// ============================================================================
// Retry Constants
// ============================================================================

export const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
} as const;

// ============================================================================
// Outcome Follow-up Constants
// ============================================================================

export const FOLLOW_UP_MONTHS = [3, 6, 12, 18, 24] as const;

// ============================================================================
// Accuracy Target Constants
// ============================================================================

export const ACCURACY_TARGETS = {
  marcus: 0.70,  // Market size within 20%
  sophia: 0.65,  // Competitive predictions
  david: 0.75,   // Burn rate accuracy
  elena: 0.85,   // PMF correlation
  james: 0.75,   // Execution risk correlation
  rachel: 0.90,  // Risk identification
  omar: 0.75,    // Timeline accuracy
  nora: 0.70,    // Funding predictions
  victor: 0.75,  // Valuation accuracy
  victoria: 0.85, // Verdict correlation
} as const;

// ============================================================================
// Industry Categories
// ============================================================================

export const INDUSTRIES = [
  'AI/ML',
  'B2B SaaS',
  'B2C',
  'Biotech/Life Sciences',
  'Climate/Cleantech',
  'Consumer',
  'Cybersecurity',
  'E-commerce',
  'EdTech',
  'Enterprise Software',
  'Fintech',
  'Gaming',
  'Hardware',
  'Healthcare',
  'Legal Tech',
  'Logistics/Supply Chain',
  'Marketplace',
  'Media/Entertainment',
  'Proptech',
  'Robotics',
  'Space Tech',
  'Other',
] as const;

// ============================================================================
// Business Model Categories
// ============================================================================

export const BUSINESS_MODELS = [
  'SaaS',
  'Marketplace',
  'Transaction Fee',
  'Advertising',
  'Freemium',
  'Subscription',
  'Usage-Based',
  'Licensing',
  'Hardware + Software',
  'Service',
  'E-commerce',
  'Data/API',
  'Other',
] as const;

// ============================================================================
// Geography Options
// ============================================================================

export const GEOGRAPHIES = [
  'United States',
  'Canada',
  'Europe',
  'United Kingdom',
  'LATAM',
  'Asia Pacific',
  'India',
  'China',
  'Middle East',
  'Africa',
  'Global',
] as const;
