'use client';

import { useState } from 'react';
import { useUser, useAuth, UserButton } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://validation-production.up.railway.app';

type UserType = 'founder' | 'investor';
type BillingPeriod = 'monthly' | 'yearly';

interface PlanFeature {
  text: string;
  included: boolean;
  highlight?: boolean;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  features: PlanFeature[];
  popular?: boolean;
  cta: string;
  gradient: string;
}

const FOUNDER_PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Try out the platform with limited features.',
    monthlyPrice: 0,
    yearlyPrice: 0,
    currency: 'USD',
    features: [
      { text: '1 validation', included: true },
      { text: 'Basic agent analysis', included: true },
      { text: 'Summary report', included: true },
      { text: 'All 12 AI agents', included: false },
      { text: 'Detailed findings & risks', included: false },
      { text: 'PDF/PPTX exports', included: false },
      { text: 'Investor visibility', included: false },
      { text: 'Priority support', included: false },
    ],
    cta: 'Get Started',
    gradient: 'from-slate-600 to-slate-700',
  },
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for early-stage founders testing ideas.',
    monthlyPrice: 39,
    yearlyPrice: 390,
    currency: 'USD',
    features: [
      { text: '5 validations/month', included: true },
      { text: 'All 12 AI agents', included: true },
      { text: 'Detailed findings & risks', included: true },
      { text: 'Basic recommendations', included: true },
      { text: 'PDF export', included: true },
      { text: 'Email support', included: true },
      { text: 'Investor visibility', included: false },
      { text: 'Priority support', included: false },
    ],
    cta: 'Start Trial',
    gradient: 'from-blue-600 to-blue-700',
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'For serious founders building venture-scale startups.',
    monthlyPrice: 129,
    yearlyPrice: 1290,
    currency: 'USD',
    popular: true,
    features: [
      { text: '20 validations/month', included: true, highlight: true },
      { text: 'All 12 AI agents', included: true },
      { text: 'Comprehensive reports with citations', included: true, highlight: true },
      { text: '90-day action plan', included: true },
      { text: 'PDF & PPTX exports', included: true },
      { text: 'Investor visibility & matching', included: true, highlight: true },
      { text: 'Priority support', included: true },
      { text: 'API access', included: true },
    ],
    cta: 'Go Professional',
    gradient: 'from-emerald-500 to-emerald-700',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For accelerators, VCs, and large organizations.',
    monthlyPrice: 649,
    yearlyPrice: 6490,
    currency: 'USD',
    features: [
      { text: 'Unlimited validations', included: true, highlight: true },
      { text: 'All 12 AI agents', included: true },
      { text: 'White-label reports', included: true, highlight: true },
      { text: 'Team collaboration', included: true },
      { text: 'Custom integrations', included: true },
      { text: 'Dedicated success manager', included: true, highlight: true },
      { text: 'SLA guarantee', included: true },
      { text: 'Custom AI training', included: true },
    ],
    cta: 'Contact Sales',
    gradient: 'from-purple-600 to-indigo-700',
  },
];

const INVESTOR_PLANS: Plan[] = [
  {
    id: 'free-investor',
    name: 'Free',
    description: 'Explore the deal flow with limited access.',
    monthlyPrice: 0,
    yearlyPrice: 0,
    currency: 'USD',
    features: [
      { text: 'Browse public deal flow', included: true },
      { text: '3 startup views/month', included: true },
      { text: 'Basic validation scores', included: true },
      { text: 'Full validation reports', included: false },
      { text: 'Intro requests', included: false },
      { text: 'Shortlist management', included: false },
      { text: 'Thesis matching', included: false },
      { text: 'API access', included: false },
    ],
    cta: 'Start Exploring',
    gradient: 'from-slate-600 to-slate-700',
  },
  {
    id: 'scout',
    name: 'Scout',
    description: 'For angel investors and scouts.',
    monthlyPrice: 99,
    yearlyPrice: 990,
    currency: 'USD',
    features: [
      { text: '20 startup views/month', included: true },
      { text: 'Full validation reports', included: true },
      { text: '5 intro requests/month', included: true },
      { text: 'Shortlist up to 25', included: true },
      { text: 'Basic thesis matching', included: true },
      { text: 'Email alerts', included: true },
      { text: 'Priority deal access', included: false },
      { text: 'API access', included: false },
    ],
    cta: 'Start Trial',
    gradient: 'from-blue-600 to-blue-700',
  },
  {
    id: 'partner',
    name: 'Partner',
    description: 'For active investors and small funds.',
    monthlyPrice: 299,
    yearlyPrice: 2990,
    currency: 'USD',
    popular: true,
    features: [
      { text: 'Unlimited startup views', included: true, highlight: true },
      { text: 'Full validation reports', included: true },
      { text: '20 intro requests/month', included: true, highlight: true },
      { text: 'Unlimited shortlisting', included: true },
      { text: 'Advanced thesis matching', included: true, highlight: true },
      { text: 'Priority deal access (48hr head start)', included: true },
      { text: 'Slack/Webhook alerts', included: true },
      { text: 'API access', included: true },
    ],
    cta: 'Become Partner',
    gradient: 'from-purple-500 to-indigo-700',
  },
  {
    id: 'fund',
    name: 'Fund',
    description: 'For VC funds and family offices.',
    monthlyPrice: 999,
    yearlyPrice: 9990,
    currency: 'USD',
    features: [
      { text: 'Everything in Partner', included: true },
      { text: 'Unlimited intro requests', included: true, highlight: true },
      { text: 'Team seats (5 included)', included: true },
      { text: 'Deal flow analytics', included: true, highlight: true },
      { text: 'Custom deal sourcing', included: true },
      { text: 'Dedicated account manager', included: true, highlight: true },
      { text: 'Portfolio monitoring', included: true },
      { text: 'White-label option', included: true },
    ],
    cta: 'Contact Sales',
    gradient: 'from-amber-500 to-orange-600',
  },
];

export default function PricingPage() {
  const searchParams = useSearchParams();
  const initialType = (searchParams.get('type') as UserType) || 'founder';
  const [userType, setUserType] = useState<UserType>(initialType);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  const { user } = useUser();
  const { getToken } = useAuth();

  const plans = userType === 'founder' ? FOUNDER_PLANS : INVESTOR_PLANS;
  const discount = billingPeriod === 'yearly' ? 0.17 : 0; // ~2 months free

  const handleSubscribe = async (planId: string) => {
    if (planId.includes('free')) {
      // Free plan - redirect to appropriate dashboard
      window.location.href = userType === 'founder' ? '/dashboard' : '/investor';
      return;
    }

    if (planId === 'enterprise' || planId === 'fund') {
      // Enterprise plans - contact sales
      window.location.href = 'mailto:sales@validationcouncil.com?subject=Enterprise%20Plan%20Inquiry';
      return;
    }

    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/v1/payments/create-order`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          billingPeriod,
          userType,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Would integrate with Razorpay here
        console.log('Order created:', data);
        alert('Payment integration would open here. For demo, redirecting to dashboard.');
        window.location.href = userType === 'founder' ? '/dashboard' : '/investor';
      }
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-xl">
              🚀
            </div>
            <span className="font-bold text-xl">Validation Council</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-slate-400 hover:text-white text-sm">
              Dashboard
            </Link>
            {user ? (
              <UserButton afterSignOutUrl="/" />
            ) : (
              <Link
                href="/sign-in"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-slate-400">
            Choose the perfect plan for your startup validation journey.
            No hidden fees, cancel anytime.
          </p>
        </div>

        {/* User Type Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-slate-800/50 rounded-xl p-1.5 flex items-center gap-1">
            <button
              onClick={() => setUserType('founder')}
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                userType === 'founder'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🚀</span> For Founders
            </button>
            <button
              onClick={() => setUserType('investor')}
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                userType === 'investor'
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>💼</span> For Investors
            </button>
          </div>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center items-center gap-4 mb-12">
          <span className={`text-sm ${billingPeriod === 'monthly' ? 'text-white' : 'text-slate-400'}`}>
            Monthly
          </span>
          <button
            onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
            className="relative w-14 h-7 bg-slate-700 rounded-full transition-all"
          >
            <div
              className={`absolute top-0.5 w-6 h-6 rounded-full transition-all ${
                billingPeriod === 'yearly'
                  ? 'left-7 bg-emerald-500'
                  : 'left-0.5 bg-slate-500'
              }`}
            />
          </button>
          <span className={`text-sm ${billingPeriod === 'yearly' ? 'text-white' : 'text-slate-400'}`}>
            Yearly
          </span>
          {billingPeriod === 'yearly' && (
            <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded-full">
              Save 17%
            </span>
          )}
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {plans.map((plan) => {
            const price = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
            const displayPrice = billingPeriod === 'yearly' ? Math.round(price / 12) : price;

            return (
              <div
                key={plan.id}
                className={`relative bg-slate-800/50 rounded-2xl border transition-all hover:scale-[1.02] ${
                  plan.popular
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className={`p-6 rounded-t-2xl bg-gradient-to-br ${plan.gradient}`}>
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <p className="text-sm text-white/80 mt-1">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="p-6 border-b border-slate-700">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">
                      ${displayPrice}
                    </span>
                    {price > 0 && (
                      <span className="text-slate-400 text-sm">
                        /{billingPeriod === 'yearly' ? 'mo' : 'month'}
                      </span>
                    )}
                  </div>
                  {billingPeriod === 'yearly' && price > 0 && (
                    <p className="text-sm text-slate-400 mt-1">
                      ${price} billed annually
                    </p>
                  )}
                </div>

                {/* Features */}
                <div className="p-6 space-y-3">
                  {plan.features.map((feature, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-3 ${
                        feature.included ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      <span className={feature.included ? 'text-emerald-400' : 'text-slate-600'}>
                        {feature.included ? '✓' : '✕'}
                      </span>
                      <span className={`text-sm ${feature.highlight ? 'font-semibold text-white' : ''}`}>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className="p-6 pt-0">
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    className={`w-full py-3 rounded-xl font-semibold transition-all ${
                      plan.popular
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white'
                        : plan.monthlyPrice === 0
                        ? 'bg-slate-700 hover:bg-slate-600 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-600'
                    }`}
                  >
                    {plan.cta}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mt-20">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: 'Can I change plans later?',
                a: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately and we\'ll prorate your billing.',
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept all major credit cards, debit cards, and UPI payments through our secure payment partner Razorpay.',
              },
              {
                q: 'Do unused validations roll over?',
                a: 'Monthly validation credits reset each billing cycle. We recommend the yearly plan if you want flexibility.',
              },
              {
                q: 'How does investor matching work?',
                a: 'We match your startup with investors based on their investment thesis, preferred stages, industries, and check sizes. Higher scores get priority visibility.',
              },
              {
                q: 'Can I get a refund?',
                a: 'We offer a 14-day money-back guarantee for all paid plans. If you\'re not satisfied, contact us for a full refund.',
              },
            ].map((faq, i) => (
              <div key={i} className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
                <h3 className="font-semibold text-white mb-2">{faq.q}</h3>
                <p className="text-slate-400 text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Enterprise CTA */}
        <div className="mt-20 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10 rounded-2xl border border-purple-500/20 p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Need a Custom Solution?</h3>
          <p className="text-slate-400 max-w-xl mx-auto mb-6">
            We work with accelerators, corporate innovation teams, and large funds on custom deployments.
            Get white-labeled solutions, custom integrations, and dedicated support.
          </p>
          <a
            href="mailto:enterprise@validationcouncil.com"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl font-semibold transition-all"
          >
            <span>Talk to Enterprise Sales</span>
            <span>→</span>
          </a>
        </div>
      </div>
    </main>
  );
}
