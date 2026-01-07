'use client';

import { useState } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://validation-production.up.railway.app';

type UserRole = 'FOUNDER' | 'INVESTOR';

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'role' | 'profile'>('role');

  // Founder profile fields
  const [founderData, setFounderData] = useState({
    bio: '',
    company: '',
    linkedInUrl: '',
    openToInvestors: true,
  });

  // Investor profile fields
  const [investorData, setInvestorData] = useState({
    firmName: '',
    firmType: 'angel',
    checkSizeMin: 25000,
    checkSizeMax: 100000,
    stages: [] as string[],
    industries: [] as string[],
    thesis: '',
  });

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setStep('profile');
  };

  const handleSubmit = async () => {
    if (!selectedRole || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const token = await getToken();

      // Update user type
      const response = await fetch(`${API_URL}/api/v1/users/onboarding`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userType: selectedRole,
          ...(selectedRole === 'FOUNDER' ? { founderProfile: founderData } : { investorProfile: investorData }),
        }),
      });

      if (response.ok) {
        // Redirect based on role
        if (selectedRole === 'FOUNDER') {
          router.push('/dashboard');
        } else {
          router.push('/investor');
        }
      } else {
        console.error('Onboarding failed');
      }
    } catch (error) {
      console.error('Onboarding error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </main>
    );
  }

  if (!user) {
    router.push('/sign-in');
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold mb-3">
              Welcome to <span className="text-emerald-400">Validation</span> Council
            </h1>
            <p className="text-slate-400">
              {step === 'role'
                ? 'Tell us how you\'ll be using the platform'
                : `Complete your ${selectedRole?.toLowerCase()} profile`
              }
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className={`flex items-center gap-2 ${step === 'role' ? 'text-emerald-400' : 'text-slate-500'}`}>
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === 'role' ? 'bg-emerald-600' : 'bg-slate-700'}`}>1</span>
              <span className="text-sm">Choose Role</span>
            </div>
            <div className="w-12 h-0.5 bg-slate-700"></div>
            <div className={`flex items-center gap-2 ${step === 'profile' ? 'text-emerald-400' : 'text-slate-500'}`}>
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === 'profile' ? 'bg-emerald-600' : 'bg-slate-700'}`}>2</span>
              <span className="text-sm">Profile</span>
            </div>
          </div>

          {step === 'role' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Founder Card */}
              <button
                onClick={() => handleRoleSelect('FOUNDER')}
                className="bg-slate-800/50 border-2 border-slate-700 hover:border-emerald-500 rounded-xl p-8 text-left transition-all group"
              >
                <div className="text-5xl mb-4">🚀</div>
                <h2 className="text-2xl font-bold mb-2 group-hover:text-emerald-400">
                  I'm a Founder
                </h2>
                <p className="text-slate-400 mb-6">
                  Validate startup ideas and connect with investors
                </p>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span>
                    Get AI-powered validation from 12 agents
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span>
                    Publish deals for investor discovery
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span>
                    Receive meeting requests from investors
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span>
                    Track investor engagement analytics
                  </li>
                </ul>
                <div className="mt-6 text-emerald-400 font-medium">
                  Free to start →
                </div>
              </button>

              {/* Investor Card */}
              <button
                onClick={() => handleRoleSelect('INVESTOR')}
                className="bg-slate-800/50 border-2 border-slate-700 hover:border-purple-500 rounded-xl p-8 text-left transition-all group"
              >
                <div className="text-5xl mb-4">💰</div>
                <h2 className="text-2xl font-bold mb-2 group-hover:text-purple-400">
                  I'm an Investor
                </h2>
                <p className="text-slate-400 mb-6">
                  Discover and connect with validated startups
                </p>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex items-center gap-2">
                    <span className="text-purple-400">✓</span>
                    Browse AI-validated startup deals
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-purple-400">✓</span>
                    Read detailed agent analysis reports
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-purple-400">✓</span>
                    Save and track interesting deals
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-purple-400">✓</span>
                    Request meetings with founders
                  </li>
                </ul>
                <div className="mt-6 text-purple-400 font-medium">
                  Free to browse →
                </div>
              </button>
            </div>
          )}

          {step === 'profile' && selectedRole === 'FOUNDER' && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">🚀</span>
                <h2 className="text-xl font-bold">Founder Profile</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Company Name</label>
                  <input
                    type="text"
                    value={founderData.company}
                    onChange={(e) => setFounderData({ ...founderData, company: e.target.value })}
                    placeholder="Your startup name"
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Bio</label>
                  <textarea
                    value={founderData.bio}
                    onChange={(e) => setFounderData({ ...founderData, bio: e.target.value })}
                    placeholder="Tell us about yourself and your experience"
                    rows={3}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">LinkedIn URL</label>
                  <input
                    type="url"
                    value={founderData.linkedInUrl}
                    onChange={(e) => setFounderData({ ...founderData, linkedInUrl: e.target.value })}
                    placeholder="https://linkedin.com/in/yourprofile"
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="openToInvestors"
                    checked={founderData.openToInvestors}
                    onChange={(e) => setFounderData({ ...founderData, openToInvestors: e.target.checked })}
                    className="w-5 h-5 rounded bg-slate-900 border-slate-600"
                  />
                  <label htmlFor="openToInvestors" className="text-sm">
                    I'm open to receiving investor inquiries
                  </label>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setStep('role')}
                  className="px-6 py-3 border border-slate-600 hover:bg-slate-700 rounded-lg"
                >
                  ← Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 px-6 py-3 rounded-lg font-semibold"
                >
                  {isSubmitting ? 'Setting up...' : 'Complete Setup →'}
                </button>
              </div>
            </div>
          )}

          {step === 'profile' && selectedRole === 'INVESTOR' && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">💰</span>
                <h2 className="text-xl font-bold">Investor Profile</h2>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Firm/Fund Name</label>
                    <input
                      type="text"
                      value={investorData.firmName}
                      onChange={(e) => setInvestorData({ ...investorData, firmName: e.target.value })}
                      placeholder="e.g., ABC Ventures"
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Investor Type</label>
                    <select
                      value={investorData.firmType}
                      onChange={(e) => setInvestorData({ ...investorData, firmType: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
                    >
                      <option value="angel">Angel Investor</option>
                      <option value="vc">Venture Capital</option>
                      <option value="family_office">Family Office</option>
                      <option value="corporate">Corporate VC</option>
                      <option value="syndicate">Syndicate</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Check Size Range</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <input
                        type="number"
                        value={investorData.checkSizeMin}
                        onChange={(e) => setInvestorData({ ...investorData, checkSizeMin: parseInt(e.target.value) || 0 })}
                        placeholder="Min ($)"
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
                      />
                      <span className="text-xs text-slate-500 mt-1">Minimum</span>
                    </div>
                    <div>
                      <input
                        type="number"
                        value={investorData.checkSizeMax}
                        onChange={(e) => setInvestorData({ ...investorData, checkSizeMax: parseInt(e.target.value) || 0 })}
                        placeholder="Max ($)"
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
                      />
                      <span className="text-xs text-slate-500 mt-1">Maximum</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Preferred Stages</label>
                  <div className="flex flex-wrap gap-2">
                    {['Pre-seed', 'Seed', 'Series A', 'Series B', 'Growth'].map((stage) => (
                      <button
                        key={stage}
                        type="button"
                        onClick={() => {
                          const stages = investorData.stages.includes(stage)
                            ? investorData.stages.filter(s => s !== stage)
                            : [...investorData.stages, stage];
                          setInvestorData({ ...investorData, stages });
                        }}
                        className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                          investorData.stages.includes(stage)
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {stage}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Industries of Interest</label>
                  <div className="flex flex-wrap gap-2">
                    {['SaaS', 'FinTech', 'HealthTech', 'EdTech', 'AI/ML', 'E-commerce', 'Consumer', 'Enterprise', 'Marketplace'].map((industry) => (
                      <button
                        key={industry}
                        type="button"
                        onClick={() => {
                          const industries = investorData.industries.includes(industry)
                            ? investorData.industries.filter(i => i !== industry)
                            : [...investorData.industries, industry];
                          setInvestorData({ ...investorData, industries });
                        }}
                        className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                          investorData.industries.includes(industry)
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {industry}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Investment Thesis (Optional)</label>
                  <textarea
                    value={investorData.thesis}
                    onChange={(e) => setInvestorData({ ...investorData, thesis: e.target.value })}
                    placeholder="What types of companies are you looking for?"
                    rows={3}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setStep('role')}
                  className="px-6 py-3 border border-slate-600 hover:bg-slate-700 rounded-lg"
                >
                  ← Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 px-6 py-3 rounded-lg font-semibold"
                >
                  {isSubmitting ? 'Setting up...' : 'Complete Setup →'}
                </button>
              </div>
            </div>
          )}

          {/* Skip option */}
          {step === 'profile' && (
            <div className="text-center mt-6">
              <button
                onClick={handleSubmit}
                className="text-slate-500 hover:text-slate-300 text-sm"
              >
                Skip for now, I'll complete this later
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
