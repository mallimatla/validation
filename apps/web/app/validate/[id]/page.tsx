'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import jsPDF from 'jspdf';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://validation-production.up.railway.app';

// The 12 AI agents
const AGENTS = [
  { id: 'marcus', name: 'Marcus', role: 'Market Intel', icon: '📊', description: 'Validates market size, timing, and opportunity' },
  { id: 'sophia', name: 'Sophia', role: 'Competition', icon: '🎯', description: 'Maps competitive landscape and differentiation' },
  { id: 'david', name: 'David', role: 'Financial', icon: '💰', description: 'Validates unit economics and financial viability' },
  { id: 'elena', name: 'Elena', role: 'Customer', icon: '👥', description: 'Analyzes customer data for product-market fit' },
  { id: 'james', name: 'James', role: 'Team', icon: '👔', description: 'Evaluates team capability and execution risk' },
  { id: 'rachel', name: 'Rachel', role: 'Legal/Risk', icon: '⚖️', description: 'Identifies legal and compliance risks' },
  { id: 'omar', name: 'Omar', role: 'Technology', icon: '⚙️', description: 'Assesses technical feasibility and timelines' },
  { id: 'nora', name: 'Nora', role: 'Funding', icon: '🏦', description: 'Maps funding landscape and comparable companies' },
  { id: 'victor', name: 'Victor', role: 'Valuation', icon: '💎', description: 'Provides data-driven valuation analysis' },
  { id: 'victoria', name: 'Victoria', role: 'Synthesis', icon: '🔮', description: 'Synthesizes all reports into final verdict' },
  { id: 'sentinel', name: 'Sentinel', role: 'Trust/Audit', icon: '🛡️', description: 'Ensures platform integrity and accuracy' },
  { id: 'aria', name: 'ARIA', role: 'Orchestrator', icon: '🎭', description: 'Manages validation workflow and coordination' },
];

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

export default function ValidationProgressPage() {
  const params = useParams();
  const validationId = params.id as string;
  const { getToken, isSignedIn } = useAuth();

  const [validation, setValidation] = useState<ValidationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [pptxDownloadCount, setPptxDownloadCount] = useState(0);
  const [userTier, setUserTier] = useState<'free' | 'pro'>('free'); // TODO: Get from user subscription

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showDownloadMenu && !target.closest('.download-menu-container')) {
        setShowDownloadMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDownloadMenu]);

  useEffect(() => {
    const fetchValidation = async () => {
      try {
        const headers: Record<string, string> = {};
        if (isSignedIn) {
          const token = await getToken();
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
        }

        const response = await fetch(`${API_URL}/api/v1/validations/${validationId}`, { headers });
        if (!response.ok) {
          throw new Error('Failed to fetch validation');
        }

        const data = await response.json();
        setValidation(data);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load validation');
        setIsLoading(false);
      }
    };

    fetchValidation();
  }, [validationId, isSignedIn, getToken]);

  const getAgent = (id: string) => AGENTS.find(a => a.id === id);
  const getAgentReport = (id: string) => validation?.agentReports?.find(r => r.agentId === id);
  const getScoreColor = (s: number) => s >= 70 ? 'text-emerald-400' : s >= 50 ? 'text-yellow-400' : 'text-red-400';
  const getScoreBg = (s: number) => s >= 70 ? 'bg-emerald-500/20 border-emerald-500/50' : s >= 50 ? 'bg-yellow-500/20 border-yellow-500/50' : 'bg-red-500/20 border-red-500/50';
  const getFindingColor = (t: string) => ({ strength: 'border-emerald-500/30 bg-emerald-500/10', weakness: 'border-red-500/30 bg-red-500/10', opportunity: 'border-blue-500/30 bg-blue-500/10', threat: 'border-orange-500/30 bg-orange-500/10', neutral: 'border-slate-500/30 bg-slate-500/10' }[t] || 'border-slate-500/30 bg-slate-500/10');

  // Download limits: Free = 2, Pro = unlimited
  const maxFreeDownloads = 2;
  const canDownloadPPTX = userTier === 'pro' || pptxDownloadCount < maxFreeDownloads;
  const remainingDownloads = userTier === 'pro' ? 'Unlimited' : Math.max(0, maxFreeDownloads - pptxDownloadCount);

  const downloadPPTX = async (template: string = 'professional') => {
    if (!validation) return;

    if (!canDownloadPPTX) {
      alert('You have reached your free download limit. Upgrade to Pro for unlimited downloads!');
      return;
    }

    setIsDownloading(true);
    setShowDownloadMenu(false);

    try {
      const response = await fetch(`${API_URL}/api/v1/pptx/validation/${validationId}?template=${template}`);
      if (!response.ok) {
        throw new Error('Failed to generate PPTX');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `validation-report-${validationId}-${template}.pptx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Increment download count
      setPptxDownloadCount(prev => prev + 1);
    } catch (err) {
      console.error('PPTX download error:', err);
      alert('Failed to download PPTX. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Download Validation Report PDF
  const downloadValidationPDF = () => {
    if (!validation) return;
    setIsDownloading(true);
    setShowDownloadMenu(false);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      let y = 20;

      // Helper function to add text with word wrap
      const addWrappedText = (text: string, x: number, startY: number, maxWidth: number, lineHeight: number = 6): number => {
        const lines = doc.splitTextToSize(text, maxWidth);
        lines.forEach((line: string) => {
          if (startY > 270) {
            doc.addPage();
            startY = 20;
          }
          doc.text(line, x, startY);
          startY += lineHeight;
        });
        return startY;
      };

      // Header
      doc.setFillColor(15, 23, 42); // Dark slate
      doc.rect(0, 0, pageWidth, 45, 'F');

      doc.setTextColor(74, 222, 128); // Emerald
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('THE VALIDATION COUNCIL', pageWidth / 2, 20, { align: 'center' });

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.text('OFFICIAL VALIDATION REPORT', pageWidth / 2, 32, { align: 'center' });

      y = 55;

      // Report Info Box
      doc.setFillColor(30, 41, 59); // Slate 800
      doc.rect(margin, y, contentWidth, 35, 'F');

      doc.setTextColor(148, 163, 184); // Slate 400
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('STARTUP', margin + 5, y + 10);
      doc.text('DATE', margin + 5, y + 22);
      doc.text('REPORT ID', pageWidth / 2, y + 10);
      doc.text('STATUS', pageWidth / 2, y + 22);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(validation.title || 'N/A', margin + 35, y + 10);
      doc.text(new Date(validation.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), margin + 25, y + 22);
      doc.text(validationId.substring(0, 20) + '...', pageWidth / 2 + 35, y + 10);
      doc.text(validation.status?.toUpperCase() || 'N/A', pageWidth / 2 + 30, y + 22);

      y += 45;

      // Score Box
      const scoreColor = (validation.overallScore || 0) >= 70 ? [74, 222, 128] : (validation.overallScore || 0) >= 50 ? [250, 204, 21] : [248, 113, 113];
      doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
      doc.rect(margin, y, 50, 30, 'F');
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.text(`${validation.overallScore || 0}`, margin + 25, y + 20, { align: 'center' });
      doc.setFontSize(10);
      doc.text('/100', margin + 40, y + 20);

      // Verdict and Confidence
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('VERDICT', margin + 60, y + 8);
      doc.text('CONFIDENCE', margin + 60, y + 20);
      doc.text('RECOMMENDATION', margin + 120, y + 8);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(validation.verdict?.replace(/_/g, ' ') || 'N/A', margin + 60, y + 15);
      doc.text(`${validation.overallConfidence || 0}%`, margin + 60, y + 27);
      doc.text(validation.recommendation || 'N/A', margin + 120, y + 15);

      y += 40;

      // Executive Summary
      doc.setFillColor(30, 41, 59);
      doc.rect(margin, y, contentWidth, 8, 'F');
      doc.setTextColor(74, 222, 128);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('EXECUTIVE SUMMARY', margin + 5, y + 6);
      y += 12;

      doc.setTextColor(71, 85, 105);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      y = addWrappedText(validation.executiveSummary || 'No executive summary available.', margin, y, contentWidth, 5);
      y += 10;

      // Agent Reports
      doc.setFillColor(30, 41, 59);
      doc.rect(margin, y, contentWidth, 8, 'F');
      doc.setTextColor(74, 222, 128);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('AI AGENT ANALYSIS', margin + 5, y + 6);
      y += 15;

      validation.agentReports?.forEach(report => {
        if (y > 250) {
          doc.addPage();
          y = 20;
        }

        const agent = getAgent(report.agentId);
        const agentScoreColor = report.score >= 70 ? [74, 222, 128] : report.score >= 50 ? [250, 204, 21] : [248, 113, 113];

        // Agent header
        doc.setFillColor(51, 65, 85);
        doc.rect(margin, y, contentWidth, 12, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(`${agent?.name?.toUpperCase() || 'AGENT'} - ${agent?.role?.toUpperCase() || 'ROLE'}`, margin + 5, y + 8);

        doc.setFillColor(agentScoreColor[0], agentScoreColor[1], agentScoreColor[2]);
        doc.rect(pageWidth - margin - 30, y + 2, 25, 8, 'F');
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        doc.text(`${report.score}/100`, pageWidth - margin - 17.5, y + 8, { align: 'center' });

        y += 16;

        // Findings
        if (report.findings?.length) {
          doc.setTextColor(100, 116, 139);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.text('Key Findings:', margin + 5, y);
          y += 5;
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(71, 85, 105);
          report.findings.slice(0, 3).forEach((f) => {
            y = addWrappedText(`• [${f.type?.toUpperCase()}] ${f.title}: ${f.description}`, margin + 8, y, contentWidth - 10, 4);
          });
          y += 3;
        }

        // Risks
        if (report.risks?.length) {
          doc.setTextColor(251, 146, 60);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.text('Risks:', margin + 5, y);
          y += 5;
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(71, 85, 105);
          report.risks.slice(0, 2).forEach((r) => {
            y = addWrappedText(`• ${r.title} (${r.probability}/${r.impact})`, margin + 8, y, contentWidth - 10, 4);
          });
          y += 3;
        }

        y += 5;
      });

      // Footer
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 280, pageWidth, 17, 'F');
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(8);
      doc.text('Generated by The Validation Council AI Platform | www.startupverdict.com', pageWidth / 2, 288, { align: 'center' });
      doc.text(`Report Generated: ${new Date().toISOString()}`, pageWidth / 2, 293, { align: 'center' });

      // Save PDF
      doc.save(`Validation-Report-${validation.title?.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`);
    } catch (err) {
      console.error('Validation PDF download error:', err);
      alert('Failed to download report. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Download Valuation Report PDF (Victor's analysis)
  const downloadValuationPDF = () => {
    if (!validation) return;
    setIsDownloading(true);
    setShowDownloadMenu(false);

    try {
      const victorReport = validation.agentReports?.find(r => r.agentId === 'victor');
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      let y = 20;

      // Helper function to add text with word wrap
      const addWrappedText = (text: string, x: number, startY: number, maxWidth: number, lineHeight: number = 6): number => {
        const lines = doc.splitTextToSize(text, maxWidth);
        lines.forEach((line: string) => {
          if (startY > 270) {
            doc.addPage();
            startY = 20;
          }
          doc.text(line, x, startY);
          startY += lineHeight;
        });
        return startY;
      };

      // Header
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, 45, 'F');

      doc.setTextColor(168, 85, 247); // Purple
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('THE VALIDATION COUNCIL', pageWidth / 2, 20, { align: 'center' });

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.text('VALUATION ANALYSIS REPORT', pageWidth / 2, 32, { align: 'center' });

      y = 55;

      // Report Info
      doc.setFillColor(30, 41, 59);
      doc.rect(margin, y, contentWidth, 25, 'F');

      doc.setTextColor(148, 163, 184);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('STARTUP', margin + 5, y + 10);
      doc.text('DATE', margin + 5, y + 18);
      doc.text('ANALYZED BY', pageWidth / 2, y + 10);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(validation.title || 'N/A', margin + 35, y + 10);
      doc.text(new Date(validation.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), margin + 25, y + 18);
      doc.text('Victor AI - Valuation Agent', pageWidth / 2 + 40, y + 10);

      y += 35;

      if (victorReport) {
        // Valuation Score
        const scoreColor = victorReport.score >= 70 ? [74, 222, 128] : victorReport.score >= 50 ? [250, 204, 21] : [248, 113, 113];
        doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
        doc.rect(margin, y, 60, 35, 'F');
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(32);
        doc.setFont('helvetica', 'bold');
        doc.text(`${victorReport.score}`, margin + 30, y + 22, { align: 'center' });
        doc.setFontSize(12);
        doc.text('/100', margin + 50, y + 22);
        doc.setFontSize(9);
        doc.text('VALUATION SCORE', margin + 30, y + 30, { align: 'center' });

        // Confidence
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('CONFIDENCE LEVEL', margin + 75, y + 10);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text(`${victorReport.confidence}%`, margin + 75, y + 25);

        y += 45;

        // Findings Section
        if (victorReport.findings?.length) {
          doc.setFillColor(30, 41, 59);
          doc.rect(margin, y, contentWidth, 8, 'F');
          doc.setTextColor(168, 85, 247);
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text('VALUATION FINDINGS', margin + 5, y + 6);
          y += 15;

          doc.setTextColor(71, 85, 105);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          victorReport.findings.forEach((f, i) => {
            if (y > 250) {
              doc.addPage();
              y = 20;
            }
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 255, 255);
            y = addWrappedText(`${i + 1}. ${f.title}`, margin, y, contentWidth, 5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 116, 139);
            doc.text(`Type: ${f.type} | Severity: ${f.severity}`, margin + 5, y);
            y += 5;
            doc.setTextColor(71, 85, 105);
            y = addWrappedText(f.description, margin + 5, y, contentWidth - 10, 4);
            if (f.evidence?.length) {
              doc.setTextColor(148, 163, 184);
              y = addWrappedText(`Evidence: ${f.evidence.join(', ')}`, margin + 5, y, contentWidth - 10, 4);
            }
            y += 5;
          });
        }

        // Risks Section
        if (victorReport.risks?.length) {
          if (y > 220) {
            doc.addPage();
            y = 20;
          }
          doc.setFillColor(30, 41, 59);
          doc.rect(margin, y, contentWidth, 8, 'F');
          doc.setTextColor(251, 146, 60);
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text('VALUATION RISKS', margin + 5, y + 6);
          y += 15;

          victorReport.risks.forEach((r, i) => {
            if (y > 250) {
              doc.addPage();
              y = 20;
            }
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 255, 255);
            y = addWrappedText(`${i + 1}. ${r.title}`, margin, y, contentWidth, 5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(251, 146, 60);
            doc.text(`Probability: ${r.probability} | Impact: ${r.impact}`, margin + 5, y);
            y += 5;
            doc.setTextColor(71, 85, 105);
            y = addWrappedText(r.description, margin + 5, y, contentWidth - 10, 4);
            if (r.mitigations?.length) {
              doc.setTextColor(74, 222, 128);
              y = addWrappedText(`Mitigations: ${r.mitigations.join('; ')}`, margin + 5, y, contentWidth - 10, 4);
            }
            y += 5;
          });
        }

        // Recommendations Section
        if (victorReport.recommendations?.length) {
          if (y > 220) {
            doc.addPage();
            y = 20;
          }
          doc.setFillColor(30, 41, 59);
          doc.rect(margin, y, contentWidth, 8, 'F');
          doc.setTextColor(96, 165, 250);
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text('VALUATION RECOMMENDATIONS', margin + 5, y + 6);
          y += 15;

          victorReport.recommendations.forEach((rec, i) => {
            if (y > 250) {
              doc.addPage();
              y = 20;
            }
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 255, 255);
            y = addWrappedText(`${i + 1}. ${rec.title}`, margin, y, contentWidth, 5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(96, 165, 250);
            doc.text(`Priority: ${rec.priority} | Timeframe: ${rec.timeframe}`, margin + 5, y);
            y += 5;
            doc.setTextColor(71, 85, 105);
            y = addWrappedText(rec.description, margin + 5, y, contentWidth - 10, 4);
            y += 5;
          });
        }
      } else {
        doc.setTextColor(148, 163, 184);
        doc.setFontSize(14);
        doc.text('Valuation analysis not yet completed.', pageWidth / 2, y + 20, { align: 'center' });
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 280, pageWidth, 17, 'F');
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(8);
        doc.text('Generated by The Validation Council - Victor AI | www.startupverdict.com', pageWidth / 2, 288, { align: 'center' });
        doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, 293, { align: 'center' });
      }

      // Save PDF
      doc.save(`Valuation-Report-${validation.title?.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`);
    } catch (err) {
      console.error('Valuation PDF download error:', err);
      alert('Failed to download valuation report. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading validation results...</p>
        </div>
      </main>
    );
  }

  if (error || !validation) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Validation not found'}</p>
          <Link href="/dashboard" className="text-emerald-400 hover:underline">Back to Dashboard</Link>
        </div>
      </main>
    );
  }

  const selectedReport = expandedAgent ? getAgentReport(expandedAgent) : null;
  const selectedAgent = expandedAgent ? getAgent(expandedAgent) : null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-slate-400 hover:text-white">&larr; Dashboard</Link>
              <span className="text-slate-600">|</span>
              <Link href="/validate" className="text-slate-400 hover:text-white">+ New Validation</Link>
            </div>
            <div className="relative download-menu-container">
              <button
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                disabled={isDownloading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isDownloading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <span>Download Report</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </>
                )}
              </button>

              {showDownloadMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-800 rounded-lg shadow-xl border border-slate-700 z-50 overflow-hidden">
                  {/* Official Reports Section - Always Available */}
                  <div className="p-2 border-b border-slate-700 bg-emerald-900/20">
                    <p className="text-xs text-emerald-400 uppercase px-2 font-semibold">Official Reports</p>
                  </div>
                  <button
                    onClick={downloadValidationPDF}
                    className="w-full text-left px-4 py-3 hover:bg-slate-700 transition-colors border-b border-slate-700/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📋</span>
                      <div className="flex-1">
                        <p className="font-medium text-white">Validation Report</p>
                        <p className="text-xs text-slate-400">Complete 12-agent analysis</p>
                      </div>
                      <span className="text-xs bg-emerald-600 text-white px-2 py-0.5 rounded">FREE</span>
                    </div>
                  </button>
                  <button
                    onClick={downloadValuationPDF}
                    className="w-full text-left px-4 py-3 hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">💎</span>
                      <div className="flex-1">
                        <p className="font-medium text-white">Valuation Report</p>
                        <p className="text-xs text-slate-400">Victor AI valuation analysis</p>
                      </div>
                      <span className="text-xs bg-emerald-600 text-white px-2 py-0.5 rounded">FREE</span>
                    </div>
                  </button>

                  {/* Presentation Templates Section */}
                  <div className="p-2 border-t border-slate-700">
                    <div className="flex items-center justify-between px-2">
                      <p className="text-xs text-slate-400 uppercase">Presentation Templates</p>
                      <span className="text-xs text-amber-400">
                        {userTier === 'pro' ? 'Unlimited' : `${remainingDownloads} left`}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => downloadPPTX('professional')}
                    disabled={!canDownloadPPTX}
                    className={`w-full text-left px-4 py-3 transition-colors ${canDownloadPPTX ? 'hover:bg-slate-700' : 'opacity-50 cursor-not-allowed'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📊</span>
                      <div>
                        <p className="font-medium text-white">Professional</p>
                        <p className="text-xs text-slate-400">Corporate dark blue theme</p>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => downloadPPTX('modern')}
                    disabled={!canDownloadPPTX}
                    className={`w-full text-left px-4 py-3 transition-colors ${canDownloadPPTX ? 'hover:bg-slate-700' : 'opacity-50 cursor-not-allowed'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">✨</span>
                      <div>
                        <p className="font-medium text-white">Modern</p>
                        <p className="text-xs text-slate-400">Vibrant gradient style</p>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => downloadPPTX('minimal')}
                    disabled={!canDownloadPPTX}
                    className={`w-full text-left px-4 py-3 transition-colors ${canDownloadPPTX ? 'hover:bg-slate-700' : 'opacity-50 cursor-not-allowed'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📄</span>
                      <div>
                        <p className="font-medium text-white">Minimal</p>
                        <p className="text-xs text-slate-400">Clean, simple design</p>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => downloadPPTX('investor')}
                    disabled={!canDownloadPPTX}
                    className={`w-full text-left px-4 py-3 transition-colors ${canDownloadPPTX ? 'hover:bg-slate-700' : 'opacity-50 cursor-not-allowed'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">💼</span>
                      <div>
                        <p className="font-medium text-white">Investor Pitch</p>
                        <p className="text-xs text-slate-400">Pitch deck format</p>
                      </div>
                    </div>
                  </button>

                  {/* Upgrade prompt for free users */}
                  {userTier === 'free' && pptxDownloadCount >= maxFreeDownloads && (
                    <div className="p-3 bg-gradient-to-r from-amber-900/30 to-orange-900/30 border-t border-amber-700/50">
                      <p className="text-xs text-amber-300 text-center">
                        Upgrade to Pro for unlimited downloads
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{validation.title}</h1>
            <p className="text-slate-400 font-mono text-sm">ID: {validationId}</p>
            <p className="text-slate-500 text-sm mt-1">Created: {new Date(validation.createdAt).toLocaleDateString()}</p>
          </div>

          {/* Overall Score Card */}
          <div className="bg-slate-800/50 rounded-lg p-6 mb-8 border border-slate-700">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold mb-1">Analysis Complete</h2>
                <p className="text-slate-400 text-sm">All 12 AI agents have completed their analysis</p>
              </div>
              <div className={`text-right px-4 py-2 rounded-lg border ${getScoreBg(validation.overallScore || 0)}`}>
                <span className={`text-4xl font-bold ${getScoreColor(validation.overallScore || 0)}`}>
                  {validation.overallScore}
                </span>
                <span className="text-slate-400 text-lg">/100</span>
              </div>
            </div>

            {/* Verdict */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <p className="text-slate-400 text-xs uppercase mb-1">Verdict</p>
                <p className={`text-lg font-semibold ${validation.verdict === 'PROCEED' ? 'text-emerald-400' : validation.verdict === 'PROCEED_WITH_CAUTION' ? 'text-yellow-400' : 'text-red-400'}`}>
                  {validation.verdict?.replace(/_/g, ' ')}
                </p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4">
                <p className="text-slate-400 text-xs uppercase mb-1">Confidence</p>
                <p className="text-lg font-semibold text-white">{validation.overallConfidence}%</p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4">
                <p className="text-slate-400 text-xs uppercase mb-1">Recommendation</p>
                <p className={`text-lg font-semibold ${validation.recommendation === 'GREEN' ? 'text-emerald-400' : validation.recommendation === 'YELLOW' ? 'text-yellow-400' : 'text-red-400'}`}>
                  {validation.recommendation}
                </p>
              </div>
            </div>

            {/* Executive Summary */}
            {validation.executiveSummary && (
              <div className="bg-slate-700/30 rounded-lg p-4">
                <p className="text-slate-400 text-xs uppercase mb-2">Executive Summary</p>
                <p className="text-slate-300">{validation.executiveSummary}</p>
              </div>
            )}
          </div>

          {/* Agent Grid */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">AI Agent Council (12 Agents)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {AGENTS.map((agent) => {
                const report = getAgentReport(agent.id);

                return (
                  <div
                    key={agent.id}
                    onClick={() => report && setExpandedAgent(expandedAgent === agent.id ? null : agent.id)}
                    className={`rounded-lg p-4 border transition-all cursor-pointer hover:border-emerald-500/60 ${
                      expandedAgent === agent.id ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-slate-800' :
                      report ? `${getScoreBg(report.score)} border` : 'bg-slate-800/50 border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{agent.icon}</span>
                        <div>
                          <h3 className="font-semibold">{agent.name}</h3>
                          <p className="text-xs text-slate-400">{agent.role}</p>
                        </div>
                      </div>
                      {report && (
                        <div className="text-right">
                          <span className={`text-xl font-bold ${getScoreColor(report.score)}`}>{report.score}</span>
                          <p className="text-xs text-slate-500">{report.confidence}% conf</p>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{agent.description}</p>
                    {report && <p className="text-xs text-emerald-400 mt-2">Click to view details</p>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Expanded Agent Detail Modal */}
          {expandedAgent && selectedReport && selectedAgent && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setExpandedAgent(null)}>
              <div className="bg-slate-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-700" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{selectedAgent.icon}</span>
                    <div>
                      <h3 className="text-xl font-bold">{selectedAgent.name}</h3>
                      <p className="text-slate-400">{selectedAgent.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`px-4 py-2 rounded-lg border ${getScoreBg(selectedReport.score)}`}>
                      <span className={`text-2xl font-bold ${getScoreColor(selectedReport.score)}`}>{selectedReport.score}</span>
                      <span className="text-slate-400">/100</span>
                    </div>
                    <button onClick={() => setExpandedAgent(null)} className="text-slate-400 hover:text-white text-2xl">&times;</button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Findings */}
                  {selectedReport.findings?.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold mb-3 text-emerald-400">Key Findings</h4>
                      <div className="space-y-3">
                        {selectedReport.findings.map((finding, idx) => (
                          <div key={idx} className={`p-4 rounded-lg border ${getFindingColor(finding.type)}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs uppercase px-2 py-0.5 rounded bg-slate-700 text-slate-300">{finding.type}</span>
                              <span className="text-xs uppercase px-2 py-0.5 rounded bg-slate-700 text-slate-400">{finding.severity}</span>
                            </div>
                            <h5 className="font-semibold">{finding.title}</h5>
                            <p className="text-slate-300 text-sm mt-1">{finding.description}</p>
                            {finding.evidence && finding.evidence.length > 0 && (
                              <p className="text-xs text-slate-500 mt-2">Evidence: {finding.evidence.join(', ')}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Risks */}
                  {selectedReport.risks?.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold mb-3 text-orange-400">Risks Identified</h4>
                      <div className="space-y-3">
                        {selectedReport.risks.map((risk, idx) => (
                          <div key={idx} className="p-4 rounded-lg border border-orange-500/30 bg-orange-500/10">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs uppercase px-2 py-0.5 rounded bg-orange-600/30 text-orange-300">{risk.probability} prob</span>
                              <span className="text-xs uppercase px-2 py-0.5 rounded bg-orange-600/30 text-orange-300">{risk.impact} impact</span>
                            </div>
                            <h5 className="font-semibold">{risk.title}</h5>
                            <p className="text-slate-300 text-sm mt-1">{risk.description}</p>
                            {risk.mitigations && risk.mitigations.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs text-slate-400">Mitigations:</p>
                                <ul className="text-xs text-slate-300 list-disc list-inside">
                                  {risk.mitigations.map((m, i) => <li key={i}>{m}</li>)}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {selectedReport.recommendations?.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold mb-3 text-blue-400">Recommendations</h4>
                      <div className="space-y-3">
                        {selectedReport.recommendations.map((rec, idx) => (
                          <div key={idx} className="p-4 rounded-lg border border-blue-500/30 bg-blue-500/10">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs uppercase px-2 py-0.5 rounded bg-blue-600/30 text-blue-300">{rec.priority}</span>
                              <span className="text-xs uppercase px-2 py-0.5 rounded bg-blue-600/30 text-blue-300">{rec.timeframe}</span>
                            </div>
                            <h5 className="font-semibold">{rec.title}</h5>
                            <p className="text-slate-300 text-sm mt-1">{rec.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
