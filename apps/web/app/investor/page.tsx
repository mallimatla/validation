'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://validation-production.up.railway.app';

// Industry options for filtering
const INDUSTRIES = [
  { id: 'all', label: 'All Industries', icon: '🌐' },
  { id: 'technology', label: 'Technology', icon: '💻' },
  { id: 'fintech', label: 'Fintech', icon: '💰' },
  { id: 'healthcare', label: 'Healthcare', icon: '🏥' },
  { id: 'edtech', label: 'EdTech', icon: '📚' },
  { id: 'ecommerce', label: 'E-commerce', icon: '🛒' },
  { id: 'ai_ml', label: 'AI / ML', icon: '🤖' },
  { id: 'proptech', label: 'PropTech', icon: '🏠' },
  { id: 'foodtech', label: 'FoodTech', icon: '🍔' },
];

const STAGES = [
  { id: 'all', label: 'All Stages' },
  { id: 'idea', label: 'Idea Stage' },
  { id: 'mvp', label: 'MVP' },
  { id: 'launched', label: 'Launched' },
  { id: 'traction', label: 'Traction' },
  { id: 'scaling', label: 'Scaling' },
];

const SCORE_FILTERS = [
  { id: 'all', label: 'All Scores', min: 0 },
  { id: 'top', label: '80+ (Top Rated)', min: 80 },
  { id: 'good', label: '70+ (Good)', min: 70 },
  { id: 'promising', label: '60+ (Promising)', min: 60 },
];

const SORT_OPTIONS = [
  { id: 'score_desc', label: 'Highest Score' },
  { id: 'recent', label: 'Most Recent' },
  { id: 'trending', label: 'Trending' },
  { id: 'views', label: 'Most Viewed' },
];

interface StartupDeal {
  id: string;
  title: string;
  description: string;
  industry: string;
  stage: string;
  businessModel: string;
  overallScore: number;
  overallConfidence: number;
  recommendation: string;
  verdict: string;
  viewCount: number;
  saveCount: number;
  interestCount: number;
  createdAt: string;
  founderData?: {
    currentMRR?: number;
    currentUsers?: number;
    fundingAsk?: number;
  };
  // Investor's interaction with this deal
  isSaved?: boolean;
  myInterest?: string;
}

// Mock data for demonstration
const MOCK_DEALS: StartupDeal[] = [
  {
    id: '1',
    title: 'AI-Powered Code Review Platform',
    description: 'Automated code review using LLMs to catch bugs, security issues, and suggest improvements.',
    industry: 'technology',
    stage: 'mvp',
    businessModel: 'saas',
    overallScore: 87,
    overallConfidence: 82,
    recommendation: 'GREEN',
    verdict: 'PROCEED',
    viewCount: 234,
    saveCount: 45,
    interestCount: 12,
    createdAt: '2026-01-05',
    founderData: { currentMRR: 5000, currentUsers: 150, fundingAsk: 500000 },
  },
  {
    id: '2',
    title: 'HealthBuddy - AI Health Assistant',
    description: 'Personal health assistant that monitors symptoms, suggests remedies, and connects with doctors.',
    industry: 'healthcare',
    stage: 'launched',
    businessModel: 'subscription',
    overallScore: 79,
    overallConfidence: 75,
    recommendation: 'GREEN',
    verdict: 'PROCEED',
    viewCount: 189,
    saveCount: 38,
    interestCount: 8,
    createdAt: '2026-01-04',
    founderData: { currentMRR: 12000, currentUsers: 800, fundingAsk: 1000000 },
  },
  {
    id: '3',
    title: 'LearnQuick - Micro-Learning Platform',
    description: 'Bite-sized courses for busy professionals. Learn any skill in 5 minutes a day.',
    industry: 'edtech',
    stage: 'traction',
    businessModel: 'freemium',
    overallScore: 82,
    overallConfidence: 78,
    recommendation: 'GREEN',
    verdict: 'PROCEED',
    viewCount: 312,
    saveCount: 67,
    interestCount: 15,
    createdAt: '2026-01-03',
    founderData: { currentMRR: 25000, currentUsers: 5000, fundingAsk: 2000000 },
  },
  {
    id: '4',
    title: 'PayFlow - Instant B2B Payments',
    description: 'Real-time B2B payments with built-in invoicing and automatic reconciliation.',
    industry: 'fintech',
    stage: 'scaling',
    businessModel: 'transactional',
    overallScore: 91,
    overallConfidence: 88,
    recommendation: 'GREEN',
    verdict: 'PROCEED',
    viewCount: 456,
    saveCount: 98,
    interestCount: 28,
    createdAt: '2026-01-02',
    founderData: { currentMRR: 80000, currentUsers: 200, fundingAsk: 5000000 },
  },
  {
    id: '5',
    title: 'GreenBite - Sustainable Food Delivery',
    description: 'Eco-friendly food delivery with zero-waste packaging and carbon-neutral logistics.',
    industry: 'foodtech',
    stage: 'mvp',
    businessModel: 'marketplace',
    overallScore: 68,
    overallConfidence: 65,
    recommendation: 'YELLOW',
    verdict: 'PROCEED_WITH_CAUTION',
    viewCount: 145,
    saveCount: 23,
    interestCount: 5,
    createdAt: '2026-01-06',
    founderData: { currentMRR: 2000, currentUsers: 100, fundingAsk: 300000 },
  },
  {
    id: '6',
    title: 'PropMatch - AI Real Estate Matching',
    description: 'AI matches renters with perfect properties based on lifestyle, not just filters.',
    industry: 'proptech',
    stage: 'launched',
    businessModel: 'marketplace',
    overallScore: 74,
    overallConfidence: 71,
    recommendation: 'GREEN',
    verdict: 'PROCEED',
    viewCount: 198,
    saveCount: 41,
    interestCount: 9,
    createdAt: '2026-01-01',
    founderData: { currentMRR: 8000, currentUsers: 450, fundingAsk: 750000 },
  },
];

export default function InvestorDashboard() {
  const { isSignedIn, getToken } = useAuth();
  const [activeTab, setActiveTab] = useState<'browse' | 'saved' | 'interested' | 'meetings'>('browse');
  const [deals, setDeals] = useState<StartupDeal[]>(MOCK_DEALS);
  const [savedDeals, setSavedDeals] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    industry: 'all',
    stage: 'all',
    score: 'all',
    sort: 'score_desc',
  });
  const [selectedDeal, setSelectedDeal] = useState<StartupDeal | null>(null);
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);

  // Filter deals based on current filters
  const filteredDeals = deals.filter(deal => {
    if (filters.industry !== 'all' && deal.industry !== filters.industry) return false;
    if (filters.stage !== 'all' && deal.stage !== filters.stage) return false;
    if (filters.score !== 'all') {
      const minScore = SCORE_FILTERS.find(s => s.id === filters.score)?.min || 0;
      if (deal.overallScore < minScore) return false;
    }
    return true;
  }).sort((a, b) => {
    switch (filters.sort) {
      case 'score_desc': return b.overallScore - a.overallScore;
      case 'recent': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'views': return b.viewCount - a.viewCount;
      case 'trending': return (b.interestCount + b.saveCount) - (a.interestCount + a.saveCount);
      default: return 0;
    }
  });

  const topDeals = [...deals].sort((a, b) => b.overallScore - a.overallScore).slice(0, 3);

  const toggleSave = (dealId: string) => {
    setSavedDeals(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dealId)) {
        newSet.delete(dealId);
      } else {
        newSet.add(dealId);
      }
      return newSet;
    });
  };

  const formatMoney = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 70) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-500/20 border-emerald-500/50';
    if (score >= 70) return 'bg-green-500/20 border-green-500/50';
    if (score >= 60) return 'bg-yellow-500/20 border-yellow-500/50';
    return 'bg-red-500/20 border-red-500/50';
  };

  const getIndustryIcon = (industry: string) => {
    return INDUSTRIES.find(i => i.id === industry)?.icon || '🌐';
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Investor Dashboard</h1>
            <p className="text-slate-400 mt-1">Discover high-potential startups validated by AI</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-slate-400 hover:text-white text-sm">
              Switch to Founder View
            </Link>
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 rounded-lg">
              <span className="text-sm font-medium">🎯 {filteredDeals.length} Deals Available</span>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <p className="text-slate-400 text-sm">Total Deals</p>
            <p className="text-2xl font-bold">{deals.length}</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <p className="text-slate-400 text-sm">Top Rated (80+)</p>
            <p className="text-2xl font-bold text-emerald-400">{deals.filter(d => d.overallScore >= 80).length}</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <p className="text-slate-400 text-sm">Saved Deals</p>
            <p className="text-2xl font-bold text-blue-400">{savedDeals.size}</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <p className="text-slate-400 text-sm">New This Week</p>
            <p className="text-2xl font-bold text-purple-400">12</p>
          </div>
        </div>

        {/* Top Deals Highlight */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span>🏆</span> Top Rated This Week
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topDeals.map((deal, idx) => (
              <div
                key={deal.id}
                onClick={() => setSelectedDeal(deal)}
                className={`relative cursor-pointer rounded-xl p-4 border-2 transition-all hover:scale-[1.02] ${
                  idx === 0 ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/50' :
                  idx === 1 ? 'bg-gradient-to-br from-slate-400/20 to-slate-500/20 border-slate-400/50' :
                  'bg-gradient-to-br from-orange-600/20 to-orange-700/20 border-orange-600/50'
                }`}
              >
                <div className="absolute top-2 right-2">
                  <span className="text-2xl">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{getIndustryIcon(deal.industry)}</span>
                  <h3 className="font-semibold truncate pr-8">{deal.title}</h3>
                </div>
                <p className="text-slate-400 text-sm mb-3 line-clamp-2">{deal.description}</p>
                <div className="flex items-center justify-between">
                  <span className={`text-2xl font-bold ${getScoreColor(deal.overallScore)}`}>
                    {deal.overallScore}
                  </span>
                  <span className="text-sm text-slate-400">
                    {deal.founderData?.fundingAsk ? `Raising ${formatMoney(deal.founderData.fundingAsk)}` : 'Open to investment'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-700">
          {[
            { id: 'browse', label: 'Browse Deals', icon: '🔍' },
            { id: 'saved', label: 'Saved', icon: '⭐', count: savedDeals.size },
            { id: 'interested', label: 'Interested', icon: '💰', count: 3 },
            { id: 'meetings', label: 'Meetings', icon: '📅', count: 2 },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 font-medium transition-colors flex items-center gap-2 border-b-2 -mb-[2px] ${
                activeTab === tab.id
                  ? 'text-emerald-400 border-emerald-400'
                  : 'text-slate-400 border-transparent hover:text-white'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="bg-slate-700 px-2 py-0.5 rounded-full text-xs">{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Browse Tab */}
        {activeTab === 'browse' && (
          <>
            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
              <select
                value={filters.industry}
                onChange={(e) => setFilters(f => ({ ...f, industry: e.target.value }))}
                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm"
              >
                {INDUSTRIES.map(i => (
                  <option key={i.id} value={i.id}>{i.icon} {i.label}</option>
                ))}
              </select>

              <select
                value={filters.stage}
                onChange={(e) => setFilters(f => ({ ...f, stage: e.target.value }))}
                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm"
              >
                {STAGES.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>

              <select
                value={filters.score}
                onChange={(e) => setFilters(f => ({ ...f, score: e.target.value }))}
                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm"
              >
                {SCORE_FILTERS.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>

              <select
                value={filters.sort}
                onChange={(e) => setFilters(f => ({ ...f, sort: e.target.value }))}
                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm ml-auto"
              >
                {SORT_OPTIONS.map(s => (
                  <option key={s.id} value={s.id}>Sort: {s.label}</option>
                ))}
              </select>
            </div>

            {/* Deal Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredDeals.map(deal => (
                <div
                  key={deal.id}
                  className={`rounded-xl border p-5 transition-all hover:border-slate-600 ${getScoreBg(deal.overallScore)}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getIndustryIcon(deal.industry)}</span>
                      <div>
                        <h3 className="font-semibold text-lg">{deal.title}</h3>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span className="capitalize">{deal.stage}</span>
                          <span>•</span>
                          <span className="capitalize">{deal.businessModel}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-3xl font-bold ${getScoreColor(deal.overallScore)}`}>
                        {deal.overallScore}
                      </span>
                      <p className="text-xs text-slate-400">{deal.overallConfidence}% conf</p>
                    </div>
                  </div>

                  <p className="text-slate-300 text-sm mb-4 line-clamp-2">{deal.description}</p>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {deal.founderData?.currentMRR !== undefined && (
                      <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                        <p className="text-xs text-slate-400">MRR</p>
                        <p className="font-semibold">{formatMoney(deal.founderData.currentMRR)}</p>
                      </div>
                    )}
                    {deal.founderData?.currentUsers !== undefined && (
                      <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                        <p className="text-xs text-slate-400">Users</p>
                        <p className="font-semibold">{deal.founderData.currentUsers.toLocaleString()}</p>
                      </div>
                    )}
                    {deal.founderData?.fundingAsk !== undefined && (
                      <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                        <p className="text-xs text-slate-400">Raising</p>
                        <p className="font-semibold text-emerald-400">{formatMoney(deal.founderData.fundingAsk)}</p>
                      </div>
                    )}
                  </div>

                  {/* Engagement Stats */}
                  <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
                    <span>👀 {deal.viewCount} views</span>
                    <span>⭐ {deal.saveCount} saved</span>
                    <span>💰 {deal.interestCount} interested</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedDeal(deal)}
                      className="flex-1 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => toggleSave(deal.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        savedDeals.has(deal.id)
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                          : 'bg-slate-700 hover:bg-slate-600'
                      }`}
                    >
                      {savedDeals.has(deal.id) ? '⭐ Saved' : '☆ Save'}
                    </button>
                    <button
                      onClick={() => { setSelectedDeal(deal); setShowInterestModal(true); }}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 transition-colors"
                    >
                      💰 Interested
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Saved Tab */}
        {activeTab === 'saved' && (
          <div className="text-center py-12">
            {savedDeals.size === 0 ? (
              <div>
                <span className="text-4xl mb-4 block">⭐</span>
                <h3 className="text-xl font-semibold mb-2">No saved deals yet</h3>
                <p className="text-slate-400">Browse deals and save the ones you're interested in</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {deals.filter(d => savedDeals.has(d.id)).map(deal => (
                  <div key={deal.id} className={`rounded-xl border p-5 ${getScoreBg(deal.overallScore)}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getIndustryIcon(deal.industry)}</span>
                        <div>
                          <h3 className="font-semibold text-lg">{deal.title}</h3>
                          <p className="text-xs text-slate-400 capitalize">{deal.stage} • {deal.businessModel}</p>
                        </div>
                      </div>
                      <span className={`text-3xl font-bold ${getScoreColor(deal.overallScore)}`}>
                        {deal.overallScore}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedDeal(deal)}
                        className="flex-1 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-sm"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => toggleSave(deal.id)}
                        className="px-4 py-2 rounded-lg text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Interested Tab */}
        {activeTab === 'interested' && (
          <div className="text-center py-12">
            <span className="text-4xl mb-4 block">💰</span>
            <h3 className="text-xl font-semibold mb-2">No interests expressed yet</h3>
            <p className="text-slate-400">Express interest in deals to let founders know you might invest</p>
          </div>
        )}

        {/* Meetings Tab */}
        {activeTab === 'meetings' && (
          <div className="text-center py-12">
            <span className="text-4xl mb-4 block">📅</span>
            <h3 className="text-xl font-semibold mb-2">No meeting requests yet</h3>
            <p className="text-slate-400">Request meetings with founders to learn more about their startups</p>
          </div>
        )}

        {/* Deal Detail Modal */}
        {selectedDeal && !showInterestModal && !showMeetingModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedDeal(null)}>
            <div className="bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-slate-700">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{getIndustryIcon(selectedDeal.industry)}</span>
                    <div>
                      <h2 className="text-2xl font-bold">{selectedDeal.title}</h2>
                      <p className="text-slate-400 capitalize">{selectedDeal.industry} • {selectedDeal.stage} • {selectedDeal.businessModel}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedDeal(null)} className="text-slate-400 hover:text-white text-2xl">×</button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Score Card */}
                <div className={`rounded-xl p-4 ${getScoreBg(selectedDeal.overallScore)}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">AI Validation Score</p>
                      <p className={`text-4xl font-bold ${getScoreColor(selectedDeal.overallScore)}`}>
                        {selectedDeal.overallScore}/100
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-semibold ${selectedDeal.verdict === 'PROCEED' ? 'text-emerald-400' : 'text-yellow-400'}`}>
                        {selectedDeal.verdict?.replace('_', ' ')}
                      </p>
                      <p className="text-sm text-slate-400">{selectedDeal.overallConfidence}% confidence</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="font-semibold mb-2">About</h3>
                  <p className="text-slate-300">{selectedDeal.description}</p>
                </div>

                {/* Metrics */}
                <div>
                  <h3 className="font-semibold mb-3">Traction & Metrics</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-700/50 rounded-xl p-4 text-center">
                      <p className="text-xs text-slate-400 mb-1">Monthly Revenue</p>
                      <p className="text-xl font-bold">{formatMoney(selectedDeal.founderData?.currentMRR || 0)}</p>
                    </div>
                    <div className="bg-slate-700/50 rounded-xl p-4 text-center">
                      <p className="text-xs text-slate-400 mb-1">Active Users</p>
                      <p className="text-xl font-bold">{(selectedDeal.founderData?.currentUsers || 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-700/50 rounded-xl p-4 text-center">
                      <p className="text-xs text-slate-400 mb-1">Raising</p>
                      <p className="text-xl font-bold text-emerald-400">{formatMoney(selectedDeal.founderData?.fundingAsk || 0)}</p>
                    </div>
                  </div>
                </div>

                {/* Engagement */}
                <div className="flex items-center justify-between text-sm text-slate-400 py-3 border-t border-b border-slate-700">
                  <span>👀 {selectedDeal.viewCount} views</span>
                  <span>⭐ {selectedDeal.saveCount} investors saved</span>
                  <span>💰 {selectedDeal.interestCount} expressed interest</span>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => toggleSave(selectedDeal.id)}
                    className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${
                      savedDeals.has(selectedDeal.id)
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                        : 'bg-slate-700 hover:bg-slate-600'
                    }`}
                  >
                    {savedDeals.has(selectedDeal.id) ? '⭐ Saved' : '☆ Save Deal'}
                  </button>
                  <button
                    onClick={() => setShowInterestModal(true)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 py-3 rounded-xl font-semibold transition-colors"
                  >
                    💰 Express Interest
                  </button>
                  <button
                    onClick={() => setShowMeetingModal(true)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-semibold transition-colors"
                  >
                    📅 Request Meeting
                  </button>
                </div>

                <Link
                  href={`/validate/${selectedDeal.id}`}
                  className="block text-center text-emerald-400 hover:text-emerald-300 text-sm"
                >
                  View Full Validation Report →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Interest Modal */}
        {showInterestModal && selectedDeal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowInterestModal(false)}>
            <div className="bg-slate-800 rounded-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-slate-700">
                <h2 className="text-xl font-bold">Express Interest in {selectedDeal.title}</h2>
                <p className="text-slate-400 text-sm mt-1">Let the founder know you might invest</p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Interest Level</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'interested', label: '🤔 Interested', desc: 'I want to learn more' },
                      { id: 'very_interested', label: '🔥 Very Interested', desc: 'Ready to discuss terms' },
                    ].map(level => (
                      <button
                        key={level.id}
                        className="p-3 rounded-lg border border-slate-600 hover:border-emerald-500 text-left"
                      >
                        <p className="font-medium">{level.label}</p>
                        <p className="text-xs text-slate-400">{level.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Potential Check Size (optional)</label>
                  <select className="w-full px-4 py-3 bg-slate-700 rounded-lg border border-slate-600">
                    <option value="">Select range</option>
                    <option value="25-50k">$25K - $50K</option>
                    <option value="50-100k">$50K - $100K</option>
                    <option value="100-250k">$100K - $250K</option>
                    <option value="250k+">$250K+</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Message to Founder (optional)</label>
                  <textarea
                    rows={3}
                    placeholder="Share why you're interested..."
                    className="w-full px-4 py-3 bg-slate-700 rounded-lg border border-slate-600"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowInterestModal(false)}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 py-3 rounded-xl font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => { setShowInterestModal(false); alert('Interest submitted! The founder will be notified.'); }}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 py-3 rounded-xl font-medium"
                  >
                    Submit Interest
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Meeting Request Modal */}
        {showMeetingModal && selectedDeal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowMeetingModal(false)}>
            <div className="bg-slate-800 rounded-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-slate-700">
                <h2 className="text-xl font-bold">Request Meeting with Founder</h2>
                <p className="text-slate-400 text-sm mt-1">{selectedDeal.title}</p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Meeting Type</label>
                  <div className="space-y-2">
                    {[
                      { id: 'intro', label: '☕ Intro Call', time: '15 min', desc: 'Quick introduction and Q&A' },
                      { id: 'deep_dive', label: '📊 Deep Dive', time: '30-45 min', desc: 'Detailed discussion about the business' },
                      { id: 'demo', label: '🎥 Product Demo', time: '30 min', desc: 'See the product in action' },
                      { id: 'pitch', label: '🎯 Full Pitch', time: '60 min', desc: 'Complete pitch presentation' },
                    ].map(type => (
                      <button
                        key={type.id}
                        className="w-full p-3 rounded-lg border border-slate-600 hover:border-blue-500 text-left flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium">{type.label}</p>
                          <p className="text-xs text-slate-400">{type.desc}</p>
                        </div>
                        <span className="text-xs text-slate-500">{type.time}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Why do you want to meet?</label>
                  <textarea
                    rows={3}
                    placeholder="I'm interested in learning more about..."
                    className="w-full px-4 py-3 bg-slate-700 rounded-lg border border-slate-600"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowMeetingModal(false)}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 py-3 rounded-xl font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => { setShowMeetingModal(false); alert('Meeting request sent! The founder will respond soon.'); }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-medium"
                  >
                    Send Request
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
