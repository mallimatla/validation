'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://validation-production.up.railway.app';

// Industry configurations with dynamic options
const INDUSTRIES = {
  technology: {
    label: 'Technology / Software',
    icon: '💻',
    problems: [
      'Manual processes that need automation',
      'Data silos and lack of integration',
      'Security and compliance challenges',
      'Scalability and performance issues',
      'Poor user experience in existing solutions',
      'Other (I\'ll describe)',
    ],
    customers: [
      'Enterprise companies (1000+ employees)',
      'Mid-market businesses (100-999 employees)',
      'Small businesses (10-99 employees)',
      'Startups and micro-businesses',
      'Individual professionals / Freelancers',
      'Developers and technical teams',
    ],
    businessModels: ['saas', 'marketplace', 'api', 'freemium', 'enterprise'],
  },
  fintech: {
    label: 'Fintech / Financial Services',
    icon: '💰',
    problems: [
      'High transaction fees and costs',
      'Slow payment processing',
      'Limited access to financial services',
      'Complex compliance and regulations',
      'Fraud and security concerns',
      'Poor financial literacy and tools',
      'Other (I\'ll describe)',
    ],
    customers: [
      'Banks and financial institutions',
      'Small and medium businesses',
      'Individual consumers',
      'Underbanked populations',
      'Investors and traders',
      'Accountants and financial advisors',
    ],
    businessModels: ['saas', 'transactional', 'marketplace', 'lending', 'freemium'],
  },
  healthcare: {
    label: 'Healthcare / HealthTech',
    icon: '🏥',
    problems: [
      'Long wait times and scheduling issues',
      'High healthcare costs',
      'Lack of access to care (rural, underserved)',
      'Poor patient-provider communication',
      'Medical record fragmentation',
      'Mental health access and stigma',
      'Other (I\'ll describe)',
    ],
    customers: [
      'Hospitals and health systems',
      'Medical practices and clinics',
      'Patients and caregivers',
      'Health insurance companies',
      'Pharmaceutical companies',
      'Mental health providers',
    ],
    businessModels: ['saas', 'marketplace', 'b2b', 'subscription', 'freemium'],
  },
  edtech: {
    label: 'EdTech / Education',
    icon: '📚',
    problems: [
      'One-size-fits-all learning approaches',
      'High cost of quality education',
      'Lack of engagement and motivation',
      'Skills gap between education and jobs',
      'Limited access to quality teachers',
      'Difficulty tracking learning progress',
      'Other (I\'ll describe)',
    ],
    customers: [
      'K-12 schools and districts',
      'Universities and colleges',
      'Corporate training departments',
      'Individual learners (students)',
      'Parents and families',
      'Teachers and educators',
    ],
    businessModels: ['saas', 'subscription', 'marketplace', 'freemium', 'b2b'],
  },
  ecommerce: {
    label: 'E-commerce / Retail',
    icon: '🛒',
    problems: [
      'High customer acquisition costs',
      'Cart abandonment and low conversion',
      'Inventory management challenges',
      'Shipping and logistics complexity',
      'Returns and customer service issues',
      'Competition from major platforms',
      'Other (I\'ll describe)',
    ],
    customers: [
      'Online retailers and brands',
      'Brick-and-mortar stores going digital',
      'Direct-to-consumer brands',
      'Marketplace sellers',
      'End consumers (B2C)',
      'Wholesale and B2B buyers',
    ],
    businessModels: ['marketplace', 'ecommerce', 'subscription', 'dropship', 'saas'],
  },
  proptech: {
    label: 'PropTech / Real Estate',
    icon: '🏠',
    problems: [
      'Lengthy and complex buying process',
      'Lack of transparency in pricing',
      'Property management inefficiencies',
      'Difficult tenant-landlord communication',
      'High broker fees and commissions',
      'Limited access to real estate investing',
      'Other (I\'ll describe)',
    ],
    customers: [
      'Real estate agents and brokers',
      'Property managers',
      'Homebuyers and renters',
      'Real estate investors',
      'Commercial property owners',
      'Construction and development companies',
    ],
    businessModels: ['marketplace', 'saas', 'transactional', 'subscription', 'b2b'],
  },
  foodtech: {
    label: 'FoodTech / Restaurant',
    icon: '🍔',
    problems: [
      'Food waste and sustainability',
      'High delivery costs and fees',
      'Restaurant operational inefficiency',
      'Food safety and traceability',
      'Limited healthy/dietary options',
      'Supply chain visibility',
      'Other (I\'ll describe)',
    ],
    customers: [
      'Restaurants and food service',
      'Food delivery consumers',
      'Grocery stores and retailers',
      'Food manufacturers',
      'Farmers and producers',
      'Health-conscious consumers',
    ],
    businessModels: ['marketplace', 'subscription', 'saas', 'ecommerce', 'b2b'],
  },
  ai_ml: {
    label: 'AI / Machine Learning',
    icon: '🤖',
    problems: [
      'Lack of AI expertise in organizations',
      'Data quality and availability issues',
      'AI model deployment complexity',
      'Ethical AI and bias concerns',
      'High compute costs',
      'Integration with existing systems',
      'Other (I\'ll describe)',
    ],
    customers: [
      'Enterprise companies',
      'Data science teams',
      'Non-technical business users',
      'Developers and engineers',
      'Research institutions',
      'Government agencies',
    ],
    businessModels: ['saas', 'api', 'enterprise', 'freemium', 'consulting'],
  },
  other: {
    label: 'Other Industry',
    icon: '🌐',
    problems: [
      'Process inefficiency',
      'High costs',
      'Poor customer experience',
      'Lack of transparency',
      'Limited access or availability',
      'Other (I\'ll describe)',
    ],
    customers: [
      'Large enterprises',
      'Small and medium businesses',
      'Individual consumers',
      'Government and public sector',
      'Non-profit organizations',
      'Specific niche market',
    ],
    businessModels: ['saas', 'marketplace', 'subscription', 'transactional', 'other'],
  },
};

const BUSINESS_MODELS = {
  saas: { label: 'SaaS (Subscription)', description: 'Monthly/annual software subscription' },
  marketplace: { label: 'Marketplace', description: 'Connect buyers and sellers, take commission' },
  ecommerce: { label: 'E-commerce', description: 'Sell products directly online' },
  subscription: { label: 'Subscription Box/Service', description: 'Recurring physical or digital deliveries' },
  freemium: { label: 'Freemium', description: 'Free basic tier, paid premium features' },
  transactional: { label: 'Transactional', description: 'Fee per transaction or usage' },
  api: { label: 'API / Platform', description: 'Charge for API calls or platform access' },
  enterprise: { label: 'Enterprise Sales', description: 'High-touch B2B sales, custom contracts' },
  advertising: { label: 'Advertising', description: 'Free product, monetize through ads' },
  lending: { label: 'Lending / Credit', description: 'Interest on loans or credit products' },
  b2b: { label: 'B2B Services', description: 'Business services and consulting' },
  dropship: { label: 'Dropshipping', description: 'Sell without holding inventory' },
  consulting: { label: 'Consulting + Software', description: 'Services with software component' },
  other: { label: 'Other Model', description: 'Custom or hybrid business model' },
};

const STAGES = [
  { id: 'idea', label: 'Just an idea', description: 'Concept stage, no product yet', icon: '💡' },
  { id: 'mvp', label: 'Building MVP', description: 'Developing minimum viable product', icon: '🔨' },
  { id: 'launched', label: 'Launched', description: 'Product live, getting first users', icon: '🚀' },
  { id: 'traction', label: 'Early Traction', description: 'Growing users, some revenue', icon: '📈' },
  { id: 'scaling', label: 'Scaling', description: 'Proven model, ready to scale', icon: '⚡' },
];

const REVENUE_RANGES = [
  { id: 'pre', label: 'Pre-revenue', value: 0 },
  { id: '0-1k', label: '$0 - $1K/mo', value: 500 },
  { id: '1k-5k', label: '$1K - $5K/mo', value: 3000 },
  { id: '5k-10k', label: '$5K - $10K/mo', value: 7500 },
  { id: '10k-50k', label: '$10K - $50K/mo', value: 30000 },
  { id: '50k-100k', label: '$50K - $100K/mo', value: 75000 },
  { id: '100k+', label: '$100K+/mo', value: 150000 },
];

const USER_RANGES = [
  { id: '0', label: 'No users yet', value: 0 },
  { id: '1-100', label: '1 - 100 users', value: 50 },
  { id: '100-1k', label: '100 - 1,000 users', value: 500 },
  { id: '1k-10k', label: '1K - 10K users', value: 5000 },
  { id: '10k-100k', label: '10K - 100K users', value: 50000 },
  { id: '100k+', label: '100K+ users', value: 150000 },
];

const FUNDING_RANGES = [
  { id: 'bootstrap', label: 'Bootstrapping (no funding)', value: 0 },
  { id: '50k-250k', label: '$50K - $250K (Pre-seed)', value: 150000 },
  { id: '250k-1m', label: '$250K - $1M (Seed)', value: 625000 },
  { id: '1m-5m', label: '$1M - $5M (Seed+)', value: 3000000 },
  { id: '5m-15m', label: '$5M - $15M (Series A)', value: 10000000 },
  { id: '15m+', label: '$15M+ (Series B+)', value: 20000000 },
];

const USE_OF_FUNDS = [
  { id: 'product', label: 'Product Development', icon: '🔧' },
  { id: 'hiring', label: 'Team Hiring', icon: '👥' },
  { id: 'marketing', label: 'Marketing & Sales', icon: '📣' },
  { id: 'operations', label: 'Operations & Infrastructure', icon: '⚙️' },
  { id: 'expansion', label: 'Market Expansion', icon: '🌍' },
  { id: 'rd', label: 'R&D / Innovation', icon: '🔬' },
];

type IndustryKey = keyof typeof INDUSTRIES;

export default function ValidatePage() {
  const router = useRouter();
  const { getToken, isSignedIn } = useAuth();

  // Form state
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data
  const [industry, setIndustry] = useState<IndustryKey | ''>('');
  const [title, setTitle] = useState('');
  const [problem, setProblem] = useState('');
  const [customProblem, setCustomProblem] = useState('');
  const [solution, setSolution] = useState('');
  const [targetCustomer, setTargetCustomer] = useState('');
  const [customCustomer, setCustomCustomer] = useState('');
  const [businessModel, setBusinessModel] = useState('');
  const [stage, setStage] = useState('');
  const [revenueRange, setRevenueRange] = useState('');
  const [userRange, setUserRange] = useState('');
  const [fundingAsk, setFundingAsk] = useState('');
  const [useOfFunds, setUseOfFunds] = useState<string[]>([]);
  const [competitorInfo, setCompetitorInfo] = useState('');

  const industryConfig = industry ? INDUSTRIES[industry] : null;
  const totalSteps = 6;
  const progress = (step / totalSteps) * 100;

  // Auto-advance when selections are made
  useEffect(() => {
    if (step === 1 && industry) {
      const timer = setTimeout(() => setStep(2), 300);
      return () => clearTimeout(timer);
    }
  }, [industry, step]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    // Build description from selections
    const problemText = problem === 'Other (I\'ll describe)' ? customProblem : problem;
    const customerText = targetCustomer.includes('Other') ? customCustomer : targetCustomer;

    const description = `
Problem: ${problemText}

Solution: ${solution}

Target Customer: ${customerText}

Stage: ${STAGES.find(s => s.id === stage)?.label || stage}
${revenueRange ? `Revenue: ${REVENUE_RANGES.find(r => r.id === revenueRange)?.label}` : ''}
${userRange ? `Users: ${USER_RANGES.find(u => u.id === userRange)?.label}` : ''}

${competitorInfo ? `Competition: ${competitorInfo}` : ''}
    `.trim();

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

      const response = await fetch(`${API_URL}/api/v1/validations`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title,
          description,
          problemStatement: problemText,
          solution,
          targetCustomer: customerText,
          businessModel,
          industry,
          stage,
          founderData: {
            currentMRR: REVENUE_RANGES.find(r => r.id === revenueRange)?.value || 0,
            currentUsers: USER_RANGES.find(u => u.id === userRange)?.value || 0,
            fundingAsk: FUNDING_RANGES.find(f => f.id === fundingAsk)?.value || 0,
            useOfFunds,
            hasProduct: stage !== 'idea',
          },
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

  const canProceed = () => {
    switch (step) {
      case 1: return !!industry;
      case 2: return !!title && title.length >= 3 && (problem !== 'Other (I\'ll describe)' ? !!problem : customProblem.length >= 20);
      case 3: return !!solution && solution.length >= 20 && (targetCustomer && !targetCustomer.includes('Other') ? true : customCustomer.length >= 5);
      case 4: return !!businessModel;
      case 5: return !!stage;
      case 6: return true; // Optional funding info
      default: return false;
    }
  };

  const toggleUseOfFunds = (id: string) => {
    setUseOfFunds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Link href="/" className="text-slate-400 hover:text-white">
              &larr; Back
            </Link>
            <div className="text-sm text-slate-400">
              Step {step} of {totalSteps}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Step Content */}
          <div className="min-h-[400px]">

            {/* Step 1: Industry */}
            {step === 1 && (
              <div className="animate-fadeIn">
                <h1 className="text-3xl font-bold mb-2">What industry is your startup in?</h1>
                <p className="text-slate-400 mb-8">This helps us tailor our analysis to your market.</p>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(INDUSTRIES).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => setIndustry(key as IndustryKey)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        industry === key
                          ? 'border-emerald-500 bg-emerald-500/20 ring-2 ring-emerald-500/30'
                          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                      }`}
                    >
                      <span className="text-2xl mb-2 block">{config.icon}</span>
                      <span className="font-medium text-sm">{config.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Problem & Title */}
            {step === 2 && industryConfig && (
              <div className="animate-fadeIn">
                <h1 className="text-3xl font-bold mb-2">Tell us about your startup</h1>
                <p className="text-slate-400 mb-8">What problem are you solving?</p>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      What's your startup called?
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., PayFlow, HealthBuddy, LearnQuick"
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3">
                      What problem are you solving in {industryConfig.label}?
                    </label>
                    <div className="space-y-2">
                      {industryConfig.problems.map((prob) => (
                        <button
                          key={prob}
                          onClick={() => setProblem(prob)}
                          className={`w-full p-3 rounded-lg border text-left transition-all ${
                            problem === prob
                              ? 'border-emerald-500 bg-emerald-500/20'
                              : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                          }`}
                        >
                          {prob}
                        </button>
                      ))}
                    </div>

                    {problem === 'Other (I\'ll describe)' && (
                      <textarea
                        value={customProblem}
                        onChange={(e) => setCustomProblem(e.target.value)}
                        placeholder="Describe the problem you're solving..."
                        rows={3}
                        className="w-full mt-3 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Solution & Customer */}
            {step === 3 && industryConfig && (
              <div className="animate-fadeIn">
                <h1 className="text-3xl font-bold mb-2">How do you solve it?</h1>
                <p className="text-slate-400 mb-8">Describe your solution and target customer.</p>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Describe your solution in 1-2 sentences
                    </label>
                    <textarea
                      value={solution}
                      onChange={(e) => setSolution(e.target.value)}
                      placeholder="e.g., We use AI to automatically analyze customer feedback and generate actionable insights for product teams..."
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white"
                    />
                    <p className="text-xs text-slate-500 mt-1">{solution.length}/20 characters minimum</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3">
                      Who is your target customer?
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {industryConfig.customers.map((customer) => (
                        <button
                          key={customer}
                          onClick={() => setTargetCustomer(customer)}
                          className={`p-3 rounded-lg border text-left text-sm transition-all ${
                            targetCustomer === customer
                              ? 'border-emerald-500 bg-emerald-500/20'
                              : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                          }`}
                        >
                          {customer}
                        </button>
                      ))}
                    </div>

                    {targetCustomer.includes('niche') && (
                      <input
                        type="text"
                        value={customCustomer}
                        onChange={(e) => setCustomCustomer(e.target.value)}
                        placeholder="Describe your specific target customer..."
                        className="w-full mt-3 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Business Model */}
            {step === 4 && industryConfig && (
              <div className="animate-fadeIn">
                <h1 className="text-3xl font-bold mb-2">How will you make money?</h1>
                <p className="text-slate-400 mb-8">Select your primary business model.</p>

                <div className="space-y-3">
                  {industryConfig.businessModels.map((modelKey) => {
                    const model = BUSINESS_MODELS[modelKey as keyof typeof BUSINESS_MODELS];
                    if (!model) return null;
                    return (
                      <button
                        key={modelKey}
                        onClick={() => setBusinessModel(modelKey)}
                        className={`w-full p-4 rounded-xl border text-left transition-all ${
                          businessModel === modelKey
                            ? 'border-emerald-500 bg-emerald-500/20 ring-2 ring-emerald-500/30'
                            : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                        }`}
                      >
                        <div className="font-medium">{model.label}</div>
                        <div className="text-sm text-slate-400">{model.description}</div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Who are your main competitors? (optional)
                  </label>
                  <input
                    type="text"
                    value={competitorInfo}
                    onChange={(e) => setCompetitorInfo(e.target.value)}
                    placeholder="e.g., Competitor A, Competitor B, or 'No direct competitors'"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white"
                  />
                </div>
              </div>
            )}

            {/* Step 5: Stage & Traction */}
            {step === 5 && (
              <div className="animate-fadeIn">
                <h1 className="text-3xl font-bold mb-2">What stage are you at?</h1>
                <p className="text-slate-400 mb-8">Tell us about your current traction.</p>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3">
                      Current Stage
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {STAGES.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setStage(s.id)}
                          className={`p-4 rounded-xl border text-left transition-all flex items-center gap-3 ${
                            stage === s.id
                              ? 'border-emerald-500 bg-emerald-500/20 ring-2 ring-emerald-500/30'
                              : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                          }`}
                        >
                          <span className="text-2xl">{s.icon}</span>
                          <div>
                            <div className="font-medium">{s.label}</div>
                            <div className="text-sm text-slate-400">{s.description}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {stage && stage !== 'idea' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Monthly Revenue
                        </label>
                        <select
                          value={revenueRange}
                          onChange={(e) => setRevenueRange(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-white"
                        >
                          <option value="">Select range</option>
                          {REVENUE_RANGES.map((r) => (
                            <option key={r.id} value={r.id}>{r.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Active Users
                        </label>
                        <select
                          value={userRange}
                          onChange={(e) => setUserRange(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-white"
                        >
                          <option value="">Select range</option>
                          {USER_RANGES.map((u) => (
                            <option key={u.id} value={u.id}>{u.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 6: Funding */}
            {step === 6 && (
              <div className="animate-fadeIn">
                <h1 className="text-3xl font-bold mb-2">Funding Goals (Optional)</h1>
                <p className="text-slate-400 mb-8">This helps us provide better valuation insights.</p>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3">
                      How much funding are you looking to raise?
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {FUNDING_RANGES.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setFundingAsk(f.id)}
                          className={`p-3 rounded-lg border text-left text-sm transition-all ${
                            fundingAsk === f.id
                              ? 'border-emerald-500 bg-emerald-500/20'
                              : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {fundingAsk && fundingAsk !== 'bootstrap' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-3">
                        Primary use of funds (select all that apply)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {USE_OF_FUNDS.map((use) => (
                          <button
                            key={use.id}
                            onClick={() => toggleUseOfFunds(use.id)}
                            className={`p-3 rounded-lg border text-left text-sm transition-all flex items-center gap-2 ${
                              useOfFunds.includes(use.id)
                                ? 'border-emerald-500 bg-emerald-500/20'
                                : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                            }`}
                          >
                            <span>{use.icon}</span>
                            <span>{use.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-4 border-t border-slate-700">
            <button
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className="px-6 py-3 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              &larr; Back
            </button>

            {step < totalSteps ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-xl font-semibold transition-colors"
              >
                Continue &rarr;
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 disabled:from-slate-600 disabled:to-slate-600 rounded-xl font-semibold transition-all flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    🚀 Start Validation
                  </>
                )}
              </button>
            )}
          </div>

          {/* Summary Preview */}
          {step >= 3 && (
            <div className="mt-8 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
              <h3 className="text-sm font-medium text-slate-400 mb-2">Your Startup Summary</h3>
              <div className="space-y-1 text-sm">
                {title && <p><span className="text-slate-500">Name:</span> {title}</p>}
                {industry && <p><span className="text-slate-500">Industry:</span> {INDUSTRIES[industry]?.label}</p>}
                {problem && problem !== 'Other (I\'ll describe)' && <p><span className="text-slate-500">Problem:</span> {problem.slice(0, 50)}...</p>}
                {businessModel && <p><span className="text-slate-500">Model:</span> {BUSINESS_MODELS[businessModel as keyof typeof BUSINESS_MODELS]?.label}</p>}
                {stage && <p><span className="text-slate-500">Stage:</span> {STAGES.find(s => s.id === stage)?.label}</p>}
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </main>
  );
}
