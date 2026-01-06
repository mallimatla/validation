'use client';

import { useState } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://validation-production.up.railway.app';

export default function ValidatePage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetCustomer: '',
    businessModel: '',
    industry: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Validate description length
    if (formData.description.length < 50) {
      setError('Description must be at least 50 characters long');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/v1/validations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          targetCustomer: formData.targetCustomer || undefined,
          businessModel: formData.businessModel || undefined,
          industry: formData.industry || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit validation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <Link href="/" className="text-slate-400 hover:text-white mb-8 inline-block">
            &larr; Back to Home
          </Link>

          <h1 className="text-4xl font-bold mb-2">Validate Your Idea</h1>
          <p className="text-slate-400 mb-8">
            Our 12 AI agents will analyze your startup idea and provide comprehensive feedback.
          </p>

          {result ? (
            <div className="bg-slate-800/50 p-6 rounded-lg border border-emerald-500">
              <h2 className="text-2xl font-semibold text-emerald-400 mb-4">
                Validation Started!
              </h2>
              <p className="text-slate-300 mb-4">
                Your validation has been queued. The 12 agents are now analyzing your idea.
              </p>
              <div className="bg-slate-900/50 p-4 rounded-lg">
                <p className="text-sm text-slate-400">Validation ID:</p>
                <p className="font-mono text-emerald-400">{result.id}</p>
              </div>
              <div className="mt-6 flex gap-4">
                <button
                  onClick={() => {
                    setResult(null);
                    setFormData({
                      title: '',
                      description: '',
                      targetCustomer: '',
                      businessModel: '',
                      industry: '',
                    });
                  }}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Submit Another
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Startup/Idea Title * <span className="text-slate-500">(3-200 characters)</span>
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={200}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white"
                  placeholder="e.g., AI-Powered Recipe Generator"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description * <span className="text-slate-500">(minimum 50 characters)</span>
                </label>
                <textarea
                  required
                  rows={5}
                  minLength={50}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white"
                  placeholder="Describe your startup idea in detail. What problem does it solve? How does it work? Who are your target customers? What makes your solution unique?"
                />
                <p className="text-sm text-slate-500 mt-1">
                  {formData.description.length}/50 characters minimum
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Target Customer
                </label>
                <input
                  type="text"
                  value={formData.targetCustomer}
                  onChange={(e) => setFormData({ ...formData, targetCustomer: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white"
                  placeholder="e.g., Home cooks, busy professionals, health-conscious millennials"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Business Model
                </label>
                <select
                  value={formData.businessModel}
                  onChange={(e) => setFormData({ ...formData, businessModel: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white"
                >
                  <option value="">Select a business model</option>
                  <option value="saas">SaaS (Subscription)</option>
                  <option value="marketplace">Marketplace</option>
                  <option value="ecommerce">E-commerce</option>
                  <option value="freemium">Freemium</option>
                  <option value="advertising">Advertising</option>
                  <option value="transactional">Transactional</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Industry
                </label>
                <select
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white"
                >
                  <option value="">Select an industry</option>
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
                  <option value="other">Other</option>
                </select>
              </div>

              {error && (
                <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || formData.description.length < 50}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                {isSubmitting ? 'Submitting...' : 'Start Validation'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
