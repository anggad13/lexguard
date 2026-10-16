import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ArrowUpDown, 
  Eye,
  X
} from 'lucide-react';
import type { ClauseAnalysis, RiskLevel } from '../types';

interface ClauseTableProps {
  clauses: ClauseAnalysis[];
  onSelectClause: (clause: ClauseAnalysis) => void;
}

type SortField = 'risk_score' | 'clause_no' | 'confidence_pct';
type SortOrder = 'asc' | 'desc';

export const ClauseTable: React.FC<ClauseTableProps> = ({
  clauses,
  onSelectClause,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>('all');
  const [flaggedOnly, setFlaggedOnly] = useState<boolean>(false);
  const [sortField, setSortField] = useState<SortField>('risk_score');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Categories present in clauses
  const availableCategories = useMemo(() => {
    const set = new Set(clauses.map((c) => c.category));
    return Array.from(set).sort();
  }, [clauses]);

  // Filtered & Sorted Clauses
  const filteredClauses = useMemo(() => {
    return clauses
      .filter((c) => {
        // Search filter
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const matchesClause = c.clause.toLowerCase().includes(term);
          const matchesCat = c.category.toLowerCase().includes(term);
          const matchesTerms = c.important_terms.some((t) => t.toLowerCase().includes(term));
          if (!matchesClause && !matchesCat && !matchesTerms) return false;
        }

        // Category filter
        if (selectedCategory !== 'all' && c.category !== selectedCategory) {
          return false;
        }

        // Risk Level filter
        if (selectedRiskLevel !== 'all' && c.risk_level !== selectedRiskLevel) {
          return false;
        }

        // Flagged only filter
        if (flaggedOnly && c.risk_score === 0) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];

        if (valA === null || valA === undefined) valA = -1;
        if (valB === null || valB === undefined) valB = -1;

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return a.clause_no - b.clause_no;
      });
  }, [clauses, searchTerm, selectedCategory, selectedRiskLevel, flaggedOnly, sortField, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedRiskLevel('all');
    setFlaggedOnly(false);
  };

  const hasActiveFilters = searchTerm !== '' || selectedCategory !== 'all' || selectedRiskLevel !== 'all' || flaggedOnly;

  const getRiskBadgeStyles = (level: RiskLevel) => {
    switch (level) {
      case 'VERY HIGH':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'HIGH':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'MEDIUM':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'MODERATE':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'LOW':
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden space-y-4 p-5">
      {/* Table Header and Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">All Analyzed Clauses</h3>
          <p className="text-xs text-slate-500">
            Showing {filteredClauses.length} of {clauses.length} segmented policy clauses.
          </p>
        </div>

        {/* Flagged-only toggle */}
        <div className="flex items-center space-x-2">
          <label className="inline-flex items-center space-x-2 cursor-pointer text-xs font-medium text-slate-700">
            <input
              type="checkbox"
              checked={flaggedOnly}
              onChange={(e) => setFlaggedOnly(e.target.checked)}
              className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 h-4 w-4"
            />
            <span>Show flagged clauses only</span>
          </label>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
        {/* Search */}
        <div className="sm:col-span-5 relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search clause text, keywords, or category..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="sm:col-span-4">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="all">All Categories</option>
            {availableCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Risk Level Filter */}
        <div className="sm:col-span-3">
          <select
            value={selectedRiskLevel}
            onChange={(e) => setSelectedRiskLevel(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="all">All Risk Levels</option>
            <option value="VERY HIGH">VERY HIGH</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="MODERATE">MODERATE</option>
            <option value="LOW">LOW</option>
          </select>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>Active filters applied</span>
          <button
            onClick={resetFilters}
            className="text-slate-700 hover:text-slate-900 underline font-medium"
          >
            Reset filters
          </button>
        </div>
      )}

      {/* Table Content */}
      <div className="border border-slate-200 rounded-md overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <th 
                onClick={() => toggleSort('clause_no')} 
                className="py-2.5 px-3 w-12 cursor-pointer hover:bg-slate-100 select-none whitespace-nowrap"
              >
                <div className="flex items-center space-x-1">
                  <span>#</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-2.5 px-3 min-w-[240px]">
                Clause Text Preview
              </th>
              <th className="py-2.5 px-3 min-w-[140px]">
                Predicted Category
              </th>
              <th 
                onClick={() => toggleSort('risk_score')} 
                className="py-2.5 px-3 cursor-pointer hover:bg-slate-100 select-none whitespace-nowrap text-right"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Risk Score</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-center whitespace-nowrap">
                Risk Level
              </th>
              <th 
                onClick={() => toggleSort('confidence_pct')} 
                className="py-2.5 px-3 cursor-pointer hover:bg-slate-100 select-none whitespace-nowrap text-right"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Confidence</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-2.5 px-3 w-16 text-center">
                Inspect
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredClauses.length > 0 ? (
              filteredClauses.map((c) => (
                <tr
                  key={c.clause_no}
                  onClick={() => onSelectClause(c)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                >
                  <td className="py-3 px-3 font-mono font-medium text-slate-500">
                    {c.clause_no}
                  </td>
                  <td className="py-3 px-3 text-slate-800 font-serif leading-relaxed">
                    <p className="line-clamp-2">{c.clause}</p>
                    {c.important_terms && c.important_terms.length > 0 && (
                      <p className="text-[10px] text-slate-400 font-sans mt-0.5 font-mono truncate">
                        Key: {c.important_terms.slice(0, 3).join(', ')}
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-900 whitespace-nowrap">
                    {c.category}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-800 whitespace-nowrap">
                    {c.risk_score}
                  </td>
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getRiskBadgeStyles(c.risk_level)}`}>
                      {c.risk_level}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-500 whitespace-nowrap">
                    {c.confidence_pct !== null ? `${c.confidence_pct}%` : 'N/A'}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectClause(c);
                      }}
                      className="p-1 rounded text-slate-400 group-hover:text-slate-900 hover:bg-slate-200 transition-colors"
                      title="Inspect Clause"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                  No clauses match the selected filters or search query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
