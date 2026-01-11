'use client';

import { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';

interface ScoreGaugeProps {
  score: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showVerdict?: boolean;
  verdict?: 'PROCEED' | 'PIVOT' | 'RECONSIDER' | 'STOP';
}

const VERDICT_CONFIG = {
  PROCEED: { color: '#10b981', label: 'Proceed', icon: '✅' },
  PIVOT: { color: '#f59e0b', label: 'Consider Pivot', icon: '🔄' },
  RECONSIDER: { color: '#f97316', label: 'Reconsider', icon: '⚠️' },
  STOP: { color: '#ef4444', label: 'Major Concerns', icon: '🛑' },
};

const getScoreColor = (score: number): string => {
  if (score >= 80) return '#10b981'; // emerald
  if (score >= 70) return '#22c55e'; // green
  if (score >= 60) return '#84cc16'; // lime
  if (score >= 50) return '#eab308'; // yellow
  if (score >= 40) return '#f97316'; // orange
  return '#ef4444'; // red
};

const getScoreGradient = (score: number): string[] => {
  if (score >= 70) return ['#10b981', '#059669'];
  if (score >= 50) return ['#eab308', '#ca8a04'];
  return ['#ef4444', '#dc2626'];
};

export function ScoreGauge({
  score,
  label = 'Overall Score',
  size = 'lg',
  showVerdict = true,
  verdict
}: ScoreGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, 100);
    return () => clearTimeout(timer);
  }, [score]);

  const sizeConfig = {
    sm: { width: 120, height: 120, fontSize: 'text-xl', labelSize: 'text-xs' },
    md: { width: 180, height: 180, fontSize: 'text-3xl', labelSize: 'text-sm' },
    lg: { width: 260, height: 260, fontSize: 'text-5xl', labelSize: 'text-base' },
  };

  const config = sizeConfig[size];
  const scoreColor = getScoreColor(score);

  // Data for the gauge arc
  const data = [
    { value: animatedScore, fill: scoreColor },
    { value: 100 - animatedScore, fill: '#1e293b' },
  ];

  const verdictInfo = verdict ? VERDICT_CONFIG[verdict] : null;

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative"
        style={{ width: config.width, height: config.height }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>
              <linearGradient id={`scoreGradient-${score}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={getScoreGradient(score)[0]} />
                <stop offset="100%" stopColor={getScoreGradient(score)[1]} />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              startAngle={180}
              endAngle={0}
              innerRadius="70%"
              outerRadius="90%"
              paddingAngle={0}
              dataKey="value"
              stroke="none"
              animationDuration={1500}
              animationEasing="ease-out"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={index === 0 ? `url(#scoreGradient-${score})` : entry.fill}
                  style={index === 0 ? { filter: 'url(#glow)' } : {}}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`${config.fontSize} font-bold transition-all duration-1000`}
            style={{ color: scoreColor }}
          >
            {animatedScore}
          </span>
          <span className={`${config.labelSize} text-slate-400 mt-1`}>
            {label}
          </span>
        </div>
      </div>

      {/* Verdict badge */}
      {showVerdict && verdictInfo && (
        <div
          className="mt-4 px-4 py-2 rounded-full flex items-center gap-2 font-semibold"
          style={{
            backgroundColor: `${verdictInfo.color}20`,
            color: verdictInfo.color,
            border: `1px solid ${verdictInfo.color}40`
          }}
        >
          <span>{verdictInfo.icon}</span>
          <span>{verdictInfo.label}</span>
        </div>
      )}
    </div>
  );
}

// Small inline score badge
export function ScoreBadge({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const color = getScoreColor(score);
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg',
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold`}
      style={{
        backgroundColor: `${color}20`,
        color: color,
        border: `2px solid ${color}`,
      }}
    >
      {score}
    </div>
  );
}
