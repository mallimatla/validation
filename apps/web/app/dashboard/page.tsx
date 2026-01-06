'use client';

import { useState, useEffect } from 'react';
import { useUser, useAuth, UserButton } from '@clerk/nextjs';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://validation-production.up.railway.app';

interface Validation {
  id: string;
  title: string;
  description: string;
  status: string;
  overallScore: number | null;
  createdAt: string;
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [validations, setValidations] = useState<Validation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
        setValidations(data.data || []);
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
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">
            <span className="text-emerald-400">Validation</span> Council
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/validate" className="text-slate-400 hover:text-white transition-colors">
              New Validation
            </Link>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user.firstName || 'Founder'}!
          </h1>
          <p className="text-slate-400">Track your startup validations and insights.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
            <div className="text-3xl font-bold text-emerald-400">{validations.length}</div>
            <div className="text-slate-400 text-sm">Total Validations</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
            <div className="text-3xl font-bold text-blue-400">
              {validations.filter(v => v.status === 'PROCESSING').length}
            </div>
            <div className="text-slate-400 text-sm">In Progress</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
            <div className="text-3xl font-bold text-emerald-400">
              {validations.filter(v => v.status === 'COMPLETE').length}
            </div>
            <div className="text-slate-400 text-sm">Completed</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
            <div className="text-3xl font-bold text-purple-400">
              {validations.filter(v => v.overallScore && v.overallScore >= 70).length}
            </div>
            <div className="text-slate-400 text-sm">High Score</div>
          </div>
        </div>

        {/* Validations List */}
        <div className="bg-slate-800/50 rounded-lg border border-slate-700">
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
                <Link
                  key={validation.id}
                  href={`/validate/${validation.id}`}
                  className="block p-6 hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{validation.title}</h3>
                        {getStatusBadge(validation.status)}
                      </div>
                      <p className="text-slate-400 text-sm line-clamp-2 mb-2">
                        {validation.description}
                      </p>
                      <p className="text-slate-500 text-xs">
                        Created {new Date(validation.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {validation.overallScore !== null && (
                      <div className="text-right ml-4">
                        <div className={`text-2xl font-bold ${getScoreColor(validation.overallScore)}`}>
                          {validation.overallScore}
                        </div>
                        <div className="text-slate-500 text-xs">Score</div>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
