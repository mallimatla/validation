import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6">
            The Validation Council
          </h1>
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

          <div className="mt-16">
            <Link
              href="/validate"
              className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Start Validating
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
