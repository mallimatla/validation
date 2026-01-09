'use client';

import React, { useState } from 'react';

interface ScoreItem {
  score: number;
  maxScore: number;
  details: string;
}

interface ValidationScorecardData {
  dataQuality?: ScoreItem;
  sourceVerification?: ScoreItem;
  analysisDepth?: ScoreItem;
  riskAssessment?: ScoreItem;
  actionability?: ScoreItem;
  marketValidation?: ScoreItem;
  competitiveAnalysis?: ScoreItem;
  overall: { score: number; maxScore: number; grade: string };
}

interface ValidationScorecardProps {
  data: ValidationScorecardData;
  agentName?: string;
  onDrillDown?: (category: string) => void;
}

function getGradeColor(grade: string): string {
  if (grade.startsWith('A')) return '#10b981';
  if (grade.startsWith('B')) return '#3b82f6';
  if (grade.startsWith('C')) return '#f59e0b';
  if (grade.startsWith('D')) return '#ef4444';
  return '#ef4444';
}

function getScoreColor(score: number, maxScore: number): string {
  const percentage = (score / maxScore) * 100;
  if (percentage >= 80) return '#10b981';
  if (percentage >= 60) return '#3b82f6';
  if (percentage >= 40) return '#f59e0b';
  return '#ef4444';
}

export function ValidationScorecard({ data, agentName, onDrillDown }: ValidationScorecardProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [
    { key: 'dataQuality', label: 'Data Quality', icon: '📊', data: data.dataQuality },
    { key: 'sourceVerification', label: 'Source Verification', icon: '✓', data: data.sourceVerification },
    { key: 'analysisDepth', label: 'Analysis Depth', icon: '🔍', data: data.analysisDepth },
    { key: 'riskAssessment', label: 'Risk Assessment', icon: '⚠️', data: data.riskAssessment },
    { key: 'actionability', label: 'Actionability', icon: '🎯', data: data.actionability },
    { key: 'marketValidation', label: 'Market Validation', icon: '📈', data: data.marketValidation },
    { key: 'competitiveAnalysis', label: 'Competitive Analysis', icon: '🏆', data: data.competitiveAnalysis },
  ].filter(c => c.data);

  const gradeColor = getGradeColor(data.overall.grade);
  const percentage = (data.overall.score / data.overall.maxScore) * 100;

  return (
    <div className="space-y-4">
      {/* Overall Grade Circle */}
      <div className="flex items-center justify-center">
        <div className="relative w-32 h-32">
          {/* Background circle */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke="#1e293b"
              strokeWidth="12"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke={gradeColor}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${percentage * 3.52} 352`}
            />
          </svg>
          {/* Grade text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold" style={{ color: gradeColor }}>
              {data.overall.grade}
            </span>
            <span className="text-xs text-slate-400">
              {data.overall.score}/{data.overall.maxScore}
            </span>
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="text-center">
        <h4 className="text-sm font-medium text-white">
          {agentName ? `${agentName} Validation Score` : 'Validation Score'}
        </h4>
        <p className="text-xs text-slate-400 mt-1">
          Based on {categories.length} quality dimensions
        </p>
      </div>

      {/* Category Breakdown */}
      <div className="space-y-2">
        {categories.map((category) => {
          const cat = category.data!;
          const scorePercent = (cat.score / cat.maxScore) * 100;
          const color = getScoreColor(cat.score, cat.maxScore);

          return (
            <button
              key={category.key}
              onClick={() => {
                setSelectedCategory(category.key);
                onDrillDown?.(category.key);
              }}
              className={`w-full flex items-center gap-3 p-2 rounded-lg border transition-all text-left ${
                selectedCategory === category.key
                  ? 'border-white bg-slate-700/50'
                  : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
              }`}
            >
              <span className="text-lg">{category.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400 truncate">{category.label}</span>
                  <span className="text-xs font-medium" style={{ color }}>
                    {cat.score}/{cat.maxScore}
                  </span>
                </div>
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${scorePercent}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Drill-Down Panel */}
      {selectedCategory && (
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {categories.find(c => c.key === selectedCategory)?.icon}
              </span>
              <h4 className="font-semibold text-white">
                {categories.find(c => c.key === selectedCategory)?.label}
              </h4>
            </div>
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-slate-400 hover:text-white text-sm"
            >
              ✕ Close
            </button>
          </div>
          {(() => {
            const cat = categories.find(c => c.key === selectedCategory);
            if (!cat?.data) return null;
            const percentage = (cat.data.score / cat.data.maxScore) * 100;
            const color = getScoreColor(cat.data.score, cat.data.maxScore);
            return (
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-slate-400 text-xs">Score</p>
                    <p className="text-2xl font-bold" style={{ color }}>
                      {cat.data.score}/{cat.data.maxScore}
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-400 text-xs mb-1">Rating</p>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className="text-lg"
                          style={{
                            color: star <= Math.round(cat.data!.score / cat.data!.maxScore * 5)
                              ? '#f59e0b'
                              : '#334155'
                          }}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Details</p>
                  <p className="text-sm text-slate-300 mt-1">{cat.data.details}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs mb-1">Score Interpretation</p>
                  <p className="text-sm text-slate-300">
                    {percentage >= 80 ? 'Excellent - meets investor-grade standards' :
                     percentage >= 60 ? 'Good - above average quality' :
                     percentage >= 40 ? 'Fair - some areas need improvement' :
                     'Needs Work - significant improvement required'}
                  </p>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Overall Summary */}
      <div className="bg-slate-800/30 rounded-lg p-3 text-center">
        <p className="text-xs text-slate-400">
          {percentage >= 80
            ? '✅ This analysis meets investor-grade quality standards'
            : percentage >= 60
            ? '📊 This analysis is reasonably thorough with room for improvement'
            : percentage >= 40
            ? '⚠️ This analysis has gaps that should be addressed'
            : '❌ This analysis requires significant additional research'}
        </p>
      </div>
    </div>
  );
}
