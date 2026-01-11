/**
 * World's Best Startup Validation Framework Constants
 * Based on research from Sequoia, YC, a16z, and academic studies
 *
 * Key Statistics:
 * - 64% of VC investments fail to return principal
 * - Only 4% generate 10x+ returns (these outliers drive nearly all profits)
 * - 75% of venture-backed companies never return cash to investors
 * - 88.7% of unicorn founders share identical psychological traits
 */

// =============================================================================
// MARKET & TIMING THRESHOLDS (Agent 1: Marcus)
// =============================================================================

export const MARKET_THRESHOLDS = {
  // TAM Requirements
  TAM_VENTURE_SCALE: 1_000_000_000, // $1B minimum for venture-scale
  TAM_LARGE: 10_000_000_000, // $10B+ is large opportunity
  TAM_MASSIVE: 100_000_000_000, // $100B+ is massive
  TAM_TOO_SMALL: 500_000_000, // Below $500M is kill signal

  // Growth Rate Requirements
  GROWTH_EXCEPTIONAL: 0.25, // 25%+ CAGR
  GROWTH_STRONG: 0.15, // 15%+ CAGR
  GROWTH_MODERATE: 0.10, // 10%+ CAGR (minimum acceptable)
  GROWTH_SLOW: 0.05, // Below 5% is warning

  // Market Phase Scores
  TIMING_SCORES: {
    emerging: { score: 6, risk: 'high', opportunity: 'high' },
    growing: { score: 9, risk: 'medium', opportunity: 'high' },
    mature: { score: 4, risk: 'low', opportunity: 'low' },
    declining: { score: 1, risk: 'high', opportunity: 'very_low' },
  },
};

export const MARKET_KILL_SIGNALS = [
  'Market declining or under $500M TAM',
  'Technology on mature S-curve with no innovation path',
  'Multiple recent failures with same thesis (3+ in 5 years)',
  'Regulatory framework actively hostile',
  'Enabling infrastructure not yet available',
  'Top 3 competitors control 80%+ market with network effects',
];

// =============================================================================
// FOUNDER & TEAM THRESHOLDS (Agents 2-3: James)
// =============================================================================

export const FOUNDER_THRESHOLDS = {
  // Age Research (MIT/Northwestern: 2.7M founders)
  OPTIMAL_AGE_MIN: 35,
  OPTIMAL_AGE_MAX: 55,
  AGE_50_SUCCESS_MULTIPLIER: 2.2, // vs 30-year-old
  AGE_50_VS_25_MULTIPLIER: 2.8, // vs 25-year-old

  // Experience Requirements
  SAME_INDUSTRY_YEARS_OPTIMAL: 3, // 85% more likely to succeed

  // Success Rates by Type
  SUCCESS_RATES: {
    first_time: 0.18, // 18%
    prior_failure: 0.20, // 20%
    prior_success: 0.30, // 30% - nearly 2x first-timers
  },

  // Team Size
  OPTIMAL_TEAM_SIZE_MIN: 2,
  OPTIMAL_TEAM_SIZE_MAX: 3,
  SOLO_FOUNDER_SCALE_MULTIPLIER: 3.6, // Takes 3.6x longer to scale

  // Equity Split
  MINIMUM_FOUNDER_OWNERSHIP_SERIES_A: 0.30, // 30%
  MINIMUM_FOUNDER_OWNERSHIP_SERIES_B: 0.15, // 15%

  // Immigrant Founder Stats
  UNICORN_IMMIGRANT_PERCENTAGE: 0.55, // 55% of US unicorns
  IMMIGRANT_FOUNDING_RATE_MULTIPLIER: 1.8, // 80% higher than natives
};

export const FOUNDER_KILL_SIGNALS = [
  'Solo founder with no technical capability',
  'Co-founders just met (no prior relationship)',
  'Founder refuses feedback during process',
  'Founder badmouths former colleagues',
  'Cannot articulate unique insight',
  'Co-founder conflict evident',
  'Key founder departure within 18 months',
  'Employee turnover above 30% in Year 1',
];

export const FOUNDER_SCORING = {
  prior_exit: 20,
  same_industry_3_years: 15,
  serial_entrepreneur: 10,
  optimal_age_range: 10,
  technical_cofounder: 10,
  mixed_immigrant_native_team: 8,
  '2_3_cofounders': 8,
  prior_working_relationship: 8,
  domain_expert: 5,
};

export const FOUNDER_PENALTIES = {
  solo_founder_no_tech: -25,
  cofounders_just_met: -15,
  refuses_feedback: -15,
  badmouths_colleagues: -20,
  no_unique_insight: -15,
  no_vesting_schedule: -10,
  excessive_pivots: -10,
};

// =============================================================================
// FINANCIAL & TRACTION THRESHOLDS (Agents 4, 7: David)
// =============================================================================

export const FINANCIAL_THRESHOLDS = {
  // Stage-Specific Benchmarks (2025 standards)
  STAGE_BENCHMARKS: {
    pre_seed: {
      arr_min: 0,
      arr_max: 60_000, // $0-5K MRR
      valuation_max: 10_000_000,
      growth_rate: 0, // Just getting started
    },
    seed: {
      arr_min: 300_000, // $300K ARR minimum
      arr_target: 500_000, // $500K ARR target
      monthly_growth: 0.15, // 15%+ monthly
      valuation_range: [12_000_000, 16_000_000],
    },
    series_a: {
      arr_median: 3_000_000, // $3M ARR median for B2B SaaS
      yoy_growth_min: 2.0, // 2x YoY
      yoy_growth_top: 5.0, // 5x+ for top tier
      gross_margin_min: 0.70, // 70%+
      nrr_min: 1.00, // 100%+
    },
    series_b: {
      arr_typical: 10_000_000, // $10M ARR
      yoy_growth_range: [2.0, 5.0], // 2-5x annual
    },
  },

  // T2D3 Framework (Triple, Triple, Double, Double, Double)
  T2D3_TRAJECTORY: {
    year_0: 2_000_000, // Starting point: $2M ARR
    year_1: 6_000_000, // 3x = $6M
    year_2: 18_000_000, // 3x = $18M
    year_3: 36_000_000, // 2x = $36M
    year_4: 72_000_000, // 2x = $72M
    year_5: 144_000_000, // 2x = $144M (unicorn territory)
  },

  // Rule of 40
  RULE_OF_40_THRESHOLD: 40, // Growth% + EBITDA% >= 40%
  RULE_OF_40_MEDIAN_2025: 12, // Q1 2025 median is only 12%
  RULE_OF_40_TOP_PERFORMER: 55, // Doximity level
  RULE_OF_40_VALUATION_PREMIUM: 2.0, // 2x valuation for meeting threshold

  // Unit Economics
  LTV_CAC_UNSUSTAINABLE: 1.0,
  LTV_CAC_STANDARD: 3.0,
  LTV_CAC_GREAT: 4.0,
  LTV_CAC_UNDERINVESTING: 5.0, // May be underinvesting in growth

  // CAC Payback
  CAC_PAYBACK_EXCELLENT: 12, // months
  CAC_PAYBACK_ACCEPTABLE_ENTERPRISE: 24, // for multi-year contracts
  CAC_PAYBACK_CONCERNING: 36,

  // Burn Multiple (Net Burn / Net New ARR)
  BURN_MULTIPLE_GREAT: 1.5,
  BURN_MULTIPLE_CONCERNING: 3.0,
  BURN_MULTIPLE_DANGER: 5.0,

  // Gross Margins
  GROSS_MARGIN_SOFTWARE: 0.80, // 80-90% for software
  GROSS_MARGIN_SAAS_MIN: 0.70, // 70%+ minimum

  // Runway
  RUNWAY_HEALTHY: 18, // months
  RUNWAY_CONCERNING: 12,
  RUNWAY_DANGER: 6,
};

export const FINANCIAL_KILL_SIGNALS = [
  'LTV/CAC below 1:1',
  'Burn multiple above 5x',
  'Runway below 3 months',
  'Declining retention by cohort',
  'Down round with declining metrics',
  'Multiple bridge rounds with declining metrics',
  'Founder ownership below 15% pre-Series B',
  'No audited financials (post-Series A)',
];

// =============================================================================
// PRODUCT-MARKET FIT THRESHOLDS (Agent 5: Elena)
// =============================================================================

export const PMF_THRESHOLDS = {
  // Sean Ellis Test
  SEAN_ELLIS_PMF_THRESHOLD: 0.40, // 40% "very disappointed"
  SEAN_ELLIS_MINIMUM_RESPONSES: 30, // for directional guidance
  SEAN_ELLIS_CONFIDENT_RESPONSES: 100, // for confidence

  // Retention
  NRR_HEALTHY: 1.00, // 100%+ indicates expansion covering churn
  NRR_2025_MEDIAN: 1.06, // 106%
  NRR_TOP_QUARTILE: 1.15, // 115%+
  NRR_EXCEPTIONAL: 1.30, // 130%+ (Snowflake IPO was 164%)
  NRR_VALUE_INCREASE_PER_PERCENT: 0.12, // 12% company value per 1% NRR

  // Engagement
  DAU_MAU_STICKY: 0.20, // 20%+ indicates sticky product
  DAU_MAU_SOCIAL_TARGET: 0.50, // 50%+ for social
  DAU_MAU_SAAS_AVERAGE: 0.13, // 13% SaaS average

  // Activation
  ACTIVATION_GOOD: 0.40, // 40%+
  ACTIVATION_CONCERNING: 0.20,
  ACTIVATION_POOR: 0.10,

  // NPS
  NPS_EXCELLENT: 50,
  NPS_GOOD: 30,
  NPS_CONCERNING: 0,

  // Virality
  K_VALUE_VIRAL: 1.0, // K > 1.0 means viral growth
};

export const PMF_KILL_SIGNALS = [
  'Below 20% "very disappointed" after 24 months',
  'Retention curves declining to zero',
  '0% organic growth',
  'Activation rate below 10%',
  'NPS below 0 with downward trend',
  'DAU/MAU collapsing over time',
];

// =============================================================================
// MOAT & DEFENSIBILITY THRESHOLDS (Agent 6: Sophia)
// =============================================================================

export const MOAT_THRESHOLDS = {
  // Multi-tenanting (customers using competitors)
  MULTI_TENANTING_STRONG_MOAT: 0.30, // Below 30% is strong
  MULTI_TENANTING_WEAK_MOAT: 0.50, // Above 50% is weak

  // Customer Lock-in
  AVG_CONTRACT_LENGTH_STRONG: 24, // months
  CRITICAL_INTEGRATIONS_STRONG: 5, // API integrations per customer

  // Retention
  LOGO_CHURN_EXCELLENT: 0.05, // Below 5% annually

  // Financial Evidence
  ROIC_SUSTAINED_MOAT: 0.15, // 15%+ ROIC sustained

  // Network Effects (NFX research)
  NETWORK_EFFECTS_VALUE_SHARE: 0.70, // 70% of tech value since 1994
};

// Hamilton Helmer's 7 Powers Framework
export const SEVEN_POWERS = {
  scale_economies: {
    name: 'Scale Economies',
    description: 'Per-unit cost decreases as production increases',
    examples: ['Amazon', 'Costco', 'TSMC'],
    strength: 'high',
  },
  network_economies: {
    name: 'Network Economies',
    description: 'Value increases as more users join',
    examples: ['Facebook', 'Visa', 'Uber'],
    strength: 'very_high',
  },
  counter_positioning: {
    name: 'Counter-Positioning',
    description: 'New business model incumbents cannot copy without cannibalization',
    examples: ['Netflix vs Blockbuster', 'Tesla vs legacy auto'],
    strength: 'high',
  },
  switching_costs: {
    name: 'Switching Costs',
    description: 'Customer lock-in through integration and workflow embedding',
    examples: ['Adobe Creative Cloud', 'SAP', 'Salesforce'],
    strength: 'medium_high',
  },
  branding: {
    name: 'Branding',
    description: 'Premium pricing through reputation',
    examples: ['Apple', 'Coca-Cola', 'Louis Vuitton'],
    strength: 'medium',
  },
  cornered_resource: {
    name: 'Cornered Resource',
    description: 'Preferential access to unique assets',
    examples: ['ARM IP', 'DeBeers diamonds', 'Sports leagues'],
    strength: 'high',
  },
  process_power: {
    name: 'Process Power',
    description: 'Proprietary processes competitors cannot replicate',
    examples: ['Toyota Production System', 'Amazon fulfillment'],
    strength: 'medium_high',
  },
};

// Network Effect Types (NFX 16 types)
export const NETWORK_EFFECT_TYPES = {
  direct: ['physical', 'protocol', 'personal_utility', 'personal_identity', 'market_network'],
  two_sided: ['marketplace', 'platform'],
  data: ['data_network'], // Often weaker than founders believe
  tech_performance: ['tech_performance'],
};

export const MOAT_KILL_SIGNALS = [
  'Easily replicable in under 12 months',
  'Multi-tenanting above 50%',
  'Commoditized supply',
  'Gross margin below 40%',
  'No differentiated data asset',
  'Top 3 competitors control 80%+ with network effects',
];

// =============================================================================
// LEGAL & COMPLIANCE THRESHOLDS (Agent 8: Rachel)
// =============================================================================

export const LEGAL_KILL_SIGNALS = [
  'No formal cap table maintenance',
  'Undocumented equity transactions',
  'Excessive investor counts (30+) on cap table',
  'Unclear founder ownership',
  'Untracked SAFEs',
  'Missing 409A valuations',
  'No IP assignment agreements',
  'Prior art exposure on core technology',
  'No patents filed for claimed innovations',
  'IP developed before incorporation not assigned',
  'Contractor IP not assigned',
  'No NDA practices',
  'No founder vesting schedule',
  'Founders fully vested at incorporation',
  'No acceleration provisions',
  'Pending regulatory investigation',
  'Operating in regulatory gray area without legal review',
];

// =============================================================================
// RED FLAG PATTERNS (Agent 10: Sentinel)
// =============================================================================

// CB Insights Top 20 Failure Causes (111 post-mortems)
export const CB_INSIGHTS_FAILURE_CAUSES = {
  no_market_need: { percentage: 0.42, rank: 1, severity: 'critical' },
  ran_out_of_cash: { percentage: 0.38, rank: 2, severity: 'critical' },
  not_right_team: { percentage: 0.23, rank: 3, severity: 'major' },
  got_outcompeted: { percentage: 0.19, rank: 4, severity: 'major' },
  pricing_cost_issues: { percentage: 0.18, rank: 5, severity: 'major' },
  poor_product: { percentage: 0.17, rank: 6, severity: 'major' },
  no_business_model: { percentage: 0.17, rank: 7, severity: 'major' },
  poor_marketing: { percentage: 0.14, rank: 8, severity: 'moderate' },
  ignored_customers: { percentage: 0.14, rank: 9, severity: 'moderate' },
  product_mistiming: { percentage: 0.10, rank: 10, severity: 'moderate' },
};

// Premature Scaling (Startup Genome)
export const PREMATURE_SCALING_FAILURE_RATE = 0.74; // 74% fail due to this

// =============================================================================
// FALSE POSITIVE PATTERNS (Agent 12: Sentinel)
// =============================================================================

// Theranos/FTX/WeWork Red Flags
export const FALSE_POSITIVE_PATTERNS = {
  theranos: [
    'Charismatic founder with unverifiable claims',
    'No audited financials',
    'No independent technology verification',
    'Prestige backers substituting for due diligence',
    'Deal pressure emphasizing speed over scrutiny',
    '"Exclusive" positioning discouraging questions',
  ],
  ftx: [
    'No formal board of directors',
    'No in-house accounting department',
    'Unaudited financial statements',
    'Large assets in self-created tokens',
    'CEO distracted during pitch (gaming)',
    'Complete failure of corporate controls',
  ],
  wework: [
    'Vanity metrics focus (community, vibes)',
    'Unit economics masked by growth',
    'Related party transactions',
    'Governance failures',
    'Founder overreach',
  ],
};

export const VANITY_METRICS_WARNING = [
  'Total registered users without active data',
  'App downloads without engagement metrics',
  'Page views without conversion data',
  'Social followers without engagement rates',
  'GMV without take rate and margin',
];

// =============================================================================
// PATTERN ANOMALY DETECTION (Agent 11: Victoria)
// =============================================================================

// Companies VCs typically reject that actually succeed
export const CONTRARIAN_SUCCESS_PATTERNS = [
  'Market timing appears too early but inflection points approaching',
  'Founders outside "pattern" (older, non-traditional) with domain expertise',
  'Negative initial unit economics with clear path to improvement (Instacart)',
  'Regulatory complexity creating barriers to entry (Uber, PayPal)',
  'High judge disagreement correlates with success (Strategy Science 2024)',
];

// Famous VC Misses
export const FAMOUS_REJECTIONS = {
  airbnb: {
    rejected_by: 7,
    ask: 150_000,
    for_percentage: 0.10,
    current_value: 10_500_000_000, // That stake worth $10.5B
    rejection_reasons: [
      'Not in our area of focus',
      'Market opportunity not large enough',
      'Not in prime target markets',
      'Struggled with travel category',
    ],
  },
  google: {
    bessemer_reaction: 'How can I get out of this house without going near your garage?',
  },
  facebook: {
    bessemer_reaction: 'Kid, haven\'t you heard of Friendster? Move on.',
  },
};

// =============================================================================
// SCORING WEIGHTS
// =============================================================================

export const AGENT_SCORING_WEIGHTS = {
  marcus: 1.0, // Market
  sophia: 1.0, // Competition/Moat
  david: 1.2, // Financial (slightly higher weight)
  elena: 1.2, // PMF (slightly higher weight)
  james: 1.0, // Team
  rachel: 0.8, // Legal
  omar: 0.9, // Technology
  nora: 0.9, // Funding
  victor: 1.0, // Valuation
  victoria: 1.1, // Synthesis
  sentinel: 1.0, // Red Flags
  aria: 0, // Orchestrator - doesn't score
};

// =============================================================================
// VERDICT THRESHOLDS
// =============================================================================

export const VERDICT_THRESHOLDS = {
  PROCEED: {
    min_score: 70,
    min_confidence: 70,
    max_critical_flags: 0,
    max_major_flags: 2,
  },
  PROCEED_WITH_CAUTION: {
    min_score: 50,
    min_confidence: 50,
    max_critical_flags: 1,
    max_major_flags: 4,
  },
  RECONSIDER: {
    min_score: 0, // Anything below PROCEED_WITH_CAUTION
    max_critical_flags: 999,
    max_major_flags: 999,
  },
};

export const RECOMMENDATION_MAPPING = {
  PROCEED: 'GREEN',
  PROCEED_WITH_CAUTION: 'YELLOW',
  RECONSIDER: 'RED',
};

// =============================================================================
// PIVOTING PATTERNS
// =============================================================================

export const PIVOT_STATISTICS = {
  optimal_pivots: { min: 1, max: 2 },
  user_growth_multiplier: 3.6, // 3.6x user growth with 1-2 pivots
  return_multiplier: 2.5, // 2.5x returns
  excessive_pivots: 3, // More than 3 in 2 years is red flag
  no_pivot_despite_no_pmf: true, // Red flag
};

// =============================================================================
// TIMING ANALYSIS (Bill Gross Research)
// =============================================================================

export const SUCCESS_FACTOR_WEIGHTS = {
  timing: 0.42, // 42% - single most important
  team_execution: 0.32, // 32%
  idea_uniqueness: 0.28, // 28%
  business_model: 0.24, // 24%
  funding: 0.14, // 14%
};

// First Mover vs Fast Follower (Golder & Tellis)
export const FIRST_MOVER_STATISTICS = {
  first_mover_failure_rate: 0.47, // 47%
  fast_follower_failure_rate: 0.08, // 8%
};

// Gartner Hype Cycle
export const HYPE_CYCLE_PHASES = {
  innovation_trigger: { risk: 'very_high', investment_timing: 'too_early' },
  peak_inflated_expectations: { risk: 'high', investment_timing: 'risky' },
  trough_of_disillusionment: { risk: 'medium', investment_timing: 'good_entry', recovery_rate: 0.40 },
  slope_of_enlightenment: { risk: 'medium_low', investment_timing: 'good' },
  plateau_of_productivity: { risk: 'low', investment_timing: 'late_but_safe' },
};

// Only 20% follow full cycle, 60% that fall into trough never recover
export const HYPE_CYCLE_STATISTICS = {
  full_cycle_percentage: 0.20,
  trough_recovery_failure: 0.60,
};
