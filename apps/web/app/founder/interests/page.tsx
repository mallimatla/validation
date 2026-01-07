'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navigation from '../../../components/Navigation';
import { useUserContext } from '../../../contexts/UserContext';
import { API_URL } from '../../../lib/config';

interface InvestorInterest {
  id: string;
  investorId: string;
  type: string;
  message: string | null;
  checkSize: string | null;
  createdAt: string;
  investor?: {
    name: string | null;
    company: string | null;
    avatarUrl: string | null;
  };
  validation: {
    id: string;
    title: string;
    overallScore: number | null;
  };
}

interface MeetingRequest {
  id: string;
  investorId: string;
  type: string;
  message: string;
  status: string;
  preferredTimes: string[];
  calendlyLink: string | null;
  createdAt: string;
  investor?: {
    name: string | null;
    company: string | null;
    avatarUrl: string | null;
  };
  validation: {
    id: string;
    title: string;
  };
}

interface EngagementStats {
  totalViews: number;
  totalSaves: number;
  totalInterests: number;
  totalMeetings: number;
}

export default function FounderInterestsPage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const { userProfile, isFounder, isLoading: profileLoading } = useUserContext();

  const [activeTab, setActiveTab] = useState<'interests' | 'meetings'>('interests');
  const [interests, setInterests] = useState<InvestorInterest[]>([]);
  const [meetings, setMeetings] = useState<MeetingRequest[]>([]);
  const [stats, setStats] = useState<EngagementStats>({ totalViews: 0, totalSaves: 0, totalInterests: 0, totalMeetings: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseMessage, setResponseMessage] = useState('');

  // Redirect non-founders
  useEffect(() => {
    if (!profileLoading && userProfile && !isFounder) {
      router.push('/investor');
    }
  }, [profileLoading, userProfile, isFounder, router]);

  const fetchWithAuth = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = await getToken();
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });
  }, [getToken]);

  // Fetch engagement data
  const fetchEngagementData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const [statsRes, interestsRes, meetingsRes] = await Promise.all([
        fetchWithAuth(`${API_URL}/api/v1/investor/founder/stats`),
        fetchWithAuth(`${API_URL}/api/v1/investor/founder/interests`),
        fetchWithAuth(`${API_URL}/api/v1/investor/founder/meetings`),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (interestsRes.ok) {
        const interestsData = await interestsRes.json();
        setInterests(interestsData || []);
      }

      if (meetingsRes.ok) {
        const meetingsData = await meetingsRes.json();
        setMeetings(meetingsData || []);
      }
    } catch (error) {
      console.error('Failed to fetch engagement data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, fetchWithAuth]);

  useEffect(() => {
    if (isLoaded && user) {
      fetchEngagementData();
    } else if (isLoaded && !user) {
      setIsLoading(false);
    }
  }, [isLoaded, user, fetchEngagementData]);

  // Respond to meeting request
  const respondToMeeting = async (meetingId: string, accept: boolean) => {
    try {
      const response = await fetchWithAuth(
        `${API_URL}/api/v1/investor/founder/meetings/${meetingId}/respond`,
        {
          method: 'POST',
          body: JSON.stringify({
            accept,
            message: responseMessage,
          }),
        }
      );

      if (response.ok) {
        setRespondingTo(null);
        setResponseMessage('');
        fetchEngagementData();
      }
    } catch (error) {
      console.error('Failed to respond to meeting:', error);
    }
  };

  const getInterestTypeLabel = (type: string) => {
    switch (type) {
      case 'VERY_INTERESTED': return { label: 'Very Interested', color: 'text-emerald-400 bg-emerald-500/20' };
      case 'INTERESTED': return { label: 'Interested', color: 'text-blue-400 bg-blue-500/20' };
      case 'WATCHING': return { label: 'Watching', color: 'text-yellow-400 bg-yellow-500/20' };
      default: return { label: type, color: 'text-slate-400 bg-slate-500/20' };
    }
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

  if (!isLoaded || profileLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
        <Navigation />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
          <p className="text-slate-400 mb-6">You need to be signed in to view investor interests.</p>
          <Link href="/sign-in" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold">
            Sign In
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Investor Interest</h1>
          <p className="text-slate-400">Track who's interested in your validated ideas</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <p className="text-slate-400 text-sm">Total Views</p>
            <p className="text-2xl font-bold text-cyan-400">{stats.totalViews}</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <p className="text-slate-400 text-sm">Saved by Investors</p>
            <p className="text-2xl font-bold text-yellow-400">{stats.totalSaves}</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <p className="text-slate-400 text-sm">Interests Expressed</p>
            <p className="text-2xl font-bold text-emerald-400">{stats.totalInterests}</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <p className="text-slate-400 text-sm">Meeting Requests</p>
            <p className="text-2xl font-bold text-purple-400">{stats.totalMeetings}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-700">
          <button
            onClick={() => setActiveTab('interests')}
            className={`px-4 py-3 font-medium transition-colors border-b-2 -mb-[2px] ${
              activeTab === 'interests'
                ? 'text-emerald-400 border-emerald-400'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            Interests ({interests.length})
          </button>
          <button
            onClick={() => setActiveTab('meetings')}
            className={`px-4 py-3 font-medium transition-colors border-b-2 -mb-[2px] ${
              activeTab === 'meetings'
                ? 'text-emerald-400 border-emerald-400'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            Meeting Requests ({meetings.length})
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-slate-400">Loading engagement data...</p>
          </div>
        ) : (
          <>
            {/* Interests Tab */}
            {activeTab === 'interests' && (
              <div>
                {interests.length === 0 ? (
                  <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-700">
                    <span className="text-5xl mb-4 block">💰</span>
                    <h3 className="text-xl font-semibold mb-2">No investor interests yet</h3>
                    <p className="text-slate-400 mb-6">
                      Make your validations public to get discovered by investors
                    </p>
                    <Link
                      href="/dashboard"
                      className="bg-emerald-600 hover:bg-emerald-700 px-6 py-3 rounded-lg font-semibold"
                    >
                      Go to Dashboard
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {interests.map((interest) => {
                      const typeInfo = getInterestTypeLabel(interest.type);
                      return (
                        <div
                          key={interest.id}
                          className="bg-slate-800/50 rounded-xl border border-slate-700 p-5"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xl font-bold">
                                {interest.investor?.name?.[0] || '?'}
                              </div>
                              <div>
                                <h3 className="font-semibold">
                                  {interest.investor?.name || 'Anonymous Investor'}
                                </h3>
                                <p className="text-sm text-slate-400">
                                  {interest.investor?.company || 'Independent'}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                  Interested in: <span className="text-emerald-400">{interest.validation.title}</span>
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
                                {typeInfo.label}
                              </span>
                              {interest.checkSize && (
                                <p className="text-sm text-slate-400 mt-2">
                                  Check size: {interest.checkSize}
                                </p>
                              )}
                            </div>
                          </div>
                          {interest.message && (
                            <div className="mt-4 bg-slate-700/50 rounded-lg p-3">
                              <p className="text-sm text-slate-300">"{interest.message}"</p>
                            </div>
                          )}
                          <p className="text-xs text-slate-500 mt-3">
                            {new Date(interest.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Meetings Tab */}
            {activeTab === 'meetings' && (
              <div>
                {meetings.length === 0 ? (
                  <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-700">
                    <span className="text-5xl mb-4 block">📅</span>
                    <h3 className="text-xl font-semibold mb-2">No meeting requests yet</h3>
                    <p className="text-slate-400">
                      Investors can request meetings once they express interest in your ideas
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {meetings.map((meeting) => (
                      <div
                        key={meeting.id}
                        className="bg-slate-800/50 rounded-xl border border-slate-700 p-5"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xl font-bold">
                              {meeting.investor?.name?.[0] || '?'}
                            </div>
                            <div>
                              <h3 className="font-semibold">
                                {meeting.investor?.name || 'Anonymous Investor'}
                              </h3>
                              <p className="text-sm text-slate-400">
                                {meeting.investor?.company || 'Independent'}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                Re: <span className="text-emerald-400">{meeting.validation.title}</span>
                              </p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getMeetingStatusColor(meeting.status)}`}>
                            {meeting.status}
                          </span>
                        </div>

                        <div className="bg-slate-700/50 rounded-lg p-3 mb-4">
                          <p className="text-xs text-slate-400 mb-1">
                            {meeting.type.replace('_', ' ')}
                          </p>
                          <p className="text-sm text-slate-300">"{meeting.message}"</p>
                        </div>

                        {meeting.calendlyLink && (
                          <p className="text-xs text-blue-400 mb-4">
                            Calendly: {meeting.calendlyLink}
                          </p>
                        )}

                        {meeting.status === 'PENDING' && (
                          <>
                            {respondingTo === meeting.id ? (
                              <div className="space-y-3">
                                <textarea
                                  value={responseMessage}
                                  onChange={(e) => setResponseMessage(e.target.value)}
                                  placeholder="Add a message (optional)"
                                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-sm"
                                  rows={2}
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => respondToMeeting(meeting.id, true)}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 py-2 rounded-lg font-medium"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => respondToMeeting(meeting.id, false)}
                                    className="flex-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 py-2 rounded-lg font-medium border border-red-500/50"
                                  >
                                    Decline
                                  </button>
                                  <button
                                    onClick={() => setRespondingTo(null)}
                                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setRespondingTo(meeting.id)}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 py-2 rounded-lg font-medium"
                              >
                                Respond to Request
                              </button>
                            )}
                          </>
                        )}

                        <p className="text-xs text-slate-500 mt-3">
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
      </div>
    </main>
  );
}
