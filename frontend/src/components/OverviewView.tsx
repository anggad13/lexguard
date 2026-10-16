import React from 'react';
import { 
  ArrowRight, 
  Upload, 
  FileText, 
  Play
} from 'lucide-react';
import type { ActiveTab } from '../types';

interface OverviewViewProps {
  onNavigate: (tab: ActiveTab) => void;
  onRunSample: () => void;
  isLoadingSample: boolean;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  onNavigate,
  onRunSample,
  isLoadingSample,
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-10 py-4 sm:py-8">
      {/* Hero / Header Section */}
      <div className="space-y-4">
        <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
          <span>Research Prototype · Calibrated Linear SVM & TF-IDF</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
          Your policy, made easier to understand.
        </h1>
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
          Review terms and conditions, identify potentially concerning clauses, and understand what the wording may mean.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={() => onNavigate('analyze')}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-slate-900 text-white rounded-md text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm"
          >
            <span>Analyze a document</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onRunSample}
            disabled={isLoadingSample}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-50 hover:text-slate-900 transition-colors disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-slate-500 text-slate-500" />
            <span>{isLoadingSample ? 'Analyzing sample policy...' : 'Try a sample policy'}</span>
          </button>
        </div>
      </div>

      {/* Intake Options Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div 
          onClick={() => onNavigate('analyze')}
          className="group p-6 rounded-lg border border-slate-200 bg-white hover:border-slate-400 hover:shadow-sm transition-all cursor-pointer space-y-3"
        >
          <div className="w-9 h-9 rounded bg-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors">
            <Upload className="w-4 h-4" />
          </div>
          <h2 className="text-base font-semibold text-slate-900">Upload PDF or TXT</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Drag and drop your terms of service or privacy policy file. LexGuard extracts the text and segments it into distinct clauses.
          </p>
          <div className="pt-2 text-xs font-medium text-slate-900 flex items-center space-x-1">
            <span>Select file</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        <div 
          onClick={() => onNavigate('analyze')}
          className="group p-6 rounded-lg border border-slate-200 bg-white hover:border-slate-400 hover:shadow-sm transition-all cursor-pointer space-y-3"
        >
          <div className="w-9 h-9 rounded bg-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors">
            <FileText className="w-4 h-4" />
          </div>
          <h2 className="text-base font-semibold text-slate-900">Paste policy text</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Copy and paste any legal clauses or agreement sections directly into the editor for instant sentence segmentation and assessment.
          </p>
          <div className="pt-2 text-xs font-medium text-slate-900 flex items-center space-x-1">
            <span>Open editor</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>

      {/* How it Works Section */}
      <div className="border-t border-slate-200 pt-8 space-y-6">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Workflow</h2>
          <h3 className="text-lg font-semibold text-slate-900 mt-1">How LexGuard works</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-semibold text-slate-700">
              1
            </div>
            <h4 className="text-sm font-semibold text-slate-800">Add a document</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Upload a standard text PDF or TXT file, or paste raw contract text. Text normalization preserves critical negations like <i>not</i> and <i>without</i>.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-semibold text-slate-700">
              2
            </div>
            <h4 className="text-sm font-semibold text-slate-800">Review flagged clauses</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Trained NLP models classify clauses into seven distinct categories, assign project-defined risk weights, and highlight salient key phrases.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-semibold text-slate-700">
              3
            </div>
            <h4 className="text-sm font-semibold text-slate-800">Download your report</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Export comprehensive clause-by-clause analysis to CSV or download a clean, publication-ready PDF audit summary for your records.
            </p>
          </div>
        </div>
      </div>

      {/* Model summary footer */}
      <div className="bg-slate-50 rounded-lg p-5 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-semibold text-slate-800">Trained on 7 Clause Risk Categories</h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Mandatory Arbitration (85) · Unilateral Modification (75) · Liability Limitation (70) · Unilateral Termination (60) · Content Ownership (50) · Fair / Normal (0)
          </p>
        </div>
        <button
          onClick={() => onNavigate('about')}
          className="text-xs font-medium text-slate-700 hover:text-slate-900 underline whitespace-nowrap"
        >
          View Model Metrics →
        </button>
      </div>
    </div>
  );
};
