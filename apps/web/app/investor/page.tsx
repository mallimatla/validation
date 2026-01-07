'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import Navigation from '../../components/Navigation';
import { useUserContext } from '../../contexts/UserContext';

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
  { id: 'overallScore', label: 'Highest Score', order: 'desc' },
  { id: 'createdAt', label: 'Most Recent', order: 'desc' },
  { id: 'interestCount', label: 'Trending', order: 'desc' },
  { id: 'viewCount', label: 'Most Viewed', order: 'desc' },
];

interface StartupDeal {
  id: string;
  title: string;
  description: string;
  industry: string;
  stage: string;
  businessModel: string;
  targetCustomer?: string;
  overallScore: number;
  overallConfidence?: number;
  recommendation: string;
  verdict: string;
  executiveSummary?: string;
  viewCount: number;
  saveCount: number;
  interestCount: number;
  allowMeetings?: boolean;
  allowMessages?: boolean;
  founderLinkedIn?: string;
  pitchDeckUrl?: string;
  createdAt: string;
  completedAt?: string;
  founderData?: {
    currentMRR?: number;
    currentUsers?: number;
    fundingAsk?: number;
  };
  agentReports?: Array<{
    agentId: string;
    score: number;
    confidence?: number;
    findings?: any[];
    recommendations?: any[];
  }>;
}

interface SavedDeal extends StartupDeal {
  savedAt: string;
  notes?: string;
  tags?: string[];
  folder?: string;
}

interface InterestedDeal extends StartupDeal {
  interestType: string;
  interestMessage?: string;
  checkSize?: string;
  expressedAt: string;
}

interface MeetingRequest {
  id: string;
  type: string;
  message: string;
  status: string;
  preferredTimes: string[];
  calendlyLink?: string;
  founderResponse?: string;
  scheduledAt?: string;
  meetingLink?: string;
  createdAt: string;
  respondedAt?: string;
  validation: {
    id: string;
    title: string;
    industry?: string;
    overallScore?: number;
  };
}

export default function InvestorDashboard() {
  const { isSignedIn, getToken } = useAuth();
  const { userProfile, canContactFounders, isInvestor } = useUserContext();
  const [activeTab, setActiveTab] = useState<'browse' | 'saved' | 'interested' | 'meetings'>('browse');
  const isPremium = userProfile?.subscription?.plan !== 'FREE';
  const [deals, setDeals] = useState<StartupDeal[]>([]);
  const [topDeals, setTopDeals] = useState<StartupDeal[]>([]);
  const [savedDeals, setSavedDeals] = useState<SavedDeal[]>([]);
  const [interestedDeals, setInterestedDeals] = useState<InterestedDeal[]>([]);
  const [meetingRequests, setMeetingRequests] = useState<MeetingRequest[]>([]);
  const [savedDealIds, setSavedDealIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    industry: 'all',
    stage: 'all',
    score: 'all',
    sortBy: 'overallScore',
    sortOrder: 'desc' as 'asc' | 'desc',
  });
  const [selectedDeal, setSelectedDeal] = useState<StartupDeal | null>(null);
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [interestForm, setInterestForm] = useState({ type: 'INTERESTED', message: '', checkSize: '' });
  const [meetingForm, setMeetingForm] = useState({ type: 'INTRO_CALL', message: '', calendlyLink: '' });
  const [pagination, setPagination] = useState({ total: 0, hasMore: false });

  const fetchWithAuth = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = isSignedIn ? await getToken() : null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return fetch(url, { ...options, headers });
  }, [isSignedIn, getToken]);

  // Fetch deals from API
  const fetchDeals = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.industry !== 'all') params.append('industry', filters.industry);
      if (filters.stage !== 'all') params.append('stage', filters.stage);
      if (filters.score !== 'all') {
        const minScore = SCORE_FILTERS.find(s => s.id === filters.score)?.min || 0;
        params.append('minScore', minScore.toString());
      }
      params.append('sortBy', filters.sortBy);
      params.append('sortOrder', filters.sortOrder);
      params.append('limit', '20');

      const response = await fetchWithAuth(`${API_URL}/api/v1/investor/deals?${params}`);
      if (response.ok) {
        const data = await response.json();
        setDeals(data.data || []);
        setPagination(data.pagination || { total: 0, hasMore: false });
      }
    } catch (error) {
      console.error('Failed to fetch deals:', error);
    }
  }, [filters, fetchWithAuth]);

  // Fetch top deals
  const fetchTopDeals = useCallback(async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/api/v1/investor/deals/top?limit=3`);
      if (response.ok) {
        const data = await response.json();
        setTopDeals(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch top deals:', error);
    }
  }, [fetchWithAuth]);

  // Fetch saved deals
  const fetchSavedDeals = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const response = await fetchWithAuth(`${API_URL}/api/v1/investor/saved`);
      if (response.ok) {
        const data = await response.json();
        setSavedDeals(data || []);
        setSavedDealIds(new Set((data || []).map((d: SavedDeal) => d.id)));
      }
    } catch (error) {
      console.error('Failed to fetch saved deals:', error);
    }
  }, [isSignedIn, fetchWithAuth]);

  // Fetch interested deals
  const fetchInterestedDeals = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const response = await fetchWithAuth(`${API_URL}/api/v1/investor/interests`);
      if (response.ok) {
        const data = await response.json();
        setInterestedDeals(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch interested deals:', error);
    }
  }, [isSignedIn, fetchWithAuth]);

  // Fetch meeting requests
  const fetchMeetingRequests = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const response = await fetchWithAuth(`${API_URL}/api/v1/investor/meetings`);
      if (response.ok) {
        const data = await response.json();
        setMeetingRequests(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch meetings:', error);
    }
  }, [isSignedIn, fetchWithAuth]);

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchDeals(),
        fetchTopDeals(),
        fetchSavedDeals(),
        fetchInterestedDeals(),
        fetchMeetingRequests(),
      ]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchDeals, fetchTopDeals, fetchSavedDeals, fetchInterestedDeals, fetchMeetingRequests]);

  // Refetch deals when filters change
  useEffect(() => {
    fetchDeals();
  }, [filters, fetchDeals]);

  // Save/unsave deal
  const toggleSave = async (dealId: string) => {
    if (!isSignedIn) {
      alert('Please sign in to save deals');
      return;
    }

    try {
      if (savedDealIds.has(dealId)) {
        // Unsave
        const response = await fetchWithAuth(`${API_URL}/api/v1/investor/deals/${dealId}/save`, {
          method: 'DELETE',
        });
        if (response.ok) {
          setSavedDealIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(dealId);
            return newSet;
          });
          setSavedDeals(prev => prev.filter(d => d.id !== dealId));
        }
      } else {
        // Save
        const response = await fetchWithAuth(`${API_URL}/api/v1/investor/deals/${dealId}/save`, {
          method: 'POST',
          body: JSON.stringify({}),
        });
        if (response.ok) {
          setSavedDealIds(prev => new Set([...Array.from(prev), dealId]));
          fetchSavedDeals();
        }
      }
    } catch (error) {
      console.error('Failed to toggle save:', error);
    }
  };

  // Express interest
  const submitInterest = async () => {
    if (!isSignedIn || !selectedDeal) {
      alert('Please sign in to express interest');
      return;
    }

    try {
      const response = await fetchWithAuth(`${API_URL}/api/v1/investor/deals/${selectedDeal.id}/interest`, {
        method: 'POST',
        body: JSON.stringify(interestForm),
      });
      if (response.ok) {
        setShowInterestModal(false);
        setInterestForm({ type: 'INTERESTED', message: '', checkSize: '' });
        fetchInterestedDeals();
        alert('Interest submitted! The founder will be notified.');
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to submit interest');
      }
    } catch (error) {
      console.error('Failed to submit interest:', error);
      alert('Failed to submit interest');
    }
  };

  // Request meeting
  const submitMeetingRequest = async () => {
    if (!isSignedIn || !selectedDeal) {
      alert('Please sign in to request a meeting');
      return;
    }

    if (!meetingForm.message.trim()) {
      alert('Please provide a reason for the meeting');
      return;
    }

    try {
      const response = await fetchWithAuth(`${API_URL}/api/v1/investor/deals/${selectedDeal.id}/meeting`, {
        method: 'POST',
        body: JSON.stringify(meetingForm),
      });
      if (response.ok) {
        setShowMeetingModal(false);
        setMeetingForm({ type: 'INTRO_CALL', message: '', calendlyLink: '' });
        fetchMeetingRequests();
        alert('Meeting request sent! The founder will respond soon.');
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to request meeting');
      }
    } catch (error) {
      console.error('Failed to request meeting:', error);
      alert('Failed to request meeting');
    }
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

  const getMeetingStatusColor = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return 'text-emerald-400 bg-emerald-500/20';
      case 'DECLINED': return 'text-red-400 bg-red-500/20';
      case 'SCHEDULED': return 'text-blue-400 bg-blue-500/20';
      case 'COMPLETED': return 'text-slate-400 bg-slate-500/20';
      default: return 'text-yellow-400 bg-yellow-500/20';
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Premium Upgrade Banner (for free users) */}
        {!isPremium && isSignedIn && (
          <div className="mb-6 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-3xl">✨</span>
              <div>
                <h3 className="font-semibold">Upgrade to Premium</h3>
                <p className="text-sm text-slate-300">
                  Get unlimited browsing, save deals, express interest, and request meetings with founders
                </p>
              </div>
            </div>
            <Link
              href="/pricing"
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap"
            >
              Upgrade Now
            </Link>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Investor Dashboard</h1>
            <p className="text-slate-400 mt-1">Discover high-potential startups validated by AI</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 rounded-lg">
              <span className="text-sm font-medium">{pagination.total} Deals Available</span>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <p className="text-slate-400 text-sm">Total Deals</p>
            <p className="text-2xl font-bold">{pagination.total}</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <p className="text-slate-400 text-sm">Top Rated (80+)</p>
            <p className="text-2xl font-bold text-emerald-400">{topDeals.length}</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <p className="text-slate-400 text-sm">Saved Deals</p>
            <p className="text-2xl font-bold text-blue-400">{savedDeals.length}</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <p className="text-slate-400 text-sm">Meeting Requests</p>
            <p className="text-2xl font-bold text-purple-400">{meetingRequests.length}</p>
          </div>
        </div>

        {/* Top Deals Highlight */}
        {topDeals.length > 0 && (
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
                    <span className="text-xl">{getIndustryIcon(deal.industry || '')}</span>
                    <h3 className="font-semibold truncate pr-8">{deal.title}</h3>
                  </div>
                  <p className="text-slate-400 text-sm mb-3 line-clamp-2">{deal.description}</p>
                  <div className="flex items-center justify-between">
                    <span className={`text-2xl font-bold ${getScoreColor(deal.overallScore || 0)}`}>
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
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-700">
          {[
            { id: 'browse', label: 'Browse Deals', icon: '🔍' },
            { id: 'saved', label: 'Saved', icon: '⭐', count: savedDeals.length },
            { id: 'interested', label: 'Interested', icon: '💰', count: interestedDeals.length },
            { id: 'meetings', label: 'Meetings', icon: '📅', count: meetingRequests.length },
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

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-slate-400">Loading deals...</p>
          </div>
        ) : (
          <>
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
                    value={filters.sortBy}
                    onChange={(e) => {
                      const option = SORT_OPTIONS.find(o => o.id === e.target.value);
                      setFilters(f => ({ ...f, sortBy: e.target.value, sortOrder: (option?.order || 'desc') as 'asc' | 'desc' }));
                    }}
                    className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm ml-auto"
                  >
                    {SORT_OPTIONS.map(s => (
                      <option key={s.id} value={s.id}>Sort: {s.label}</option>
                    ))}
                  </select>
                </div>

                {deals.length === 0 ? (
                  <div className="text-center py-12">
                    <span className="text-4xl mb-4 block">🔍</span>
                    <h3 className="text-xl font-semibold mb-2">No deals found</h3>
                    <p className="text-slate-400">Try adjusting your filters or check back later</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {deals.map(deal => (
                      <div
                        key={deal.id}
                        className={`rounded-xl border p-5 transition-all hover:border-slate-600 ${getScoreBg(deal.overallScore || 0)}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{getIndustryIcon(deal.industry || '')}</span>
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
                            <span className={`text-3xl font-bold ${getScoreColor(deal.overallScore || 0)}`}>
                              {deal.overallScore}
                            </span>
                            <p className="text-xs text-slate-400">{deal.overallConfidence || 0}% conf</p>
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
                          <span>👀 {deal.viewCount || 0} views</span>
                          <span>⭐ {deal.saveCount || 0} saved</span>
                          <span>💰 {deal.interestCount || 0} interested</span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedDeal(deal)}
                            className="flex-1 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            View Details
                          </button>
                          {isPremium ? (
                            <>
                              <button
                                onClick={() => toggleSave(deal.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                  savedDealIds.has(deal.id)
                                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                                    : 'bg-slate-700 hover:bg-slate-600'
                                }`}
                              >
                                {savedDealIds.has(deal.id) ? '⭐ Saved' : '☆ Save'}
                              </button>
                              <button
                                onClick={() => { setSelectedDeal(deal); setShowInterestModal(true); }}
                                className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 transition-colors"
                              >
                                💰 Interested
                              </button>
                            </>
                          ) : (
                            <Link
                              href="/pricing"
                              className="px-4 py-2 rounded-lg text-sm font-medium bg-purple-600/20 text-purple-400 border border-purple-500/50 hover:bg-purple-600/30 transition-colors"
                            >
                              ✨ Upgrade to Save
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Saved Tab */}
            {activeTab === 'saved' && (
              <div>
                {savedDeals.length === 0 ? (
                  <div className="text-center py-12">
                    <span className="text-4xl mb-4 block">⭐</span>
                    <h3 className="text-xl font-semibold mb-2">No saved deals yet</h3>
                    <p className="text-slate-400">Browse deals and save the ones you're interested in</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {savedDeals.map(deal => (
                      <div key={deal.id} className={`rounded-xl border p-5 ${getScoreBg(deal.overallScore || 0)}`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{getIndustryIcon(deal.industry || '')}</span>
                            <div>
                              <h3 className="font-semibold text-lg">{deal.title}</h3>
                              <p className="text-xs text-slate-400 capitalize">{deal.stage} • {deal.businessModel}</p>
                            </div>
                          </div>
                          <span className={`text-3xl font-bold ${getScoreColor(deal.overallScore || 0)}`}>
                            {deal.overallScore}
                          </span>
                        </div>
                        <p className="text-slate-400 text-xs mb-3">
                          Saved {new Date(deal.savedAt).toLocaleDateString()}
                        </p>
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
              <div>
                {interestedDeals.length === 0 ? (
                  <div className="text-center py-12">
                    <span className="text-4xl mb-4 block">💰</span>
                    <h3 className="text-xl font-semibold mb-2">No interests expressed yet</h3>
                    <p className="text-slate-400">Express interest in deals to let founders know you might invest</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {interestedDeals.map(deal => (
                      <div key={deal.id} className={`rounded-xl border p-5 ${getScoreBg(deal.overallScore || 0)}`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{getIndustryIcon(deal.industry || '')}</span>
                            <div>
                              <h3 className="font-semibold text-lg">{deal.title}</h3>
                              <p className="text-xs text-slate-400 capitalize">{deal.stage}</p>
                            </div>
                          </div>
                          <span className={`text-3xl font-bold ${getScoreColor(deal.overallScore || 0)}`}>
                            {deal.overallScore}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            deal.interestType === 'VERY_INTERESTED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {deal.interestType === 'VERY_INTERESTED' ? '🔥 Very Interested' : '💰 Interested'}
                          </span>
                          {deal.checkSize && (
                            <span className="px-2 py-1 rounded-full text-xs bg-slate-700 text-slate-300">
                              {deal.checkSize}
                            </span>
                          )}
                        </div>
                        {deal.interestMessage && (
                          <p className="text-slate-400 text-sm mb-3 italic">"{deal.interestMessage}"</p>
                        )}
                        <p className="text-slate-500 text-xs mb-3">
                          Expressed {new Date(deal.expressedAt).toLocaleDateString()}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedDeal(deal)}
                            className="flex-1 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-sm"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => { setSelectedDeal(deal); setShowMeetingModal(true); }}
                            className="px-4 py-2 rounded-lg text-sm bg-blue-600 hover:bg-blue-700"
                          >
                            📅 Request Meeting
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Meetings Tab */}
            {activeTab === 'meetings' && (
              <div>
                {meetingRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <span className="text-4xl mb-4 block">📅</span>
                    <h3 className="text-xl font-semibold mb-2">No meeting requests yet</h3>
                    <p className="text-slate-400">Request meetings with founders to learn more about their startups</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {meetingRequests.map(meeting => (
                      <div key={meeting.id} className="rounded-xl border border-slate-700 p-5 bg-slate-800/50">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{meeting.validation.title}</h3>
                            <p className="text-xs text-slate-400 capitalize">{meeting.type.replace('_', ' ')}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getMeetingStatusColor(meeting.status)}`}>
                            {meeting.status}
                          </span>
                        </div>
                        <p className="text-slate-300 text-sm mb-3">"{meeting.message}"</p>
                        {meeting.founderResponse && (
                          <div className="bg-slate-700/50 rounded-lg p-3 mb-3">
                            <p className="text-xs text-slate-400 mb-1">Founder Response:</p>
                            <p className="text-sm">{meeting.founderResponse}</p>
                          </div>
                        )}
                        {meeting.scheduledAt && (
                          <div className="flex items-center gap-2 text-sm text-emerald-400 mb-3">
                            <span>📅</span>
                            <span>Scheduled: {new Date(meeting.scheduledAt).toLocaleString()}</span>
                          </div>
                        )}
                        {meeting.meetingLink && (
                          <a
                            href={meeting.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium"
                          >
                            Join Meeting
                          </a>
                        )}
                        <p className="text-slate-500 text-xs mt-3">
                          Requested {new Date(meeting.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Deal Detail Modal */}
        {selectedDeal && !showInterestModal && !showMeetingModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedDeal(null)}>
            <div className="bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-slate-700">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{getIndustryIcon(selectedDeal.industry || '')}</span>
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
                <div className={`rounded-xl p-4 ${getScoreBg(selectedDeal.overallScore || 0)}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">AI Validation Score</p>
                      <p className={`text-4xl font-bold ${getScoreColor(selectedDeal.overallScore || 0)}`}>
                        {selectedDeal.overallScore}/100
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-semibold ${selectedDeal.verdict === 'PROCEED' ? 'text-emerald-400' : 'text-yellow-400'}`}>
                        {selectedDeal.verdict?.replace('_', ' ')}
                      </p>
                      <p className="text-sm text-slate-400">{selectedDeal.overallConfidence || 0}% confidence</p>
                    </div>
                  </div>
                </div>

                {/* Executive Summary */}
                {selectedDeal.executiveSummary && (
                  <div>
                    <h3 className="font-semibold mb-2">Executive Summary</h3>
                    <p className="text-slate-300 text-sm">{selectedDeal.executiveSummary}</p>
                  </div>
                )}

                {/* Description */}
                <div>
                  <h3 className="font-semibold mb-2">About</h3>
                  <p className="text-slate-300">{selectedDeal.description}</p>
                </div>

                {/* Target Customer */}
                {selectedDeal.targetCustomer && (
                  <div>
                    <h3 className="font-semibold mb-2">Target Customer</h3>
                    <p className="text-slate-300">{selectedDeal.targetCustomer}</p>
                  </div>
                )}

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

                {/* Founder Info */}
                {(selectedDeal.founderLinkedIn || selectedDeal.pitchDeckUrl) && (
                  <div>
                    <h3 className="font-semibold mb-3">Founder Resources</h3>
                    <div className="flex gap-3">
                      {selectedDeal.founderLinkedIn && (
                        <a
                          href={selectedDeal.founderLinkedIn}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium"
                        >
                          LinkedIn Profile
                        </a>
                      )}
                      {selectedDeal.pitchDeckUrl && (
                        <a
                          href={selectedDeal.pitchDeckUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-sm font-medium"
                        >
                          View Pitch Deck
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Engagement */}
                <div className="flex items-center justify-between text-sm text-slate-400 py-3 border-t border-b border-slate-700">
                  <span>👀 {selectedDeal.viewCount || 0} views</span>
                  <span>⭐ {selectedDeal.saveCount || 0} investors saved</span>
                  <span>💰 {selectedDeal.interestCount || 0} expressed interest</span>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => toggleSave(selectedDeal.id)}
                    className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${
                      savedDealIds.has(selectedDeal.id)
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                        : 'bg-slate-700 hover:bg-slate-600'
                    }`}
                  >
                    {savedDealIds.has(selectedDeal.id) ? '⭐ Saved' : '☆ Save Deal'}
                  </button>
                  <button
                    onClick={() => setShowInterestModal(true)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 py-3 rounded-xl font-semibold transition-colors"
                  >
                    💰 Express Interest
                  </button>
                  {selectedDeal.allowMeetings !== false && (
                    <button
                      onClick={() => setShowMeetingModal(true)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-semibold transition-colors"
                    >
                      📅 Request Meeting
                    </button>
                  )}
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
                      { id: 'INTERESTED', label: '🤔 Interested', desc: 'I want to learn more' },
                      { id: 'VERY_INTERESTED', label: '🔥 Very Interested', desc: 'Ready to discuss terms' },
                    ].map(level => (
                      <button
                        key={level.id}
                        onClick={() => setInterestForm(f => ({ ...f, type: level.id }))}
                        className={`p-3 rounded-lg border text-left transition-colors ${
                          interestForm.type === level.id
                            ? 'border-emerald-500 bg-emerald-500/20'
                            : 'border-slate-600 hover:border-slate-500'
                        }`}
                      >
                        <p className="font-medium">{level.label}</p>
                        <p className="text-xs text-slate-400">{level.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Potential Check Size (optional)</label>
                  <select
                    value={interestForm.checkSize}
                    onChange={(e) => setInterestForm(f => ({ ...f, checkSize: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-700 rounded-lg border border-slate-600"
                  >
                    <option value="">Select range</option>
                    <option value="$25K - $50K">$25K - $50K</option>
                    <option value="$50K - $100K">$50K - $100K</option>
                    <option value="$100K - $250K">$100K - $250K</option>
                    <option value="$250K+">$250K+</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Message to Founder (optional)</label>
                  <textarea
                    rows={3}
                    value={interestForm.message}
                    onChange={(e) => setInterestForm(f => ({ ...f, message: e.target.value }))}
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
                    onClick={submitInterest}
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
                      { id: 'INTRO_CALL', label: '☕ Intro Call', time: '15 min', desc: 'Quick introduction and Q&A' },
                      { id: 'DEEP_DIVE', label: '📊 Deep Dive', time: '30-45 min', desc: 'Detailed discussion about the business' },
                      { id: 'DEMO', label: '🎥 Product Demo', time: '30 min', desc: 'See the product in action' },
                      { id: 'PITCH', label: '🎯 Full Pitch', time: '60 min', desc: 'Complete pitch presentation' },
                    ].map(type => (
                      <button
                        key={type.id}
                        onClick={() => setMeetingForm(f => ({ ...f, type: type.id }))}
                        className={`w-full p-3 rounded-lg border text-left flex items-center justify-between transition-colors ${
                          meetingForm.type === type.id
                            ? 'border-blue-500 bg-blue-500/20'
                            : 'border-slate-600 hover:border-slate-500'
                        }`}
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
                  <label className="block text-sm font-medium mb-2">Why do you want to meet? *</label>
                  <textarea
                    rows={3}
                    value={meetingForm.message}
                    onChange={(e) => setMeetingForm(f => ({ ...f, message: e.target.value }))}
                    placeholder="I'm interested in learning more about..."
                    className="w-full px-4 py-3 bg-slate-700 rounded-lg border border-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Your Calendly Link (optional)</label>
                  <input
                    type="url"
                    value={meetingForm.calendlyLink}
                    onChange={(e) => setMeetingForm(f => ({ ...f, calendlyLink: e.target.value }))}
                    placeholder="https://calendly.com/yourusername"
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
                    onClick={submitMeetingRequest}
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
