'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navigation from '../../components/Navigation';
import { useUserContext } from '../../contexts/UserContext';
import { API_URL } from '../../lib/config';

interface Validation {
  id: string;
  title: string;
  description: string;
  status: string;
  overallScore: number | null;
  createdAt: string;
}

interface EngagementStats {
  totalViews: number;
  totalSaves: number;
  totalInterests: number;
  totalMeetings: number;
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const { userProfile, isInvestor } = useUserContext();
  const [validations, setValidations] = useState<Validation[]>([]);
  const [engagementStats, setEngagementStats] = useState<EngagementStats>({
    totalViews: 0,
    totalSaves: 0,
    totalInterests: 0,
    totalMeetings: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Redirect investors to their dashboard
  useEffect(() => {
    if (userProfile && isInvestor) {
      router.push('/investor');
    }
  }, [userProfile, isInvestor, router]);

  const fetchWithAuth = useCallback(async (url: string) => {
    const token = await getToken();
    return fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }, [getToken]);

  useEffect(() => {
    if (isLoaded && user) {
      fetchData();
    } else if (isLoaded && !user) {
      setIsLoading(false);
    }
  }, [isLoaded, user]);

  const fetchData = async () => {
    try {
      // Fetch validations and engagement stats in parallel
      const [validationsRes, statsRes] = await Promise.all([
        fetchWithAuth(`${API_URL}/api/v1/validations`),
        fetchWithAuth(`${API_URL}/api/v1/investor/founder/stats`),
      ]);

      if (validationsRes.ok) {
        const data = await validationsRes.json();
        // Use ONLY real data from API - no mock data
        setValidations(data.data || []);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setEngagementStats(statsData);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-slate-500/20 text-slate-400',
      QUEUED: 'bg-yellow-500/20 text-yellow-400',
      PROCESSING: 'bg-blue-500/20 text-blue-400 animate-pulse',
      COMPLETE: 'bg-emerald-500/20 text-emerald-400',
      FAILED: 'bg-red-500/20 text-red-400',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.PENDING}`}>
        {status}
      </span>
    );
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-slate-500';
    if (score >= 70) return 'text-emerald-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
          <p className="text-slate-400 mb-6">You need to be signed in to view your dashboard.</p>
          <Link
            href="/sign-in"
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Sign In
          </Link>
        </div>
      </main>
    );
  }

  const hasEngagement = engagementStats.totalInterests > 0 || engagementStats.totalSaves > 0;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Investor Interest Banner - Only show if there's REAL engagement */}
        {hasEngagement && (
          <div className="mb-6 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-3xl">🔥</span>
              <div>
                <h3 className="font-semibold">Investors are interested in your ideas!</h3>
                <p className="text-sm text-slate-300">
                  {engagementStats.totalInterests} interests • {engagementStats.totalSaves} saves • {engagementStats.totalViews} views
                </p>
              </div>
            </div>
            <Link
              href="/founder/interests"
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm font-medium"
            >
              View Details →
            </Link>
          </div>
        )}

        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user.firstName || 'Founder'}!
          </h1>
          <p className="text-slate-400">Track your startup validations and investor interest.</p>
        </div>

        {/* Stats Cards - Only REAL data */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="text-2xl font-bold text-emerald-400">{validations.length}</div>
            <div className="text-slate-400 text-xs">Validations</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="text-2xl font-bold text-blue-400">
              {validations.filter(v => v.status === 'COMPLETE').length}
            </div>
            <div className="text-slate-400 text-xs">Completed</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="text-2xl font-bold text-yellow-400">
              {validations.filter(v => v.status === 'PROCESSING').length}
            </div>
            <div className="text-slate-400 text-xs">Processing</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="text-2xl font-bold text-pink-400">{engagementStats.totalInterests}</div>
            <div className="text-slate-400 text-xs">Investor Interests</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link
            href="/validate"
            className="bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 border border-emerald-500/30 rounded-xl p-5 hover:border-emerald-500/50 transition-all group"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🚀</span>
              <h3 className="font-semibold group-hover:text-emerald-400">New Validation</h3>
            </div>
            <p className="text-sm text-slate-400">Get your startup idea validated by 12 AI agents</p>
          </Link>
          <Link
            href="/founder/interests"
            className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-5 hover:border-purple-500/50 transition-all group"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">💰</span>
              <h3 className="font-semibold group-hover:text-purple-400">Investor Interest</h3>
            </div>
            <p className="text-sm text-slate-400">See who's interested in your validated ideas</p>
          </Link>
          <Link
            href="/investor"
            className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/30 rounded-xl p-5 hover:border-blue-500/50 transition-all group"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🔍</span>
              <h3 className="font-semibold group-hover:text-blue-400">Browse as Investor</h3>
            </div>
            <p className="text-sm text-slate-400">Preview how investors see deals on the platform</p>
          </Link>
        </div>

        {/* Validations List */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700">
          <div className="p-6 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Your Validations</h2>
            <Link
              href="/validate"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              + New Validation
            </Link>
          </div>

          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
              <p className="text-slate-400">Loading validations...</p>
            </div>
          ) : validations.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold mb-2">No validations yet</h3>
              <p className="text-slate-400 mb-6">
                Get started by submitting your first startup idea for validation.
              </p>
              <Link
                href="/validate"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors inline-block"
              >
                Validate Your Idea
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-700">
              {validations.map((validation) => (
                <div
                  key={validation.id}
                  className="p-5 hover:bg-slate-700/30 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Link href={`/validate/${validation.id}`} className="font-semibold text-lg hover:text-emerald-400">
                          {validation.title}
                        </Link>
                        {getStatusBadge(validation.status)}
                      </div>
                      <p className="text-slate-400 text-sm line-clamp-1 mb-2">
                        {validation.description}
                      </p>
                      <p className="text-slate-600 text-xs">
                        Created {new Date(validation.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 ml-4">
                      {/* Score */}
                      {validation.overallScore !== null && (
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${getScoreColor(validation.overallScore)}`}>
                            {validation.overallScore}
                          </div>
                          <div className="text-slate-500 text-xs">Score</div>
                        </div>
                      )}

                      {/* Actions */}
                      <Link
                        href={`/validate/${validation.id}`}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm"
                      >
                        View Report
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* How It Works Section */}
        <div className="mt-8 bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-xl border border-slate-700 p-6">
          <h3 className="text-lg font-semibold mb-4">🎯 How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">1️⃣</span>
              <div>
                <p className="font-medium">Validate Your Idea</p>
                <p className="text-slate-400">Get your startup analyzed by 12 AI agents</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">2️⃣</span>
              <div>
                <p className="font-medium">Review Analysis</p>
                <p className="text-slate-400">See detailed reports from each agent</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">3️⃣</span>
              <div>
                <p className="font-medium">Get Discovered</p>
                <p className="text-slate-400">Investors can find and save your idea</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">4️⃣</span>
              <div>
                <p className="font-medium">Connect & Raise</p>
                <p className="text-slate-400">Accept meetings with interested investors</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
