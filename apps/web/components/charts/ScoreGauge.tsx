'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface ScoreGaugeProps {
  score: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showVerdict?: boolean;
  verdict?: string;
}

export function ScoreGauge({ score, label = 'Overall Score', size = 'md', showVerdict = false, verdict }: ScoreGaugeProps) {
  const getColor = (s: number) => {
    if (s >= 70) return '#10b981'; // emerald
    if (s >= 50) return '#eab308'; // yellow
    return '#ef4444'; // red
  };

  const getVerdictColor = (v: string) => {
    switch (v) {
      case 'PROCEED': return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/50';
      case 'PROCEED_WITH_CAUTION': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50';
      case 'PIVOT_RECOMMENDED': return 'text-orange-400 bg-orange-500/20 border-orange-500/50';
      case 'DO_NOT_PROCEED': return 'text-red-400 bg-red-500/20 border-red-500/50';
      default: return 'text-slate-400 bg-slate-500/20 border-slate-500/50';
    }
  };

  const data = [
    { value: score, fill: getColor(score) },
    { value: 100 - score, fill: '#334155' },
  ];

  const sizes = {
    sm: { width: 120, height: 80, fontSize: 'text-xl', innerRadius: 35, outerRadius: 50 },
    md: { width: 180, height: 120, fontSize: 'text-3xl', innerRadius: 55, outerRadius: 75 },
    lg: { width: 240, height: 160, fontSize: 'text-4xl', innerRadius: 75, outerRadius: 100 },
  };

  const s = sizes[size];

  return (
    <div className="flex flex-col items-center">
      <div style={{ width: s.width, height: s.height }} className="relative">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="100%"
              startAngle={180}
              endAngle={0}
              innerRadius={s.innerRadius}
              outerRadius={s.outerRadius}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-end justify-center pb-2">
          <span className={`font-bold ${s.fontSize}`} style={{ color: getColor(score) }}>
            {score}
          </span>
        </div>
      </div>
      <p className="text-slate-400 text-sm mt-1">{label}</p>
      {showVerdict && verdict && (
        <div className={`mt-3 px-4 py-2 rounded-lg border ${getVerdictColor(verdict)}`}>
          <span className="font-semibold text-sm">{verdict.replace(/_/g, ' ')}</span>
        </div>
      )}
    </div>
  );
}
