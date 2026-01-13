'use client';

import { useState, useEffect } from 'react';
import { useUser, useAuth, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://validation-production.up.railway.app';

const STAGES = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Growth'];
const INDUSTRIES = [
  'AI/ML', 'SaaS', 'Fintech', 'Healthcare', 'E-commerce', 'EdTech',
  'CleanTech', 'Marketplace', 'Enterprise', 'Consumer', 'DeepTech', 'Crypto/Web3'
];

interface InvestorProfile {
  id: string;
  firmName: string;
  firmType: string;
  checkSizeMin: number;
  checkSizeMax: number;
  stages: string[];
  industries: string[];
  geography: string[];
}

export default function InvestorSettingsPage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [profile, setProfile] = useState<InvestorProfile | null>(null);

  // Form state
  const [firmName, setFirmName] = useState('');
  const [firmType, setFirmType] = useState('angel');
  const [checkSizeMin, setCheckSizeMin] = useState('');
  const [checkSizeMax, setCheckSizeMax] = useState('');
  const [stages, setStages] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);

  // Fetch investor profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!isLoaded || !user) return;

      try {
        const token = await getToken();
        const res = await fetch(`${API_URL}/api/v1/investor/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          if (data) {
            setProfile(data);
            setFirmName(data.firmName || '');
            setFirmType(data.firmType || 'angel');
            setCheckSizeMin(data.checkSizeMin?.toString() || '');
            setCheckSizeMax(data.checkSizeMax?.toString() || '');
            setStages(data.stages || []);
            setIndustries(data.industries || []);
          }
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
          userType: 'INVESTOR',
          investorProfile: {
            firmName,
            firmType,
            checkSizeMin: parseInt(checkSizeMin) || 0,
            checkSizeMax: parseInt(checkSizeMax) || 0,
            stages,
            industries,
          },
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        console.error('Failed to update profile');
        alert('Failed to save settings. Please try again.');
      }
    } catch (err) {
      console.error('Failed to save:', err);
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStage = (stage: string) => {
    setStages(prev =>
      prev.includes(stage) ? prev.filter(s => s !== stage) : [...prev, stage]
    );
  };

  const toggleIndustry = (industry: string) => {
    setIndustries(prev =>
      prev.includes(industry) ? prev.filter(i => i !== industry) : [...prev, industry]
    );
  };

  if (!isLoaded || isLoading) {
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
          <Link href="/investor" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-700 flex items-center justify-center text-xl">
              ⚙️
            </div>
            <div>
              <span className="font-bold text-xl">Investor Settings</span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/investor" className="text-slate-400 hover:text-white text-sm">
              ← Back to Portal
            </Link>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Investment Thesis Settings</h1>
          <p className="text-slate-400">
            Configure your investment preferences to get better startup matches.
          </p>
        </div>

        {/* Settings Form */}
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-8 space-y-8">
          {/* Firm Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Firm Name
              </label>
              <input
                type="text"
                value={firmName}
                onChange={(e) => setFirmName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                placeholder="Your firm or fund name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Investor Type
              </label>
              <select
                value={firmType}
                onChange={(e) => setFirmType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
              >
                <option value="angel">Angel Investor</option>
                <option value="vc">Venture Capital</option>
                <option value="family_office">Family Office</option>
                <option value="corporate">Corporate/CVC</option>
                <option value="accelerator">Accelerator/Incubator</option>
              </select>
            </div>
          </div>

          {/* Check Size */}
          <div className="pt-6 border-t border-slate-700">
            <h3 className="text-lg font-semibold mb-4">Check Size Range (USD)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Minimum
                </label>
                <input
                  type="number"
                  value={checkSizeMin}
                  onChange={(e) => setCheckSizeMin(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                  placeholder="50000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Maximum
                </label>
                <input
                  type="number"
                  value={checkSizeMax}
                  onChange={(e) => setCheckSizeMax(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                  placeholder="500000"
                />
              </div>
            </div>
          </div>

          {/* Investment Stages */}
          <div className="pt-6 border-t border-slate-700">
            <h3 className="text-lg font-semibold mb-4">Investment Stages</h3>
            <div className="flex flex-wrap gap-2">
              {STAGES.map((stage) => (
                <button
                  key={stage}
                  type="button"
                  onClick={() => toggleStage(stage)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    stages.includes(stage)
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {stage}
                </button>
              ))}
            </div>
          </div>

          {/* Industries */}
          <div className="pt-6 border-t border-slate-700">
            <h3 className="text-lg font-semibold mb-4">Industries of Interest</h3>
            <div className="flex flex-wrap gap-2">
              {INDUSTRIES.map((industry) => (
                <button
                  key={industry}
                  type="button"
                  onClick={() => toggleIndustry(industry)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    industries.includes(industry)
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {industry}
                </button>
              ))}
            </div>
          </div>

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
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white hover:scale-105'
              }`}
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-purple-400 text-xl">💡</span>
            <div>
              <h4 className="font-medium text-purple-300 mb-1">Better Matches</h4>
              <p className="text-sm text-slate-400">
                The more specific your investment thesis, the better we can match you with
                relevant startups. Startups that match your criteria will appear higher in
                your deal flow.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
