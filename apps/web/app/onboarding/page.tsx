'use client';

import { useState } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://validation-production.up.railway.app';

type UserType = 'FOUNDER' | 'INVESTOR';

interface UserTypeOption {
  type: UserType;
  icon: string;
  title: string;
  description: string;
  features: string[];
  gradient: string;
  borderColor: string;
}

const USER_TYPE_OPTIONS: UserTypeOption[] = [
  {
    type: 'FOUNDER',
    icon: '🚀',
    title: 'I\'m a Founder',
    description: 'Validate your startup idea with our AI Council of 12 expert agents.',
    features: [
      'Get comprehensive startup validation',
      'Receive AI-powered insights on market, team, and financials',
      'Track risks and get actionable recommendations',
      'Connect with potential investors',
      'Download professional pitch deck reports',
    ],
    gradient: 'from-emerald-500 to-emerald-700',
    borderColor: 'border-emerald-500',
  },
  {
    type: 'INVESTOR',
    icon: '💼',
    title: 'I\'m an Investor',
    description: 'Discover pre-validated startups matching your investment thesis.',
    features: [
      'Browse AI-validated deal flow',
      'Filter by stage, industry, and score',
      'Shortlist promising startups',
      'Request founder introductions',
      'Access detailed validation reports',
    ],
    gradient: 'from-purple-500 to-indigo-700',
    borderColor: 'border-purple-500',
  },
];

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<UserType | null>(null);
  const [step, setStep] = useState<'select' | 'details'>('select');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Founder form state
  const [founderForm, setFounderForm] = useState({
    company: '',
    linkedIn: '',
    bio: '',
    lookingForCofounder: false,
    openToInvestors: true,
  });

  // Investor form state
  const [investorForm, setInvestorForm] = useState({
    firmName: '',
    firmType: 'angel',
    checkSizeMin: '',
    checkSizeMax: '',
    stages: [] as string[],
    industries: [] as string[],
    linkedIn: '',
  });

  const STAGES = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Growth'];
  const INDUSTRIES = [
    'AI/ML', 'SaaS', 'Fintech', 'Healthcare', 'E-commerce', 'EdTech',
    'CleanTech', 'Marketplace', 'Enterprise', 'Consumer', 'DeepTech', 'Crypto/Web3'
  ];
  const FIRM_TYPES = [
    { value: 'angel', label: 'Angel Investor' },
    { value: 'vc', label: 'Venture Capital' },
    { value: 'family_office', label: 'Family Office' },
    { value: 'corporate', label: 'Corporate/CVC' },
    { value: 'accelerator', label: 'Accelerator/Incubator' },
  ];

  const handleSubmit = async () => {
    if (!selectedType) return;
    setIsSubmitting(true);

    try {
      const token = await getToken();

      // Update user type and profile
      const response = await fetch(`${API_URL}/api/v1/users/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userType: selectedType,
          ...(selectedType === 'FOUNDER' ? {
            company: founderForm.company,
            linkedInUrl: founderForm.linkedIn,
            founderProfile: {
              bio: founderForm.bio,
              lookingForCofounder: founderForm.lookingForCofounder,
              openToInvestors: founderForm.openToInvestors,
            },
          } : {
            investorProfile: {
              firmName: investorForm.firmName,
              firmType: investorForm.firmType,
              checkSizeMin: parseInt(investorForm.checkSizeMin) || 0,
              checkSizeMax: parseInt(investorForm.checkSizeMax) || 0,
              stages: investorForm.stages,
              industries: investorForm.industries,
            },
            linkedInUrl: investorForm.linkedIn,
          }),
        }),
      });

      if (response.ok) {
        // Redirect to appropriate dashboard
        router.push(selectedType === 'FOUNDER' ? '/dashboard' : '/investor');
      } else {
        console.error('Failed to update profile');
        // Redirect anyway for demo
        router.push(selectedType === 'FOUNDER' ? '/dashboard' : '/investor');
      }
    } catch (error) {
      console.error('Error:', error);
      // Redirect anyway for demo
      router.push(selectedType === 'FOUNDER' ? '/dashboard' : '/investor');
    }

    setIsSubmitting(false);
  };

  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-2xl">
              🚀
            </div>
            <span className="font-bold text-2xl">Validation Council</span>
          </Link>
          <h1 className="text-4xl font-bold mb-4">
            Welcome{user?.firstName ? `, ${user.firstName}` : ''}! 👋
          </h1>
          <p className="text-slate-400 text-lg">
            {step === 'select'
              ? 'How would you like to use Validation Council?'
              : 'Tell us more about yourself'}
          </p>
        </div>

        {step === 'select' ? (
          /* Step 1: User Type Selection */
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {USER_TYPE_OPTIONS.map((option) => (
                <div
                  key={option.type}
                  onClick={() => setSelectedType(option.type)}
                  className={`relative bg-slate-800/50 rounded-2xl border-2 transition-all cursor-pointer hover:scale-[1.02] p-8 ${
                    selectedType === option.type
                      ? `${option.borderColor} ring-4 ring-${option.type === 'FOUNDER' ? 'emerald' : 'purple'}-500/20`
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {/* Selection indicator */}
                  {selectedType === option.type && (
                    <div className={`absolute top-4 right-4 w-6 h-6 rounded-full bg-gradient-to-r ${option.gradient} flex items-center justify-center`}>
                      ✓
                    </div>
                  )}

                  {/* Icon & Title */}
                  <div className="text-center mb-6">
                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${option.gradient} flex items-center justify-center text-4xl mx-auto mb-4`}>
                      {option.icon}
                    </div>
                    <h3 className="text-2xl font-bold">{option.title}</h3>
                    <p className="text-slate-400 mt-2">{option.description}</p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3">
                    {option.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <span className={`text-${option.type === 'FOUNDER' ? 'emerald' : 'purple'}-400`}>✓</span>
                        <span className="text-slate-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="text-center mt-8">
              <button
                onClick={() => selectedType && setStep('details')}
                disabled={!selectedType}
                className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all ${
                  selectedType
                    ? `bg-gradient-to-r ${selectedType === 'FOUNDER' ? 'from-emerald-500 to-emerald-600' : 'from-purple-500 to-indigo-600'} text-white hover:scale-105 shadow-lg`
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                }`}
              >
                Continue →
              </button>
            </div>
          </div>
        ) : (
          /* Step 2: Profile Details */
          <div className="max-w-xl mx-auto">
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-8">
              {selectedType === 'FOUNDER' ? (
                /* Founder Form */
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Company/Startup Name
                    </label>
                    <input
                      type="text"
                      value={founderForm.company}
                      onChange={(e) => setFounderForm(prev => ({ ...prev, company: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                      placeholder="Your startup name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      LinkedIn Profile
                    </label>
                    <input
                      type="url"
                      value={founderForm.linkedIn}
                      onChange={(e) => setFounderForm(prev => ({ ...prev, linkedIn: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Short Bio
                    </label>
                    <textarea
                      rows={3}
                      value={founderForm.bio}
                      onChange={(e) => setFounderForm(prev => ({ ...prev, bio: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                      placeholder="Tell us about yourself and your startup journey..."
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={founderForm.lookingForCofounder}
                        onChange={(e) => setFounderForm(prev => ({ ...prev, lookingForCofounder: e.target.checked }))}
                        className="w-5 h-5 rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span className="text-slate-300">I'm looking for a co-founder</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={founderForm.openToInvestors}
                        onChange={(e) => setFounderForm(prev => ({ ...prev, openToInvestors: e.target.checked }))}
                        className="w-5 h-5 rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span className="text-slate-300">Make my profile visible to investors</span>
                    </label>
                  </div>
                </div>
              ) : (
                /* Investor Form */
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">
                        Firm Name
                      </label>
                      <input
                        type="text"
                        value={investorForm.firmName}
                        onChange={(e) => setInvestorForm(prev => ({ ...prev, firmName: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                        placeholder="Your firm or fund name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">
                        Investor Type
                      </label>
                      <select
                        value={investorForm.firmType}
                        onChange={(e) => setInvestorForm(prev => ({ ...prev, firmType: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                      >
                        {FIRM_TYPES.map((ft) => (
                          <option key={ft.value} value={ft.value}>{ft.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">
                        Check Size Min ($)
                      </label>
                      <input
                        type="number"
                        value={investorForm.checkSizeMin}
                        onChange={(e) => setInvestorForm(prev => ({ ...prev, checkSizeMin: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                        placeholder="50000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">
                        Check Size Max ($)
                      </label>
                      <input
                        type="number"
                        value={investorForm.checkSizeMax}
                        onChange={(e) => setInvestorForm(prev => ({ ...prev, checkSizeMax: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                        placeholder="500000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Investment Stages
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {STAGES.map((stage) => (
                        <button
                          key={stage}
                          type="button"
                          onClick={() => setInvestorForm(prev => ({
                            ...prev,
                            stages: prev.stages.includes(stage)
                              ? prev.stages.filter(s => s !== stage)
                              : [...prev.stages, stage]
                          }))}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            investorForm.stages.includes(stage)
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
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Industries of Interest
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {INDUSTRIES.map((industry) => (
                        <button
                          key={industry}
                          type="button"
                          onClick={() => setInvestorForm(prev => ({
                            ...prev,
                            industries: prev.industries.includes(industry)
                              ? prev.industries.filter(i => i !== industry)
                              : [...prev.industries, industry]
                          }))}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            investorForm.industries.includes(industry)
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
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      LinkedIn Profile
                    </label>
                    <input
                      type="url"
                      value={investorForm.linkedIn}
                      onChange={(e) => setInvestorForm(prev => ({ ...prev, linkedIn: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-4 mt-8">
                <button
                  onClick={() => setStep('select')}
                  className="flex-1 py-3 rounded-xl font-semibold bg-slate-700 text-slate-300 hover:bg-slate-600 transition-all"
                >
                  ← Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                    isSubmitting
                      ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                      : `bg-gradient-to-r ${selectedType === 'FOUNDER' ? 'from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700' : 'from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700'} text-white`
                  }`}
                >
                  {isSubmitting ? 'Setting up...' : 'Complete Setup →'}
                </button>
              </div>
            </div>

            <p className="text-center text-slate-500 text-sm mt-6">
              You can always change these settings later in your profile.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
