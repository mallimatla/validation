'use client';

import { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navigation from '../../components/Navigation';
import { useUserContext } from '../../contexts/UserContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://validation-production.up.railway.app';

interface Validation {
  id: string;
  title: string;
  description: string;
  status: string;
  overallScore: number | null;
  createdAt: string;
  isPublic?: boolean;
  viewCount?: number;
  saveCount?: number;
  interestCount?: number;
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const { userProfile, isInvestor, canCreateValidation } = useUserContext();
  const [validations, setValidations] = useState<Validation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInvestorBanner, setShowInvestorBanner] = useState(true);

  // Redirect investors to their dashboard
  useEffect(() => {
    if (userProfile && isInvestor) {
      router.push('/investor');
    }
  }, [userProfile, isInvestor, router]);

  useEffect(() => {
    if (isLoaded && user) {
      fetchValidations();
    } else if (isLoaded && !user) {
      setIsLoading(false);
    }
  }, [isLoaded, user]);

  const fetchValidations = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/v1/validations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Add mock engagement data for demo
        const validationsWithEngagement = (data.data || []).map((v: Validation) => ({
          ...v,
          isPublic: Math.random() > 0.5,
          viewCount: Math.floor(Math.random() * 100) + 10,
          saveCount: Math.floor(Math.random() * 20) + 2,
          interestCount: Math.floor(Math.random() * 5),
        }));
        setValidations(validationsWithEngagement);
      }
    } catch (error) {
      console.error('Failed to fetch validations:', error);
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

  // Calculate totals
  const totalViews = validations.reduce((sum, v) => sum + (v.viewCount || 0), 0);
  const totalSaves = validations.reduce((sum, v) => sum + (v.saveCount || 0), 0);
  const totalInterests = validations.reduce((sum, v) => sum + (v.interestCount || 0), 0);
  const publicCount = validations.filter(v => v.isPublic).length;

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

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Investor Interest Banner */}
        {showInvestorBanner && totalInterests > 0 && (
          <div className="mb-6 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-3xl">🔥</span>
              <div>
                <h3 className="font-semibold">Investors are interested in your ideas!</h3>
                <p className="text-sm text-slate-300">
                  {totalInterests} investors have expressed interest • {totalSaves} saved your ideas • {totalViews} total views
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/founder/interests"
                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm font-medium"
              >
                View Interests →
              </Link>
              <button
                onClick={() => setShowInvestorBanner(false)}
                className="text-slate-400 hover:text-white"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user.firstName || 'Founder'}!
          </h1>
          <p className="text-slate-400">Track your startup validations and investor interest.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="text-2xl font-bold text-emerald-400">{validations.length}</div>
            <div className="text-slate-400 text-xs">Validations</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="text-2xl font-bold text-blue-400">
              {validations.filter(v => v.status === 'PROCESSING').length}
            </div>
            <div className="text-slate-400 text-xs">Processing</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="text-2xl font-bold text-green-400">{publicCount}</div>
            <div className="text-slate-400 text-xs">Public</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="text-2xl font-bold text-cyan-400">👀 {totalViews}</div>
            <div className="text-slate-400 text-xs">Investor Views</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="text-2xl font-bold text-yellow-400">⭐ {totalSaves}</div>
            <div className="text-slate-400 text-xs">Saved by Investors</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="text-2xl font-bold text-pink-400">💰 {totalInterests}</div>
            <div className="text-slate-400 text-xs">Interested</div>
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
            href="/investor"
            className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-5 hover:border-purple-500/50 transition-all group"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">💰</span>
              <h3 className="font-semibold group-hover:text-purple-400">Browse as Investor</h3>
            </div>
            <p className="text-sm text-slate-400">See how investors view your ideas on the platform</p>
          </Link>
          <div className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/30 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">📊</span>
              <h3 className="font-semibold">Engagement Analytics</h3>
            </div>
            <p className="text-sm text-slate-400">Track investor interest in real-time</p>
          </div>
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
                        {validation.isPublic && (
                          <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full text-xs">
                            🌐 Public
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 text-sm line-clamp-1 mb-2">
                        {validation.description}
                      </p>

                      {/* Engagement Stats */}
                      {validation.isPublic && validation.status === 'COMPLETE' && (
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>👀 {validation.viewCount} views</span>
                          <span>⭐ {validation.saveCount} saved</span>
                          {validation.interestCount && validation.interestCount > 0 && (
                            <span className="text-pink-400 font-medium">
                              💰 {validation.interestCount} interested!
                            </span>
                          )}
                        </div>
                      )}

                      <p className="text-slate-600 text-xs mt-2">
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
                      <div className="flex flex-col gap-2">
                        <Link
                          href={`/validate/${validation.id}`}
                          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs text-center"
                        >
                          View Report
                        </Link>
                        {validation.status === 'COMPLETE' && !validation.isPublic && (
                          <button className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30 rounded-lg text-xs">
                            Make Public
                          </button>
                        )}
                        {validation.interestCount && validation.interestCount > 0 && (
                          <button className="px-3 py-1.5 bg-pink-600/20 hover:bg-pink-600/30 text-pink-400 border border-pink-500/30 rounded-lg text-xs animate-pulse">
                            {validation.interestCount} Interest{validation.interestCount > 1 ? 's' : ''}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* How It Works for Investors Section */}
        <div className="mt-8 bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-xl border border-slate-700 p-6">
          <h3 className="text-lg font-semibold mb-4">🎯 How Investors Discover Your Ideas</h3>
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
                <p className="font-medium">Make It Public</p>
                <p className="text-slate-400">Choose to list on the investor marketplace</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">3️⃣</span>
              <div>
                <p className="font-medium">Get Discovered</p>
                <p className="text-slate-400">Investors browse, save, and express interest</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">4️⃣</span>
              <div>
                <p className="font-medium">Connect & Raise</p>
                <p className="text-slate-400">Accept meetings and start conversations</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
