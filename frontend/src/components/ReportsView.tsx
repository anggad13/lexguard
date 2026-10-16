import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  FileText, 
  Download, 
  ArrowRight,
  FileCheck
} from 'lucide-react';
import type { PolicyAnalysisResponse } from '../types';
import { downloadCsvReport, downloadPdfReport } from '../api/client';

interface ReportsViewProps {
  analysis: PolicyAnalysisResponse | null;
  onNavigateAnalyze: () => void;
  onError: (msg: string) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  analysis,
  onNavigateAnalyze,
  onError,
}) => {
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleCsvDownload = async () => {
    if (!analysis) return;
    try {
      setDownloadingCsv(true);
      await downloadCsvReport(analysis);
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'CSV generation failed');
    } finally {
      setDownloadingCsv(false);
    }
  };

  const handlePdfDownload = async () => {
    if (!analysis) return;
    try {
      setDownloadingPdf(true);
      await downloadPdfReport(analysis);
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'PDF generation failed');
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Reports & Exports</h1>
        <p className="text-sm text-slate-500 mt-1">
          Generate structured CSV spreadsheets or formatted PDF audit documentation from your analysis.
        </p>
      </div>

      {analysis ? (
        <div className="space-y-6">
          {/* Active document status card */}
          <div className="p-5 rounded-lg border border-slate-200 bg-white space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-xs uppercase font-semibold text-slate-400">Current Analysis Ready</span>
              </div>
              <span className="text-xs font-mono text-slate-400">{analysis.analysis_timestamp}</span>
            </div>
            <h2 className="text-base font-bold text-slate-900">{analysis.document_name}</h2>
            <div className="flex items-center space-x-4 text-xs text-slate-600 pt-1">
              <span>Overall Score: <b>{analysis.overall_score}/100</b></span>
              <span>·</span>
              <span>Risk Level: <b>{analysis.risk_level}</b></span>
              <span>·</span>
              <span>Clauses: <b>{analysis.total_clauses}</b></span>
              <span>·</span>
              <span>Flagged: <b>{analysis.risky_clauses}</b></span>
            </div>
          </div>

          {/* Download cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CSV Card */}
            <div className="p-6 rounded-lg border border-slate-200 bg-white space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-slate-700">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">CSV Spreadsheet Export</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Raw tabular dataset containing all segmented clauses, predicted risk categories, model confidence percentages, TF-IDF salient keywords, and plain-English summaries. UTF-8 encoded with Excel BOM support.
                </p>
              </div>

              <button
                onClick={handleCsvDownload}
                disabled={downloadingCsv}
                className="w-full py-2.5 px-4 bg-slate-900 text-white rounded-md text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center justify-center space-x-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{downloadingCsv ? 'Generating CSV...' : 'Download CSV (.csv)'}</span>
              </button>
            </div>

            {/* PDF Card */}
            <div className="p-6 rounded-lg border border-slate-200 bg-white space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-slate-700">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">PDF Policy Audit Document</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Publication-ready formal report generated via ReportLab. Includes executive risk score summary, category distribution breakdown, full clause-by-clause assessment with key terms, and academic research disclosures.
                </p>
              </div>

              <button
                onClick={handlePdfDownload}
                disabled={downloadingPdf}
                className="w-full py-2.5 px-4 bg-slate-900 text-white rounded-md text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center justify-center space-x-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{downloadingPdf ? 'Building PDF...' : 'Download PDF Report (.pdf)'}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-10 rounded-lg border border-slate-200 bg-white text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
            <FileText className="w-5 h-5" />
          </div>
          <h2 className="text-base font-semibold text-slate-800">No Document Analyzed Yet</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Run an analysis on a terms of service document or privacy agreement to generate downloadable CSV and PDF reports.
          </p>
          <div className="pt-2">
            <button
              onClick={onNavigateAnalyze}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white text-xs font-medium rounded-md hover:bg-slate-800 transition-colors"
            >
              <span>Analyze a document</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Report Specifications Reference */}
      <div className="border-t border-slate-200 pt-6 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Report Contents Reference</h3>
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 text-xs text-slate-600 space-y-2">
          <p><b>Included Fields:</b> Clause #, Original Clause Text, Predicted Category, Model Confidence %, Static Risk Weight, Risk Level, Salient N-gram Keywords, and Plain-English Explanation.</p>
          <p><b>Integrity Note:</b> Reports are generated directly from backend model analysis pipelines and cannot be manipulated on the client side.</p>
        </div>
      </div>
    </div>
  );
};
