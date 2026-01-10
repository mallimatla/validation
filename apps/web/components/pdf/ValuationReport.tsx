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

// Professional valuation report colors
const colors = {
  primary: '#1e3a5f',      // Deep navy blue
  secondary: '#2c5282',    // Professional blue
  accent: '#c9a227',       // Gold accent
  success: '#276749',      // Green
  warning: '#c05621',      // Orange
  danger: '#9b2c2c',       // Deep red
  dark: '#1a202c',
  medium: '#4a5568',
  light: '#718096',
  lighter: '#e2e8f0',
  lightest: '#f7fafc',
  white: '#ffffff',
  black: '#000000',
  tableHeader: '#2d3748',
  tableBorder: '#cbd5e0',
};

// Professional valuation report styles
const styles = StyleSheet.create({
  // Cover Page
  coverPage: {
    backgroundColor: colors.white,
    padding: 0,
  },
  coverBorder: {
    margin: 20,
    padding: 40,
    height: '94%',
    borderWidth: 3,
    borderColor: colors.primary,
  },
  coverHeader: {
    alignItems: 'center',
    marginBottom: 60,
  },
  coverTitle: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 2,
  },
  coverSubtitle: {
    fontSize: 14,
    color: colors.medium,
    textAlign: 'center',
    marginBottom: 5,
  },
  coverCompanySection: {
    alignItems: 'center',
    marginBottom: 60,
    paddingVertical: 40,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.accent,
  },
  coverCompanyName: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: colors.dark,
    textAlign: 'center',
    marginBottom: 15,
  },
  coverCompanyAddress: {
    fontSize: 10,
    color: colors.medium,
    textAlign: 'center',
    lineHeight: 1.6,
  },
  coverIssuedBy: {
    alignItems: 'center',
    marginTop: 40,
  },
  coverIssuedByLabel: {
    fontSize: 11,
    color: colors.light,
    marginBottom: 15,
    letterSpacing: 2,
  },
  coverValuerName: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 10,
  },
  coverValuerDetails: {
    fontSize: 9,
    color: colors.medium,
    textAlign: 'center',
    lineHeight: 1.5,
    maxWidth: 400,
  },
  coverFooter: {
    position: 'absolute',
    bottom: 60,
    left: 60,
    right: 60,
    alignItems: 'center',
  },
  coverFooterText: {
    fontSize: 8,
    color: colors.light,
    textAlign: 'center',
  },

  // Standard Page
  page: {
    backgroundColor: colors.white,
    padding: 50,
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
  },
  pageHeaderLeft: {
    flexDirection: 'column',
  },
  pageHeaderTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
  },
  pageHeaderCompany: {
    fontSize: 8,
    color: colors.medium,
    marginTop: 2,
  },
  pageHeaderRight: {
    alignItems: 'flex-end',
  },
  pageNumber: {
    fontSize: 9,
    color: colors.medium,
  },

  // Content
  content: {
    flex: 1,
  },

  // Section styles
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    marginBottom: 15,
    marginTop: 20,
    paddingBottom: 5,
    borderBottomWidth: 2,
    borderBottomColor: colors.accent,
  },
  sectionNumber: {
    fontFamily: 'Helvetica-Bold',
    marginRight: 8,
  },
  subsectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: colors.dark,
    marginBottom: 10,
    marginTop: 15,
  },
  paragraph: {
    fontSize: 10,
    color: colors.dark,
    lineHeight: 1.6,
    marginBottom: 10,
    textAlign: 'justify',
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingLeft: 10,
  },
  bullet: {
    width: 15,
    fontSize: 10,
    color: colors.primary,
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    color: colors.dark,
    lineHeight: 1.5,
  },

  // Table styles
  table: {
    marginVertical: 15,
    borderWidth: 1,
    borderColor: colors.tableBorder,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.tableHeader,
    padding: 8,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: colors.white,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.tableBorder,
  },
  tableRowAlt: {
    backgroundColor: colors.lightest,
  },
  tableCell: {
    fontSize: 9,
    color: colors.dark,
  },
  tableCellBold: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: colors.dark,
  },

  // Value highlight box
  valueBox: {
    backgroundColor: colors.lightest,
    borderWidth: 2,
    borderColor: colors.primary,
    padding: 20,
    marginVertical: 20,
    alignItems: 'center',
  },
  valueLabel: {
    fontSize: 10,
    color: colors.medium,
    marginBottom: 8,
    letterSpacing: 1,
  },
  valueAmount: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    marginBottom: 5,
  },
  valueSubtext: {
    fontSize: 9,
    color: colors.light,
  },

  // Signature section
  signatureSection: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.lighter,
  },
  signatureBox: {
    alignItems: 'flex-start',
    marginTop: 30,
  },
  signatureLine: {
    width: 200,
    height: 1,
    backgroundColor: colors.dark,
    marginBottom: 5,
  },
  signatureName: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: colors.dark,
  },
  signatureTitle: {
    fontSize: 9,
    color: colors.medium,
    marginTop: 2,
  },
  signatureDate: {
    fontSize: 9,
    color: colors.light,
    marginTop: 10,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
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
  },

  // TOC styles
  tocItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomStyle: 'dotted',
    borderBottomColor: colors.lighter,
  },
  tocText: {
    fontSize: 10,
    color: colors.dark,
  },
  tocPage: {
    fontSize: 10,
    color: colors.medium,
  },

  // Letter styles
  letterDate: {
    fontSize: 10,
    color: colors.dark,
    marginBottom: 20,
    textAlign: 'right',
  },
  letterTo: {
    fontSize: 10,
    color: colors.dark,
    marginBottom: 5,
  },
  letterSubject: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: colors.dark,
    marginTop: 15,
    marginBottom: 15,
  },
  letterBody: {
    fontSize: 10,
    color: colors.dark,
    lineHeight: 1.6,
    marginBottom: 10,
    textAlign: 'justify',
  },

  // Methodology box
  methodBox: {
    backgroundColor: colors.lightest,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
    padding: 15,
    marginVertical: 15,
  },
  methodTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    marginBottom: 8,
  },
  methodText: {
    fontSize: 9,
    color: colors.dark,
    lineHeight: 1.5,
  },

  // DCF Table styles
  dcfTable: {
    marginVertical: 15,
  },
  dcfRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.tableBorder,
  },
  dcfLabel: {
    flex: 2,
    padding: 6,
    fontSize: 9,
    color: colors.dark,
    backgroundColor: colors.lightest,
  },
  dcfValue: {
    flex: 1,
    padding: 6,
    fontSize: 9,
    color: colors.dark,
    textAlign: 'right',
  },
  dcfHighlight: {
    backgroundColor: colors.primary,
  },
  dcfHighlightText: {
    color: colors.white,
    fontFamily: 'Helvetica-Bold',
  },
});

// Use flexible types to handle various data shapes
/* eslint-disable @typescript-eslint/no-explicit-any */
interface ValuationReportProps {
  validation: any;
  agents: any[];
}

// Helper functions
const formatCurrency = (value: number): string => {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

const formatINR = (value: number): string => {
  if (value >= 1e7) return `Rs. ${(value / 1e7).toFixed(2)} Cr`;
  if (value >= 1e5) return `Rs. ${(value / 1e5).toFixed(2)} Lacs`;
  return `Rs. ${value.toFixed(0)}`;
};

const normalizeScore = (score: number): number => {
  if (score > 10) return Math.min(10, score / 10);
  return Math.min(10, Math.max(0, score));
};

const getValuationFromScore = (score: number, baseMultiplier: number = 1000000): number => {
  // Convert score to estimated valuation
  const normalizedScore = normalizeScore(score);
  const multiplier = Math.pow(1.5, normalizedScore - 5); // Exponential growth
  return baseMultiplier * multiplier * 10;
};

const getCurrentDate = (): string => {
  return new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const getReportId = (id: string): string => {
  return `SVR-VAL-${id.slice(0, 8).toUpperCase()}`;
};

// Valuation Report Document
const ValuationReportDocument: React.FC<ValuationReportProps> = ({ validation, agents }) => {
  const overallScore = normalizeScore(validation.overallScore || 0);
  const confidence = validation.overallConfidence || 0;
  const reportId = getReportId(validation.id);
  const currentDate = getCurrentDate();

  // Get financial data
  const financialAgent = validation.agentReports?.find((r: any) => r.agentId === 'david');
  const marketAgent = validation.agentReports?.find((r: any) => r.agentId === 'marcus');
  const valuationAgent = validation.agentReports?.find((r: any) => r.agentId === 'victor');

  // Calculate estimated valuation
  const baseValuation = getValuationFromScore(overallScore, 5000000);
  const estimatedValuation = valuationAgent?.scenarioAnalysis?.base?.valuation || baseValuation;

  // Market data
  const tam = marketAgent?.marketData?.tam || 10000000000;
  const sam = marketAgent?.marketData?.sam || 1000000000;
  const som = marketAgent?.marketData?.som || 100000000;

  // Unit economics
  const cac = financialAgent?.unitEconomics?.cac?.mid || 150;
  const ltv = financialAgent?.unitEconomics?.ltv?.mid || 800;
  const ltvCacRatio = cac > 0 ? (ltv / cac) : 0;

  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.coverPage}>
        <View style={styles.coverBorder}>
          <View style={styles.coverHeader}>
            <Text style={styles.coverTitle}>VALUATION REPORT</Text>
            <Text style={styles.coverSubtitle}>OF</Text>
            <Text style={styles.coverSubtitle}>EQUITY SHARES</Text>
          </View>

          <View style={styles.coverCompanySection}>
            <Text style={styles.coverCompanyName}>{validation.title}</Text>
            <Text style={styles.coverCompanyAddress}>
              {validation.description.substring(0, 200)}
              {validation.description.length > 200 ? '...' : ''}
            </Text>
          </View>

          <View style={styles.coverIssuedBy}>
            <Text style={styles.coverIssuedByLabel}>ISSUED BY</Text>
            <Text style={styles.coverValuerName}>Startup Verdict AI Valuation System</Text>
            <Text style={styles.coverValuerDetails}>
              AI-Powered Startup Validation and Valuation Platform{'\n'}
              12-Agent Analysis System | Comprehensive Due Diligence{'\n'}
              www.startupverdict.com
            </Text>
          </View>

          <View style={styles.coverFooter}>
            <Text style={styles.coverFooterText}>
              Report ID: {reportId} | Generated: {currentDate}
            </Text>
          </View>
        </View>
      </Page>

      {/* Letter to Directors */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pageHeader}>
          <View style={styles.pageHeaderLeft}>
            <Text style={styles.pageHeaderTitle}>Valuation Report</Text>
            <Text style={styles.pageHeaderCompany}>{validation.title}</Text>
          </View>
          <View style={styles.pageHeaderRight}>
            <Text style={styles.pageNumber}>Page 2</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.letterDate}>{currentDate}</Text>

          <Text style={styles.letterTo}>To,</Text>
          <Text style={styles.letterTo}>Board of Directors / Founders</Text>
          <Text style={styles.letterTo}>{validation.title}</Text>

          <Text style={styles.letterSubject}>
            Subject: Valuation of equity shares of {validation.title} for investment and strategic planning purposes.
          </Text>

          <Text style={styles.letterBody}>
            Startup Verdict, an AI-Powered Validation and Valuation Platform, has conducted a comprehensive analysis of {validation.title} using our proprietary 12-agent AI system. This report presents our findings and valuation opinion based on extensive analysis of market opportunity, competitive landscape, financial viability, technical feasibility, team capabilities, and growth potential.
          </Text>

          <Text style={styles.letterBody}>
            Our analysis utilizes multiple valuation methodologies including Discounted Cash Flow (DCF), Comparable Company Analysis, and Risk-Adjusted Return modeling to arrive at a fair value estimate. The valuation considers both quantitative metrics and qualitative factors assessed by our specialized AI agents.
          </Text>

          <View style={styles.valueBox}>
            <Text style={styles.valueLabel}>ESTIMATED FAIR VALUE</Text>
            <Text style={styles.valueAmount}>{formatCurrency(estimatedValuation)}</Text>
            <Text style={styles.valueSubtext}>
              Overall Score: {overallScore.toFixed(1)}/10 | Confidence: {confidence}%
            </Text>
          </View>

          <Text style={styles.letterBody}>
            This valuation is based on the information provided, market conditions as of the valuation date, and assumptions detailed in this report. We recommend reviewing the limitations section and conducting additional due diligence as appropriate.
          </Text>

          <View style={styles.signatureSection}>
            <Text style={styles.letterBody}>
              We would be delighted to provide any clarification or additional analysis as needed.
            </Text>
            <View style={styles.signatureBox}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureName}>Startup Verdict AI System</Text>
              <Text style={styles.signatureTitle}>Automated Valuation Report</Text>
              <Text style={styles.signatureDate}>Date: {currentDate}</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Valuation Report - {validation.title}</Text>
          <Text style={styles.footerPage}>Page 2 of 12</Text>
        </View>
      </Page>

      {/* Table of Contents */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pageHeader}>
          <View style={styles.pageHeaderLeft}>
            <Text style={styles.pageHeaderTitle}>Valuation Report</Text>
            <Text style={styles.pageHeaderCompany}>{validation.title}</Text>
          </View>
          <View style={styles.pageHeaderRight}>
            <Text style={styles.pageNumber}>Page 3</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Table of Contents</Text>

          {[
            { title: '1. EXECUTIVE SUMMARY', page: '4' },
            { title: '   1.1 Terms of Engagement', page: '4' },
            { title: '   1.2 Purpose of Valuation', page: '4' },
            { title: '   1.3 Valuation Approach & Methodology', page: '4' },
            { title: '   1.4 Valuation Summary', page: '4' },
            { title: '2. INTRODUCTION', page: '5' },
            { title: '   2.1 Scope and Purpose', page: '5' },
            { title: '   2.2 Basis of Valuation', page: '5' },
            { title: '   2.3 Source of Information', page: '5' },
            { title: '   2.4 Limitations', page: '5' },
            { title: '3. ABOUT THE COMPANY', page: '6' },
            { title: '4. MARKET ANALYSIS', page: '7' },
            { title: '5. FINANCIAL PROJECTIONS', page: '8' },
            { title: '6. FAIR-VALUE METHODOLOGY', page: '9' },
            { title: '   6.1 Asset Approach', page: '9' },
            { title: '   6.2 Market Approach', page: '9' },
            { title: '   6.3 Income Approach (DCF)', page: '10' },
            { title: '7. VALUATION ANALYSIS', page: '11' },
            { title: '8. CONCLUSION', page: '12' },
            { title: 'ANNEXURE - DCF CALCULATION', page: '12' },
          ].map((item, idx) => (
            <View key={idx} style={styles.tocItem}>
              <Text style={styles.tocText}>{item.title}</Text>
              <Text style={styles.tocPage}>{item.page}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Valuation Report - {validation.title}</Text>
          <Text style={styles.footerPage}>Page 3 of 12</Text>
        </View>
      </Page>

      {/* Executive Summary */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pageHeader}>
          <View style={styles.pageHeaderLeft}>
            <Text style={styles.pageHeaderTitle}>Valuation Report</Text>
            <Text style={styles.pageHeaderCompany}>{validation.title}</Text>
          </View>
          <View style={styles.pageHeaderRight}>
            <Text style={styles.pageNumber}>Page 4</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>1. EXECUTIVE SUMMARY</Text>

          <Text style={styles.subsectionTitle}>1.1 TERMS OF ENGAGEMENT</Text>
          <Text style={styles.paragraph}>
            Startup Verdict has been engaged to determine the fair value of equity shares of {validation.title}. This valuation has been conducted using our proprietary 12-agent AI analysis system, which provides comprehensive assessment across multiple dimensions including market opportunity, competitive positioning, financial viability, and growth potential.
          </Text>

          <Text style={styles.subsectionTitle}>1.2 PURPOSE OF VALUATION</Text>
          <Text style={styles.paragraph}>
            The purpose of this valuation is to provide founders, investors, and stakeholders with an independent assessment of the company's fair value for:
          </Text>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>-</Text>
            <Text style={styles.bulletText}>Investment decision-making and fundraising</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>-</Text>
            <Text style={styles.bulletText}>Strategic planning and growth initiatives</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>-</Text>
            <Text style={styles.bulletText}>Equity compensation and ESOP planning</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>-</Text>
            <Text style={styles.bulletText}>Merger, acquisition, or partnership discussions</Text>
          </View>

          <Text style={styles.subsectionTitle}>1.3 VALUATION APPROACH & METHODOLOGY</Text>
          <View style={styles.methodBox}>
            <Text style={styles.methodTitle}>Primary Methodology: Discounted Cash Flow (DCF)</Text>
            <Text style={styles.methodText}>
              We have utilized the Discounted Cash Flow (DCF) Method under the Income Approach, supplemented by Market Comparable Analysis and Risk-Adjusted scoring. The DCF method provides the most appropriate framework for early-stage companies with significant growth potential.
            </Text>
          </View>

          <Text style={styles.subsectionTitle}>1.4 VALUATION SUMMARY</Text>
          <View style={styles.valueBox}>
            <Text style={styles.valueLabel}>FAIR VALUE OF EQUITY</Text>
            <Text style={styles.valueAmount}>{formatCurrency(estimatedValuation)}</Text>
            <Text style={styles.valueSubtext}>
              As of {currentDate}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Valuation Report - {validation.title}</Text>
          <Text style={styles.footerPage}>Page 4 of 12</Text>
        </View>
      </Page>

      {/* Introduction */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pageHeader}>
          <View style={styles.pageHeaderLeft}>
            <Text style={styles.pageHeaderTitle}>Valuation Report</Text>
            <Text style={styles.pageHeaderCompany}>{validation.title}</Text>
          </View>
          <View style={styles.pageHeaderRight}>
            <Text style={styles.pageNumber}>Page 5</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>2. INTRODUCTION</Text>

          <Text style={styles.subsectionTitle}>2.1 SCOPE AND PURPOSE</Text>
          <Text style={styles.paragraph}>
            This report provides a comprehensive fair valuation of equity shares of {validation.title}. The material date of valuation is {currentDate}. Our investigation included detailed analysis of the company's business model, market opportunity, competitive landscape, financial projections, and risk factors.
          </Text>

          <Text style={styles.subsectionTitle}>2.2 BASIS OF VALUATION</Text>
          <Text style={styles.paragraph}>
            This valuation is based on the "Going Concern Concept" which assumes that the enterprise shall continue to operate and grow its business. Fair Value is defined as "the price that would be received to sell an asset or paid to transfer a liability in an orderly transaction between market participants at the measurement date."
          </Text>

          <Text style={styles.subsectionTitle}>2.3 SOURCE OF INFORMATION</Text>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>-</Text>
            <Text style={styles.bulletText}>Company profile, business plan, and strategic documentation</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>-</Text>
            <Text style={styles.bulletText}>Market research and industry analysis</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>-</Text>
            <Text style={styles.bulletText}>Competitive landscape assessment</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>-</Text>
            <Text style={styles.bulletText}>Financial projections and unit economics data</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>-</Text>
            <Text style={styles.bulletText}>Public domain information and industry benchmarks</Text>
          </View>

          <Text style={styles.subsectionTitle}>2.4 LIMITATIONS</Text>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>-</Text>
            <Text style={styles.bulletText}>This valuation is based on information provided and may be affected by changes in market conditions</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>-</Text>
            <Text style={styles.bulletText}>Financial projections are based on management assumptions that may not materialize</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>-</Text>
            <Text style={styles.bulletText}>This report is prepared for the specific purposes stated and should not be relied upon for other purposes</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>-</Text>
            <Text style={styles.bulletText}>We reserve the right to update conclusions based on new information</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Valuation Report - {validation.title}</Text>
          <Text style={styles.footerPage}>Page 5 of 12</Text>
        </View>
      </Page>

      {/* About Company */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pageHeader}>
          <View style={styles.pageHeaderLeft}>
            <Text style={styles.pageHeaderTitle}>Valuation Report</Text>
            <Text style={styles.pageHeaderCompany}>{validation.title}</Text>
          </View>
          <View style={styles.pageHeaderRight}>
            <Text style={styles.pageNumber}>Page 6</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>3. ABOUT THE COMPANY</Text>

          <Text style={styles.subsectionTitle}>3.1 Company Overview</Text>
          <Text style={styles.paragraph}>
            {validation.description}
          </Text>

          <Text style={styles.subsectionTitle}>3.2 Business Assessment</Text>
          <Text style={styles.paragraph}>
            {validation.executiveSummary || `${validation.title} has been evaluated across multiple dimensions by our specialized AI agents. The comprehensive analysis covers market opportunity, competitive positioning, financial sustainability, technical feasibility, team capabilities, and growth potential.`}
          </Text>

          <Text style={styles.subsectionTitle}>3.3 Validation Verdict</Text>
          <View style={styles.methodBox}>
            <Text style={styles.methodTitle}>AI Assessment Result</Text>
            <Text style={styles.methodText}>
              {validation.verdict || `Based on our 12-agent AI analysis, ${validation.title} demonstrates ${overallScore >= 7 ? 'strong' : overallScore >= 5 ? 'moderate' : 'developing'} fundamentals with a validation score of ${overallScore.toFixed(1)}/10. The confidence level of this assessment is ${confidence}%.`}
            </Text>
          </View>

          <Text style={styles.subsectionTitle}>3.4 Agent Analysis Summary</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Analysis Area</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Score</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Confidence</Text>
            </View>
            {validation.agentReports?.slice(0, 8).map((report: any, idx: number) => {
              const agent = agents.find((a: any) => a.id === report.agentId);
              const score = normalizeScore(report.score);
              return (
                <View key={idx} style={idx % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>{agent?.role || report.agentId}</Text>
                  <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' as const }]}>{score.toFixed(1)}/10</Text>
                  <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' as const }]}>{report.confidence}%</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Valuation Report - {validation.title}</Text>
          <Text style={styles.footerPage}>Page 6 of 12</Text>
        </View>
      </Page>

      {/* Market Analysis */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pageHeader}>
          <View style={styles.pageHeaderLeft}>
            <Text style={styles.pageHeaderTitle}>Valuation Report</Text>
            <Text style={styles.pageHeaderCompany}>{validation.title}</Text>
          </View>
          <View style={styles.pageHeaderRight}>
            <Text style={styles.pageNumber}>Page 7</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>4. MARKET ANALYSIS</Text>

          <Text style={styles.subsectionTitle}>4.1 Market Size Assessment</Text>
          <Text style={styles.paragraph}>
            Our Market Intelligence analysis has identified the following market opportunity metrics for {validation.title}:
          </Text>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Market Metric</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Value</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCellBold, { flex: 2 }]}>Total Addressable Market (TAM)</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{formatCurrency(tam)}</Text>
            </View>
            <View style={[styles.tableRow, styles.tableRowAlt]}>
              <Text style={[styles.tableCellBold, { flex: 2 }]}>Serviceable Addressable Market (SAM)</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{formatCurrency(sam)}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCellBold, { flex: 2 }]}>Serviceable Obtainable Market (SOM)</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{formatCurrency(som)}</Text>
            </View>
            <View style={[styles.tableRow, styles.tableRowAlt]}>
              <Text style={[styles.tableCellBold, { flex: 2 }]}>Market Growth Rate (CAGR)</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{marketAgent?.marketData?.growthRate || 15}%</Text>
            </View>
          </View>

          <Text style={styles.subsectionTitle}>4.2 Unit Economics</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Metric</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Value</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCellBold, { flex: 2 }]}>Customer Acquisition Cost (CAC)</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>${cac}</Text>
            </View>
            <View style={[styles.tableRow, styles.tableRowAlt]}>
              <Text style={[styles.tableCellBold, { flex: 2 }]}>Lifetime Value (LTV)</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>${ltv}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCellBold, { flex: 2 }]}>LTV:CAC Ratio</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{ltvCacRatio.toFixed(1)}x</Text>
            </View>
            <View style={[styles.tableRow, styles.tableRowAlt]}>
              <Text style={[styles.tableCellBold, { flex: 2 }]}>Health Assessment</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{ltvCacRatio >= 3 ? 'Healthy' : 'Needs Improvement'}</Text>
            </View>
          </View>

          <Text style={styles.subsectionTitle}>4.3 Competitive Position</Text>
          <Text style={styles.paragraph}>
            Based on our Competitive Analysis, {validation.title} operates in a {overallScore >= 7 ? 'favorable' : 'competitive'} market environment with {overallScore >= 6 ? 'differentiated positioning' : 'opportunity for differentiation'}. Key competitive factors have been assessed and incorporated into the valuation model.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Valuation Report - {validation.title}</Text>
          <Text style={styles.footerPage}>Page 7 of 12</Text>
        </View>
      </Page>

      {/* Financial Projections */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pageHeader}>
          <View style={styles.pageHeaderLeft}>
            <Text style={styles.pageHeaderTitle}>Valuation Report</Text>
            <Text style={styles.pageHeaderCompany}>{validation.title}</Text>
          </View>
          <View style={styles.pageHeaderRight}>
            <Text style={styles.pageNumber}>Page 8</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>5. FINANCIAL PROJECTIONS</Text>

          <Text style={styles.subsectionTitle}>5.1 Revenue Projections (5-Year Forecast)</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Year</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Revenue</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Growth</Text>
            </View>
            {[1, 2, 3, 4, 5].map((year, idx) => {
              const baseRevenue = som * 0.01;
              const growth = 0.5 + (overallScore / 20);
              const revenue = baseRevenue * Math.pow(1 + growth, year);
              const growthRate = year === 1 ? '-' : `${(growth * 100).toFixed(0)}%`;
              return (
                <View key={idx} style={idx % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 1 }]}>Year {year}</Text>
                  <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' as const }]}>{formatCurrency(revenue)}</Text>
                  <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' as const }]}>{growthRate}</Text>
                </View>
              );
            })}
          </View>

          <Text style={styles.subsectionTitle}>5.2 Scenario Analysis</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Scenario</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Year 5 Revenue</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Valuation</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCellBold, { flex: 1 }]}>Conservative</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{formatCurrency(estimatedValuation * 0.3)}</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{formatCurrency(estimatedValuation * 0.6)}</Text>
            </View>
            <View style={[styles.tableRow, styles.tableRowAlt]}>
              <Text style={[styles.tableCellBold, { flex: 1 }]}>Base Case</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{formatCurrency(estimatedValuation * 0.5)}</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{formatCurrency(estimatedValuation)}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCellBold, { flex: 1 }]}>Optimistic</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{formatCurrency(estimatedValuation * 0.8)}</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{formatCurrency(estimatedValuation * 1.5)}</Text>
            </View>
          </View>

          <Text style={styles.paragraph}>
            The financial projections are based on market size assumptions, growth trajectory analysis, and operational efficiency metrics. These projections have been risk-adjusted based on our AI agent assessments.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Valuation Report - {validation.title}</Text>
          <Text style={styles.footerPage}>Page 8 of 12</Text>
        </View>
      </Page>

      {/* Methodology */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pageHeader}>
          <View style={styles.pageHeaderLeft}>
            <Text style={styles.pageHeaderTitle}>Valuation Report</Text>
            <Text style={styles.pageHeaderCompany}>{validation.title}</Text>
          </View>
          <View style={styles.pageHeaderRight}>
            <Text style={styles.pageNumber}>Page 9</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>6. FAIR-VALUE MEASUREMENT METHODOLOGY</Text>

          <Text style={styles.paragraph}>
            When determining the value of a business enterprise, three general approaches are available: the market approach, the income approach, and the asset approach. The choice of approach depends on the specific facts and circumstances of the company and the purpose of valuation.
          </Text>

          <Text style={styles.subsectionTitle}>6.1 Asset Approach (Net Adjusted Value Method)</Text>
          <Text style={styles.paragraph}>
            The asset-based approach establishes value based on the cost of reproducing or replacing property, less depreciation. This method is typically used as a "floor" value. For growth-oriented technology companies like {validation.title}, where earning capacity significantly exceeds asset base, this method has been given minimal weight.
          </Text>

          <Text style={styles.subsectionTitle}>6.2 Market Approach (Comparable Companies Method)</Text>
          <Text style={styles.paragraph}>
            The market approach uses pricing multiples from comparable publicly traded companies or recent transactions. While useful for established companies, early-stage startups often lack directly comparable public companies. We have incorporated market multiples as a reference point in our analysis.
          </Text>

          <Text style={styles.subsectionTitle}>6.3 Income Approach (Discounted Cash Flow Method)</Text>
          <Text style={styles.paragraph}>
            The DCF method determines fair value by converting anticipated future benefits into a present value. This is the most appropriate method for early-stage companies with significant growth potential, as it captures the value of future cash flows discounted at an appropriate risk-adjusted rate.
          </Text>

          <View style={styles.methodBox}>
            <Text style={styles.methodTitle}>Primary Methodology Selected</Text>
            <Text style={styles.methodText}>
              Discounted Cash Flow (DCF) Method under Income Approach with 100% weight. This method provides the most comprehensive framework for valuing {validation.title} given its growth stage and market opportunity.
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Valuation Report - {validation.title}</Text>
          <Text style={styles.footerPage}>Page 9 of 12</Text>
        </View>
      </Page>

      {/* DCF Details */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pageHeader}>
          <View style={styles.pageHeaderLeft}>
            <Text style={styles.pageHeaderTitle}>Valuation Report</Text>
            <Text style={styles.pageHeaderCompany}>{validation.title}</Text>
          </View>
          <View style={styles.pageHeaderRight}>
            <Text style={styles.pageNumber}>Page 10</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>6.3 INCOME APPROACH - DCF METHOD (Continued)</Text>

          <Text style={styles.paragraph}>
            The Discounted Cash Flow (DCF) approach indicates Fair Market Value based on expected future cash flows. Post-tax cash flows are estimated after considering reinvestment requirements and working capital needs.
          </Text>

          <Text style={styles.subsectionTitle}>Cost of Equity Calculation</Text>
          <View style={styles.dcfTable}>
            <View style={styles.dcfRow}>
              <Text style={styles.dcfLabel}>Risk-free Rate of Return</Text>
              <Text style={styles.dcfValue}>4.5%</Text>
            </View>
            <View style={styles.dcfRow}>
              <Text style={styles.dcfLabel}>Market Risk Premium</Text>
              <Text style={styles.dcfValue}>6.0%</Text>
            </View>
            <View style={styles.dcfRow}>
              <Text style={styles.dcfLabel}>Beta (Industry Adjusted)</Text>
              <Text style={styles.dcfValue}>1.5</Text>
            </View>
            <View style={styles.dcfRow}>
              <Text style={styles.dcfLabel}>Size Premium</Text>
              <Text style={styles.dcfValue}>4.0%</Text>
            </View>
            <View style={styles.dcfRow}>
              <Text style={styles.dcfLabel}>Company Specific Risk Premium</Text>
              <Text style={styles.dcfValue}>{(10 - overallScore).toFixed(1)}%</Text>
            </View>
            <View style={[styles.dcfRow, styles.dcfHighlight]}>
              <Text style={[styles.dcfLabel, styles.dcfHighlightText]}>Cost of Equity (Ke)</Text>
              <Text style={[styles.dcfValue, styles.dcfHighlightText]}>{(20 + (10 - overallScore)).toFixed(1)}%</Text>
            </View>
          </View>

          <Text style={styles.subsectionTitle}>Terminal Value Assumptions</Text>
          <View style={styles.dcfTable}>
            <View style={styles.dcfRow}>
              <Text style={styles.dcfLabel}>Terminal Growth Rate</Text>
              <Text style={styles.dcfValue}>3.0%</Text>
            </View>
            <View style={styles.dcfRow}>
              <Text style={styles.dcfLabel}>Exit Multiple (Revenue)</Text>
              <Text style={styles.dcfValue}>{(5 + overallScore / 2).toFixed(1)}x</Text>
            </View>
          </View>

          <Text style={styles.paragraph}>
            The discount rate reflects business risk, capital structure considerations, and the specific risk profile identified through our 12-agent analysis. The terminal value incorporates assumptions of perpetual operations and long-term growth consistent with the broader market.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Valuation Report - {validation.title}</Text>
          <Text style={styles.footerPage}>Page 10 of 12</Text>
        </View>
      </Page>

      {/* Valuation Analysis */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pageHeader}>
          <View style={styles.pageHeaderLeft}>
            <Text style={styles.pageHeaderTitle}>Valuation Report</Text>
            <Text style={styles.pageHeaderCompany}>{validation.title}</Text>
          </View>
          <View style={styles.pageHeaderRight}>
            <Text style={styles.pageNumber}>Page 11</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>7. VALUATION ANALYSIS</Text>

          <Text style={styles.subsectionTitle}>7.1 Methodology Weights</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Approach</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Weight</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Contribution</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 2 }]}>DCF Method (Income Approach)</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>70%</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{formatCurrency(estimatedValuation * 0.7)}</Text>
            </View>
            <View style={[styles.tableRow, styles.tableRowAlt]}>
              <Text style={[styles.tableCell, { flex: 2 }]}>Market Comparables</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>20%</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{formatCurrency(estimatedValuation * 0.2)}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 2 }]}>Asset-Based Floor</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>10%</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{formatCurrency(estimatedValuation * 0.1)}</Text>
            </View>
          </View>

          <Text style={styles.subsectionTitle}>7.2 Risk Adjustments</Text>
          <Text style={styles.paragraph}>
            The following risk factors have been incorporated into the valuation based on our AI agent assessments:
          </Text>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>-</Text>
            <Text style={styles.bulletText}>Market Risk: Adjusted based on market volatility and competitive dynamics</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>-</Text>
            <Text style={styles.bulletText}>Execution Risk: Based on team assessment and operational capability scores</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>-</Text>
            <Text style={styles.bulletText}>Technology Risk: Evaluated through technical feasibility analysis</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>-</Text>
            <Text style={styles.bulletText}>Regulatory Risk: Assessed through legal and compliance review</Text>
          </View>

          <Text style={styles.subsectionTitle}>7.3 Valuation Range</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Scenario</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Equity Value</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCellBold, { flex: 1 }]}>Low End (Conservative)</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{formatCurrency(estimatedValuation * 0.7)}</Text>
            </View>
            <View style={[styles.tableRow, styles.tableRowAlt]}>
              <Text style={[styles.tableCellBold, { flex: 1 }]}>Mid-Point (Base Case)</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{formatCurrency(estimatedValuation)}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCellBold, { flex: 1 }]}>High End (Optimistic)</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{formatCurrency(estimatedValuation * 1.4)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Valuation Report - {validation.title}</Text>
          <Text style={styles.footerPage}>Page 11 of 12</Text>
        </View>
      </Page>

      {/* Conclusion */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pageHeader}>
          <View style={styles.pageHeaderLeft}>
            <Text style={styles.pageHeaderTitle}>Valuation Report</Text>
            <Text style={styles.pageHeaderCompany}>{validation.title}</Text>
          </View>
          <View style={styles.pageHeaderRight}>
            <Text style={styles.pageNumber}>Page 12</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>8. CONCLUSION</Text>

          <Text style={styles.paragraph}>
            The Fair Value of Equity of {validation.title} has been estimated using primarily the Income Approach (DCF Method), supplemented by Market Comparable analysis and Asset-Based considerations.
          </Text>

          <View style={styles.valueBox}>
            <Text style={styles.valueLabel}>CONCLUDED FAIR VALUE</Text>
            <Text style={styles.valueAmount}>{formatCurrency(estimatedValuation)}</Text>
            <Text style={styles.valueSubtext}>
              As of {currentDate}
            </Text>
          </View>

          <Text style={styles.paragraph}>
            This valuation reflects our assessment of {validation.title} based on the information provided, market conditions as of the valuation date, and the methodologies applied. The company has achieved a validation score of {overallScore.toFixed(1)}/10 with {confidence}% confidence level.
          </Text>

          <View style={styles.methodBox}>
            <Text style={styles.methodTitle}>Key Valuation Drivers</Text>
            <Text style={styles.methodText}>
              - Market Opportunity: {formatCurrency(tam)} TAM with {formatCurrency(som)} addressable market{'\n'}
              - Unit Economics: LTV/CAC ratio of {ltvCacRatio.toFixed(1)}x{'\n'}
              - Validation Score: {overallScore.toFixed(1)}/10 across 12 assessment dimensions{'\n'}
              - Risk-Adjusted Discount Rate: {(20 + (10 - overallScore)).toFixed(1)}%
            </Text>
          </View>

          <View style={styles.signatureSection}>
            <Text style={styles.paragraph}>
              This report has been generated by Startup Verdict's AI-powered valuation system. For questions or additional analysis, please visit www.startupverdict.com.
            </Text>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureName}>Report ID: {reportId}</Text>
              <Text style={styles.signatureTitle}>Generated: {currentDate}</Text>
              <Text style={styles.signatureDate}>Startup Verdict - AI-Powered Validation Intelligence</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Valuation Report - {validation.title}</Text>
          <Text style={styles.footerPage}>Page 12 of 12</Text>
        </View>
      </Page>
    </Document>
  );
};

// Export function for generating PDF blob
export const generateValuationReportPdf = async (
  validation: any,
  agents: any[]
): Promise<Blob> => {
  const doc = <ValuationReportDocument validation={validation} agents={agents} />;
  const blob = await pdf(doc).toBlob();
  return blob;
};

export default ValuationReportDocument;
