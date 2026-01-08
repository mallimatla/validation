'use client';

interface Recommendation {
  title: string;
  description: string;
  priority: string;
  timeframe: string;
}

interface RecommendationTimelineProps {
  recommendations: Recommendation[];
}

const PRIORITY_CONFIG: Record<string, { color: string; bgColor: string; icon: string }> = {
  critical: { color: 'text-red-400', bgColor: 'bg-red-500/20 border-red-500/50', icon: '🚨' },
  high: { color: 'text-orange-400', bgColor: 'bg-orange-500/20 border-orange-500/50', icon: '⚡' },
  medium: { color: 'text-yellow-400', bgColor: 'bg-yellow-500/20 border-yellow-500/50', icon: '📌' },
  low: { color: 'text-slate-400', bgColor: 'bg-slate-500/20 border-slate-500/50', icon: '📋' },
};

const TIMEFRAME_ORDER = ['immediate', 'short-term', 'medium-term', 'long-term'];
const TIMEFRAME_LABELS: Record<string, { label: string; days: string }> = {
  immediate: { label: 'Immediate', days: '0-7 days' },
  'short-term': { label: 'Short-term', days: '1-4 weeks' },
  'medium-term': { label: 'Medium-term', days: '1-3 months' },
  'long-term': { label: 'Long-term', days: '3+ months' },
};

export function RecommendationTimeline({ recommendations }: RecommendationTimelineProps) {
  // Group by timeframe
  const grouped = TIMEFRAME_ORDER.reduce((acc, tf) => {
    acc[tf] = recommendations.filter(r => r.timeframe === tf);
    return acc;
  }, {} as Record<string, Recommendation[]>);

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span>📅</span> Action Timeline
      </h3>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-700"></div>

        {TIMEFRAME_ORDER.map((timeframe, tfIndex) => {
          const items = grouped[timeframe];
          if (!items || items.length === 0) return null;

          const tfConfig = TIMEFRAME_LABELS[timeframe];

          return (
            <div key={timeframe} className="relative mb-6 last:mb-0">
              {/* Timeframe header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-600 flex items-center justify-center text-sm font-bold text-slate-300 z-10">
                  {tfIndex + 1}
                </div>
                <div>
                  <h4 className="font-semibold text-white">{tfConfig.label}</h4>
                  <p className="text-xs text-slate-500">{tfConfig.days}</p>
                </div>
              </div>

              {/* Recommendations */}
              <div className="ml-11 space-y-2">
                {items
                  .sort((a, b) => {
                    const priorityOrder = ['critical', 'high', 'medium', 'low'];
                    return priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority);
                  })
                  .map((rec, idx) => {
                    const config = PRIORITY_CONFIG[rec.priority] || PRIORITY_CONFIG.medium;
                    return (
                      <div
                        key={idx}
                        className={`rounded-lg border p-3 ${config.bgColor}`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-lg">{config.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h5 className={`font-medium ${config.color}`}>{rec.title}</h5>
                              <span className={`text-xs px-1.5 py-0.5 rounded ${config.color} bg-slate-800/50`}>
                                {rec.priority}
                              </span>
                            </div>
                            <p className="text-sm text-slate-300 mt-1 line-clamp-2">{rec.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-slate-700">
        <div className="flex flex-wrap gap-4 text-sm">
          {Object.entries(PRIORITY_CONFIG).map(([priority, config]) => {
            const count = recommendations.filter(r => r.priority === priority).length;
            if (count === 0) return null;
            return (
              <div key={priority} className="flex items-center gap-2">
                <span>{config.icon}</span>
                <span className={config.color}>{count} {priority}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
