/**
 * INVESTOR-GRADE SHARED TYPES
 *
 * These types are used across all Validation Council agents to ensure
 * consistent, professional, investor-ready reports.
 *
 * Version: 3.0.0
 * Last Updated: 2026-01-07
 */

/**
 * Confidence Range - All estimates should include low/mid/high ranges
 */
export interface ConfidenceRange {
  low: number;
  mid: number;
  high: number;
  confidence: number; // 0-1 confidence level
  sources: string[];
  dataFreshness: Date;
}

/**
 * Validation Scorecard - Every agent report includes quality metrics
 */
export interface ValidationScorecard {
  dataQuality: { score: number; maxScore: number; details: string };
  sourceVerification: { score: number; maxScore: number; details: string };
  analysisDepth: { score: number; maxScore: number; details: string };
  riskAssessment: { score: number; maxScore: number; details: string };
  actionability: { score: number; maxScore: number; details: string };
  overall: { score: number; maxScore: number; grade: string };
}

/**
 * Scenario Analysis - Bull/Base/Bear cases with probabilities
 */
export interface ScenarioAnalysis {
  bull: ScenarioCase;
  base: ScenarioCase;
  bear: ScenarioCase;
  expectedValue?: number;
}

export interface ScenarioCase {
  probability: number;
  multiplier: number;
  description: string;
  keyAssumptions: string[];
  triggers: string[];
}

/**
 * Comparable Entity - For benchmarking analysis
 */
export interface ComparableEntity {
  name: string;
  description: string;
  metrics: Record<string, number | string>;
  relevanceScore: number;
  sourceUrl: string;
  lastUpdated: Date;
}

/**
 * Risk Matrix Entry
 */
export interface RiskMatrixEntry {
  risk: string;
  category: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'minor' | 'moderate' | 'major' | 'critical';
  score: number; // probability * impact numerical
  mitigations: string[];
  owner: string;
  timeline: string;
}

/**
 * Investment Readiness Metrics
 */
export interface InvestmentReadiness {
  overallScore: number;
  maxScore: number;
  grade: string;
  strengths: string[];
  weaknesses: string[];
  dealBreakers: string[];
  recommendations: string[];
}

/**
 * Evidence Quality Levels
 */
export type EvidenceQuality = 'verified' | 'estimated' | 'projected' | 'assumed';

/**
 * Source Verification Status
 */
export interface VerifiedSource {
  url: string;
  title: string;
  verified: boolean;
  verifiedAt: Date;
  quality: EvidenceQuality;
  excerpts: string[];
}

/**
 * Agent Report Metadata
 */
export interface ReportMetadata {
  agentId: string;
  agentName: string;
  agentVersion: string;
  generatedAt: Date;
  dataCollectionDate: Date;
  confidenceLevel: number;
  disclaimer: string;
}

/**
 * Investor-Grade Report Structure
 */
export interface InvestorGradeReport {
  metadata: ReportMetadata;
  scorecard: ValidationScorecard;
  executiveSummary: string;
  keyFindings: KeyFinding[];
  scenarios: ScenarioAnalysis;
  risks: RiskMatrixEntry[];
  recommendations: Recommendation[];
  sources: VerifiedSource[];
  rawAnalysis: string;
}

export interface KeyFinding {
  title: string;
  description: string;
  type: 'strength' | 'weakness' | 'opportunity' | 'threat' | 'neutral';
  severity: 'critical' | 'major' | 'minor' | 'info';
  confidence: number;
  evidence: string[];
}

export interface Recommendation {
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  timeframe: 'immediate' | 'short-term' | 'medium-term' | 'long-term';
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  owner?: string;
}

/**
 * Helper function to calculate letter grade from percentage
 */
export function calculateGrade(score: number, maxScore: number): string {
  const percentage = (score / maxScore) * 100;
  if (percentage >= 90) return 'A+';
  if (percentage >= 85) return 'A';
  if (percentage >= 80) return 'A-';
  if (percentage >= 77) return 'B+';
  if (percentage >= 73) return 'B';
  if (percentage >= 70) return 'B-';
  if (percentage >= 67) return 'C+';
  if (percentage >= 63) return 'C';
  if (percentage >= 60) return 'C-';
  if (percentage >= 50) return 'D';
  return 'F';
}

/**
 * Helper function to format currency
 */
export function formatCurrency(value: number): string {
  if (value >= 1e12) return `${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(0)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
  return value.toFixed(0);
}

/**
 * Default disclaimer for all reports
 */
export const REPORT_DISCLAIMER = `
This report is for informational purposes only and should not be considered as
investment advice. All projections and estimates are based on available data and
assumptions that may not reflect actual future outcomes. Investors should conduct
their own due diligence before making any investment decisions.
`.trim();
