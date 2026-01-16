'use client';

import { useState, useEffect } from 'react';
import { useUser, useAuth, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://validation-production.up.railway.app';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  company?: string;
  linkedInUrl?: string;
  userType: string;
  founderProfile?: {
    bio?: string;
    openToInvestors: boolean;
    lookingForCofounder: boolean;
  };
}

export default function VisibilitySettingsPage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [openToInvestors, setOpenToInvestors] = useState(true);
  const [lookingForCofounder, setLookingForCofounder] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!isLoaded || !user) return;

      try {
        const token = await getToken();
        const res = await fetch(`${API_URL}/api/v1/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setProfile(data);
          setOpenToInvestors(data.founderProfile?.openToInvestors ?? true);
          setLookingForCofounder(data.founderProfile?.lookingForCofounder ?? false);
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [isLoaded, user, getToken]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/v1/users/profile`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userType: 'FOUNDER',
          founderProfile: {
            openToInvestors,
            lookingForCofounder,
          },
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert('Failed to save settings. Please try again.');
      }
    } catch (err) {
      console.error('Failed to save:', err);
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLoaded || isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-xl">
              ⚙️
            </div>
            <div>
              <span className="font-bold text-xl">Settings</span>
              <span className="text-slate-500 text-sm ml-2">Visibility</span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-slate-400 hover:text-white text-sm">
              ← Back to Dashboard
            </Link>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Investor Visibility Settings</h1>
          <p className="text-slate-400">
            Control how investors discover and interact with your validated startup.
          </p>
        </div>

        {/* Settings Card */}
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-8 space-y-8">
          {/* Open to Investors */}
          <div className="flex items-start justify-between gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <span className="text-2xl">🤝</span>
                Open to Investor Discovery
              </h3>
              <p className="text-slate-400 text-sm">
                When enabled, your completed validations will be visible to investors on the
                Investor Portal. They can browse, shortlist, and request introductions.
              </p>
            </div>
            <button
              onClick={() => setOpenToInvestors(!openToInvestors)}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                openToInvestors ? 'bg-emerald-600' : 'bg-slate-600'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  openToInvestors ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Looking for Co-founder */}
          <div className="flex items-start justify-between gap-6 pt-6 border-t border-slate-700">
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <span className="text-2xl">👥</span>
                Looking for a Co-founder
              </h3>
              <p className="text-slate-400 text-sm">
                Enable this if you're actively searching for a co-founder.
                Your profile will appear in co-founder matching features.
              </p>
            </div>
            <button
              onClick={() => setLookingForCofounder(!lookingForCofounder)}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                lookingForCofounder ? 'bg-emerald-600' : 'bg-slate-600'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  lookingForCofounder ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* What Investors See */}
          {openToInvestors && (
            <div className="pt-6 border-t border-slate-700">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="text-2xl">👁️</span>
                What Investors See
              </h3>
              <div className="bg-slate-900/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400">✓</span>
                  <span className="text-slate-300">Your startup name and description</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400">✓</span>
                  <span className="text-slate-300">Overall validation score and verdict</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400">✓</span>
                  <span className="text-slate-300">Industry, stage, and geography</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400">✓</span>
                  <span className="text-slate-300">Key highlights from validation</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400">✓</span>
                  <span className="text-slate-300">Your name (not email until you accept intro)</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-3">
                Detailed validation reports are only shared after you accept an introduction request.
              </p>
            </div>
          )}

          {/* Save Button */}
          <div className="pt-6 border-t border-slate-700 flex items-center justify-between">
            <div>
              {saveSuccess && (
                <span className="text-emerald-400 flex items-center gap-2">
                  <span>✓</span> Settings saved successfully!
                </span>
              )}
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                isSaving
                  ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white hover:scale-105'
              }`}
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-blue-400 text-xl">ℹ️</span>
            <div>
              <h4 className="font-medium text-blue-300 mb-1">How Investor Discovery Works</h4>
              <p className="text-sm text-slate-400">
                When investors discover your startup, they can request an introduction.
                You'll receive a notification with the investor's details and message.
                You can then choose to accept or decline. Only after you accept will your
                full contact details be shared.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
