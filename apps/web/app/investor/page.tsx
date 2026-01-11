'use client';

import { useState, useEffect } from 'react';
import { useUser, useAuth, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const ScoreBadge = dynamic(
  () => import('../../components/charts/ScoreGauge').then((mod) => mod.ScoreBadge),
  { ssr: false }
);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://validation-production.up.railway.app';

interface Startup {
  id: string;
  title: string;
  description: string;
  industry: string;
  stage: string;
  score: number;
  confidence: number;
  verdict: string;
  geography: string[];
  founderName: string;
  founderAvatar: string;
  matchScore: number;
  isShortlisted: boolean;
  createdAt: string;
  highlights: string[];
  fundingAsk?: string;
}

interface InvestorProfile {
  checkSizeMin: number;
  checkSizeMax: number;
  stages: string[];
  industries: string[];
  geography: string[];
}

const STAGES = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Growth'];
const INDUSTRIES = [
  'AI/ML', 'SaaS', 'Fintech', 'Healthcare', 'E-commerce', 'EdTech',
  'CleanTech', 'Marketplace', 'Enterprise', 'Consumer', 'DeepTech', 'Crypto/Web3'
];

// Mock data for demo - would come from API
const MOCK_STARTUPS: Startup[] = [
  {
    id: '1',
    title: 'AIDocuSign',
    description: 'AI-powered document analysis and contract intelligence platform for legal teams.',
    industry: 'AI/ML',
    stage: 'Seed',
    score: 82,
    confidence: 78,
    verdict: 'PROCEED',
    geography: ['US', 'Europe'],
    founderName: 'Sarah Chen',
    founderAvatar: '',
    matchScore: 95,
    isShortlisted: false,
    createdAt: '2024-01-15',
    highlights: ['Strong PMF signals', '3x MoM growth', 'Repeat founder'],
    fundingAsk: '$2M',
  },
  {
    id: '2',
    title: 'HealthSync',
    description: 'Patient engagement platform with AI-driven health insights and remote monitoring.',
    industry: 'Healthcare',
    stage: 'Series A',
    score: 76,
    confidence: 82,
    verdict: 'PROCEED',
    geography: ['US'],
    founderName: 'Michael Park',
    founderAvatar: '',
    matchScore: 88,
    isShortlisted: true,
    createdAt: '2024-01-10',
    highlights: ['$500K ARR', 'Enterprise contracts', 'FDA pathway'],
    fundingAsk: '$8M',
  },
  {
    id: '3',
    title: 'GreenCommute',
    description: 'Corporate sustainability platform for tracking and reducing commute emissions.',
    industry: 'CleanTech',
    stage: 'Pre-Seed',
    score: 68,
    confidence: 65,
    verdict: 'PIVOT',
    geography: ['Europe'],
    founderName: 'Emma Wilson',
    founderAvatar: '',
    matchScore: 72,
    isShortlisted: false,
    createdAt: '2024-01-08',
    highlights: ['First-time founder', 'Strong domain expertise', 'Early traction'],
    fundingAsk: '$500K',
  },
  {
    id: '4',
    title: 'CodeMentor AI',
    description: 'AI coding assistant and mentorship platform for developer skill development.',
    industry: 'EdTech',
    stage: 'Seed',
    score: 79,
    confidence: 74,
    verdict: 'PROCEED',
    geography: ['US', 'India'],
    founderName: 'Raj Patel',
    founderAvatar: '',
    matchScore: 91,
    isShortlisted: false,
    createdAt: '2024-01-05',
    highlights: ['20K MAU', 'Viral growth', 'Technical team'],
    fundingAsk: '$3M',
  },
  {
    id: '5',
    title: 'SupplyChain360',
    description: 'End-to-end supply chain visibility with predictive analytics and risk management.',
    industry: 'Enterprise',
    stage: 'Series A',
    score: 85,
    confidence: 88,
    verdict: 'PROCEED',
    geography: ['US', 'Asia'],
    founderName: 'John Martinez',
    founderAvatar: '',
    matchScore: 78,
    isShortlisted: true,
    createdAt: '2024-01-02',
    highlights: ['Enterprise pilot', 'Strong moat', 'Experienced team'],
    fundingAsk: '$12M',
  },
];

export default function InvestorDashboard() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [startups, setStartups] = useState<Startup[]>(MOCK_STARTUPS);
  const [activeTab, setActiveTab] = useState<'discover' | 'shortlist' | 'contacted'>('discover');
  const [filters, setFilters] = useState({
    stage: [] as string[],
    industry: [] as string[],
    minScore: 0,
    sortBy: 'matchScore' as 'matchScore' | 'score' | 'createdAt',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStartup, setSelectedStartup] = useState<Startup | null>(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);

  const toggleShortlist = (id: string) => {
    setStartups(prev =>
      prev.map(s => s.id === id ? { ...s, isShortlisted: !s.isShortlisted } : s)
    );
  };

  const filteredStartups = startups
    .filter(s => {
      if (activeTab === 'shortlist') return s.isShortlisted;
      if (filters.stage.length && !filters.stage.includes(s.stage)) return false;
      if (filters.industry.length && !filters.industry.includes(s.industry)) return false;
      if (s.score < filters.minScore) return false;
      return true;
    })
    .sort((a, b) => {
      if (filters.sortBy === 'matchScore') return b.matchScore - a.matchScore;
      if (filters.sortBy === 'score') return b.score - a.score;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const shortlistedCount = startups.filter(s => s.isShortlisted).length;

  const getVerdictStyle = (verdict: string) => {
    const styles: Record<string, { bg: string; text: string }> = {
      PROCEED: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
      PIVOT: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
      RECONSIDER: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
      STOP: { bg: 'bg-red-500/20', text: 'text-red-400' },
    };
    return styles[verdict] || styles.PROCEED;
  };

  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-700 flex items-center justify-center text-xl">
              💼
            </div>
            <div>
              <span className="font-bold text-xl">Investor Portal</span>
              <span className="text-slate-500 text-sm ml-2">by Validation Council</span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/investor/settings" className="text-slate-400 hover:text-white text-sm">
              Settings
            </Link>
            <Link
              href="/pricing?type=investor"
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
            >
              Upgrade Plan
            </Link>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome & Stats */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Deal Flow Dashboard 💎
            </h1>
            <p className="text-slate-400">
              Discover AI-validated startups matching your investment thesis.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-slate-800/50 rounded-xl px-4 py-3 border border-slate-700">
              <div className="text-2xl font-bold text-purple-400">{startups.length}</div>
              <div className="text-xs text-slate-400">Available Deals</div>
            </div>
            <div className="bg-slate-800/50 rounded-xl px-4 py-3 border border-slate-700">
              <div className="text-2xl font-bold text-amber-400">{shortlistedCount}</div>
              <div className="text-xs text-slate-400">Shortlisted</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-1">
            {(['discover', 'shortlist', 'contacted'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize flex items-center gap-2 ${
                  activeTab === tab
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                {tab === 'discover' && '🔍'}
                {tab === 'shortlist' && '⭐'}
                {tab === 'contacted' && '📧'}
                {tab}
                {tab === 'shortlist' && shortlistedCount > 0 && (
                  <span className="bg-purple-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {shortlistedCount}
                  </span>
                )}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              showFilters ? 'bg-slate-700 text-white' : 'bg-slate-800/50 text-slate-400 hover:text-white'
            }`}
          >
            <span>⚡</span>
            Filters
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Stage Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Stage</label>
                <div className="flex flex-wrap gap-2">
                  {STAGES.map((stage) => (
                    <button
                      key={stage}
                      onClick={() => setFilters(prev => ({
                        ...prev,
                        stage: prev.stage.includes(stage)
                          ? prev.stage.filter(s => s !== stage)
                          : [...prev.stage, stage]
                      }))}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        filters.stage.includes(stage)
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {stage}
                    </button>
                  ))}
                </div>
              </div>

              {/* Industry Filter */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-400 mb-2">Industry</label>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRIES.slice(0, 8).map((industry) => (
                    <button
                      key={industry}
                      onClick={() => setFilters(prev => ({
                        ...prev,
                        industry: prev.industry.includes(industry)
                          ? prev.industry.filter(i => i !== industry)
                          : [...prev.industry, industry]
                      }))}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        filters.industry.includes(industry)
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {industry}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort & Min Score */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white"
                >
                  <option value="matchScore">Best Match</option>
                  <option value="score">Highest Score</option>
                  <option value="createdAt">Most Recent</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Startup Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStartups.map((startup) => {
            const verdictStyle = getVerdictStyle(startup.verdict);
            return (
              <div
                key={startup.id}
                className="bg-slate-800/50 rounded-xl border border-slate-700 hover:border-purple-500/50 transition-all group cursor-pointer"
                onClick={() => setSelectedStartup(startup)}
              >
                {/* Match Score Banner */}
                <div className="bg-gradient-to-r from-purple-600/20 to-indigo-600/20 px-4 py-2 rounded-t-xl border-b border-slate-700/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🎯</span>
                    <span className="text-sm font-medium text-purple-300">{startup.matchScore}% match</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleShortlist(startup.id); }}
                    className={`text-lg transition-all ${
                      startup.isShortlisted ? 'text-amber-400' : 'text-slate-500 hover:text-amber-400'
                    }`}
                  >
                    {startup.isShortlisted ? '⭐' : '☆'}
                  </button>
                </div>

                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg group-hover:text-purple-400 transition-colors">
                        {startup.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-slate-700 px-2 py-0.5 rounded text-slate-300">
                          {startup.industry}
                        </span>
                        <span className="text-xs bg-slate-700 px-2 py-0.5 rounded text-slate-300">
                          {startup.stage}
                        </span>
                      </div>
                    </div>
                    <ScoreBadge score={startup.score} size="md" />
                  </div>

                  {/* Description */}
                  <p className="text-sm text-slate-400 line-clamp-2 mb-4">
                    {startup.description}
                  </p>

                  {/* Highlights */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {startup.highlights.slice(0, 2).map((h, i) => (
                      <span key={i} className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded">
                        ✓ {h}
                      </span>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-xs font-bold">
                        {startup.founderName.charAt(0)}
                      </div>
                      <span className="text-sm text-slate-400">{startup.founderName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded ${verdictStyle.bg} ${verdictStyle.text}`}>
                        {startup.verdict}
                      </span>
                      {startup.fundingAsk && (
                        <span className="text-xs text-slate-500">
                          Raising {startup.fundingAsk}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredStartups.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">No startups match your criteria</h3>
            <p className="text-slate-400">Try adjusting your filters to see more deals.</p>
          </div>
        )}

        {/* Startup Detail Modal */}
        {selectedStartup && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold">{selectedStartup.title}</h2>
                    <ScoreBadge score={selectedStartup.score} size="md" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm bg-slate-700 px-2 py-0.5 rounded text-slate-300">
                      {selectedStartup.industry}
                    </span>
                    <span className="text-sm bg-slate-700 px-2 py-0.5 rounded text-slate-300">
                      {selectedStartup.stage}
                    </span>
                    <span className="text-sm text-purple-400">
                      {selectedStartup.matchScore}% match to your thesis
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStartup(null)}
                  className="text-slate-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-2">About</h3>
                  <p className="text-slate-200">{selectedStartup.description}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-2">Key Highlights</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedStartup.highlights.map((h, i) => (
                      <span key={i} className="text-sm bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-lg">
                        ✓ {h}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <div className="text-slate-400 text-sm mb-1">Validation Score</div>
                    <div className="text-2xl font-bold text-emerald-400">{selectedStartup.score}/100</div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <div className="text-slate-400 text-sm mb-1">Raising</div>
                    <div className="text-2xl font-bold text-purple-400">{selectedStartup.fundingAsk || 'TBD'}</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-2">Founder</h3>
                  <div className="flex items-center gap-3 bg-slate-900/50 rounded-lg p-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-xl font-bold">
                      {selectedStartup.founderName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold">{selectedStartup.founderName}</div>
                      <div className="text-sm text-slate-400">Founder & CEO</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="sticky bottom-0 bg-slate-800 border-t border-slate-700 p-6 flex items-center gap-4">
                <button
                  onClick={() => toggleShortlist(selectedStartup.id)}
                  className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                    selectedStartup.isShortlisted
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {selectedStartup.isShortlisted ? '⭐ Shortlisted' : '☆ Add to Shortlist'}
                </button>
                <button
                  onClick={() => setContactModalOpen(true)}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-3 rounded-xl font-semibold transition-all"
                >
                  📧 Request Intro
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Contact Modal */}
        {contactModalOpen && selectedStartup && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-lg">
              <div className="p-6 border-b border-slate-700">
                <h2 className="text-xl font-bold">Request Introduction</h2>
                <p className="text-slate-400 text-sm mt-1">
                  Send an intro request to {selectedStartup.founderName}
                </p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Message to Founder
                  </label>
                  <textarea
                    rows={4}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                    placeholder="Introduce yourself and explain why you're interested in their startup..."
                    defaultValue={`Hi ${selectedStartup.founderName},\n\nI'm an investor interested in ${selectedStartup.industry} startups. Your validation score of ${selectedStartup.score} caught my attention, and I'd love to learn more about ${selectedStartup.title}.\n\nWould you be open to a brief call?`}
                  />
                </div>
              </div>
              <div className="p-6 border-t border-slate-700 flex items-center gap-4">
                <button
                  onClick={() => setContactModalOpen(false)}
                  className="flex-1 py-3 rounded-xl font-semibold bg-slate-700 text-slate-300 hover:bg-slate-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setContactModalOpen(false);
                    setSelectedStartup(null);
                    // Would trigger API call here
                    alert('Intro request sent! The founder will be notified.');
                  }}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-3 rounded-xl font-semibold transition-all"
                >
                  Send Request
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
