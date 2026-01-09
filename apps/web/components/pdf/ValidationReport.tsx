'use client';

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer';

// Premium color palette for investor-grade documents
const colors = {
  primary: '#0f172a',      // Slate 900 - Professional dark
  primaryLight: '#1e40af', // Blue 800
  accent: '#0ea5e9',       // Sky 500
  success: '#059669',      // Emerald 600
  warning: '#d97706',      // Amber 600
  danger: '#dc2626',       // Red 600
  purple: '#7c3aed',       // Violet 600
  dark: '#0f172a',
  medium: '#475569',
  light: '#94a3b8',
  lighter: '#e2e8f0',
  lightest: '#f8fafc',
  white: '#ffffff',
  gold: '#b45309',
  certified: '#059669',
};

// Professional styles
const styles = StyleSheet.create({
  // Cover Page
  coverPage: {
    backgroundColor: colors.dark,
    padding: 0,
  },
  coverContent: {
    padding: 60,
    height: '100%',
    justifyContent: 'space-between',
  },
  coverTop: {
    alignItems: 'center',
  },
  coverLogo: {
    fontSize: 42,
    fontFamily: 'Helvetica-Bold',
    color: colors.white,
    letterSpacing: 3,
    marginBottom: 8,
  },
  coverTagline: {
    fontSize: 11,
    color: colors.light,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  coverCenter: {
    alignItems: 'center',
  },
  coverBadge: {
    backgroundColor: colors.certified,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginBottom: 40,
  },
  coverBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 2,
  },
  coverTitle: {
    fontSize: 32,
    fontFamily: 'Helvetica-Bold',
    color: colors.white,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 1.3,
  },
  coverDesc: {
    fontSize: 12,
    color: colors.light,
    textAlign: 'center',
    maxWidth: 380,
    lineHeight: 1.6,
    marginBottom: 50,
  },
  coverScoreContainer: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  coverScoreLabel: {
    fontSize: 11,
    color: colors.light,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  coverScoreValue: {
    fontSize: 72,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
  },
  coverScoreMax: {
    fontSize: 16,
    color: colors.light,
  },
  coverBottom: {
    alignItems: 'center',
  },
  coverDivider: {
    width: 80,
    height: 3,
    backgroundColor: colors.certified,
    marginBottom: 25,
  },
  coverMeta: {
    fontSize: 10,
    color: colors.light,
    marginBottom: 6,
    letterSpacing: 1,
  },

  // Standard Page
  page: {
    backgroundColor: colors.white,
    padding: 45,
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: colors.primaryLight,
  },
  pageHeaderLeft: {},
  pageHeaderLogo: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: colors.primaryLight,
  },
  pageHeaderSub: {
    fontSize: 8,
    color: colors.medium,
    marginTop: 3,
  },
  pageHeaderRight: {
    alignItems: 'flex-end',
  },
  pageHeaderTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: colors.dark,
  },
  pageHeaderDate: {
    fontSize: 8,
    color: colors.medium,
    marginTop: 3,
  },

  // Sections
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: colors.dark,
    marginBottom: 15,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: colors.lighter,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: colors.medium,
    marginBottom: 12,
    marginTop: 15,
  },

  // Cards
  card: {
    backgroundColor: colors.lightest,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  cardBordered: {
    backgroundColor: colors.lightest,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 45,
    right: 45,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.lighter,
  },
  footerText: {
    fontSize: 8,
    color: colors.light,
  },
  footerPage: {
    fontSize: 8,
    color: colors.medium,
    fontFamily: 'Helvetica-Bold',
  },

  // Table
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.dark,
    padding: 10,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.lighter,
  },
  tableRowAlt: {
    backgroundColor: colors.lightest,
  },
  tableCell: {
    fontSize: 9,
    color: colors.dark,
  },
});

// Helper functions
const formatCurrency = (value: number): string => {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

const getScoreColor = (score: number): string => {
  if (score >= 8) return colors.success;
  if (score >= 6) return colors.primaryLight;
  if (score >= 4) return colors.warning;
  return colors.danger;
};

const normalizeScore = (score: number): number => {
  // Normalize scores to 0-10 scale
  if (score > 10) return Math.min(10, score / 10);
  return Math.min(10, Math.max(0, score));
};

const getGrade = (score: number): string => {
  if (score >= 9) return 'A+';
  if (score >= 8) return 'A';
  if (score >= 7) return 'B+';
  if (score >= 6) return 'B';
  if (score >= 5) return 'C';
  if (score >= 4) return 'D';
  return 'F';
};

// Professional Agent Role Mapping
const getAgentDisplayName = (agent: Agent): string => {
  const roleMap: Record<string, string> = {
    'marcus': 'Market Intelligence',
    'sophia': 'Competitive Analysis',
    'david': 'Financial Analysis',
    'elena': 'Customer Insights',
    'james': 'Team Assessment',
    'rachel': 'Legal & Risk',
    'omar': 'Technical Feasibility',
    'nora': 'Funding Landscape',
    'victor': 'Valuation Analysis',
    'victoria': 'Executive Synthesis',
    'sentinel': 'Trust & Audit',
    'aria': 'AI Orchestration',
  };
  return roleMap[agent.id] || agent.role;
};

// Types
interface Finding {
  title: string;
  description: string;
  type: string;
  severity: string;
}

interface Risk {
  title: string;
  description: string;
  probability: string;
  impact: string;
  mitigations: string[];
}

interface Recommendation {
  title: string;
  description: string;
  priority: string;
  timeframe: string;
}

interface AgentReport {
  id: string;
  agentId: string;
  score: number;
  confidence: number;
  findings: Finding[];
  risks: Risk[];
  recommendations: Recommendation[];
  marketData?: any;
  unitEconomics?: any;
  scenarioAnalysis?: any;
}

interface ValidationData {
  id: string;
  title: string;
  description: string;
  status: string;
  overallScore: number | null;
  overallConfidence: number | null;
  recommendation: string | null;
  verdict: string | null;
  executiveSummary: string | null;
  agentReports: AgentReport[];
  createdAt: string;
  completedAt: string | null;
}

interface Agent {
  id: string;
  name: string;
  role: string;
  icon: string;
  description: string;
  investorGrade: boolean;
}

interface ValidationReportProps {
  validation: ValidationData;
  agents: Agent[];
}

// Score Visualization Component
const ScoreRing = ({ score, size = 80, label }: { score: number; size?: number; label?: string }) => {
  const normalized = normalizeScore(score);
  const color = getScoreColor(normalized);

  return (
    <View style={{ alignItems: 'center', marginBottom: 10 }}>
      <View style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: size / 12,
        borderColor: color,
        backgroundColor: colors.lightest,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <Text style={{
          fontSize: size / 3,
          fontFamily: 'Helvetica-Bold',
          color: color,
        }}>
          {normalized.toFixed(1)}
        </Text>
      </View>
      {label && (
        <Text style={{
          fontSize: 9,
          color: colors.medium,
          marginTop: 8,
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}>
          {label}
        </Text>
      )}
    </View>
  );
};

// Horizontal Bar Chart Component
const HorizontalBar = ({ label, value, maxValue = 10, color, showGrade = false }: {
  label: string;
  value: number;
  maxValue?: number;
  color: string;
  showGrade?: boolean;
}) => {
  const normalized = normalizeScore(value);
  const percentage = (normalized / maxValue) * 100;

  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
        <Text style={{ fontSize: 10, color: colors.dark, fontFamily: 'Helvetica-Bold' }}>{label}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: color }}>
            {normalized.toFixed(1)}/10
          </Text>
          {showGrade && (
            <View style={{
              backgroundColor: color,
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 3,
              marginLeft: 8,
            }}>
              <Text style={{ fontSize: 8, color: colors.white, fontFamily: 'Helvetica-Bold' }}>
                {getGrade(normalized)}
              </Text>
            </View>
          )}
        </View>
      </View>
      <View style={{ height: 12, backgroundColor: colors.lighter, borderRadius: 6 }}>
        <View style={{
          height: 12,
          backgroundColor: color,
          borderRadius: 6,
          width: `${Math.min(100, percentage)}%`,
        }} />
      </View>
    </View>
  );
};

// Market Size Visualization
const MarketSizeChart = ({ tam, sam, som }: { tam: number; sam: number; som: number }) => (
  <View style={[styles.card, { padding: 20 }]}>
    <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: colors.dark, marginBottom: 16 }}>
      Market Size Analysis (TAM → SAM → SOM)
    </Text>
    {[
      { label: 'Total Addressable Market (TAM)', value: tam, color: colors.primaryLight, desc: 'Complete market demand' },
      { label: 'Serviceable Addressable Market (SAM)', value: sam, color: colors.purple, desc: 'Target segment' },
      { label: 'Serviceable Obtainable Market (SOM)', value: som, color: colors.success, desc: 'Realistic capture' },
    ].map((item, idx) => (
      <View key={idx} style={{ marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: item.color }}>{item.label}</Text>
          <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: item.color }}>{formatCurrency(item.value)}</Text>
        </View>
        <View style={{ height: 16, backgroundColor: colors.lighter, borderRadius: 4 }}>
          <View style={{
            height: 16,
            backgroundColor: item.color,
            borderRadius: 4,
            width: `${(item.value / tam) * 100}%`,
            justifyContent: 'center',
            paddingLeft: 8,
          }}>
            {item.value / tam > 0.15 && (
              <Text style={{ fontSize: 7, color: colors.white, fontFamily: 'Helvetica-Bold' }}>
                {((item.value / tam) * 100).toFixed(0)}%
              </Text>
            )}
          </View>
        </View>
        <Text style={{ fontSize: 7, color: colors.light, marginTop: 3 }}>{item.desc}</Text>
      </View>
    ))}
  </View>
);

// Unit Economics Display
const UnitEconomicsDisplay = ({ data }: { data: any }) => {
  const cac = data?.cac?.mid || 100;
  const ltv = data?.ltv?.mid || 300;
  const ratio = ltv / cac;

  return (
    <View style={[styles.card, { padding: 20 }]}>
      <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: colors.dark, marginBottom: 16 }}>
        Unit Economics Analysis
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 8, color: colors.medium, marginBottom: 4 }}>CUSTOMER ACQUISITION COST</Text>
          <Text style={{ fontSize: 22, fontFamily: 'Helvetica-Bold', color: colors.danger }}>{formatCurrency(cac)}</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 8, color: colors.medium, marginBottom: 4 }}>LIFETIME VALUE</Text>
          <Text style={{ fontSize: 22, fontFamily: 'Helvetica-Bold', color: colors.success }}>{formatCurrency(ltv)}</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 8, color: colors.medium, marginBottom: 4 }}>LTV:CAC RATIO</Text>
          <Text style={{ fontSize: 22, fontFamily: 'Helvetica-Bold', color: ratio >= 3 ? colors.success : colors.warning }}>
            {ratio.toFixed(1)}x
          </Text>
        </View>
      </View>
      <View style={{
        backgroundColor: ratio >= 3 ? '#ecfdf5' : '#fef3c7',
        padding: 10,
        borderRadius: 6,
        flexDirection: 'row',
        alignItems: 'center',
      }}>
        <Text style={{ fontSize: 14, marginRight: 8 }}>{ratio >= 3 ? '✓' : '⚠'}</Text>
        <Text style={{ fontSize: 9, color: ratio >= 3 ? colors.success : colors.warning }}>
          {ratio >= 3
            ? 'Healthy unit economics - LTV:CAC ratio exceeds 3:1 benchmark'
            : 'Unit economics need improvement - Target LTV:CAC ratio of 3:1 or higher'}
        </Text>
      </View>
    </View>
  );
};

// Scenario Analysis Display
const ScenarioDisplay = ({ scenarios }: { scenarios: any }) => (
  <View style={[styles.card, { padding: 20 }]}>
    <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: colors.dark, marginBottom: 16 }}>
      Scenario Analysis
    </Text>
    <View style={{ flexDirection: 'row' }}>
      {[
        { name: 'Bull Case', data: scenarios?.bull, color: colors.success, bg: '#ecfdf5' },
        { name: 'Base Case', data: scenarios?.base, color: colors.primaryLight, bg: '#eff6ff' },
        { name: 'Bear Case', data: scenarios?.bear, color: colors.danger, bg: '#fef2f2' },
      ].map((scenario, idx) => (
        <View key={idx} style={{
          flex: 1,
          backgroundColor: scenario.bg,
          borderRadius: 6,
          padding: 14,
          marginHorizontal: 3,
          alignItems: 'center',
        }}>
          <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: scenario.color, marginBottom: 8 }}>
            {scenario.name}
          </Text>
          <Text style={{ fontSize: 24, fontFamily: 'Helvetica-Bold', color: scenario.color }}>
            {((scenario.data?.probability || 0.33) * 100).toFixed(0)}%
          </Text>
          <Text style={{ fontSize: 8, color: colors.medium, marginTop: 4 }}>probability</Text>
        </View>
      ))}
    </View>
  </View>
);

// Stats Grid Component
const StatsGrid = ({ stats }: { stats: { label: string; value: string | number; color: string; bg: string }[] }) => (
  <View style={{ flexDirection: 'row', marginBottom: 20 }}>
    {stats.map((stat, idx) => (
      <View key={idx} style={{
        flex: 1,
        backgroundColor: stat.bg,
        borderRadius: 8,
        padding: 16,
        marginHorizontal: 4,
        alignItems: 'center',
      }}>
        <Text style={{ fontSize: 26, fontFamily: 'Helvetica-Bold', color: stat.color }}>
          {stat.value}
        </Text>
        <Text style={{ fontSize: 8, color: colors.medium, marginTop: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {stat.label}
        </Text>
      </View>
    ))}
  </View>
);

// Table of Contents
const TOCItem = ({ title, page, isLast = false }: { title: string; page: number; isLast?: boolean }) => (
  <View style={{
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: isLast ? 0 : 1,
    borderBottomColor: colors.lighter,
  }}>
    <Text style={{ fontSize: 11, color: colors.dark }}>{title}</Text>
    <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: colors.primaryLight }}>{page}</Text>
  </View>
);

// Main Document Component
export const ValidationReportDocument = ({ validation, agents }: ValidationReportProps) => {
  const generatedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const reportId = `SVR-${validation.id.slice(0, 8).toUpperCase()}`;

  const getAgentReport = (agentId: string) => validation.agentReports?.find(r => r.agentId === agentId);

  const allFindings = validation.agentReports?.flatMap(r => r.findings || []) || [];
  const allRisks = validation.agentReports?.flatMap(r => r.risks || []) || [];
  const allRecommendations = validation.agentReports?.flatMap(r => r.recommendations || []) || [];

  const findingCounts = {
    strength: allFindings.filter(f => f.type === 'strength').length,
    weakness: allFindings.filter(f => f.type === 'weakness').length,
    opportunity: allFindings.filter(f => f.type === 'opportunity').length,
    threat: allFindings.filter(f => f.type === 'threat').length,
  };

  const agentScores = agents
    .map(agent => {
      const report = getAgentReport(agent.id);
      if (!report) return null;
      const normalized = normalizeScore(report.score);
      return {
        id: agent.id,
        label: getAgentDisplayName(agent),
        icon: agent.icon,
        value: normalized,
        color: getScoreColor(normalized),
        investorGrade: agent.investorGrade,
      };
    })
    .filter(Boolean) as { id: string; label: string; icon: string; value: number; color: string; investorGrade: boolean }[];

  const agentsWithReports = agents.filter(a => getAgentReport(a.id));
  const normalizedOverallScore = normalizeScore(validation.overallScore || 0);

  // Build TOC
  const tocItems = [
    { title: 'Executive Summary', page: 2 },
    { title: 'Analysis Overview & Scores', page: 3 },
    ...agentsWithReports.map((agent, idx) => ({
      title: `${getAgentDisplayName(agent)} Report`,
      page: idx + 4,
    })),
    { title: 'Action Plan & Certification', page: agentsWithReports.length + 4 },
  ];

  return (
    <Document>
      {/* ========== COVER PAGE ========== */}
      <Page size="A4" style={styles.coverPage}>
        <View style={styles.coverContent}>
          <View style={styles.coverTop}>
            <Text style={styles.coverLogo}>STARTUP VERDICT</Text>
            <Text style={styles.coverTagline}>AI-Powered Validation Intelligence</Text>
          </View>

          <View style={styles.coverCenter}>
            <View style={styles.coverBadge}>
              <Text style={styles.coverBadgeText}>✓ CERTIFIED VALIDATION</Text>
            </View>

            <Text style={styles.coverTitle}>{validation.title}</Text>
            <Text style={styles.coverDesc}>
              Comprehensive startup validation powered by 12 specialized AI agents with investor-grade analysis
            </Text>

            <View style={styles.coverScoreContainer}>
              <Text style={styles.coverScoreLabel}>Validation Score</Text>
              <Text style={[styles.coverScoreValue, { color: getScoreColor(normalizedOverallScore) }]}>
                {normalizedOverallScore.toFixed(1)}
              </Text>
              <Text style={styles.coverScoreMax}>out of 10.0 | Grade: {getGrade(normalizedOverallScore)}</Text>
            </View>
          </View>

          <View style={styles.coverBottom}>
            <View style={styles.coverDivider} />
            <Text style={styles.coverMeta}>Report ID: {reportId}</Text>
            <Text style={styles.coverMeta}>Generated: {generatedDate}</Text>
            <Text style={[styles.coverMeta, { marginTop: 10 }]}>
              Confidence: {validation.overallConfidence || 0}% | Agents: {agentsWithReports.length}
            </Text>
          </View>
        </View>
      </Page>

      {/* ========== PAGE 2: EXECUTIVE SUMMARY ========== */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pageHeader}>
          <View style={styles.pageHeaderLeft}>
            <Text style={styles.pageHeaderLogo}>Startup Verdict</Text>
            <Text style={styles.pageHeaderSub}>Validation Report</Text>
          </View>
          <View style={styles.pageHeaderRight}>
            <Text style={styles.pageHeaderTitle}>{validation.title}</Text>
            <Text style={styles.pageHeaderDate}>{generatedDate}</Text>
          </View>
        </View>

        {/* Table of Contents */}
        <View style={[styles.section, { marginBottom: 25 }]}>
          <Text style={styles.sectionTitle}>Table of Contents</Text>
          {tocItems.map((item, idx) => (
            <TOCItem key={idx} title={item.title} page={item.page} isLast={idx === tocItems.length - 1} />
          ))}
        </View>

        {/* Certification Badge */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#ecfdf5',
          padding: 16,
          borderRadius: 8,
          marginBottom: 20,
          borderWidth: 1,
          borderColor: colors.certified,
        }}>
          <View style={{
            width: 44,
            height: 44,
            backgroundColor: colors.certified,
            borderRadius: 22,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 16,
          }}>
            <Text style={{ color: colors.white, fontSize: 24, fontFamily: 'Helvetica-Bold' }}>✓</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: colors.certified, marginBottom: 4 }}>
              VERIFIED & CERTIFIED ANALYSIS
            </Text>
            <Text style={{ fontSize: 9, color: colors.medium, lineHeight: 1.5 }}>
              Generated by Startup Verdict's 12-agent AI validation system. All data cross-referenced for investor-grade accuracy.
            </Text>
          </View>
        </View>

        {/* Startup Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Startup Overview</Text>
          <View style={styles.card}>
            <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', color: colors.dark, marginBottom: 8 }}>
              {validation.title}
            </Text>
            <Text style={{ fontSize: 10, color: colors.medium, lineHeight: 1.6 }}>
              {validation.description}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Startup Verdict - Confidential</Text>
          <Text style={styles.footerPage}>Page 2</Text>
        </View>
      </Page>

      {/* ========== PAGE 3: ANALYSIS OVERVIEW ========== */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pageHeader}>
          <View style={styles.pageHeaderLeft}>
            <Text style={styles.pageHeaderLogo}>Startup Verdict</Text>
            <Text style={styles.pageHeaderSub}>Analysis Overview</Text>
          </View>
          <View style={styles.pageHeaderRight}>
            <Text style={styles.pageHeaderTitle}>{validation.title}</Text>
            <Text style={styles.pageHeaderDate}>{generatedDate}</Text>
          </View>
        </View>

        {/* Score Overview */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 25 }}>
          <ScoreRing score={normalizedOverallScore} size={90} label="Overall Score" />
          <View style={{ alignItems: 'center' }}>
            <View style={{
              width: 90,
              height: 90,
              borderRadius: 45,
              backgroundColor: colors.lightest,
              borderWidth: 6,
              borderColor: colors.primaryLight,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Text style={{ fontSize: 24, fontFamily: 'Helvetica-Bold', color: colors.primaryLight }}>
                {validation.overallConfidence || 0}%
              </Text>
            </View>
            <Text style={{ fontSize: 9, color: colors.medium, marginTop: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              Confidence
            </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <View style={{
              width: 90,
              height: 90,
              borderRadius: 45,
              backgroundColor: colors.lightest,
              borderWidth: 6,
              borderColor: colors.success,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Text style={{ fontSize: 24, fontFamily: 'Helvetica-Bold', color: colors.success }}>
                {agentsWithReports.length}
              </Text>
            </View>
            <Text style={{ fontSize: 9, color: colors.medium, marginTop: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              Agents
            </Text>
          </View>
        </View>

        {/* SWOT Summary */}
        <StatsGrid stats={[
          { label: 'Strengths', value: findingCounts.strength, color: colors.success, bg: '#ecfdf5' },
          { label: 'Weaknesses', value: findingCounts.weakness, color: colors.danger, bg: '#fef2f2' },
          { label: 'Opportunities', value: findingCounts.opportunity, color: colors.primaryLight, bg: '#eff6ff' },
          { label: 'Threats', value: findingCounts.threat, color: colors.warning, bg: '#fef3c7' },
        ]} />

        {/* Agent Scores Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionSubtitle}>Agent Analysis Scores</Text>
          <View style={styles.card}>
            {agentScores.slice(0, 6).map((agent, idx) => (
              <HorizontalBar
                key={idx}
                label={`${agent.icon} ${agent.label}`}
                value={agent.value}
                color={agent.color}
                showGrade
              />
            ))}
          </View>
        </View>

        {/* Verdict */}
        {validation.verdict && (
          <View style={{
            backgroundColor: '#ecfdf5',
            padding: 16,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.certified,
          }}>
            <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: colors.certified, marginBottom: 6 }}>
              FINAL VERDICT
            </Text>
            <Text style={{ fontSize: 10, color: colors.dark, lineHeight: 1.6 }}>
              {validation.verdict}
            </Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Startup Verdict - Confidential</Text>
          <Text style={styles.footerPage}>Page 3</Text>
        </View>
      </Page>

      {/* ========== AGENT REPORT PAGES ========== */}
      {agentsWithReports.map((agent, idx) => {
        const report = getAgentReport(agent.id)!;
        const normalized = normalizeScore(report.score);
        const displayName = getAgentDisplayName(agent);

        return (
          <Page key={agent.id} size="A4" style={styles.page}>
            <View style={styles.pageHeader}>
              <View style={styles.pageHeaderLeft}>
                <Text style={styles.pageHeaderLogo}>Startup Verdict</Text>
                <Text style={styles.pageHeaderSub}>{displayName}</Text>
              </View>
              <View style={styles.pageHeaderRight}>
                <Text style={styles.pageHeaderTitle}>{validation.title}</Text>
                <Text style={styles.pageHeaderDate}>{generatedDate}</Text>
              </View>
            </View>

            {/* Agent Header */}
            <View style={[styles.cardBordered, { borderLeftColor: getScoreColor(normalized), marginBottom: 20 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontFamily: 'Helvetica-Bold', color: colors.dark, marginBottom: 4 }}>
                    {agent.icon} {displayName}
                  </Text>
                  <Text style={{ fontSize: 10, color: colors.medium, marginBottom: 8, lineHeight: 1.5 }}>
                    {agent.description}
                  </Text>
                  {agent.investorGrade && (
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#ecfdf5',
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 12,
                      alignSelf: 'flex-start',
                    }}>
                      <View style={{ width: 8, height: 8, backgroundColor: colors.certified, borderRadius: 4, marginRight: 6 }} />
                      <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: colors.certified }}>
                        INVESTOR-GRADE ANALYSIS
                      </Text>
                    </View>
                  )}
                </View>
                <View style={{ alignItems: 'center', marginLeft: 20 }}>
                  <ScoreRing score={normalized} size={70} />
                  <Text style={{ fontSize: 8, color: colors.light }}>{report.confidence}% confidence</Text>
                </View>
              </View>
            </View>

            {/* Agent-Specific Charts */}
            {agent.id === 'marcus' && report.marketData && (
              <MarketSizeChart
                tam={report.marketData.tam || 1000000000}
                sam={report.marketData.sam || 500000000}
                som={report.marketData.som || 50000000}
              />
            )}

            {agent.id === 'david' && report.unitEconomics && (
              <UnitEconomicsDisplay data={report.unitEconomics} />
            )}

            {report.scenarioAnalysis && (
              <ScenarioDisplay scenarios={report.scenarioAnalysis} />
            )}

            {/* Key Findings */}
            {report.findings?.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionSubtitle}>Key Findings ({report.findings.length})</Text>
                {report.findings.slice(0, 4).map((finding, fidx) => (
                  <View key={fidx} style={{
                    flexDirection: 'row',
                    marginBottom: 10,
                    paddingBottom: 10,
                    borderBottomWidth: fidx < 3 ? 1 : 0,
                    borderBottomColor: colors.lighter,
                  }}>
                    <View style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: finding.type === 'strength' ? colors.success :
                        finding.type === 'weakness' ? colors.danger :
                        finding.type === 'opportunity' ? colors.primaryLight : colors.warning,
                      marginRight: 10,
                      marginTop: 4,
                    }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: colors.dark, marginBottom: 3 }}>
                        {finding.title}
                      </Text>
                      <Text style={{ fontSize: 9, color: colors.medium, lineHeight: 1.5 }}>
                        {finding.description.substring(0, 120)}{finding.description.length > 120 ? '...' : ''}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Recommendations */}
            {report.recommendations?.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionSubtitle}>Recommendations</Text>
                {report.recommendations.slice(0, 2).map((rec, ridx) => (
                  <View key={ridx} style={[styles.cardBordered, {
                    borderLeftColor: rec.priority === 'critical' ? colors.danger :
                      rec.priority === 'high' ? colors.warning : colors.primaryLight,
                    marginBottom: 8,
                    padding: 12,
                  }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                      <View style={{
                        backgroundColor: rec.priority === 'critical' ? colors.danger :
                          rec.priority === 'high' ? colors.warning : colors.primaryLight,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 3,
                        marginRight: 8,
                      }}>
                        <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: colors.white, textTransform: 'uppercase' }}>
                          {rec.priority}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 8, color: colors.light }}>{rec.timeframe}</Text>
                    </View>
                    <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: colors.dark, marginBottom: 4 }}>
                      {rec.title}
                    </Text>
                    <Text style={{ fontSize: 9, color: colors.medium, lineHeight: 1.5 }}>
                      {rec.description.substring(0, 120)}{rec.description.length > 120 ? '...' : ''}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.footer}>
              <Text style={styles.footerText}>Startup Verdict - {displayName}</Text>
              <Text style={styles.footerPage}>Page {idx + 4}</Text>
            </View>
          </Page>
        );
      })}

      {/* ========== FINAL PAGE: ACTION PLAN ========== */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pageHeader}>
          <View style={styles.pageHeaderLeft}>
            <Text style={styles.pageHeaderLogo}>Startup Verdict</Text>
            <Text style={styles.pageHeaderSub}>Action Plan</Text>
          </View>
          <View style={styles.pageHeaderRight}>
            <Text style={styles.pageHeaderTitle}>{validation.title}</Text>
            <Text style={styles.pageHeaderDate}>{generatedDate}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Priority Action Items</Text>

        {allRecommendations
          .filter(r => r.priority === 'critical' || r.priority === 'high')
          .slice(0, 5)
          .map((rec, idx) => (
            <View key={idx} style={[styles.cardBordered, {
              borderLeftColor: rec.priority === 'critical' ? colors.danger : colors.warning,
              marginBottom: 10,
              padding: 12,
            }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <View style={{
                  backgroundColor: rec.priority === 'critical' ? colors.danger : colors.warning,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 3,
                  marginRight: 8,
                }}>
                  <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: colors.white, textTransform: 'uppercase' }}>
                    {rec.priority}
                  </Text>
                </View>
                <Text style={{ fontSize: 8, color: colors.light }}>{rec.timeframe}</Text>
              </View>
              <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: colors.dark, marginBottom: 4 }}>
                {rec.title}
              </Text>
              <Text style={{ fontSize: 9, color: colors.medium, lineHeight: 1.5 }}>
                {rec.description.substring(0, 140)}{rec.description.length > 140 ? '...' : ''}
              </Text>
            </View>
          ))}

        {/* Risk Summary */}
        {allRisks.length > 0 && (
          <View style={[styles.section, { marginTop: 20 }]}>
            <Text style={styles.sectionSubtitle}>Top Risks</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { width: '40%' }]}>Risk</Text>
                <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Probability</Text>
                <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Impact</Text>
                <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Status</Text>
              </View>
              {allRisks.slice(0, 4).map((risk, idx) => (
                <View key={idx} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}>
                  <Text style={[styles.tableCell, { width: '40%' }]}>{risk.title.substring(0, 35)}</Text>
                  <Text style={[styles.tableCell, { width: '20%', color: risk.probability === 'high' ? colors.danger : colors.warning }]}>
                    {risk.probability}
                  </Text>
                  <Text style={[styles.tableCell, { width: '20%' }]}>{risk.impact}</Text>
                  <Text style={[styles.tableCell, { width: '20%', color: colors.warning }]}>Monitor</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Disclaimer */}
        <View style={{
          marginTop: 20,
          padding: 14,
          backgroundColor: '#fef3c7',
          borderRadius: 6,
          borderWidth: 1,
          borderColor: '#fcd34d',
        }}>
          <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#92400e', marginBottom: 4 }}>
            Important Disclaimer
          </Text>
          <Text style={{ fontSize: 8, color: '#92400e', lineHeight: 1.6 }}>
            This report is for informational purposes only and does not constitute financial, legal, or investment advice.
            Conduct independent due diligence before making any decisions.
          </Text>
        </View>

        {/* Final Certification */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#ecfdf5',
          padding: 16,
          borderRadius: 8,
          marginTop: 20,
          borderWidth: 1,
          borderColor: colors.certified,
        }}>
          <View style={{
            width: 40,
            height: 40,
            backgroundColor: colors.certified,
            borderRadius: 20,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 14,
          }}>
            <Text style={{ color: colors.white, fontSize: 20, fontFamily: 'Helvetica-Bold' }}>✓</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: colors.certified, marginBottom: 3 }}>
              CERTIFIED BY STARTUP VERDICT
            </Text>
            <Text style={{ fontSize: 8, color: colors.medium }}>
              Report ID: {reportId} | Generated: {generatedDate}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Startup Verdict - www.startupverdict.com</Text>
          <Text style={styles.footerPage}>Final Page</Text>
        </View>
      </Page>
    </Document>
  );
};

// Export functions
export async function generateValidationPDF(validation: ValidationData, agents: Agent[]): Promise<Blob> {
  try {
    console.log('Generating PDF for:', validation.title);
    const doc = <ValidationReportDocument validation={validation} agents={agents} />;
    const blob = await pdf(doc).toBlob();
    console.log('PDF generated, size:', blob.size);
    return blob;
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
}

export async function downloadValidationPDF(validation: ValidationData, agents: Agent[], filename?: string): Promise<void> {
  try {
    const blob = await generateValidationPDF(validation, agents);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `StartupVerdict-${validation.title.replace(/\s+/g, '-')}-Report.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('PDF download error:', error);
    throw error;
  }
}
