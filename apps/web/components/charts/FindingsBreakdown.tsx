'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface Finding {
  title: string;
  type: string;
  severity: string;
}

interface FindingsBreakdownProps {
  findings: Finding[];
}

const TYPE_COLORS: Record<string, string> = {
  strength: '#10b981',
  weakness: '#ef4444',
  opportunity: '#3b82f6',
  threat: '#f97316',
  neutral: '#64748b',
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  major: '#f97316',
  minor: '#eab308',
  info: '#64748b',
};

export function FindingsBreakdown({ findings }: FindingsBreakdownProps) {
  // Group by type
  const typeGroups = findings.reduce((acc, f) => {
    const type = f.type || 'neutral';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const typeData = Object.entries(typeGroups).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: TYPE_COLORS[name] || '#64748b',
  }));

  // Group by severity
  const severityGroups = findings.reduce((acc, f) => {
    const severity = f.severity || 'info';
    acc[severity] = (acc[severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const severityData = Object.entries(severityGroups).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: SEVERITY_COLORS[name] || '#64748b',
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-2 shadow-lg">
          <p className="text-white text-sm">
            {payload[0].name}: <span className="font-bold">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className="flex flex-wrap justify-center gap-3 mt-2">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-1.5 text-xs">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></div>
            <span className="text-slate-300">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span>🔍</span> Findings Analysis
      </h3>

      <div className="grid grid-cols-2 gap-4">
        {/* By Type */}
        <div>
          <p className="text-sm text-slate-400 text-center mb-2">By Type (SWOT)</p>
          <div className="h-[180px]">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={60}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend content={renderCustomLegend} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* By Severity */}
        <div>
          <p className="text-sm text-slate-400 text-center mb-2">By Severity</p>
          <div className="h-[180px]">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={60}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend content={renderCustomLegend} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-4 pt-4 border-t border-slate-700 grid grid-cols-4 gap-2 text-center">
        <div>
          <div className="text-2xl font-bold text-emerald-400">{typeGroups['strength'] || 0}</div>
          <div className="text-xs text-slate-400">Strengths</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-red-400">{typeGroups['weakness'] || 0}</div>
          <div className="text-xs text-slate-400">Weaknesses</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-blue-400">{typeGroups['opportunity'] || 0}</div>
          <div className="text-xs text-slate-400">Opportunities</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-orange-400">{typeGroups['threat'] || 0}</div>
          <div className="text-xs text-slate-400">Threats</div>
        </div>
      </div>
    </div>
  );
}
