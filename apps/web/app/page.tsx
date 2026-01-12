import Link from 'next/link';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Animated background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-emerald-900/20 via-slate-950 to-blue-900/20 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

      {/* Navigation */}
      <header className="relative z-50 border-b border-slate-800/50 backdrop-blur-sm bg-slate-950/80 sticky top-0">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500 blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
              <img src="/logo.svg" alt="Validation Council" className="h-10 relative" />
            </div>
            <span className="font-bold text-lg hidden sm:block">Validation Council</span>
          </Link>
          <nav className="flex items-center gap-6">
            <SignedIn>
              <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors text-sm">
                Dashboard
              </Link>
              <Link href="/validate" className="text-slate-400 hover:text-white transition-colors text-sm">
                New Validation
              </Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
            <SignedOut>
              <Link href="/pricing" className="text-slate-400 hover:text-white transition-colors text-sm hidden md:block">
                Pricing
              </Link>
              <Link href="/sign-in" className="text-slate-400 hover:text-white transition-colors text-sm">
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
              >
                Start Free
              </Link>
            </SignedOut>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-4 pt-20 pb-32">
        <div className="max-w-5xl mx-auto text-center">
          {/* Trust badge */}
          <div className="inline-flex items-center gap-2 bg-slate-800/50 border border-slate-700/50 rounded-full px-4 py-2 mb-8 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-sm text-slate-300">Trusted by 500+ founders worldwide</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-white via-white to-slate-400 bg-clip-text text-transparent">
              Validate Your Startup
            </span>
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Before You Build
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-400 mb-10 max-w-3xl mx-auto leading-relaxed">
            12 AI agents analyze your startup idea in real-time. Get investor-grade
            market research, financial projections, and risk analysis in minutes, not months.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link
              href="/validate"
              className="group relative bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105"
            >
              <span className="relative z-10 flex items-center gap-2">
                Validate My Idea Free
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </Link>
            <Link
              href="#how-it-works"
              className="text-slate-400 hover:text-white px-8 py-4 font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Watch Demo
            </Link>
          </div>

          {/* Social proof stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { value: '2,500+', label: 'Startups Validated' },
              { value: '$47M', label: 'Funding Raised' },
              { value: '12', label: 'AI Agents' },
              { value: '4.9/5', label: 'Founder Rating' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Logo cloud */}
      <section className="relative z-10 border-y border-slate-800/50 bg-slate-900/30 backdrop-blur-sm py-12">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-slate-500 mb-8">Founders from these companies trust us</p>
          <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6 opacity-50">
            {['Y Combinator', 'Techstars', 'Sequoia', '500 Startups', 'Andreessen Horowitz'].map((name) => (
              <span key={name} className="text-lg font-semibold text-slate-400">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="relative z-10 container mx-auto px-4 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Stop Guessing. Start Knowing.
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Most startups fail because founders skip proper validation.
              We give you the insights VCs use to evaluate opportunities.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* The Old Way */}
            <div className="bg-gradient-to-br from-red-500/10 to-transparent p-8 rounded-2xl border border-red-500/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-red-400">The Old Way</h3>
              </div>
              <ul className="space-y-4">
                {[
                  'Months of market research',
                  'Expensive consultants ($10K+)',
                  'Biased advice from friends',
                  'Guessing your TAM/SAM/SOM',
                  'No idea if investors will bite',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-slate-400">
                    <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* The Validation Council Way */}
            <div className="bg-gradient-to-br from-emerald-500/10 to-transparent p-8 rounded-2xl border border-emerald-500/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-emerald-400">The Validation Council Way</h3>
              </div>
              <ul className="space-y-4">
                {[
                  'Complete analysis in 10 minutes',
                  'Fraction of consultant costs',
                  '12 unbiased AI perspectives',
                  'Data-backed market sizing',
                  'Investor-ready documentation',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-slate-300">
                    <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative z-10 container mx-auto px-4 py-24 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-emerald-400 font-semibold text-sm uppercase tracking-wider">How It Works</span>
            <h2 className="text-3xl md:text-5xl font-bold mt-2 mb-4">
              From Idea to Insights in 3 Steps
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Describe Your Idea',
                description: 'Tell us about your startup concept, target market, and what problem you\'re solving. No pitch deck needed.',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                ),
              },
              {
                step: '02',
                title: '12 Agents Analyze',
                description: 'Our specialized AI council evaluates market size, competition, financials, legal risks, and more in parallel.',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                ),
              },
              {
                step: '03',
                title: 'Get Your Report',
                description: 'Receive a comprehensive validation report with scores, risks, opportunities, and actionable recommendations.',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ),
              },
            ].map((item) => (
              <div key={item.step} className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-slate-800/50 backdrop-blur-sm p-8 rounded-2xl border border-slate-700/50 group-hover:border-emerald-500/30 transition-colors h-full">
                  <div className="text-emerald-400 font-mono text-sm mb-4">{item.step}</div>
                  <div className="text-emerald-400 mb-4">{item.icon}</div>
                  <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-slate-400">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The 12 Agents */}
      <section className="relative z-10 container mx-auto px-4 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-emerald-400 font-semibold text-sm uppercase tracking-wider">The Council</span>
            <h2 className="text-3xl md:text-5xl font-bold mt-2 mb-4">
              12 Specialized AI Agents
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Each agent brings deep expertise in their domain, working together
              to give you a 360° view of your startup's potential.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { name: 'Market Intel', role: 'TAM/SAM/SOM Analysis', icon: '📊', color: 'from-blue-500 to-blue-600' },
              { name: 'Competition', role: 'Competitive Landscape', icon: '🎯', color: 'from-cyan-500 to-cyan-600' },
              { name: 'Financial', role: 'Unit Economics', icon: '💰', color: 'from-green-500 to-green-600' },
              { name: 'Customer', role: 'Product-Market Fit', icon: '👥', color: 'from-yellow-500 to-yellow-600' },
              { name: 'Team', role: 'Founder Evaluation', icon: '🏆', color: 'from-orange-500 to-orange-600' },
              { name: 'Legal & Risk', role: 'Regulatory Analysis', icon: '⚖️', color: 'from-red-500 to-red-600' },
              { name: 'Technology', role: 'Tech Feasibility', icon: '⚙️', color: 'from-indigo-500 to-indigo-600' },
              { name: 'Funding', role: 'Investment Landscape', icon: '🚀', color: 'from-pink-500 to-pink-600' },
              { name: 'Valuation', role: 'Company Valuation', icon: '📈', color: 'from-teal-500 to-teal-600' },
              { name: 'Synthesis', role: 'Final Recommendations', icon: '🎓', color: 'from-violet-500 to-violet-600' },
              { name: 'Trust & Audit', role: 'Data Verification', icon: '🔒', color: 'from-slate-500 to-slate-600' },
              { name: 'Orchestrator', role: 'Coordination', icon: '🤖', color: 'from-purple-500 to-purple-600' },
            ].map((agent) => (
              <div
                key={agent.name}
                className="group relative bg-slate-800/30 backdrop-blur-sm p-5 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-all hover:scale-105 cursor-default"
              >
                <div className="text-3xl mb-3">{agent.icon}</div>
                <div className="font-semibold text-white mb-1">{agent.name}</div>
                <div className="text-xs text-slate-400">{agent.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 container mx-auto px-4 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-emerald-400 font-semibold text-sm uppercase tracking-wider">Testimonials</span>
            <h2 className="text-3xl md:text-5xl font-bold mt-2">
              Loved by Founders
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "The Validation Council saved me 6 months of market research. The TAM analysis alone was worth 10x the price.",
                author: "Sarah Chen",
                role: "Founder, TechFlow",
                raised: "Raised $2.3M Seed",
              },
              {
                quote: "I used the report in my pitch deck. Investors were impressed by the depth of analysis. Closed our round in 3 weeks.",
                author: "Marcus Johnson",
                role: "CEO, DataSync",
                raised: "Raised $5M Series A",
              },
              {
                quote: "The competitive analysis found 3 competitors I didn't even know existed. Pivoted my positioning and found product-market fit.",
                author: "Elena Rodriguez",
                role: "Founder, HealthAI",
                raised: "Raised $1.8M Pre-seed",
              },
            ].map((testimonial) => (
              <div
                key={testimonial.author}
                className="bg-slate-800/30 backdrop-blur-sm p-8 rounded-2xl border border-slate-700/50"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-slate-300 mb-6 italic">"{testimonial.quote}"</p>
                <div>
                  <div className="font-semibold">{testimonial.author}</div>
                  <div className="text-sm text-slate-400">{testimonial.role}</div>
                  <div className="text-xs text-emerald-400 mt-1">{testimonial.raised}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Investors Section */}
      <section className="relative z-10 container mx-auto px-4 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-br from-blue-500/10 via-slate-800/50 to-emerald-500/10 rounded-3xl border border-slate-700/50 p-12 md:p-16">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <span className="text-blue-400 font-semibold text-sm uppercase tracking-wider">For Investors</span>
                <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">
                  Due Diligence, Accelerated
                </h2>
                <p className="text-slate-400 mb-6">
                  Get standardized validation reports on portfolio candidates. Compare opportunities
                  with consistent metrics. Identify red flags before they become problems.
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    'Standardized scoring across all startups',
                    'Market size validation with sources',
                    'Competitive moat analysis',
                    'Team capability assessment',
                    'Risk factor identification',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-slate-300">
                      <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/investor"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-semibold transition-colors"
                >
                  Investor Portal
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
              <div className="hidden md:block">
                <div className="bg-slate-900/80 rounded-2xl p-6 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-slate-400">Validation Score</span>
                    <span className="text-2xl font-bold text-emerald-400">87/100</span>
                  </div>
                  <div className="h-3 bg-slate-700 rounded-full overflow-hidden mb-6">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" style={{width: '87%'}} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-slate-800/50 p-3 rounded-lg">
                      <div className="text-slate-400">Market Size</div>
                      <div className="font-semibold text-white">$4.2B TAM</div>
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded-lg">
                      <div className="text-slate-400">Competition</div>
                      <div className="font-semibold text-white">Medium</div>
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded-lg">
                      <div className="text-slate-400">Risk Level</div>
                      <div className="font-semibold text-yellow-400">Moderate</div>
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded-lg">
                      <div className="text-slate-400">Verdict</div>
                      <div className="font-semibold text-emerald-400">Proceed</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Ready to Validate
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Your Next Big Idea?
            </span>
          </h2>
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            Join thousands of founders who've de-risked their startups with
            AI-powered validation. Your first analysis is free.
          </p>
          <Link
            href="/validate"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white px-10 py-5 rounded-full font-semibold text-lg transition-all shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105"
          >
            Start Free Validation
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <p className="text-sm text-slate-500 mt-6">No credit card required · Results in minutes</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/50 bg-slate-900/30 backdrop-blur-sm py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <Link href="/" className="flex items-center gap-2 mb-4">
                <img src="/logo.svg" alt="Validation Council" className="h-8" />
                <span className="font-bold">Validation Council</span>
              </Link>
              <p className="text-sm text-slate-400">
                AI-powered startup validation trusted by founders worldwide.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/validate" className="hover:text-white transition-colors">Start Validation</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/investor" className="hover:text-white transition-colors">For Investors</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800/50 mt-12 pt-8 text-center text-sm text-slate-500">
            © {new Date().getFullYear()} Validation Council. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}
