import React from 'react';
import { ChevronRight, ShieldCheck } from 'lucide-react';
import type { ClauseAnalysis, RiskLevel } from '../types';

interface RiskyClausesListProps {
  riskyClauses: ClauseAnalysis[];
  onSelectClause: (clause: ClauseAnalysis) => void;
}

export const RiskyClausesList: React.FC<RiskyClausesListProps> = ({
  riskyClauses,
  onSelectClause,
}) => {
  const getBadgeClass = (level: RiskLevel) => {
    switch (level) {
      case 'VERY HIGH':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'HIGH':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'MODERATE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
  };

  if (riskyClauses.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg border border-slate-200 text-center space-y-2">
        <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <h3 className="text-sm font-semibold text-slate-800">No Flagged Risk Categories Identified</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          The model did not classify any clauses into this project's five flagged risk categories.
          This does not constitute a legal determination that the agreement is balanced, lawful, or risk-free.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden space-y-0">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Highest-Risk Flagged Clauses</h3>
          <p className="text-xs text-slate-500">
            Clauses identified in project risk categories, ordered by severity weight.
          </p>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
          {riskyClauses.length} Flagged
        </span>
      </div>

      <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
        {riskyClauses.map((c) => (
          <div
            key={c.clause_no}
            onClick={() => onSelectClause(c)}
            className="p-4 hover:bg-slate-50 cursor-pointer transition-colors flex items-start justify-between gap-4 group"
          >
            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-medium text-slate-400">
                  #{c.clause_no}
                </span>
                <span className="text-xs font-semibold text-slate-900">
                  {c.category}
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getBadgeClass(c.risk_level)}`}>
                  {c.risk_level} ({c.risk_score} pts)
                </span>
              </div>

              <p className="text-xs text-slate-600 font-serif line-clamp-2 leading-relaxed">
                "{c.clause}"
              </p>

              {c.important_terms && c.important_terms.length > 0 && (
                <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
                  <span className="font-mono text-slate-500 font-medium">Keywords:</span>
                  <span className="truncate">{c.important_terms.slice(0, 4).join(', ')}</span>
                </div>
              )}
            </div>

            <div className="flex items-center text-xs font-medium text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all self-center flex-shrink-0">
              <span className="hidden sm:inline mr-1">Inspect</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
