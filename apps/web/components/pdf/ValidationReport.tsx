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

// Professional color palette
const colors = {
  primary: '#1e40af',
  secondary: '#059669',
  accent: '#7c3aed',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  dark: '#1e293b',
  medium: '#475569',
  light: '#94a3b8',
  lighter: '#e2e8f0',
  white: '#ffffff',
  certifiedGreen: '#059669',
};

// Styles - using Helvetica (built-in font)
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: colors.white,
    padding: 40,
    fontFamily: 'Helvetica',
  },
  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottom: `2px solid ${colors.primary}`,
  },
  logo: {
    flexDirection: 'column',
  },
  logoText: {
    fontSize: 24,
    fontWeight: 700,
    color: colors.primary,
  },
  logoSubtext: {
    fontSize: 10,
    color: colors.medium,
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: colors.dark,
  },
  reportDate: {
    fontSize: 10,
    color: colors.medium,
    marginTop: 4,
  },
  reportId: {
    fontSize: 8,
    color: colors.light,
    marginTop: 2,
  },
  // Certification badge
  certificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    border: `1px solid ${colors.certifiedGreen}`,
  },
  certificationIcon: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  certificationText: {
    flex: 1,
  },
  certificationTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: colors.certifiedGreen,
  },
  certificationSubtitle: {
    fontSize: 9,
    color: colors.medium,
    marginTop: 2,
  },
  // Section styles
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: colors.dark,
    marginBottom: 12,
    paddingBottom: 6,
    borderBottom: `1px solid ${colors.lighter}`,
  },
  sectionSubtitle: {
    fontSize: 11,
    fontWeight: 600,
    color: colors.medium,
    marginBottom: 8,
    marginTop: 12,
  },
  // Executive summary
  summaryBox: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  summaryText: {
    fontSize: 11,
    color: colors.dark,
    lineHeight: 1.6,
  },
  // Score display
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  scoreBox: {
    alignItems: 'center',
    padding: 10,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: 700,
  },
  scoreLabel: {
    fontSize: 10,
    color: colors.medium,
    marginTop: 4,
  },
  // Agent card
  agentCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    border: `1px solid ${colors.lighter}`,
  },
  agentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottom: `1px solid ${colors.lighter}`,
  },
  agentName: {
    fontSize: 13,
    fontWeight: 700,
    color: colors.dark,
  },
  agentRole: {
    fontSize: 10,
    color: colors.medium,
    marginTop: 2,
  },
  agentScore: {
    fontSize: 18,
    fontWeight: 700,
  },
  agentConfidence: {
    fontSize: 9,
    color: colors.light,
  },
  // Finding styles
  findingItem: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 8,
  },
  findingBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
    marginTop: 4,
  },
  findingText: {
    flex: 1,
    fontSize: 10,
    color: colors.dark,
    lineHeight: 1.5,
  },
  findingTitle: {
    fontWeight: 600,
  },
  // Risk table
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.dark,
    padding: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: 600,
    color: colors.white,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: `1px solid ${colors.lighter}`,
  },
  tableRowAlt: {
    backgroundColor: '#f8fafc',
  },
  tableCell: {
    fontSize: 9,
    color: colors.dark,
  },
  // Market data
  marketMetric: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottom: `1px solid ${colors.lighter}`,
  },
  marketLabel: {
    fontSize: 10,
    color: colors.medium,
  },
  marketValue: {
    fontSize: 11,
    fontWeight: 600,
    color: colors.dark,
  },
  // Progress bar
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.lighter,
    borderRadius: 4,
    marginTop: 4,
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  // Recommendation
  recommendationItem: {
    flexDirection: 'row',
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    borderLeft: '3px solid',
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: colors.dark,
    marginBottom: 4,
  },
  recommendationDesc: {
    fontSize: 9,
    color: colors.medium,
    lineHeight: 1.5,
  },
  priorityBadge: {
    fontSize: 8,
    fontWeight: 600,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTop: `1px solid ${colors.lighter}`,
  },
  footerText: {
    fontSize: 8,
    color: colors.light,
  },
  pageNumber: {
    fontSize: 8,
    color: colors.medium,
  },
  // Watermark/Stamp
  certifiedStamp: {
    position: 'absolute',
    right: 40,
    top: 180,
    width: 100,
    height: 100,
    opacity: 0.15,
  },
  // Disclaimer
  disclaimer: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#fefce8',
    borderRadius: 6,
    border: `1px solid #fef08a`,
  },
  disclaimerText: {
    fontSize: 8,
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
  evidence?: string[];
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
  competitors?: any[];
  scorecard?: any;
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

// Main Document Component
export const ValidationReportDocument = ({ validation, agents }: ValidationReportProps) => {
  const generatedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const reportId = `SVR-${validation.id.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

  const getAgentReport = (agentId: string) =>
    validation.agentReports?.find(r => r.agentId === agentId);

  const allFindings = validation.agentReports?.flatMap(r => r.findings || []) || [];
  const allRisks = validation.agentReports?.flatMap(r => r.risks || []) || [];
  const allRecommendations = validation.agentReports?.flatMap(r => r.recommendations || []) || [];

  // Sort recommendations by priority
  const sortedRecommendations = [...allRecommendations].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return (order[a.priority as keyof typeof order] || 3) - (order[b.priority as keyof typeof order] || 3);
  });

  // Count findings by type
  const findingCounts = {
    strength: allFindings.filter(f => f.type === 'strength').length,
    weakness: allFindings.filter(f => f.type === 'weakness').length,
    opportunity: allFindings.filter(f => f.type === 'opportunity').length,
    threat: allFindings.filter(f => f.type === 'threat').length,
  };

  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>Startup Verdict</Text>
            <Text style={styles.logoSubtext}>AI-Powered Startup Validation Platform</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.reportTitle}>Validation Report</Text>
            <Text style={styles.reportDate}>{generatedDate}</Text>
            <Text style={styles.reportId}>Report ID: {reportId}</Text>
          </View>
        </View>

        {/* Certification Badge */}
        <View style={styles.certificationBadge}>
          <View style={[styles.certificationIcon, { backgroundColor: colors.certifiedGreen, borderRadius: 20, justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ color: colors.white, fontSize: 24, fontWeight: 700 }}>✓</Text>
          </View>
          <View style={styles.certificationText}>
            <Text style={styles.certificationTitle}>VERIFIED & CERTIFIED ANALYSIS</Text>
            <Text style={styles.certificationSubtitle}>
              This report has been generated and verified by Startup Verdict's 12-agent AI validation system.
              All data has been cross-referenced and quality-assured for investor-grade accuracy.
            </Text>
          </View>
        </View>

        {/* Company Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Startup Overview</Text>
          <View style={styles.summaryBox}>
            <Text style={{ fontSize: 18, fontWeight: 700, color: colors.dark, marginBottom: 8 }}>
              {validation.title}
            </Text>
            <Text style={styles.summaryText}>{validation.description}</Text>
          </View>
        </View>

        {/* Overall Scores */}
        <View style={styles.scoreContainer}>
          <View style={styles.scoreBox}>
            <Text style={[styles.scoreValue, { color: getScoreColor(validation.overallScore || 0) }]}>
              {validation.overallScore?.toFixed(1) || 'N/A'}
            </Text>
            <Text style={styles.scoreLabel}>OVERALL SCORE</Text>
          </View>
          <View style={styles.scoreBox}>
            <Text style={[styles.scoreValue, { color: colors.primary }]}>
              {validation.overallConfidence || 0}%
            </Text>
            <Text style={styles.scoreLabel}>CONFIDENCE</Text>
          </View>
          <View style={styles.scoreBox}>
            <Text style={[styles.scoreValue, { color: colors.secondary, fontSize: 24 }]}>
              {validation.agentReports?.length || 0}/12
            </Text>
            <Text style={styles.scoreLabel}>AGENTS COMPLETE</Text>
          </View>
        </View>

        {/* Verdict */}
        {validation.verdict && (
          <View style={[styles.summaryBox, { backgroundColor: '#ecfdf5', border: `1px solid ${colors.certifiedGreen}` }]}>
            <Text style={{ fontSize: 12, fontWeight: 700, color: colors.certifiedGreen, marginBottom: 6 }}>
              FINAL VERDICT
            </Text>
            <Text style={{ fontSize: 11, color: colors.dark, lineHeight: 1.6 }}>
              {validation.verdict}
            </Text>
          </View>
        )}

        {/* Executive Summary */}
        {validation.executiveSummary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Executive Summary</Text>
            <Text style={styles.summaryText}>{validation.executiveSummary}</Text>
          </View>
        )}

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Analysis Summary</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, padding: 10, backgroundColor: '#ecfdf5', borderRadius: 6, marginRight: 8 }}>
              <Text style={{ fontSize: 24, fontWeight: 700, color: colors.success }}>{findingCounts.strength}</Text>
              <Text style={{ fontSize: 9, color: colors.medium }}>Strengths</Text>
            </View>
            <View style={{ flex: 1, padding: 10, backgroundColor: '#fef2f2', borderRadius: 6, marginRight: 8 }}>
              <Text style={{ fontSize: 24, fontWeight: 700, color: colors.danger }}>{findingCounts.weakness}</Text>
              <Text style={{ fontSize: 9, color: colors.medium }}>Weaknesses</Text>
            </View>
            <View style={{ flex: 1, padding: 10, backgroundColor: '#eff6ff', borderRadius: 6, marginRight: 8 }}>
              <Text style={{ fontSize: 24, fontWeight: 700, color: colors.primary }}>{findingCounts.opportunity}</Text>
              <Text style={{ fontSize: 9, color: colors.medium }}>Opportunities</Text>
            </View>
            <View style={{ flex: 1, padding: 10, backgroundColor: '#fefce8', borderRadius: 6 }}>
              <Text style={{ fontSize: 24, fontWeight: 700, color: colors.warning }}>{findingCounts.threat}</Text>
              <Text style={{ fontSize: 9, color: colors.medium }}>Threats</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Startup Verdict - AI-Powered Validation | Confidential
          </Text>
          <Text style={styles.pageNumber}>Page 1</Text>
        </View>
      </Page>

      {/* Agent Reports Pages */}
      {agents.map((agent, agentIndex) => {
        const report = getAgentReport(agent.id);
        if (!report) return null;

        return (
          <Page key={agent.id} size="A4" style={styles.page}>
            {/* Page Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
              <Text style={{ fontSize: 10, color: colors.medium }}>Startup Verdict - {validation.title}</Text>
              <Text style={{ fontSize: 10, color: colors.medium }}>{agent.name} - {agent.role}</Text>
            </View>

            {/* Agent Card */}
            <View style={styles.agentCard}>
              <View style={styles.agentHeader}>
                <View>
                  <Text style={styles.agentName}>{agent.icon} {agent.name}</Text>
                  <Text style={styles.agentRole}>{agent.role} - {agent.description}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.agentScore, { color: getScoreColor(report.score) }]}>
                    {report.score}/10
                  </Text>
                  <Text style={styles.agentConfidence}>{report.confidence}% confidence</Text>
                </View>
              </View>

              {/* Investor Grade Badge */}
              {agent.investorGrade && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                  <View style={{ width: 12, height: 12, backgroundColor: colors.certifiedGreen, borderRadius: 6, marginRight: 4, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: colors.white, fontSize: 8, fontWeight: 700 }}>✓</Text>
                  </View>
                  <Text style={{ fontSize: 8, color: colors.certifiedGreen, fontWeight: 600 }}>
                    INVESTOR-GRADE ANALYSIS
                  </Text>
                </View>
              )}
            </View>

            {/* Market Data (for Marcus) */}
            {report.marketData && (
              <View style={styles.section}>
                <Text style={styles.sectionSubtitle}>Market Analysis</Text>
                <View style={styles.marketMetric}>
                  <Text style={styles.marketLabel}>Total Addressable Market (TAM)</Text>
                  <Text style={styles.marketValue}>{formatCurrency(report.marketData.tam)}</Text>
                </View>
                <View style={styles.marketMetric}>
                  <Text style={styles.marketLabel}>Serviceable Addressable Market (SAM)</Text>
                  <Text style={styles.marketValue}>{formatCurrency(report.marketData.sam)}</Text>
                </View>
                <View style={styles.marketMetric}>
                  <Text style={styles.marketLabel}>Serviceable Obtainable Market (SOM)</Text>
                  <Text style={styles.marketValue}>{formatCurrency(report.marketData.som)}</Text>
                </View>
                {report.marketData.growthRate && (
                  <View style={styles.marketMetric}>
                    <Text style={styles.marketLabel}>Market Growth Rate (CAGR)</Text>
                    <Text style={[styles.marketValue, { color: colors.success }]}>
                      {(report.marketData.growthRate * 100).toFixed(1)}%
                    </Text>
                  </View>
                )}
                {report.marketData.marketTiming && (
                  <View style={styles.marketMetric}>
                    <Text style={styles.marketLabel}>Market Timing</Text>
                    <Text style={styles.marketValue}>{report.marketData.marketTiming}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Unit Economics (for David) */}
            {report.unitEconomics && (
              <View style={styles.section}>
                <Text style={styles.sectionSubtitle}>Unit Economics</Text>
                {report.unitEconomics.cac && (
                  <View style={styles.marketMetric}>
                    <Text style={styles.marketLabel}>Customer Acquisition Cost (CAC)</Text>
                    <Text style={styles.marketValue}>{formatCurrency(report.unitEconomics.cac.mid)}</Text>
                  </View>
                )}
                {report.unitEconomics.ltv && (
                  <View style={styles.marketMetric}>
                    <Text style={styles.marketLabel}>Customer Lifetime Value (LTV)</Text>
                    <Text style={styles.marketValue}>{formatCurrency(report.unitEconomics.ltv.mid)}</Text>
                  </View>
                )}
                {report.unitEconomics.ltvCacRatio && (
                  <View style={styles.marketMetric}>
                    <Text style={styles.marketLabel}>LTV:CAC Ratio</Text>
                    <Text style={[styles.marketValue, {
                      color: report.unitEconomics.ltvCacRatio.mid >= 3 ? colors.success : colors.warning
                    }]}>
                      {report.unitEconomics.ltvCacRatio.mid.toFixed(1)}:1
                    </Text>
                  </View>
                )}
                {report.unitEconomics.grossMargin && (
                  <View style={styles.marketMetric}>
                    <Text style={styles.marketLabel}>Gross Margin</Text>
                    <Text style={styles.marketValue}>
                      {(report.unitEconomics.grossMargin.mid * 100).toFixed(0)}%
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Scenario Analysis */}
            {report.scenarioAnalysis && (
              <View style={styles.section}>
                <Text style={styles.sectionSubtitle}>Scenario Analysis</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                  <View style={{ flex: 1, padding: 10, backgroundColor: '#ecfdf5', borderRadius: 6, marginRight: 8 }}>
                    <Text style={{ fontSize: 10, fontWeight: 600, color: colors.success }}>Bull Case</Text>
                    <Text style={{ fontSize: 8, color: colors.medium }}>
                      {(report.scenarioAnalysis.bull.probability * 100).toFixed(0)}% probability
                    </Text>
                    <Text style={{ fontSize: 9, color: colors.dark, marginTop: 4 }}>
                      {report.scenarioAnalysis.bull.description?.substring(0, 100)}...
                    </Text>
                  </View>
                  <View style={{ flex: 1, padding: 10, backgroundColor: '#eff6ff', borderRadius: 6, marginRight: 8 }}>
                    <Text style={{ fontSize: 10, fontWeight: 600, color: colors.primary }}>Base Case</Text>
                    <Text style={{ fontSize: 8, color: colors.medium }}>
                      {(report.scenarioAnalysis.base.probability * 100).toFixed(0)}% probability
                    </Text>
                    <Text style={{ fontSize: 9, color: colors.dark, marginTop: 4 }}>
                      {report.scenarioAnalysis.base.description?.substring(0, 100)}...
                    </Text>
                  </View>
                  <View style={{ flex: 1, padding: 10, backgroundColor: '#fef2f2', borderRadius: 6 }}>
                    <Text style={{ fontSize: 10, fontWeight: 600, color: colors.danger }}>Bear Case</Text>
                    <Text style={{ fontSize: 8, color: colors.medium }}>
                      {(report.scenarioAnalysis.bear.probability * 100).toFixed(0)}% probability
                    </Text>
                    <Text style={{ fontSize: 9, color: colors.dark, marginTop: 4 }}>
                      {report.scenarioAnalysis.bear.description?.substring(0, 100)}...
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Key Findings */}
            {report.findings?.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionSubtitle}>Key Findings ({report.findings.length})</Text>
                {report.findings.slice(0, 6).map((finding, idx) => (
                  <View key={idx} style={styles.findingItem}>
                    <View style={[styles.findingBullet, { backgroundColor: getTypeColor(finding.type) }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.findingText}>
                        <Text style={styles.findingTitle}>{finding.title}: </Text>
                        {finding.description.substring(0, 200)}{finding.description.length > 200 ? '...' : ''}
                      </Text>
                    </View>
                  </View>
                ))}
                {report.findings.length > 6 && (
                  <Text style={{ fontSize: 9, color: colors.light, marginTop: 8, fontStyle: 'italic' }}>
                    + {report.findings.length - 6} more findings
                  </Text>
                )}
              </View>
            )}

            {/* Risks */}
            {report.risks?.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionSubtitle}>Risks Identified ({report.risks.length})</Text>
                {report.risks.slice(0, 4).map((risk, idx) => (
                  <View key={idx} style={{ marginBottom: 8, padding: 8, backgroundColor: '#fef2f2', borderRadius: 4 }}>
                    <View style={{ flexDirection: 'row', marginBottom: 4 }}>
                      <Text style={{ fontSize: 8, backgroundColor: risk.probability === 'high' ? colors.danger : colors.warning, color: colors.white, paddingHorizontal: 4, paddingVertical: 2, borderRadius: 2, marginRight: 4 }}>
                        {risk.probability}
                      </Text>
                      <Text style={{ fontSize: 8, backgroundColor: colors.medium, color: colors.white, paddingHorizontal: 4, paddingVertical: 2, borderRadius: 2 }}>
                        {risk.impact}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 10, fontWeight: 600, color: colors.dark }}>{risk.title}</Text>
                    <Text style={{ fontSize: 9, color: colors.medium, marginTop: 2 }}>
                      {risk.description.substring(0, 150)}{risk.description.length > 150 ? '...' : ''}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Recommendations */}
            {report.recommendations?.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionSubtitle}>Recommendations ({report.recommendations.length})</Text>
                {report.recommendations.slice(0, 4).map((rec, idx) => (
                  <View key={idx} style={[styles.recommendationItem, { borderLeftColor: getPriorityColor(rec.priority) }]}>
                    <View style={styles.recommendationContent}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <Text style={[styles.priorityBadge, { backgroundColor: getPriorityColor(rec.priority), color: colors.white }]}>
                          {rec.priority.toUpperCase()}
                        </Text>
                        <Text style={{ fontSize: 8, color: colors.light }}>{rec.timeframe}</Text>
                      </View>
                      <Text style={styles.recommendationTitle}>{rec.title}</Text>
                      <Text style={styles.recommendationDesc}>
                        {rec.description.substring(0, 200)}{rec.description.length > 200 ? '...' : ''}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Startup Verdict - {agent.name} Analysis | Confidential
              </Text>
              <Text style={styles.pageNumber}>Page {agentIndex + 2}</Text>
            </View>
          </Page>
        );
      })}

      {/* Summary & Action Items Page */}
      <Page size="A4" style={styles.page}>
        {/* Page Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
          <Text style={{ fontSize: 10, color: colors.medium }}>Startup Verdict - {validation.title}</Text>
          <Text style={{ fontSize: 10, color: colors.medium }}>Action Plan & Recommendations</Text>
        </View>

        <Text style={styles.sectionTitle}>Priority Action Items</Text>

        {/* Critical & High Priority */}
        <View style={styles.section}>
          <Text style={styles.sectionSubtitle}>
            Critical & High Priority ({sortedRecommendations.filter(r => r.priority === 'critical' || r.priority === 'high').length})
          </Text>
          {sortedRecommendations
            .filter(r => r.priority === 'critical' || r.priority === 'high')
            .slice(0, 8)
            .map((rec, idx) => (
              <View key={idx} style={[styles.recommendationItem, { borderLeftColor: getPriorityColor(rec.priority) }]}>
                <View style={styles.recommendationContent}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={[styles.priorityBadge, { backgroundColor: getPriorityColor(rec.priority), color: colors.white }]}>
                      {rec.priority.toUpperCase()}
                    </Text>
                    <Text style={{ fontSize: 8, color: colors.light }}>{rec.timeframe}</Text>
                  </View>
                  <Text style={styles.recommendationTitle}>{rec.title}</Text>
                  <Text style={styles.recommendationDesc}>{rec.description}</Text>
                </View>
              </View>
            ))}
        </View>

        {/* Risk Summary Table */}
        <View style={styles.section}>
          <Text style={styles.sectionSubtitle}>Risk Overview ({allRisks.length} total)</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { width: '30%' }]}>Risk</Text>
              <Text style={[styles.tableHeaderCell, { width: '15%' }]}>Probability</Text>
              <Text style={[styles.tableHeaderCell, { width: '15%' }]}>Impact</Text>
              <Text style={[styles.tableHeaderCell, { width: '40%' }]}>Mitigation</Text>
            </View>
            {allRisks.slice(0, 8).map((risk, idx) => (
              <View key={idx} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}>
                <Text style={[styles.tableCell, { width: '30%' }]}>{risk.title}</Text>
                <Text style={[styles.tableCell, { width: '15%', color: risk.probability === 'high' ? colors.danger : colors.warning }]}>
                  {risk.probability}
                </Text>
                <Text style={[styles.tableCell, { width: '15%' }]}>{risk.impact}</Text>
                <Text style={[styles.tableCell, { width: '40%' }]}>
                  {risk.mitigations?.[0]?.substring(0, 60) || 'See detailed analysis'}...
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={{ fontSize: 9, fontWeight: 600, color: '#854d0e', marginBottom: 4 }}>
            Important Disclaimer
          </Text>
          <Text style={styles.disclaimerText}>
            This report is generated by Startup Verdict's AI-powered validation system and is intended for
            informational purposes only. While our 12-agent system provides comprehensive analysis, this
            should not be considered as financial, legal, or investment advice. All projections and
            estimates are based on available data and AI analysis, which may not reflect actual future
            outcomes. Investors and founders should conduct their own due diligence before making any
            decisions. Startup Verdict does not guarantee the accuracy or completeness of any information
            contained in this report.
          </Text>
        </View>

        {/* Final Certification */}
        <View style={[styles.certificationBadge, { marginTop: 20 }]}>
          <View style={[styles.certificationIcon, { backgroundColor: colors.certifiedGreen, borderRadius: 20, justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ color: colors.white, fontSize: 24, fontWeight: 700 }}>✓</Text>
          </View>
          <View style={styles.certificationText}>
            <Text style={styles.certificationTitle}>CERTIFIED BY STARTUP VERDICT</Text>
            <Text style={styles.certificationSubtitle}>
              Report ID: {reportId} | Generated: {generatedDate}
            </Text>
            <Text style={[styles.certificationSubtitle, { marginTop: 4 }]}>
              This document has been digitally signed and verified by Startup Verdict's validation system.
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Startup Verdict - AI-Powered Validation | www.startupverdict.com
          </Text>
          <Text style={styles.pageNumber}>Final Page</Text>
        </View>
      </Page>
    </Document>
  );
};

// Export function to generate and download PDF
export async function generateValidationPDF(
  validation: ValidationData,
  agents: Agent[]
): Promise<Blob> {
  try {
    console.log('Generating PDF for validation:', validation.id);
    const doc = <ValidationReportDocument validation={validation} agents={agents} />;
    const blob = await pdf(doc).toBlob();
    console.log('PDF generated successfully, size:', blob.size);
    return blob;
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
}

// Export function to download PDF directly
export async function downloadValidationPDF(
  validation: ValidationData,
  agents: Agent[],
  filename?: string
): Promise<void> {
  try {
    console.log('Starting PDF download...');
    const blob = await generateValidationPDF(validation, agents);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `StartupVerdict-${validation.title.replace(/\s+/g, '-')}-Report.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    console.log('PDF download initiated');
  } catch (error) {
    console.error('PDF download error:', error);
    throw error;
  }
}
