'use client';

import { useEffect, useState } from 'react';

interface MetricCardProps {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  icon?: string;
  trend?: number;
  trendLabel?: string;
  color?: 'emerald' | 'blue' | 'purple' | 'amber' | 'red' | 'slate';
  size?: 'sm' | 'md' | 'lg';
}

const colorConfig = {
  emerald: {
    bg: 'from-emerald-500/10 to-emerald-600/5',
    border: 'border-emerald-500/20',
    text: 'text-emerald-400',
    glow: 'shadow-emerald-500/10',
  },
  blue: {
    bg: 'from-blue-500/10 to-blue-600/5',
    border: 'border-blue-500/20',
    text: 'text-blue-400',
    glow: 'shadow-blue-500/10',
  },
  purple: {
    bg: 'from-purple-500/10 to-purple-600/5',
    border: 'border-purple-500/20',
    text: 'text-purple-400',
    glow: 'shadow-purple-500/10',
  },
  amber: {
    bg: 'from-amber-500/10 to-amber-600/5',
    border: 'border-amber-500/20',
    text: 'text-amber-400',
    glow: 'shadow-amber-500/10',
  },
  red: {
    bg: 'from-red-500/10 to-red-600/5',
    border: 'border-red-500/20',
    text: 'text-red-400',
    glow: 'shadow-red-500/10',
  },
  slate: {
    bg: 'from-slate-500/10 to-slate-600/5',
    border: 'border-slate-500/20',
    text: 'text-slate-400',
    glow: 'shadow-slate-500/10',
  },
};

export function MetricCard({
  label,
  value,
  suffix = '',
  prefix = '',
  icon,
  trend,
  trendLabel,
  color = 'emerald',
  size = 'md',
}: MetricCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const config = colorConfig[color];

  const sizeConfig = {
    sm: { value: 'text-2xl', label: 'text-xs', padding: 'p-4' },
    md: { value: 'text-4xl', label: 'text-sm', padding: 'p-6' },
    lg: { value: 'text-5xl', label: 'text-base', padding: 'p-8' },
  };

  const sizes = sizeConfig[size];

  useEffect(() => {
    const duration = 1000;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <div
      className={`bg-gradient-to-br ${config.bg} rounded-xl ${sizes.padding} border ${config.border} shadow-lg ${config.glow}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon && <span className="text-xl">{icon}</span>}
          <span className={`${sizes.label} text-slate-400`}>{label}</span>
        </div>
        {trend !== undefined && (
          <div
            className={`flex items-center gap-1 text-xs ${
              trend >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            <span>{trend >= 0 ? '↑' : '↓'}</span>
            <span>{Math.abs(trend)}%</span>
            {trendLabel && <span className="text-slate-500">vs {trendLabel}</span>}
          </div>
        )}
      </div>
      <div className={`${sizes.value} font-bold ${config.text}`}>
        {prefix}
        {displayValue}
        {suffix}
      </div>
    </div>
  );
}

// Circular progress ring
interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  label?: string;
  showPercentage?: boolean;
}

export function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 8,
  color = '#10b981',
  bgColor = '#334155',
  label,
  showPercentage = true,
}: ProgressRingProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedProgress / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 100);
    return () => clearTimeout(timer);
  }, [progress]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={bgColor}
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: 'stroke-dashoffset 1s ease-out',
              filter: 'drop-shadow(0 0 6px ' + color + '40)',
            }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {showPercentage && (
            <span className="text-2xl font-bold text-white">{Math.round(animatedProgress)}%</span>
          )}
        </div>
      </div>
      {label && <span className="text-sm text-slate-400 mt-2">{label}</span>}
    </div>
  );
}

// Linear progress bar
interface ProgressBarProps {
  progress: number;
  label?: string;
  showValue?: boolean;
  color?: string;
  height?: number;
  animated?: boolean;
}

export function ProgressBar({
  progress,
  label,
  showValue = true,
  color = '#10b981',
  height = 8,
  animated = true,
}: ProgressBarProps) {
  const [width, setWidth] = useState(animated ? 0 : progress);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setWidth(progress), 100);
      return () => clearTimeout(timer);
    }
  }, [progress, animated]);

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-sm text-slate-400">{label}</span>}
          {showValue && <span className="text-sm font-medium text-white">{progress}%</span>}
        </div>
      )}
      <div
        className="w-full bg-slate-700 rounded-full overflow-hidden"
        style={{ height }}
      >
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${width}%`,
            backgroundColor: color,
            boxShadow: `0 0 10px ${color}50`,
          }}
        />
      </div>
    </div>
  );
}

// Stats grid component
export function StatsGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {children}
    </div>
  );
}

// Multi-metric comparison card
interface ComparisonMetric {
  label: string;
  current: number;
  previous?: number;
  target?: number;
}

export function ComparisonCard({ metrics, title }: { metrics: ComparisonMetric[]; title?: string }) {
  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
      {title && <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>}
      <div className="space-y-4">
        {metrics.map((metric, i) => {
          const trend = metric.previous
            ? ((metric.current - metric.previous) / metric.previous) * 100
            : undefined;
          const color =
            metric.target !== undefined
              ? metric.current >= metric.target
                ? '#10b981'
                : '#f59e0b'
              : '#10b981';

          return (
            <div key={i}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-slate-400">{metric.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-white">{metric.current}%</span>
                  {trend !== undefined && (
                    <span
                      className={`text-xs ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                    >
                      {trend >= 0 ? '↑' : '↓'} {Math.abs(Math.round(trend))}%
                    </span>
                  )}
                </div>
              </div>
              <div className="relative">
                <ProgressBar progress={metric.current} showValue={false} color={color} height={6} />
                {metric.target && (
                  <div
                    className="absolute top-0 w-0.5 h-6 bg-white/50 -translate-y-0.5"
                    style={{ left: `${metric.target}%` }}
                    title={`Target: ${metric.target}%`}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
