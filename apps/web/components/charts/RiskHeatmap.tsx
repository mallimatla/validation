'use client';

interface Risk {
  title: string;
  probability: string;
  impact: string;
  category?: string;
}

interface RiskHeatmapProps {
  risks: Risk[];
}

const PROBABILITY_MAP: Record<string, number> = { low: 0, medium: 1, high: 2 };
const IMPACT_MAP: Record<string, number> = { minor: 0, moderate: 1, major: 2, critical: 3 };

const CELL_COLORS = [
  ['bg-green-900/50', 'bg-green-700/50', 'bg-yellow-700/50', 'bg-yellow-600/50'],
  ['bg-green-700/50', 'bg-yellow-700/50', 'bg-orange-600/50', 'bg-orange-500/50'],
  ['bg-yellow-600/50', 'bg-orange-500/50', 'bg-red-600/50', 'bg-red-500/50'],
];

export function RiskHeatmap({ risks }: RiskHeatmapProps) {
  // Build risk matrix
  const matrix: Risk[][][] = Array(3).fill(null).map(() => Array(4).fill(null).map(() => []));

  risks.forEach(risk => {
    const probIdx = PROBABILITY_MAP[risk.probability.toLowerCase()] ?? 1;
    const impactIdx = IMPACT_MAP[risk.impact.toLowerCase()] ?? 1;
    if (matrix[probIdx] && matrix[probIdx][impactIdx]) {
      matrix[probIdx][impactIdx].push(risk);
    }
  });

  const probLabels = ['Low', 'Medium', 'High'];
  const impactLabels = ['Minor', 'Moderate', 'Major', 'Critical'];

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span>🎯</span> Risk Matrix
      </h3>

      <div className="overflow-x-auto">
        <div className="min-w-[400px]">
          {/* Header - Impact */}
          <div className="flex mb-1">
            <div className="w-20"></div>
            {impactLabels.map(label => (
              <div key={label} className="flex-1 text-center text-xs text-slate-400 font-medium pb-2">
                {label}
              </div>
            ))}
          </div>

          {/* Matrix rows - Probability (reversed for high at top) */}
          {[...probLabels].reverse().map((prob, rowIdx) => {
            const actualRow = 2 - rowIdx;
            return (
              <div key={prob} className="flex mb-1">
                <div className="w-20 flex items-center text-xs text-slate-400 font-medium pr-2">
                  {prob}
                </div>
                {impactLabels.map((_, colIdx) => {
                  const cellRisks = matrix[actualRow][colIdx];
                  const hasRisks = cellRisks.length > 0;
                  return (
                    <div
                      key={colIdx}
                      className={`flex-1 h-16 rounded-lg mx-0.5 flex items-center justify-center relative group cursor-pointer transition-all ${
                        CELL_COLORS[actualRow][colIdx]
                      } ${hasRisks ? 'ring-2 ring-white/30' : ''}`}
                    >
                      {hasRisks && (
                        <>
                          <span className="text-white font-bold text-lg">{cellRisks.length}</span>
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                            <div className="bg-slate-900 border border-slate-600 rounded-lg p-3 shadow-xl max-w-xs">
                              {cellRisks.map((risk, i) => (
                                <div key={i} className={i > 0 ? 'mt-2 pt-2 border-t border-slate-700' : ''}>
                                  <p className="text-white text-sm font-medium">{risk.title}</p>
                                  {risk.category && (
                                    <span className="text-xs text-slate-400">{risk.category}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Legend */}
          <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
            <span>← Lower Risk</span>
            <span>Higher Risk →</span>
          </div>
        </div>
      </div>

      {/* Risk count summary */}
      <div className="mt-4 pt-4 border-t border-slate-700">
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500"></div>
            <span className="text-slate-300">
              Critical: {risks.filter(r => r.probability === 'high' && ['major', 'critical'].includes(r.impact.toLowerCase())).length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-orange-500"></div>
            <span className="text-slate-300">
              High: {risks.filter(r => r.probability === 'medium' || r.impact === 'major').length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-600"></div>
            <span className="text-slate-300">
              Low: {risks.filter(r => r.probability === 'low' && ['minor', 'moderate'].includes(r.impact.toLowerCase())).length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
