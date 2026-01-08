'use client';

interface Evidence {
  source?: string;
  claim?: string;
  url?: string;
  verified?: boolean;
  quality?: 'verified' | 'estimated' | 'projected' | 'assumed';
}

interface EvidenceCardProps {
  title: string;
  description: string;
  type: string;
  severity: string;
  evidence?: (string | Evidence)[];
}

const TYPE_CONFIG: Record<string, { icon: string; color: string; bgColor: string; borderColor: string }> = {
  strength: { icon: '💪', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/30' },
  weakness: { icon: '⚠️', color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30' },
  opportunity: { icon: '🚀', color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30' },
  threat: { icon: '🔥', color: 'text-orange-400', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/30' },
  neutral: { icon: '📋', color: 'text-slate-400', bgColor: 'bg-slate-500/10', borderColor: 'border-slate-500/30' },
};

const SEVERITY_CONFIG: Record<string, { label: string; color: string }> = {
  critical: { label: 'Critical', color: 'bg-red-500 text-white' },
  major: { label: 'Major', color: 'bg-orange-500 text-white' },
  minor: { label: 'Minor', color: 'bg-yellow-500 text-black' },
  info: { label: 'Info', color: 'bg-slate-500 text-white' },
};

const QUALITY_BADGE: Record<string, { label: string; icon: string; color: string }> = {
  verified: { label: 'Verified', icon: '✓', color: 'text-emerald-400 bg-emerald-500/20' },
  estimated: { label: 'Estimated', icon: '≈', color: 'text-yellow-400 bg-yellow-500/20' },
  projected: { label: 'Projected', icon: '→', color: 'text-blue-400 bg-blue-500/20' },
  assumed: { label: 'Assumed', icon: '?', color: 'text-slate-400 bg-slate-500/20' },
};

export function EvidenceCard({ title, description, type, severity, evidence }: EvidenceCardProps) {
  const typeConfig = TYPE_CONFIG[type] || TYPE_CONFIG.neutral;
  const severityConfig = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.info;

  const formatEvidence = (e: string | Evidence): { text: string; quality?: string; url?: string } => {
    if (typeof e === 'string') {
      return { text: e };
    }
    return {
      text: e.claim || e.source || JSON.stringify(e),
      quality: e.quality,
      url: e.url,
    };
  };

  return (
    <div className={`rounded-xl border ${typeConfig.borderColor} ${typeConfig.bgColor} p-4 transition-all hover:border-opacity-60`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{typeConfig.icon}</span>
          <div>
            <h4 className={`font-semibold ${typeConfig.color}`}>{title}</h4>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${severityConfig.color}`}>
                {severityConfig.label}
              </span>
              <span className="text-xs text-slate-500 uppercase">{type}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-slate-300 text-sm mb-3">{description}</p>

      {/* Evidence Section */}
      {evidence && evidence.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-slate-400">📎 Evidence & Sources</span>
            <span className="text-xs text-slate-500">({evidence.length})</span>
          </div>
          <div className="space-y-2">
            {evidence.slice(0, 3).map((e, idx) => {
              const formatted = formatEvidence(e);
              return (
                <div key={idx} className="flex items-start gap-2 bg-slate-800/50 rounded-lg p-2">
                  <span className="text-emerald-400 text-xs mt-0.5">→</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-300 line-clamp-2">{formatted.text}</p>
                    {formatted.quality && (
                      <span className={`inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-xs ${QUALITY_BADGE[formatted.quality]?.color || 'text-slate-400 bg-slate-500/20'}`}>
                        <span>{QUALITY_BADGE[formatted.quality]?.icon}</span>
                        {QUALITY_BADGE[formatted.quality]?.label}
                      </span>
                    )}
                    {formatted.url && (
                      <a
                        href={formatted.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:underline block mt-1 truncate"
                      >
                        🔗 {formatted.url}
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
            {evidence.length > 3 && (
              <p className="text-xs text-slate-500 pl-4">
                +{evidence.length - 3} more sources
              </p>
            )}
          </div>
        </div>
      )}

      {/* No Evidence Warning */}
      {(!evidence || evidence.length === 0) && (
        <div className="mt-3 pt-3 border-t border-slate-700/50">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>⚠️</span>
            <span>No evidence sources provided</span>
          </div>
        </div>
      )}
    </div>
  );
}
