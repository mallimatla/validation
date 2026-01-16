'use client';

import { useState, useEffect, useRef } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
}

// Animated counter hook
function useAnimatedCounter(endValue: number, duration: number = 1000, decimals: number = 0) {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const startValue = countRef.current;
    const difference = endValue - startValue;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = startValue + difference * easeOutQuart;

      setCount(currentValue);
      countRef.current = currentValue;

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    startTimeRef.current = null;
    requestAnimationFrame(animate);
  }, [endValue, duration]);

  return decimals > 0 ? count.toFixed(decimals) : Math.round(count);
}

export function AnimatedCounter({ value, duration = 1000, decimals = 0, suffix = '', prefix = '' }: AnimatedCounterProps) {
  const animatedValue = useAnimatedCounter(value, duration, decimals);
  return <>{prefix}{animatedValue}{suffix}</>;
}

// Enhanced stat card with gradient and animation
interface EnhancedStatCardProps {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  icon: string;
  color: 'emerald' | 'blue' | 'purple' | 'amber' | 'red' | 'cyan';
  trend?: { value: number; direction: 'up' | 'down' };
  subtext?: string;
  onClick?: () => void;
}

const COLOR_SCHEMES = {
  emerald: {
    gradient: 'from-emerald-500/20 to-emerald-600/5',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    glow: 'shadow-emerald-500/20',
    ring: 'ring-emerald-500/30',
  },
  blue: {
    gradient: 'from-blue-500/20 to-blue-600/5',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    glow: 'shadow-blue-500/20',
    ring: 'ring-blue-500/30',
  },
  purple: {
    gradient: 'from-purple-500/20 to-purple-600/5',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    glow: 'shadow-purple-500/20',
    ring: 'ring-purple-500/30',
  },
  amber: {
    gradient: 'from-amber-500/20 to-amber-600/5',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    glow: 'shadow-amber-500/20',
    ring: 'ring-amber-500/30',
  },
  red: {
    gradient: 'from-red-500/20 to-red-600/5',
    border: 'border-red-500/30',
    text: 'text-red-400',
    glow: 'shadow-red-500/20',
    ring: 'ring-red-500/30',
  },
  cyan: {
    gradient: 'from-cyan-500/20 to-cyan-600/5',
    border: 'border-cyan-500/30',
    text: 'text-cyan-400',
    glow: 'shadow-cyan-500/20',
    ring: 'ring-cyan-500/30',
  },
};

export function EnhancedStatCard({
  label,
  value,
  suffix = '',
  prefix = '',
  icon,
  color,
  trend,
  subtext,
  onClick,
}: EnhancedStatCardProps) {
  const scheme = COLOR_SCHEMES[color];

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden bg-gradient-to-br ${scheme.gradient} rounded-xl p-6 border ${scheme.border} transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${scheme.glow} ${onClick ? 'cursor-pointer' : ''}`}
    >
      {/* Background decoration */}
      <div className="absolute -right-4 -top-4 w-24 h-24 opacity-10">
        <div className={`w-full h-full rounded-full bg-gradient-to-br ${scheme.gradient}`} />
      </div>

      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{icon}</span>
            <span className="text-slate-400 text-sm font-medium">{label}</span>
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs ${trend.direction === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
              <span>{trend.direction === 'up' ? '↑' : '↓'}</span>
              <span>{trend.value}%</span>
            </div>
          )}
        </div>

        <div className={`text-4xl font-bold ${scheme.text}`}>
          <AnimatedCounter value={value} prefix={prefix} suffix={suffix} duration={1200} />
        </div>

        {subtext && (
          <p className="text-xs text-slate-500 mt-2">{subtext}</p>
        )}
      </div>
    </div>
  );
}

// Actions breakdown card
interface ActionItem {
  priority: string;
  title?: string;
  description?: string;
}

export function ActionsBreakdownCard({ actions }: { actions: ActionItem[] }) {
  const critical = actions.filter(a => a.priority === 'critical' || a.priority === 'high').length;
  const high = actions.filter(a => a.priority === 'high').length;
  const medium = actions.filter(a => a.priority === 'medium').length;
  const low = actions.filter(a => a.priority === 'low').length;
  const total = actions.length;
  const maxVal = Math.max(critical, high, medium, low, 1);

  const data = [
    { label: 'Critical', value: critical, color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.2)' },
    { label: 'High', value: high, color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.2)' },
    { label: 'Medium', value: medium, color: '#eab308', bgColor: 'rgba(234, 179, 8, 0.2)' },
    { label: 'Low', value: low, color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.2)' },
  ];

  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
            <span className="text-xl">📋</span>
          </div>
          <div>
            <h3 className="font-semibold text-white">Actions</h3>
            <p className="text-xs text-slate-400">Prioritized recommendations</p>
          </div>
        </div>
        <div className="text-3xl font-bold text-white">{total}</div>
      </div>

      <div className="space-y-4">
        {data.map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm" style={{ color: item.color }}>{item.label}</span>
              </div>
              <span className="text-sm font-bold text-white">{item.value}</span>
            </div>
            <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out relative"
                style={{
                  width: `${(item.value / maxVal) * 100}%`,
                  backgroundColor: item.color,
                }}
              >
                <div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
                  style={{ backgroundSize: '200% 100%' }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {critical > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          <div className="flex items-center gap-2 text-red-400">
            <span className="text-lg">⚡</span>
            <span className="text-sm">{critical} high-priority actions need attention</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Risks breakdown card
interface Risk {
  probability?: string;
  impact?: string;
  title?: string;
}

export function RisksBreakdownCard({ risks }: { risks: Risk[] }) {
  const high = risks.filter(r => r.probability === 'high' || r.impact === 'critical' || r.impact === 'major').length;
  const medium = risks.filter(r => r.probability === 'medium' || r.impact === 'moderate').length;
  const low = risks.filter(r => r.probability === 'low' || r.impact === 'minor').length;
  const total = risks.length;
  const maxVal = Math.max(high, medium, low, 1);

  const data = [
    { label: 'High', value: high, color: '#ef4444', icon: '🔴' },
    { label: 'Medium', value: medium, color: '#eab308', icon: '🟡' },
    { label: 'Low', value: low, color: '#22c55e', icon: '🟢' },
  ];

  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
            <span className="text-xl">⚠️</span>
          </div>
          <div>
            <h3 className="font-semibold text-white">Risks</h3>
            <p className="text-xs text-slate-400">Identified risk factors</p>
          </div>
        </div>
        <div className="text-3xl font-bold text-white">{total}</div>
      </div>

      <div className="space-y-4">
        {data.map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span>{item.icon}</span>
                <span className="text-sm" style={{ color: item.color }}>{item.label}</span>
              </div>
              <span className="text-sm font-bold text-white">{item.value}</span>
            </div>
            <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${(item.value / maxVal) * 100}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {high > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          <div className="flex items-center gap-2 text-amber-400">
            <span className="text-lg">⚡</span>
            <span className="text-sm">{high} high-priority risks need attention</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Score gauge with confidence ring
interface ScoreWithConfidenceProps {
  score: number;
  confidence: number;
  verdict?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ScoreWithConfidence({ score, confidence, verdict, size = 'lg' }: ScoreWithConfidenceProps) {
  const sizes = {
    sm: { width: 120, strokeWidth: 8, fontSize: 24 },
    md: { width: 180, strokeWidth: 10, fontSize: 36 },
    lg: { width: 240, strokeWidth: 12, fontSize: 48 },
  };

  const config = sizes[size];
  const radius = (config.width - config.strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const scoreProgress = (score / 100) * circumference;
  const confidenceProgress = (confidence / 100) * circumference;

  const getScoreColor = (s: number) => {
    if (s >= 70) return '#10b981';
    if (s >= 50) return '#eab308';
    return '#ef4444';
  };

  const getVerdictConfig = (v?: string) => {
    const configs: Record<string, { bg: string; text: string; label: string }> = {
      PROCEED: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'PROCEED' },
      'PROCEED WITH CAUTION': { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'PROCEED WITH CAUTION' },
      PIVOT: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'PIVOT' },
      RECONSIDER: { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'RECONSIDER' },
      STOP: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'STOP' },
    };
    return configs[v || ''] || configs.PROCEED;
  };

  const verdictConfig = getVerdictConfig(verdict);
  const scoreColor = getScoreColor(score);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: config.width, height: config.width }}>
        {/* Background circles */}
        <svg className="absolute inset-0 -rotate-90" width={config.width} height={config.width}>
          {/* Outer confidence track */}
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius}
            fill="none"
            stroke="#334155"
            strokeWidth={config.strokeWidth}
          />
          {/* Inner score track */}
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius - config.strokeWidth - 4}
            fill="none"
            stroke="#1e293b"
            strokeWidth={config.strokeWidth - 2}
          />

          {/* Confidence progress */}
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius}
            fill="none"
            stroke="#3b82f6"
            strokeWidth={config.strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - confidenceProgress}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{ filter: 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.5))' }}
          />

          {/* Score progress */}
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius - config.strokeWidth - 4}
            fill="none"
            stroke={scoreColor}
            strokeWidth={config.strokeWidth - 2}
            strokeDasharray={2 * Math.PI * (radius - config.strokeWidth - 4)}
            strokeDashoffset={2 * Math.PI * (radius - config.strokeWidth - 4) * (1 - score / 100)}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{ filter: `drop-shadow(0 0 8px ${scoreColor}80)` }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-5xl font-bold text-white" style={{ fontSize: config.fontSize }}>
            <AnimatedCounter value={score} duration={1500} />
          </div>
          <div className="text-sm text-slate-400">Overall Score</div>
        </div>
      </div>

      {/* Verdict badge */}
      {verdict && (
        <div className={`mt-4 px-4 py-2 rounded-lg border ${verdictConfig.bg} ${verdictConfig.text} font-semibold text-sm`}>
          {verdictConfig.label}
        </div>
      )}

      {/* Confidence indicator */}
      <div className="mt-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-sm text-slate-400">Confidence</span>
        </div>
        <span className="text-lg font-bold text-blue-400">{confidence}%</span>
      </div>

      {/* Confidence label */}
      <div className="text-xs text-slate-500 mt-1">
        {confidence >= 80 ? 'High Confidence' : confidence >= 60 ? 'Good Confidence' : 'Moderate Confidence'}
      </div>
    </div>
  );
}
