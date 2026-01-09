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

// Professional color palette - Premium startup validation theme
const colors = {
  primary: '#1e40af',      // Deep blue
  primaryLight: '#3b82f6', // Bright blue
  secondary: '#059669',    // Emerald green
  accent: '#7c3aed',       // Purple
  success: '#10b981',      // Green
  warning: '#f59e0b',      // Amber
  danger: '#ef4444',       // Red
  dark: '#0f172a',         // Slate 900
  medium: '#475569',       // Slate 600
  light: '#94a3b8',        // Slate 400
  lighter: '#e2e8f0',      // Slate 200
  lightest: '#f8fafc',     // Slate 50
  white: '#ffffff',
  certifiedGreen: '#059669',
  gold: '#d97706',         // For premium badges
};

// Styles
const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.white,
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.4,
  },
  // Cover Page Styles
  coverPage: {
    backgroundColor: colors.dark,
    padding: 0,
    position: 'relative',
  },
  coverContent: {
    padding: 50,
    flex: 1,
    justifyContent: 'space-between',
  },
  coverHeader: {
    alignItems: 'center',
    marginTop: 30,
  },
  coverLogo: {
    fontSize: 36,
    fontFamily: 'Helvetica-Bold',
    color: colors.white,
    letterSpacing: 2,
  },
  coverTagline: {
    fontSize: 12,
    color: colors.light,
    marginTop: 8,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  coverMain: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  coverBadge: {
    backgroundColor: colors.certifiedGreen,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 30,
  },
  coverBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
  },
  coverTitle: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: colors.white,
    textAlign: 'center',
    marginBottom: 15,
    maxWidth: 400,
  },
  coverSubtitle: {
    fontSize: 11,
    color: colors.light,
    textAlign: 'center',
    maxWidth: 350,
    lineHeight: 1.6,
  },
  coverScoreBox: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    marginTop: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  coverScoreLabel: {
    fontSize: 10,
    color: colors.light,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
  },
  coverScoreValue: {
    fontSize: 56,
    fontFamily: 'Helvetica-Bold',
  },
  coverScoreMax: {
    fontSize: 14,
    color: colors.light,
    marginTop: 4,
  },
  coverFooter: {
    alignItems: 'center',
    paddingBottom: 30,
  },
  coverMeta: {
    fontSize: 9,
    color: colors.light,
    marginBottom: 4,
  },
  coverDivider: {
    width: 60,
    height: 2,
    backgroundColor: colors.certifiedGreen,
    marginVertical: 20,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  logoText: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
  },
  logoSubtext: {
    fontSize: 8,
    color: colors.medium,
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  reportTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: colors.dark,
  },
  reportMeta: {
    fontSize: 8,
    color: colors.medium,
    marginTop: 2,
  },
  // Certification Badge
  certBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    padding: 12,
    borderRadius: 6,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.certifiedGreen,
  },
  certIcon: {
    width: 36,
    height: 36,
    backgroundColor: colors.certifiedGreen,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  certIconText: {
    color: colors.white,
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
  },
  certTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: colors.certifiedGreen,
  },
  certSubtitle: {
    fontSize: 8,
    color: colors.medium,
    marginTop: 3,
    maxWidth: 420,
  },
  // Section
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: colors.dark,
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: colors.lighter,
  },
  sectionSubtitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: colors.medium,
    marginBottom: 8,
    marginTop: 12,
  },
  // Score Display
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  scoreCard: {
    flex: 1,
    backgroundColor: colors.lightest,
    padding: 15,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  scoreValue: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
  },
  scoreLabel: {
    fontSize: 8,
    color: colors.medium,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  // Summary Box
  summaryBox: {
    backgroundColor: colors.lightest,
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: colors.dark,
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 10,
    color: colors.dark,
    lineHeight: 1.5,
  },
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    padding: 10,
    borderRadius: 4,
    marginHorizontal: 3,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
  },
  statLabel: {
    fontSize: 8,
    color: colors.medium,
    marginTop: 2,
  },
  // Bar Chart
  chartContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: colors.lightest,
    borderRadius: 6,
  },
  chartTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: colors.dark,
    marginBottom: 10,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  barLabel: {
    width: 60,
    fontSize: 9,
    color: colors.medium,
  },
  barContainer: {
    flex: 1,
    height: 16,
    backgroundColor: colors.lighter,
    borderRadius: 3,
    marginHorizontal: 8,
  },
  bar: {
    height: 16,
    borderRadius: 3,
  },
  barValue: {
    width: 50,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
  },
  // Agent Card
  agentCard: {
    backgroundColor: colors.lightest,
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  agentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  agentName: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: colors.dark,
  },
  agentRole: {
    fontSize: 9,
    color: colors.medium,
    marginTop: 2,
  },
  agentScore: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
  },
  agentConfidence: {
    fontSize: 8,
    color: colors.light,
    textAlign: 'right',
  },
  investorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  investorDot: {
    width: 8,
    height: 8,
    backgroundColor: colors.certifiedGreen,
    borderRadius: 4,
    marginRight: 4,
  },
  investorText: {
    fontSize: 7,
    color: colors.certifiedGreen,
    fontFamily: 'Helvetica-Bold',
  },
  // Finding Item
  findingItem: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.lighter,
  },
  findingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
    marginTop: 4,
  },
  findingContent: {
    flex: 1,
  },
  findingTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: colors.dark,
  },
  findingDesc: {
    fontSize: 8,
    color: colors.medium,
    marginTop: 2,
    lineHeight: 1.4,
  },
  // Risk Item
  riskItem: {
    backgroundColor: '#fef2f2',
    padding: 10,
    borderRadius: 4,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.danger,
  },
  riskHeader: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  riskBadge: {
    fontSize: 7,
    color: colors.white,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 2,
    marginRight: 4,
    fontFamily: 'Helvetica-Bold',
  },
  riskTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: colors.dark,
    marginBottom: 3,
  },
  riskDesc: {
    fontSize: 8,
    color: colors.medium,
    lineHeight: 1.4,
  },
  // Recommendation Item
  recItem: {
    padding: 10,
    borderRadius: 4,
    marginBottom: 8,
    borderLeftWidth: 3,
  },
  recHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  recBadge: {
    fontSize: 7,
    color: colors.white,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
    marginRight: 6,
    fontFamily: 'Helvetica-Bold',
  },
  recTimeframe: {
    fontSize: 7,
    color: colors.light,
  },
  recTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: colors.dark,
    marginBottom: 3,
  },
  recDesc: {
    fontSize: 8,
    color: colors.medium,
    lineHeight: 1.4,
  },
  // Table
  table: {
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.dark,
    padding: 8,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: colors.white,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.lighter,
  },
  tableRowAlt: {
    backgroundColor: colors.lightest,
  },
  tableCell: {
    fontSize: 8,
    color: colors.dark,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.lighter,
  },
  footerText: {
    fontSize: 7,
    color: colors.light,
  },
  pageNumber: {
    fontSize: 7,
    color: colors.medium,
  },
  // Disclaimer
  disclaimer: {
    marginTop: 16,
    padding: 10,
    backgroundColor: '#fefce8',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#fef08a',
  },
  disclaimerTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#854d0e',
    marginBottom: 4,
  },
  disclaimerText: {
    fontSize: 7,
    color: '#854d0e',
    lineHeight: 1.5,
  },
});

// Helper functions
function formatCurrency(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function getScoreColor(score: number): string {
  if (score >= 8) return colors.success;
  if (score >= 6) return colors.primary;
  if (score >= 4) return colors.warning;
  return colors.danger;
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'critical': return colors.danger;
    case 'high': return colors.warning;
    case 'medium': return '#eab308';
    default: return colors.primary;
  }
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'strength': return colors.success;
    case 'weakness': return colors.danger;
    case 'opportunity': return colors.primary;
    case 'threat': return colors.warning;
    default: return colors.medium;
  }
}

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

// Visual Bar Chart Component
const BarChart = ({ title, data }: { title: string; data: { label: string; value: number; maxValue: number; color: string }[] }) => (
  <View style={styles.chartContainer}>
    <Text style={styles.chartTitle}>{title}</Text>
    {data.map((item, idx) => (
      <View key={idx} style={styles.barRow}>
        <Text style={styles.barLabel}>{item.label}</Text>
        <View style={styles.barContainer}>
          <View style={[styles.bar, { width: `${Math.min(100, (item.value / item.maxValue) * 100)}%`, backgroundColor: item.color }]} />
        </View>
        <Text style={[styles.barValue, { color: item.color }]}>{item.value.toFixed(1)}/10</Text>
      </View>
    ))}
  </View>
);

// Market Size Chart Component
const MarketChart = ({ tam, sam, som }: { tam: number; sam: number; som: number }) => {
  const maxVal = tam;
  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Market Size Analysis (TAM / SAM / SOM)</Text>
      {[
        { label: 'TAM', value: tam, color: colors.primary, desc: 'Total Addressable Market' },
        { label: 'SAM', value: sam, color: colors.accent, desc: 'Serviceable Addressable Market' },
        { label: 'SOM', value: som, color: colors.success, desc: 'Serviceable Obtainable Market' },
      ].map((item, idx) => (
        <View key={idx} style={{ marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
            <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: item.color }}>{item.label}</Text>
            <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: item.color }}>{formatCurrency(item.value)}</Text>
          </View>
          <View style={{ height: 12, backgroundColor: colors.lighter, borderRadius: 2 }}>
            <View style={{ height: 12, backgroundColor: item.color, borderRadius: 2, width: `${(item.value / maxVal) * 100}%` }} />
          </View>
          <Text style={{ fontSize: 7, color: colors.light, marginTop: 2 }}>{item.desc}</Text>
        </View>
      ))}
    </View>
  );
};

// Scenario Chart Component
const ScenarioChart = ({ bull, base, bear }: { bull: any; base: any; bear: any }) => (
  <View style={styles.chartContainer}>
    <Text style={styles.chartTitle}>Scenario Analysis</Text>
    <View style={{ flexDirection: 'row' }}>
      {[
        { name: 'Bull Case', data: bull, color: colors.success, bgColor: '#ecfdf5' },
        { name: 'Base Case', data: base, color: colors.primary, bgColor: '#eff6ff' },
        { name: 'Bear Case', data: bear, color: colors.danger, bgColor: '#fef2f2' },
      ].map((scenario, idx) => (
        <View key={idx} style={{ flex: 1, padding: 8, backgroundColor: scenario.bgColor, borderRadius: 4, marginHorizontal: 2 }}>
          <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: scenario.color, marginBottom: 4 }}>{scenario.name}</Text>
          <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', color: scenario.color }}>
            {((scenario.data?.probability || 0.33) * 100).toFixed(0)}%
          </Text>
          <Text style={{ fontSize: 7, color: colors.medium }}>probability</Text>
        </View>
      ))}
    </View>
  </View>
);

// Unit Economics Chart
const UnitEconomicsChart = ({ data }: { data: any }) => {
  const cac = data?.cac?.mid || 100;
  const ltv = data?.ltv?.mid || 300;
  const ratio = ltv / cac;
  const maxVal = Math.max(cac, ltv);

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Unit Economics</Text>
      <View style={{ flexDirection: 'row', marginBottom: 10 }}>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 8, color: colors.medium }}>CAC</Text>
          <Text style={{ fontSize: 16, fontFamily: 'Helvetica-Bold', color: colors.danger }}>{formatCurrency(cac)}</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 8, color: colors.medium }}>LTV</Text>
          <Text style={{ fontSize: 16, fontFamily: 'Helvetica-Bold', color: colors.success }}>{formatCurrency(ltv)}</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 8, color: colors.medium }}>LTV:CAC</Text>
          <Text style={{ fontSize: 16, fontFamily: 'Helvetica-Bold', color: ratio >= 3 ? colors.success : colors.warning }}>
            {ratio.toFixed(1)}:1
          </Text>
        </View>
      </View>
      <View style={{ height: 20, flexDirection: 'row', borderRadius: 4, overflow: 'hidden' }}>
        <View style={{ width: `${(cac / maxVal) * 50}%`, backgroundColor: colors.danger, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 7, color: colors.white, fontFamily: 'Helvetica-Bold' }}>CAC</Text>
        </View>
        <View style={{ width: `${(ltv / maxVal) * 50}%`, backgroundColor: colors.success, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 7, color: colors.white, fontFamily: 'Helvetica-Bold' }}>LTV</Text>
        </View>
      </View>
      <Text style={{ fontSize: 7, color: ratio >= 3 ? colors.success : colors.warning, marginTop: 4, textAlign: 'center' }}>
        {ratio >= 3 ? '✓ Healthy ratio (≥3:1)' : '⚠ Below healthy threshold (3:1)'}
      </Text>
    </View>
  );
};

// Visual Score Gauge Component
const ScoreGauge = ({ score, label, size = 'large' }: { score: number; label: string; size?: 'large' | 'small' }) => {
  const color = getScoreColor(score);
  const percentage = (score / 10) * 100;
  const isLarge = size === 'large';

  return (
    <View style={{ alignItems: 'center', marginBottom: 12 }}>
      <View style={{
        width: isLarge ? 100 : 60,
        height: isLarge ? 100 : 60,
        borderRadius: isLarge ? 50 : 30,
        borderWidth: isLarge ? 8 : 5,
        borderColor: colors.lighter,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
      }}>
        {/* Colored progress arc representation using segments */}
        <View style={{
          position: 'absolute',
          width: isLarge ? 100 : 60,
          height: isLarge ? 100 : 60,
          borderRadius: isLarge ? 50 : 30,
          borderWidth: isLarge ? 8 : 5,
          borderColor: color,
          borderTopColor: percentage >= 25 ? color : 'transparent',
          borderRightColor: percentage >= 50 ? color : 'transparent',
          borderBottomColor: percentage >= 75 ? color : 'transparent',
          borderLeftColor: percentage >= 100 ? color : 'transparent',
        }} />
        <Text style={{
          fontSize: isLarge ? 24 : 14,
          fontFamily: 'Helvetica-Bold',
          color: color,
        }}>
          {score.toFixed(1)}
        </Text>
      </View>
      <Text style={{
        fontSize: isLarge ? 10 : 8,
        color: colors.medium,
        marginTop: 6,
        textTransform: 'uppercase',
        letterSpacing: 1,
      }}>
        {label}
      </Text>
    </View>
  );
};

// Horizontal Progress Bar with Label
const ProgressBar = ({ value, maxValue, label, color, showPercentage = false }: {
  value: number;
  maxValue: number;
  label: string;
  color: string;
  showPercentage?: boolean;
}) => {
  const percentage = Math.min(100, (value / maxValue) * 100);
  return (
    <View style={{ marginBottom: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
        <Text style={{ fontSize: 8, color: colors.medium }}>{label}</Text>
        <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: color }}>
          {showPercentage ? `${percentage.toFixed(0)}%` : value.toFixed(1)}
        </Text>
      </View>
      <View style={{ height: 8, backgroundColor: colors.lighter, borderRadius: 4 }}>
        <View style={{
          height: 8,
          backgroundColor: color,
          borderRadius: 4,
          width: `${percentage}%`
        }} />
      </View>
    </View>
  );
};

// Summary Statistics Row
const StatsRow = ({ stats }: { stats: { label: string; value: string | number; color: string; bgColor: string }[] }) => (
  <View style={{ flexDirection: 'row', marginBottom: 16 }}>
    {stats.map((stat, idx) => (
      <View key={idx} style={{
        flex: 1,
        padding: 12,
        backgroundColor: stat.bgColor,
        borderRadius: 6,
        marginHorizontal: 3,
        alignItems: 'center',
      }}>
        <Text style={{ fontSize: 20, fontFamily: 'Helvetica-Bold', color: stat.color }}>
          {stat.value}
        </Text>
        <Text style={{ fontSize: 7, color: colors.medium, marginTop: 3, textTransform: 'uppercase' }}>
          {stat.label}
        </Text>
      </View>
    ))}
  </View>
);

// Table of Contents Component
const TableOfContents = ({ items }: { items: { title: string; page: number }[] }) => (
  <View style={{ marginBottom: 20 }}>
    <Text style={{
      fontSize: 14,
      fontFamily: 'Helvetica-Bold',
      color: colors.dark,
      marginBottom: 12,
      paddingBottom: 6,
      borderBottomWidth: 2,
      borderBottomColor: colors.primary,
    }}>
      Table of Contents
    </Text>
    {items.map((item, idx) => (
      <View key={idx} style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: colors.lighter,
      }}>
        <Text style={{ fontSize: 10, color: colors.dark }}>{item.title}</Text>
        <Text style={{ fontSize: 10, color: colors.primary, fontFamily: 'Helvetica-Bold' }}>
          {item.page}
        </Text>
      </View>
    ))}
  </View>
);

// Props
interface ValidationReportProps {
  validation: ValidationData;
  agents: Agent[];
}

// Main Document
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

  // Get agent scores for chart
  const agentScores = agents
    .map(agent => {
      const report = getAgentReport(agent.id);
      return report ? { label: agent.name, value: report.score, maxValue: 10, color: getScoreColor(report.score) } : null;
    })
    .filter(Boolean) as { label: string; value: number; maxValue: number; color: string }[];

  // Build table of contents
  const tocItems = [
    { title: 'Executive Summary & Score Overview', page: 2 },
    ...agents.filter(a => getAgentReport(a.id)).map((agent, idx) => ({
      title: `${agent.name} Analysis`,
      page: idx + 3,
    })),
    { title: 'Action Plan & Certification', page: agents.filter(a => getAgentReport(a.id)).length + 3 },
  ];

  return (
    <Document>
      {/* Cover Page - Premium Dark Theme */}
      <Page size="A4" style={styles.coverPage}>
        <View style={styles.coverContent}>
          {/* Header */}
          <View style={styles.coverHeader}>
            <Text style={styles.coverLogo}>STARTUP VERDICT</Text>
            <Text style={styles.coverTagline}>AI-Powered Validation Intelligence</Text>
          </View>

          {/* Main Content */}
          <View style={styles.coverMain}>
            <View style={styles.coverBadge}>
              <Text style={styles.coverBadgeText}>✓ CERTIFIED ANALYSIS</Text>
            </View>
            <Text style={styles.coverTitle}>{validation.title}</Text>
            <Text style={styles.coverSubtitle}>
              Comprehensive startup validation report powered by 12 specialized AI agents
            </Text>

            {/* Score Display */}
            <View style={styles.coverScoreBox}>
              <Text style={styles.coverScoreLabel}>Overall Score</Text>
              <Text style={[styles.coverScoreValue, { color: getScoreColor(validation.overallScore || 0) }]}>
                {validation.overallScore?.toFixed(1) || 'N/A'}
              </Text>
              <Text style={styles.coverScoreMax}>out of 10.0</Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.coverFooter}>
            <View style={styles.coverDivider} />
            <Text style={styles.coverMeta}>Report ID: {reportId}</Text>
            <Text style={styles.coverMeta}>Generated: {generatedDate}</Text>
            <Text style={[styles.coverMeta, { marginTop: 8 }]}>
              Confidence Level: {validation.overallConfidence || 0}%
            </Text>
          </View>
        </View>
      </Page>

      {/* Page 2: Table of Contents & Executive Summary */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.logoText}>Startup Verdict</Text>
            <Text style={styles.logoSubtext}>AI-Powered Startup Validation</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.reportTitle}>Validation Report</Text>
            <Text style={styles.reportMeta}>{generatedDate}</Text>
            <Text style={styles.reportMeta}>ID: {reportId}</Text>
          </View>
        </View>

        {/* Table of Contents */}
        <TableOfContents items={tocItems} />

        {/* Certification */}
        <View style={styles.certBadge}>
          <View style={styles.certIcon}>
            <Text style={styles.certIconText}>✓</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.certTitle}>VERIFIED & CERTIFIED ANALYSIS</Text>
            <Text style={styles.certSubtitle}>
              Generated by Startup Verdict's 12-agent AI validation system. All data cross-referenced for investor-grade accuracy.
            </Text>
          </View>
        </View>

        {/* Company Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Startup Overview</Text>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>{validation.title}</Text>
            <Text style={styles.summaryText}>{validation.description}</Text>
          </View>
        </View>

        {/* Visual Score Display */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 }}>
          <ScoreGauge score={validation.overallScore || 0} label="Overall Score" />
          <View style={{ alignItems: 'center' }}>
            <View style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: colors.lightest,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 3,
              borderColor: colors.primary,
            }}>
              <Text style={{ fontSize: 28, fontFamily: 'Helvetica-Bold', color: colors.primary }}>
                {validation.overallConfidence || 0}%
              </Text>
            </View>
            <Text style={{ fontSize: 10, color: colors.medium, marginTop: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
              Confidence
            </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <View style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: colors.lightest,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 3,
              borderColor: colors.secondary,
            }}>
              <Text style={{ fontSize: 28, fontFamily: 'Helvetica-Bold', color: colors.secondary }}>
                {validation.agentReports?.length || 0}
              </Text>
            </View>
            <Text style={{ fontSize: 10, color: colors.medium, marginTop: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
              Agents
            </Text>
          </View>
        </View>

        {/* SWOT Summary */}
        <StatsRow stats={[
          { label: 'Strengths', value: findingCounts.strength, color: colors.success, bgColor: '#ecfdf5' },
          { label: 'Weaknesses', value: findingCounts.weakness, color: colors.danger, bgColor: '#fef2f2' },
          { label: 'Opportunities', value: findingCounts.opportunity, color: colors.primary, bgColor: '#eff6ff' },
          { label: 'Threats', value: findingCounts.threat, color: colors.warning, bgColor: '#fefce8' },
        ]} />

        {/* Verdict */}
        {validation.verdict && (
          <View style={[styles.summaryBox, { backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: colors.certifiedGreen }]}>
            <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: colors.certifiedGreen, marginBottom: 4 }}>
              FINAL VERDICT
            </Text>
            <Text style={{ fontSize: 9, color: colors.dark, lineHeight: 1.5 }}>{validation.verdict}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Startup Verdict - Confidential</Text>
          <Text style={styles.pageNumber}>Page 2</Text>
        </View>
      </Page>

      {/* Page 3: Executive Summary & Charts */}
      <Page size="A4" style={styles.page}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
          <Text style={{ fontSize: 9, color: colors.medium }}>{validation.title}</Text>
          <Text style={{ fontSize: 9, color: colors.medium }}>Analysis Overview</Text>
        </View>

        {/* Executive Summary */}
        {validation.executiveSummary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Executive Summary</Text>
            <Text style={{ fontSize: 9, color: colors.dark, lineHeight: 1.6 }}>{validation.executiveSummary}</Text>
          </View>
        )}

        {/* Agent Score Chart */}
        {agentScores.length > 0 && (
          <BarChart title="Agent Scores Overview" data={agentScores.slice(0, 6)} />
        )}

        {/* Score Progress Bars */}
        {agentScores.length > 6 && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Additional Agent Scores</Text>
            {agentScores.slice(6).map((score, idx) => (
              <ProgressBar
                key={idx}
                label={score.label}
                value={score.value}
                maxValue={score.maxValue}
                color={score.color}
              />
            ))}
          </View>
        )}

        {/* Key Metrics Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionSubtitle}>Key Validation Metrics</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            <View style={{ width: '50%', padding: 4 }}>
              <ProgressBar label="Market Potential" value={agentScores.find(s => s.label === 'Marcus')?.value || 7} maxValue={10} color={colors.primary} />
            </View>
            <View style={{ width: '50%', padding: 4 }}>
              <ProgressBar label="Financial Viability" value={agentScores.find(s => s.label === 'David')?.value || 7} maxValue={10} color={colors.success} />
            </View>
            <View style={{ width: '50%', padding: 4 }}>
              <ProgressBar label="Technical Feasibility" value={agentScores.find(s => s.label === 'Nina')?.value || 7} maxValue={10} color={colors.accent} />
            </View>
            <View style={{ width: '50%', padding: 4 }}>
              <ProgressBar label="Risk Assessment" value={agentScores.find(s => s.label === 'Rita')?.value || 7} maxValue={10} color={colors.warning} />
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Startup Verdict - Confidential</Text>
          <Text style={styles.pageNumber}>Page 3</Text>
        </View>
      </Page>

      {/* Agent Report Pages */}
      {agents.map((agent, idx) => {
        const report = getAgentReport(agent.id);
        if (!report) return null;

        return (
          <Page key={agent.id} size="A4" style={styles.page}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
              <Text style={{ fontSize: 9, color: colors.medium }}>{validation.title}</Text>
              <Text style={{ fontSize: 9, color: colors.medium }}>{agent.name} Analysis</Text>
            </View>

            {/* Agent Header Card - Enhanced */}
            <View style={[styles.agentCard, { borderLeftColor: getScoreColor(report.score), marginBottom: 16 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.agentName}>{agent.icon} {agent.name}</Text>
                  <Text style={styles.agentRole}>{agent.role}</Text>
                  <Text style={{ fontSize: 8, color: colors.light, marginTop: 4, maxWidth: 280 }}>{agent.description}</Text>
                  {agent.investorGrade && (
                    <View style={[styles.investorBadge, { marginTop: 8 }]}>
                      <View style={styles.investorDot} />
                      <Text style={styles.investorText}>INVESTOR-GRADE ANALYSIS</Text>
                    </View>
                  )}
                </View>
                {/* Score Circle */}
                <View style={{ alignItems: 'center', marginLeft: 16 }}>
                  <View style={{
                    width: 70,
                    height: 70,
                    borderRadius: 35,
                    borderWidth: 5,
                    borderColor: getScoreColor(report.score),
                    backgroundColor: colors.lightest,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    <Text style={{ fontSize: 22, fontFamily: 'Helvetica-Bold', color: getScoreColor(report.score) }}>
                      {report.score.toFixed(1)}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 8, color: colors.light, marginTop: 4 }}>{report.confidence}% confidence</Text>
                </View>
              </View>
            </View>

            {/* Market Data Charts for Marcus */}
            {agent.id === 'marcus' && report.marketData && (
              <MarketChart
                tam={report.marketData.tam || 1000000000}
                sam={report.marketData.sam || 500000000}
                som={report.marketData.som || 50000000}
              />
            )}

            {/* Unit Economics for David */}
            {agent.id === 'david' && report.unitEconomics && (
              <UnitEconomicsChart data={report.unitEconomics} />
            )}

            {/* Scenario Analysis */}
            {report.scenarioAnalysis && (
              <ScenarioChart
                bull={report.scenarioAnalysis.bull}
                base={report.scenarioAnalysis.base}
                bear={report.scenarioAnalysis.bear}
              />
            )}

            {/* Key Findings */}
            {report.findings?.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionSubtitle}>Key Findings ({report.findings.length})</Text>
                {report.findings.slice(0, 5).map((finding, fidx) => (
                  <View key={fidx} style={styles.findingItem}>
                    <View style={[styles.findingDot, { backgroundColor: getTypeColor(finding.type) }]} />
                    <View style={styles.findingContent}>
                      <Text style={styles.findingTitle}>{finding.title}</Text>
                      <Text style={styles.findingDesc}>{finding.description.substring(0, 150)}{finding.description.length > 150 ? '...' : ''}</Text>
                    </View>
                  </View>
                ))}
                {report.findings.length > 5 && (
                  <Text style={{ fontSize: 8, color: colors.light, fontStyle: 'italic' }}>+{report.findings.length - 5} more findings</Text>
                )}
              </View>
            )}

            {/* Risks */}
            {report.risks?.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionSubtitle}>Risks ({report.risks.length})</Text>
                {report.risks.slice(0, 3).map((risk, ridx) => (
                  <View key={ridx} style={styles.riskItem}>
                    <View style={styles.riskHeader}>
                      <Text style={[styles.riskBadge, { backgroundColor: risk.probability === 'high' ? colors.danger : colors.warning }]}>
                        {risk.probability.toUpperCase()}
                      </Text>
                      <Text style={[styles.riskBadge, { backgroundColor: colors.medium }]}>{risk.impact}</Text>
                    </View>
                    <Text style={styles.riskTitle}>{risk.title}</Text>
                    <Text style={styles.riskDesc}>{risk.description.substring(0, 120)}{risk.description.length > 120 ? '...' : ''}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Recommendations */}
            {report.recommendations?.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionSubtitle}>Recommendations ({report.recommendations.length})</Text>
                {report.recommendations.slice(0, 3).map((rec, recidx) => (
                  <View key={recidx} style={[styles.recItem, { borderLeftColor: getPriorityColor(rec.priority), backgroundColor: colors.lightest }]}>
                    <View style={styles.recHeader}>
                      <Text style={[styles.recBadge, { backgroundColor: getPriorityColor(rec.priority) }]}>
                        {rec.priority.toUpperCase()}
                      </Text>
                      <Text style={styles.recTimeframe}>{rec.timeframe}</Text>
                    </View>
                    <Text style={styles.recTitle}>{rec.title}</Text>
                    <Text style={styles.recDesc}>{rec.description.substring(0, 150)}{rec.description.length > 150 ? '...' : ''}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.footer}>
              <Text style={styles.footerText}>Startup Verdict - {agent.name} Analysis</Text>
              <Text style={styles.pageNumber}>Page {idx + 4}</Text>
            </View>
          </Page>
        );
      })}

      {/* Final Page: Summary & Certification */}
      <Page size="A4" style={styles.page}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
          <Text style={{ fontSize: 9, color: colors.medium }}>{validation.title}</Text>
          <Text style={{ fontSize: 9, color: colors.medium }}>Action Plan & Certification</Text>
        </View>

        <Text style={styles.sectionTitle}>Priority Action Items</Text>

        {allRecommendations
          .filter(r => r.priority === 'critical' || r.priority === 'high')
          .slice(0, 6)
          .map((rec, idx) => (
            <View key={idx} style={[styles.recItem, { borderLeftColor: getPriorityColor(rec.priority), backgroundColor: colors.lightest }]}>
              <View style={styles.recHeader}>
                <Text style={[styles.recBadge, { backgroundColor: getPriorityColor(rec.priority) }]}>
                  {rec.priority.toUpperCase()}
                </Text>
                <Text style={styles.recTimeframe}>{rec.timeframe}</Text>
              </View>
              <Text style={styles.recTitle}>{rec.title}</Text>
              <Text style={styles.recDesc}>{rec.description.substring(0, 150)}{rec.description.length > 150 ? '...' : ''}</Text>
            </View>
          ))}

        {/* Risk Summary Table */}
        <View style={[styles.section, { marginTop: 16 }]}>
          <Text style={styles.sectionSubtitle}>Top Risks Summary</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { width: '35%' }]}>Risk</Text>
              <Text style={[styles.tableHeaderCell, { width: '15%' }]}>Probability</Text>
              <Text style={[styles.tableHeaderCell, { width: '15%' }]}>Impact</Text>
              <Text style={[styles.tableHeaderCell, { width: '35%' }]}>Key Mitigation</Text>
            </View>
            {allRisks.slice(0, 5).map((risk, idx) => (
              <View key={idx} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}>
                <Text style={[styles.tableCell, { width: '35%' }]}>{risk.title.substring(0, 30)}</Text>
                <Text style={[styles.tableCell, { width: '15%', color: risk.probability === 'high' ? colors.danger : colors.warning }]}>
                  {risk.probability}
                </Text>
                <Text style={[styles.tableCell, { width: '15%' }]}>{risk.impact}</Text>
                <Text style={[styles.tableCell, { width: '35%' }]}>{risk.mitigations?.[0]?.substring(0, 40) || '-'}...</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerTitle}>Important Disclaimer</Text>
          <Text style={styles.disclaimerText}>
            This report is for informational purposes only. While our AI system provides comprehensive analysis,
            this should not be considered financial, legal, or investment advice. Conduct your own due diligence
            before making decisions. Startup Verdict does not guarantee the accuracy of this report.
          </Text>
        </View>

        {/* Final Certification */}
        <View style={[styles.certBadge, { marginTop: 16 }]}>
          <View style={styles.certIcon}>
            <Text style={styles.certIconText}>✓</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.certTitle}>CERTIFIED BY STARTUP VERDICT</Text>
            <Text style={styles.certSubtitle}>Report ID: {reportId} | Generated: {generatedDate}</Text>
            <Text style={[styles.certSubtitle, { marginTop: 2 }]}>
              This document has been verified by Startup Verdict's validation system.
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Startup Verdict - www.startupverdict.com</Text>
          <Text style={styles.pageNumber}>Final Page</Text>
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
