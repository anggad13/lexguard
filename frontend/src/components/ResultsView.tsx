import React, { useState } from 'react';
import { 
  Download, 
  FileSpreadsheet, 
  ArrowLeft, 
  RotateCcw
} from 'lucide-react';
import type { PolicyAnalysisResponse, ClauseAnalysis, RiskLevel } from '../types';
import { CategoryDistribution } from './CategoryDistribution';
import { RiskyClausesList } from './RiskyClausesList';
import { ClauseTable } from './ClauseTable';
import { ClauseDrawer } from './ClauseDrawer';
import { downloadCsvReport, downloadPdfReport } from '../api/client';

interface ResultsViewProps {
  analysis: PolicyAnalysisResponse;
  onAnalyzeAnother: () => void;
  onReturnOverview: () => void;
  onError: (msg: string) => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  analysis,
  onAnalyzeAnother,
  onReturnOverview,
  onError,
}) => {
  const [selectedClause, setSelectedClause] = useState<ClauseAnalysis | null>(null);
  const [isDownloadingCsv, setIsDownloadingCsv] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case 'VERY HIGH':
        return 'text-rose-700 bg-rose-50 border-rose-200';
      case 'HIGH':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'MEDIUM':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'MODERATE':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'LOW':
      default:
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    }
  };

  const handleExportCsv = async () => {
    try {
      setIsDownloadingCsv(true);
      await downloadCsvReport(analysis);
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Failed to download CSV');
    } finally {
      setIsDownloadingCsv(false);
    }
  };

  const handleExportPdf = async () => {
    try {
      setIsDownloadingPdf(true);
      await downloadPdfReport(analysis);
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Failed to download PDF');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-4 sm:py-8 space-y-8">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <button
            onClick={onReturnOverview}
            className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to overview</span>
          </button>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 truncate max-w-xl">
            {analysis.document_name}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Analyzed on {analysis.analysis_timestamp} · Model: Calibrated Linear SVM
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCsv}
            disabled={isDownloadingCsv}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
            <span>{isDownloadingCsv ? 'Exporting...' : 'Export CSV'}</span>
          </button>

          <button
            onClick={handleExportPdf}
            disabled={isDownloadingPdf}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>{isDownloadingPdf ? 'Generating...' : 'Export PDF'}</span>
          </button>

          <button
            onClick={onAnalyzeAnother}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-md text-xs font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Analyze another</span>
          </button>
        </div>
      </div>

      {/* A. Overall Policy Assessment Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              Policy Assessment
            </span>
            <div className="flex items-baseline space-x-3">
              <span className="text-4xl font-extrabold text-slate-900 font-mono">
                {analysis.overall_score}
              </span>
              <span className="text-base text-slate-400 font-medium">/ 100</span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded border uppercase tracking-wider ${getRiskColor(analysis.risk_level)}`}>
                {analysis.risk_level} Risk
              </span>
            </div>
          </div>

          {/* Metric Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center sm:text-left border-t sm:border-t-0 sm:border-l border-slate-100 pt-4 sm:pt-0 sm:pl-6">
            <div>
              <span className="text-[11px] text-slate-400 uppercase font-semibold block">Total Clauses</span>
              <span className="text-lg font-bold text-slate-800 font-mono">{analysis.total_clauses}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 uppercase font-semibold block">Flagged Risky</span>
              <span className="text-lg font-bold text-slate-800 font-mono">{analysis.risky_clauses}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 uppercase font-semibold block">Risk Density</span>
              <span className="text-lg font-bold text-slate-800 font-mono">{analysis.risk_density_pct}%</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 uppercase font-semibold block">Avg Severity</span>
              <span className="text-lg font-bold text-slate-800 font-mono">{analysis.severity_mean}</span>
            </div>
          </div>
        </div>

        {/* Restrained Horizontal Score Indicator Bar */}
        <div className="space-y-1.5 pt-2">
          <div className="flex justify-between text-[11px] text-slate-400 font-mono">
            <span>0 (Low)</span>
            <span>20</span>
            <span>40</span>
            <span>60</span>
            <span>80</span>
            <span>100 (Very High)</span>
          </div>

          <div className="relative h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
            {/* Background range markers */}
            <div className="absolute inset-0 flex">
              <div className="w-[20%] bg-emerald-100/40 border-r border-white" />
              <div className="w-[20%] bg-yellow-100/40 border-r border-white" />
              <div className="w-[20%] bg-amber-100/40 border-r border-white" />
              <div className="w-[20%] bg-red-100/40 border-r border-white" />
              <div className="w-[20%] bg-rose-100/40" />
            </div>

            {/* Indicator Marker */}
            <div
              className="absolute top-0 bottom-0 left-0 bg-slate-800 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(Math.max(analysis.overall_score, 2), 100)}%` }}
            />
          </div>
        </div>

        {/* Concise Disclaimer */}
        <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2.5 rounded border border-slate-100">
          Risk scores reflect this project's experimental classification and scoring rules. They are not a legal determination.
        </p>
      </div>

      {/* Grid: Risky Clauses Summary & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RiskyClausesList
          riskyClauses={analysis.risky_clauses_summary}
          onSelectClause={setSelectedClause}
        />
        <CategoryDistribution
          distribution={analysis.category_distribution}
          totalClauses={analysis.total_clauses}
        />
      </div>

      {/* Full Clause Analysis Table */}
      <ClauseTable
        clauses={analysis.clauses}
        onSelectClause={setSelectedClause}
      />

      {/* Side Drawer for Full Clause Inspection */}
      <ClauseDrawer
        clause={selectedClause}
        onClose={() => setSelectedClause(null)}
      />
    </div>
  );
};
