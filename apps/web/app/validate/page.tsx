'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://validation-production.up.railway.app';

// Form steps for the multi-step wizard
const STEPS = [
  { id: 1, name: 'Basic Info', description: 'Tell us about your idea' },
  { id: 2, name: 'Market & Business', description: 'Industry and business model' },
  { id: 3, name: 'Traction', description: 'Current progress (optional)' },
  { id: 4, name: 'Team', description: 'About the founders (optional)' },
];

interface FormData {
  // Step 1: Basic Info
  title: string;
  description: string;
  problemStatement: string;
  solution: string;
  // Step 2: Market & Business
  industry: string;
  businessModel: string;
  targetCustomer: string;
  geography: string[];
  stage: string;
  // Step 3: Traction (optional)
  hasProduct: boolean;
  hasRevenue: boolean;
  mrr: string;
  userCount: string;
  growthRate: string;
  churnRate: string;
  // Step 4: Team (optional)
  founderCount: string;
  founderExperience: string;
  hasPriorExit: boolean;
  technicalCofounder: boolean;
  teamSize: string;
  // Financial (advanced)
  burnRate: string;
  runway: string;
  fundingStage: string;
  askAmount: string;
}

const INITIAL_FORM_DATA: FormData = {
  title: '',
  description: '',
  problemStatement: '',
  solution: '',
  industry: '',
  businessModel: '',
  targetCustomer: '',
  geography: [],
  stage: '',
  hasProduct: false,
  hasRevenue: false,
  mrr: '',
  userCount: '',
  growthRate: '',
  churnRate: '',
  founderCount: '',
  founderExperience: '',
  hasPriorExit: false,
  technicalCofounder: false,
  teamSize: '',
  burnRate: '',
  runway: '',
  fundingStage: '',
  askAmount: '',
};

export default function ValidatePage() {
  const router = useRouter();
  const { getToken, isSignedIn } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Validate required fields
    if (formData.description.length < 50) {
      setError('Description must be at least 50 characters long');
      setIsSubmitting(false);
      return;
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (isSignedIn) {
        const token = await getToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      // Build founderData object with all strategic inputs
      const founderData: Record<string, any> = {};

      // Traction data
      if (formData.hasProduct) founderData.hasProduct = true;
      if (formData.hasRevenue) founderData.hasRevenue = true;
      if (formData.mrr) founderData.mrr = parseFloat(formData.mrr);
      if (formData.userCount) founderData.userCount = parseInt(formData.userCount);
      if (formData.growthRate) founderData.growthRate = parseFloat(formData.growthRate) / 100;
      if (formData.churnRate) founderData.churnRate = parseFloat(formData.churnRate) / 100;

      // Team data
      if (formData.founderCount) founderData.founderCount = parseInt(formData.founderCount);
      if (formData.founderExperience) founderData.founderExperience = formData.founderExperience;
      if (formData.hasPriorExit) founderData.hasPriorExit = true;
      if (formData.technicalCofounder) founderData.technicalCofounder = true;
      if (formData.teamSize) founderData.teamSize = parseInt(formData.teamSize);

      // Financial data
      if (formData.burnRate) founderData.burnRate = parseFloat(formData.burnRate);
      if (formData.runway) founderData.runway = parseInt(formData.runway);
      if (formData.askAmount) founderData.askAmount = parseFloat(formData.askAmount);

      const response = await fetch(`${API_URL}/api/v1/validations`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          problemStatement: formData.problemStatement || undefined,
          solution: formData.solution || undefined,
          targetCustomer: formData.targetCustomer || undefined,
          businessModel: formData.businessModel || undefined,
          industry: formData.industry || undefined,
          stage: formData.stage || undefined,
          geography: formData.geography.length > 0 ? formData.geography : undefined,
          founderData: Object.keys(founderData).length > 0 ? founderData : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      const data = await response.json();
      router.push(`/validate/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit validation');
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep === 1 && (!formData.title || formData.description.length < 50)) {
      setError('Please fill in the required fields');
      return;
    }
    setError(null);
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  };

  const prevStep = () => {
    setError(null);
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const canProceed = () => {
    if (currentStep === 1) {
      return formData.title.length >= 3 && formData.description.length >= 50;
    }
    return true;
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="text-slate-400 hover:text-white mb-6 inline-block">
            &larr; Back to Home
          </Link>

          <h1 className="text-3xl font-bold mb-2">Validate Your Startup Idea</h1>
          <p className="text-slate-400 mb-6">
            Our 12 AI agents will analyze your idea using research from Sequoia, YC, a16z, and more.
          </p>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {STEPS.map((step, idx) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
                    currentStep >= step.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-700 text-slate-400'
                  }`}>
                    {step.id}
                  </div>
                  <span className={`ml-2 text-sm hidden sm:inline ${
                    currentStep >= step.id ? 'text-white' : 'text-slate-500'
                  }`}>
                    {step.name}
                  </span>
                  {idx < STEPS.length - 1 && (
                    <div className={`w-8 sm:w-16 h-1 mx-2 ${
                      currentStep > step.id ? 'bg-emerald-600' : 'bg-slate-700'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-5">
                <h2 className="text-xl font-semibold mb-4">Basic Information</h2>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Startup/Idea Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    minLength={3}
                    maxLength={200}
                    value={formData.title}
                    onChange={(e) => updateFormData('title', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white"
                    placeholder="e.g., AI-Powered Recipe Generator"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description <span className="text-red-400">*</span>
                    <span className="text-slate-500 font-normal"> (min 50 characters)</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.description}
                    onChange={(e) => updateFormData('description', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white"
                    placeholder="Describe your startup idea in detail. What problem does it solve? How does it work?"
                  />
                  <p className={`text-sm mt-1 ${formData.description.length >= 50 ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {formData.description.length}/50 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Problem Statement
                  </label>
                  <textarea
                    rows={2}
                    value={formData.problemStatement}
                    onChange={(e) => updateFormData('problemStatement', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white"
                    placeholder="What specific problem are you solving? Who experiences this pain?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Your Solution
                  </label>
                  <textarea
                    rows={2}
                    value={formData.solution}
                    onChange={(e) => updateFormData('solution', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white"
                    placeholder="How does your solution uniquely address this problem?"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Market & Business */}
            {currentStep === 2 && (
              <div className="space-y-5">
                <h2 className="text-xl font-semibold mb-4">Market & Business Model</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Industry</label>
                    <select
                      value={formData.industry}
                      onChange={(e) => updateFormData('industry', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 text-white"
                    >
                      <option value="">Select industry</option>
                      <option value="technology">Technology</option>
                      <option value="healthcare">Healthcare</option>
                      <option value="fintech">Fintech</option>
                      <option value="edtech">EdTech</option>
                      <option value="ecommerce">E-commerce</option>
                      <option value="foodtech">FoodTech</option>
                      <option value="proptech">PropTech</option>
                      <option value="saas">SaaS</option>
                      <option value="consumer">Consumer</option>
                      <option value="b2b">B2B Services</option>
                      <option value="ai_ml">AI/ML</option>
                      <option value="climate">Climate Tech</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Business Model</label>
                    <select
                      value={formData.businessModel}
                      onChange={(e) => updateFormData('businessModel', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 text-white"
                    >
                      <option value="">Select business model</option>
                      <option value="saas">SaaS (Subscription)</option>
                      <option value="marketplace">Marketplace</option>
                      <option value="ecommerce">E-commerce</option>
                      <option value="freemium">Freemium</option>
                      <option value="advertising">Advertising</option>
                      <option value="transactional">Transactional</option>
                      <option value="enterprise">Enterprise Sales</option>
                      <option value="usage_based">Usage-Based</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Target Customer</label>
                  <input
                    type="text"
                    value={formData.targetCustomer}
                    onChange={(e) => updateFormData('targetCustomer', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 text-white"
                    placeholder="e.g., SMB SaaS companies, enterprise retailers, individual consumers"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Current Stage</label>
                    <select
                      value={formData.stage}
                      onChange={(e) => updateFormData('stage', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 text-white"
                    >
                      <option value="">Select stage</option>
                      <option value="idea">Idea Stage</option>
                      <option value="validation">Validation/Research</option>
                      <option value="mvp">MVP/Prototype</option>
                      <option value="pre_seed">Pre-Seed (some traction)</option>
                      <option value="seed">Seed Stage</option>
                      <option value="series_a">Series A</option>
                      <option value="series_b">Series B+</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Target Geography</label>
                    <select
                      value={formData.geography[0] || ''}
                      onChange={(e) => updateFormData('geography', e.target.value ? [e.target.value] : [])}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 text-white"
                    >
                      <option value="">Select geography</option>
                      <option value="global">Global</option>
                      <option value="north_america">North America</option>
                      <option value="europe">Europe</option>
                      <option value="asia">Asia</option>
                      <option value="india">India</option>
                      <option value="latam">Latin America</option>
                      <option value="mena">Middle East & Africa</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Traction */}
            {currentStep === 3 && (
              <div className="space-y-5">
                <h2 className="text-xl font-semibold mb-2">Traction & Progress</h2>
                <p className="text-slate-400 text-sm mb-4">
                  This helps our agents provide more accurate analysis. Skip if not applicable.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <label className={`flex items-center p-4 rounded-lg border cursor-pointer ${
                    formData.hasProduct ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-600 hover:border-slate-500'
                  }`}>
                    <input
                      type="checkbox"
                      checked={formData.hasProduct}
                      onChange={(e) => updateFormData('hasProduct', e.target.checked)}
                      className="mr-3 w-5 h-5 rounded"
                    />
                    <span>Have a product/MVP</span>
                  </label>

                  <label className={`flex items-center p-4 rounded-lg border cursor-pointer ${
                    formData.hasRevenue ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-600 hover:border-slate-500'
                  }`}>
                    <input
                      type="checkbox"
                      checked={formData.hasRevenue}
                      onChange={(e) => updateFormData('hasRevenue', e.target.checked)}
                      className="mr-3 w-5 h-5 rounded"
                    />
                    <span>Generating revenue</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Monthly Recurring Revenue (MRR)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                      <input
                        type="number"
                        min="0"
                        value={formData.mrr}
                        onChange={(e) => updateFormData('mrr', e.target.value)}
                        className="w-full pl-8 pr-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 text-white"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Active Users/Customers
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.userCount}
                      onChange={(e) => updateFormData('userCount', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 text-white"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Monthly Growth Rate (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="500"
                        value={formData.growthRate}
                        onChange={(e) => updateFormData('growthRate', e.target.value)}
                        className="w-full px-4 pr-8 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 text-white"
                        placeholder="0"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Monthly Churn Rate (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.churnRate}
                        onChange={(e) => updateFormData('churnRate', e.target.value)}
                        className="w-full px-4 pr-8 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 text-white"
                        placeholder="0"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Team */}
            {currentStep === 4 && (
              <div className="space-y-5">
                <h2 className="text-xl font-semibold mb-2">Team Information</h2>
                <p className="text-slate-400 text-sm mb-4">
                  Research shows team composition is crucial for success. Skip if not applicable.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Number of Founders
                    </label>
                    <select
                      value={formData.founderCount}
                      onChange={(e) => updateFormData('founderCount', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 text-white"
                    >
                      <option value="">Select</option>
                      <option value="1">1 (Solo Founder)</option>
                      <option value="2">2 Co-founders</option>
                      <option value="3">3 Co-founders</option>
                      <option value="4">4+ Co-founders</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Industry Experience
                    </label>
                    <select
                      value={formData.founderExperience}
                      onChange={(e) => updateFormData('founderExperience', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 text-white"
                    >
                      <option value="">Select</option>
                      <option value="none">No prior experience</option>
                      <option value="1-3">1-3 years in industry</option>
                      <option value="3-5">3-5 years in industry</option>
                      <option value="5-10">5-10 years in industry</option>
                      <option value="10+">10+ years in industry</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <label className={`flex items-center p-4 rounded-lg border cursor-pointer ${
                    formData.hasPriorExit ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-600 hover:border-slate-500'
                  }`}>
                    <input
                      type="checkbox"
                      checked={formData.hasPriorExit}
                      onChange={(e) => updateFormData('hasPriorExit', e.target.checked)}
                      className="mr-3 w-5 h-5 rounded"
                    />
                    <div>
                      <span className="block">Prior Startup Exit</span>
                      <span className="text-xs text-slate-400">Successful sale or IPO</span>
                    </div>
                  </label>

                  <label className={`flex items-center p-4 rounded-lg border cursor-pointer ${
                    formData.technicalCofounder ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-600 hover:border-slate-500'
                  }`}>
                    <input
                      type="checkbox"
                      checked={formData.technicalCofounder}
                      onChange={(e) => updateFormData('technicalCofounder', e.target.checked)}
                      className="mr-3 w-5 h-5 rounded"
                    />
                    <div>
                      <span className="block">Technical Co-founder</span>
                      <span className="text-xs text-slate-400">Can build the product</span>
                    </div>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Full-Time Team Size
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.teamSize}
                      onChange={(e) => updateFormData('teamSize', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 text-white"
                      placeholder="e.g., 3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Monthly Burn Rate
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                      <input
                        type="number"
                        min="0"
                        value={formData.burnRate}
                        onChange={(e) => updateFormData('burnRate', e.target.value)}
                        className="w-full pl-8 pr-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 text-white"
                        placeholder="e.g., 50000"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-4 bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6 pt-4 border-t border-slate-700">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-2 text-slate-400 hover:text-white transition-colors"
                >
                  &larr; Back
                </button>
              ) : (
                <div></div>
              )}

              {currentStep < STEPS.length ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className="px-6 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg transition-colors"
                >
                  Next &rarr;
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting || !canProceed()}
                  className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Analyzing...
                    </>
                  ) : (
                    'Start Validation'
                  )}
                </button>
              )}
            </div>

            {/* Skip to Submit option */}
            {currentStep > 1 && currentStep < STEPS.length && (
              <div className="text-center mt-4">
                <button
                  type="submit"
                  disabled={isSubmitting || !canProceed()}
                  className="text-sm text-slate-400 hover:text-emerald-400 transition-colors"
                >
                  Skip optional steps &amp; start validation
                </button>
              </div>
            )}
          </form>

          {/* Info Box */}
          <div className="mt-6 bg-slate-800/30 rounded-lg p-4 border border-slate-700">
            <h3 className="text-sm font-semibold text-emerald-400 mb-2">Why we ask for this data</h3>
            <p className="text-sm text-slate-400">
              Our AI agents use research-backed frameworks from top VCs (Sequoia, YC, a16z) to analyze your startup.
              The more data you provide, the more accurate and actionable the analysis.
              All fields except title and description are optional.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
