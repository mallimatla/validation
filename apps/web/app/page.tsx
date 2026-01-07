import Link from 'next/link';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      {/* Navigation */}
      <header className="border-b border-slate-700/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">
            <span className="text-emerald-400">Startup</span> Verdict
          </Link>
          <nav className="flex items-center gap-4">
            <SignedIn>
              <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors">
                Dashboard
              </Link>
              <Link href="/investor" className="text-slate-400 hover:text-white transition-colors">
                Investor View
              </Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
            <SignedOut>
              <Link href="/sign-in" className="text-slate-400 hover:text-white transition-colors">
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Get Started
              </Link>
            </SignedOut>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6">
            <span className="text-emerald-400">Startup</span> Verdict
          </h1>
          <p className="text-lg text-slate-400 mb-4">The AI Validation Council for Startup Ideas</p>
          <p className="text-xl text-slate-300 mb-8">
            AI-powered startup idea validation with 12 specialized agents.
            Every claim backed by evidence. Every prediction tracked for accuracy.
          </p>

          <div className="grid grid-cols-2 gap-6 mt-12 text-left">
            <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
              <h3 className="text-lg font-semibold text-emerald-400 mb-2">
                Trustworthy
              </h3>
              <p className="text-slate-400">
                Every claim has a verifiable source. No assertion without evidence.
                Every output traceable to data.
              </p>
            </div>

            <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
              <h3 className="text-lg font-semibold text-blue-400 mb-2">
                Accountable
              </h3>
              <p className="text-slate-400">
                Every agent versioned. Every prediction tracked. Outcomes compared
                against actuals. We stand behind our analysis.
              </p>
            </div>
          </div>

          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-8">The 12 Agents</h2>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
              {[
                { name: 'ARIA', role: 'Orchestrator', color: 'purple' },
                { name: 'Marcus', role: 'Market Intel', color: 'blue' },
                { name: 'Sophia', role: 'Competition', color: 'cyan' },
                { name: 'David', role: 'Financial', color: 'green' },
                { name: 'Elena', role: 'Customer', color: 'yellow' },
                { name: 'James', role: 'Team', color: 'orange' },
                { name: 'Rachel', role: 'Legal/Risk', color: 'red' },
                { name: 'Omar', role: 'Technology', color: 'indigo' },
                { name: 'Nora', role: 'Funding', color: 'pink' },
                { name: 'Victor', role: 'Valuation', color: 'teal' },
                { name: 'Victoria', role: 'Synthesis', color: 'violet' },
                { name: 'Sentinel', role: 'Trust/Audit', color: 'slate' },
              ].map((agent) => (
                <div
                  key={agent.name}
                  className="bg-slate-800/30 p-4 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
                >
                  <div className="font-semibold">{agent.name}</div>
                  <div className="text-sm text-slate-400">{agent.role}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Dual CTA */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6">Join the Platform</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <Link
                href="/sign-up"
                className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white p-6 rounded-xl transition-all hover:scale-105"
              >
                <div className="text-3xl mb-3">🚀</div>
                <h3 className="text-xl font-semibold mb-2">I'm a Founder</h3>
                <p className="text-emerald-100 text-sm">
                  Validate your startup idea and get discovered by investors
                </p>
              </Link>
              <Link
                href="/sign-up"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white p-6 rounded-xl transition-all hover:scale-105"
              >
                <div className="text-3xl mb-3">💰</div>
                <h3 className="text-xl font-semibold mb-2">I'm an Investor</h3>
                <p className="text-purple-100 text-sm">
                  Discover AI-validated startups and connect with founders
                </p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
