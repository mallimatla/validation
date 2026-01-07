'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useUser, useAuth } from '@clerk/nextjs';
import Navigation from '../../components/Navigation';
import { API_URL } from '../../lib/config';

type PlanType = 'founder' | 'investor';

interface PricingPlan {
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  buttonText: string;
  planId: string;
}

const founderPlans: PricingPlan[] = [
  {
    name: 'Free',
    price: 0,
    period: 'forever',
    description: 'Perfect for testing the waters',
    features: [
      '1 validation per month',
      'Basic AI analysis',
      '5 agent reports',
      'Private validations only',
      'Email support',
    ],
    buttonText: 'Current Plan',
    planId: 'FREE',
  },
  {
    name: 'Starter',
    price: 49,
    period: '/month',
    description: 'For serious founders',
    features: [
      '5 validations per month',
      'Full 12-agent analysis',
      'All agent reports + synthesis',
      'Public listing on marketplace',
      'Investor interest notifications',
      'Priority email support',
    ],
    highlighted: true,
    buttonText: 'Upgrade to Starter',
    planId: 'STARTER',
  },
  {
    name: 'Professional',
    price: 149,
    period: '/month',
    description: 'For scaling startups',
    features: [
      'Unlimited validations',
      'Full 12-agent analysis',
      'Advanced analytics dashboard',
      'Priority marketplace listing',
      'Meeting request management',
      'Investor engagement analytics',
      'Pitch deck hosting',
      'Dedicated support',
    ],
    buttonText: 'Upgrade to Pro',
    planId: 'PROFESSIONAL',
  },
];

const investorPlans: PricingPlan[] = [
  {
    name: 'Free',
    price: 0,
    period: 'forever',
    description: 'Browse and discover',
    features: [
      'Browse 10 deals per month',
      'View validation summaries',
      'Basic filters',
      'Cannot save or contact',
    ],
    buttonText: 'Current Plan',
    planId: 'FREE',
  },
  {
    name: 'Premium',
    price: 99,
    period: '/month',
    description: 'Full investor access',
    features: [
      'Unlimited deal browsing',
      'Full agent analysis reports',
      'Advanced filters & search',
      'Save unlimited deals',
      'Express interest to founders',
      'Request meetings',
      'Priority deal alerts',
      'Email support',
    ],
    highlighted: true,
    buttonText: 'Upgrade to Premium',
    planId: 'STARTER',
  },
  {
    name: 'Enterprise',
    price: 499,
    period: '/month',
    description: 'For active investors',
    features: [
      'Everything in Premium',
      'API access',
      'Custom deal alerts',
      'White-glove introductions',
      'Dedicated deal flow manager',
      'Custom integration support',
      'Priority founder matching',
      'Quarterly market reports',
    ],
    buttonText: 'Contact Sales',
    planId: 'ENTERPRISE',
  },
];

export default function PricingPage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [planType, setPlanType] = useState<PlanType>('founder');
  const [isProcessing, setIsProcessing] = useState(false);

  const plans = planType === 'founder' ? founderPlans : investorPlans;

  const handleUpgrade = async (planId: string) => {
    if (!user) {
      // Redirect to sign up
      window.location.href = '/sign-up';
      return;
    }

    if (planId === 'ENTERPRISE') {
      // Contact sales
      window.location.href = 'mailto:sales@validationcouncil.com?subject=Enterprise Plan Inquiry';
      return;
    }

    setIsProcessing(true);
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/v1/payments/create-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: planId,
          userType: planType.toUpperCase(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect to payment page
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        }
      } else {
        console.error('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <Navigation />

      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-slate-400 mb-8">
            Choose the plan that fits your needs
          </p>

          {/* Plan type toggle */}
          <div className="inline-flex bg-slate-800 rounded-xl p-1">
            <button
              onClick={() => setPlanType('founder')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                planType === 'founder'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🚀 For Founders
            </button>
            <button
              onClick={() => setPlanType('investor')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                planType === 'investor'
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              💰 For Investors
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-slate-800/50 rounded-2xl border ${
                plan.highlighted
                  ? planType === 'founder'
                    ? 'border-emerald-500 shadow-lg shadow-emerald-500/20'
                    : 'border-purple-500 shadow-lg shadow-purple-500/20'
                  : 'border-slate-700'
              } p-8`}
            >
              {plan.highlighted && (
                <div className={`absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-sm font-medium ${
                  planType === 'founder'
                    ? 'bg-emerald-600'
                    : 'bg-purple-600'
                }`}>
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-slate-400 text-sm">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold">
                  {plan.price === 0 ? 'Free' : `$${plan.price}`}
                </span>
                {plan.price > 0 && (
                  <span className="text-slate-400 text-sm">{plan.period}</span>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm">
                    <span className={planType === 'founder' ? 'text-emerald-400' : 'text-purple-400'}>✓</span>
                    <span className="text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade(plan.planId)}
                disabled={isProcessing || plan.planId === 'FREE'}
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  plan.planId === 'FREE'
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : plan.highlighted
                      ? planType === 'founder'
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-slate-700 hover:bg-slate-600 text-white'
                }`}
              >
                {isProcessing ? 'Processing...' : plan.buttonText}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>

          <div className="space-y-6">
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <h3 className="font-semibold mb-2">Can I switch between Founder and Investor plans?</h3>
              <p className="text-slate-400 text-sm">
                Yes! You can switch your account type at any time. Your subscription will be prorated and adjusted accordingly.
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-slate-400 text-sm">
                We accept all major credit cards (Visa, Mastercard, American Express) and UPI payments in India through Razorpay.
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <h3 className="font-semibold mb-2">Can I cancel anytime?</h3>
              <p className="text-slate-400 text-sm">
                Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <h3 className="font-semibold mb-2">Do you offer refunds?</h3>
              <p className="text-slate-400 text-sm">
                We offer a 7-day money-back guarantee for all paid plans. If you're not satisfied, contact support for a full refund.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="text-slate-400 mb-4">
            Have questions? Need a custom plan?
          </p>
          <a
            href="mailto:support@validationcouncil.com"
            className="text-emerald-400 hover:text-emerald-300 font-medium"
          >
            Contact our team →
          </a>
        </div>
      </div>
    </main>
  );
}
