'use client';

interface ConfidenceIndicatorProps {
  confidence: number;
  label?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ConfidenceIndicator({ confidence, label, showPercentage = true, size = 'md' }: ConfidenceIndicatorProps) {
  const getColor = (c: number) => {
    if (c >= 80) return { bar: 'bg-emerald-500', text: 'text-emerald-400', label: 'High Confidence' };
    if (c >= 60) return { bar: 'bg-blue-500', text: 'text-blue-400', label: 'Good Confidence' };
    if (c >= 40) return { bar: 'bg-yellow-500', text: 'text-yellow-400', label: 'Moderate Confidence' };
    return { bar: 'bg-red-500', text: 'text-red-400', label: 'Low Confidence' };
  };

  const colors = getColor(confidence);

  const sizes = {
    sm: { height: 'h-1.5', text: 'text-xs' },
    md: { height: 'h-2', text: 'text-sm' },
    lg: { height: 'h-3', text: 'text-base' },
  };

  const s = sizes[size];

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-1">
          {label && <span className={`${s.text} text-slate-400`}>{label}</span>}
          {showPercentage && (
            <span className={`${s.text} font-medium ${colors.text}`}>
              {confidence}%
            </span>
          )}
        </div>
      )}
      <div className={`w-full bg-slate-700 rounded-full ${s.height} overflow-hidden`}>
        <div
          className={`${s.height} ${colors.bar} rounded-full transition-all duration-500`}
          style={{ width: `${confidence}%` }}
        />
      </div>
      <div className="flex items-center justify-end mt-1">
        <span className={`text-xs ${colors.text}`}>{colors.label}</span>
      </div>
    </div>
  );
}
