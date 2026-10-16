import React, { useEffect, useState } from 'react';
import { BarChart3, AlertCircle, Layers } from 'lucide-react';
import type { ModelMetricsResponse } from '../types';
import { getModelMetrics } from '../api/client';

export const AboutView: React.FC = () => {
  const [metrics, setMetrics] = useState<ModelMetricsResponse | null>(null);

  useEffect(() => {
    getModelMetrics()
      .then((data) => setMetrics(data))
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-8 space-y-10">
      {/* Title & Introduction */}
      <div className="space-y-3">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          About LexGuard
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl">
          LexGuard is an academic research project exploring NLP-based classification and rule-based risk scoring for legal terms of service, end-user license agreements, and privacy policies.
        </p>
      </div>

      {/* NLP & ML Architecture */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
          <Layers className="w-4 h-4 text-slate-700" />
          <span>Pipeline & NLP Workflow</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-lg border border-slate-200 bg-white space-y-2">
            <h3 className="font-semibold text-slate-800">1. Negation Preservation</h3>
            <p className="text-slate-500 leading-relaxed">
              Legal text normalization cleans punctuation and spacing while explicitly preserving crucial negations like <i>not</i>, <i>without</i>, <i>except</i>, <i>unless</i>, and <i>no</i> that alter contractual meaning.
            </p>
          </div>

          <div className="p-4 rounded-lg border border-slate-200 bg-white space-y-2">
            <h3 className="font-semibold text-slate-800">2. TF-IDF N-grams</h3>
            <p className="text-slate-500 leading-relaxed">
              Extracts unigrams, bigrams, and trigrams (1–3 n-grams) with sublinear TF scaling, max 5,000 features, and document frequency filtering (min_df=1, max_df=0.95).
            </p>
          </div>

          <div className="p-4 rounded-lg border border-slate-200 bg-white space-y-2">
            <h3 className="font-semibold text-slate-800">3. Explainable Classifier</h3>
            <p className="text-slate-500 leading-relaxed">
              Supervised classification coupled with probability calibration (Platt scaling) and feature coefficient inspection to surface salient n-grams responsible for each prediction.
            </p>
          </div>
        </div>
      </div>

      {/* Categories & Risk Weights */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900">
          Project-Defined Clause Categories & Weights
        </h2>
        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
              <tr>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4 text-center">Risk Weight</th>
                <th className="py-2.5 px-4">Project Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-2.5 px-4 font-semibold text-slate-900">Mandatory Arbitration</td>
                <td className="py-2.5 px-4 text-center font-mono font-bold text-rose-700">85</td>
                <td className="py-2.5 px-4 text-slate-600">Dispute resolution clauses waiving court proceedings, jury trials, or class actions.</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-semibold text-slate-900">Unilateral Modification</td>
                <td className="py-2.5 px-4 text-center font-mono font-bold text-red-600">75</td>
                <td className="py-2.5 px-4 text-slate-600">Terms allowing the provider to modify conditions, rules, or fees without prior user consent.</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-semibold text-slate-900">Liability Limitation</td>
                <td className="py-2.5 px-4 text-center font-mono font-bold text-red-600">70</td>
                <td className="py-2.5 px-4 text-slate-600">Clauses disclaiming responsibility for damages, data loss, downtime, or consequential harms.</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-semibold text-slate-900">Unilateral Termination</td>
                <td className="py-2.5 px-4 text-center font-mono font-bold text-amber-600">60</td>
                <td className="py-2.5 px-4 text-slate-600">Provisions allowing account termination, suspension, or feature removal at sole discretion.</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-semibold text-slate-900">Content/Data Ownership</td>
                <td className="py-2.5 px-4 text-center font-mono font-bold text-amber-600">50</td>
                <td className="py-2.5 px-4 text-slate-600">Broad licenses granted to the platform to reproduce, distribute, or monetize user content.</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-semibold text-slate-900">Fair / Normal</td>
                <td className="py-2.5 px-4 text-center font-mono font-bold text-emerald-600">0</td>
                <td className="py-2.5 px-4 text-slate-600">Standard operational provisions such as customer support contacts or account settings.</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-semibold text-slate-900">Other / Unclassified</td>
                <td className="py-2.5 px-4 text-center font-mono font-bold text-slate-500">0</td>
                <td className="py-2.5 px-4 text-slate-600">Informational, technical, or neutral clauses not matching defined risk categories.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Real Model Performance & Benchmark Distinctions */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-slate-700" />
            <span>Empirical Model Benchmarks</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Preserving the distinction between the held-out test split winner (Linear SVM: 80.95%) and 5-fold cross-validation performance.
          </p>
        </div>

        {metrics && (
          <div className="space-y-4">
            {/* Split Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Held-out test table */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Held-out Test Split (20%, N=21)
                  </h3>
                  <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                    Linear SVM Winner
                  </span>
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-400 font-semibold border-b border-slate-100">
                    <tr>
                      <th className="py-1">Model</th>
                      <th className="py-1 text-right">Accuracy</th>
                      <th className="py-1 text-right">F1 Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {metrics.models_comparison.map((m) => (
                      <tr key={m.model} className={m.model === 'Linear SVM' ? 'font-bold text-slate-900 bg-slate-50/50' : 'text-slate-600'}>
                        <td className="py-1.5 font-sans">{m.model}</td>
                        <td className="py-1.5 text-right">{(m.accuracy * 100).toFixed(2)}%</td>
                        <td className="py-1.5 text-right">{(m.f1_score * 100).toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 5-Fold Cross Validation table */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    5-Fold Stratified CV (N=105)
                  </h3>
                  <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                    Logistic Reg Winner
                  </span>
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-400 font-semibold border-b border-slate-100">
                    <tr>
                      <th className="py-1">Model</th>
                      <th className="py-1 text-right">Mean F1</th>
                      <th className="py-1 text-right">Std F1</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {metrics.cv_comparison.map((m) => (
                      <tr key={m.model} className={m.model === 'Logistic Regression' ? 'font-bold text-slate-900 bg-slate-50/50' : 'text-slate-600'}>
                        <td className="py-1.5 font-sans">{m.model}</td>
                        <td className="py-1.5 text-right">{(m.mean_f1 * 100).toFixed(2)}%</td>
                        <td className="py-1.5 text-right">±{(m.std_f1 * 100).toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs text-slate-600 leading-relaxed">
              <b>Research Note:</b> {metrics.selected_model_note}
            </div>
          </div>
        )}
      </div>

      {/* Limitations & Academic Notice */}
      <div className="p-5 rounded-lg border border-slate-200 bg-white space-y-3">
        <div className="flex items-center space-x-2 text-slate-900 font-semibold text-sm">
          <AlertCircle className="w-4 h-4 text-slate-500" />
          <span>Research Scope & Limitations</span>
        </div>
        <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
          <p>
            • <b>Small Dataset:</b> LexGuard was developed using a curated starter dataset of 105 legal clauses (15 examples per category). It has not been trained on expansive corpus-scale legal datasets.
          </p>
          <p>
            • <b>Distribution Limits:</b> Complex or unfamiliar wording, non-standard phrasing, or jurisdictions with unique statutory provisions may result in classification errors or misassigned weights.
          </p>
          <p>
            • <b>Not Legal Advice:</b> This application does not evaluate judicial enforceability, statutory compliance, or case law precedent. It provides an automated structural review prototype only.
          </p>
        </div>
      </div>
    </div>
  );
};
