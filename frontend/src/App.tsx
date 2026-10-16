import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { OverviewView } from './components/OverviewView';
import { AnalyzeView } from './components/AnalyzeView';
import { ResultsView } from './components/ResultsView';
import { ReportsView } from './components/ReportsView';
import { AboutView } from './components/AboutView';
import type { ActiveTab, PolicyAnalysisResponse } from './types';
import { checkHealth, getSamplePolicy, analyzeText } from './api/client';
import { AlertCircle, X } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null);
  const [analysisResult, setAnalysisResult] = useState<PolicyAnalysisResponse | null>(null);
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Check backend health on mount
  useEffect(() => {
    const pingBackend = async () => {
      try {
        const res = await checkHealth();
        setBackendHealthy(res.status === 'healthy' && res.model_loaded);
      } catch {
        setBackendHealthy(false);
      }
    };
    pingBackend();
    const interval = setInterval(pingBackend, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAnalysisComplete = (result: PolicyAnalysisResponse) => {
    setAnalysisResult(result);
    setActiveTab('results');
    setGlobalError(null);
  };

  const handleRunSample = async () => {
    try {
      setIsLoadingSample(true);
      setGlobalError(null);
      const sample = await getSamplePolicy();
      const result = await analyzeText(sample.text, sample.document_name);
      setAnalysisResult(result);
      setActiveTab('results');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to analyze sample policy';
      setGlobalError(msg);
    } finally {
      setIsLoadingSample(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfbfb] flex">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setGlobalError(null);
        }}
        hasResults={analysisResult !== null}
        mobileOpen={mobileOpen}
        onToggleMobile={() => setMobileOpen(!mobileOpen)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <Header
          onToggleMobile={() => setMobileOpen(!mobileOpen)}
          backendHealthy={backendHealthy}
          documentName={activeTab === 'results' && analysisResult ? analysisResult.document_name : undefined}
        />

        {/* Global Error Banner */}
        {globalError && (
          <div className="bg-rose-50 border-b border-rose-200 px-4 py-3 text-xs text-rose-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{globalError}</span>
            </div>
            <button
              onClick={() => setGlobalError(null)}
              className="text-rose-500 hover:text-rose-800"
              aria-label="Dismiss error"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          {activeTab === 'overview' && (
            <OverviewView
              onNavigate={setActiveTab}
              onRunSample={handleRunSample}
              isLoadingSample={isLoadingSample}
            />
          )}

          {activeTab === 'analyze' && (
            <AnalyzeView
              onAnalysisComplete={handleAnalysisComplete}
              onError={setGlobalError}
            />
          )}

          {activeTab === 'results' && analysisResult && (
            <ResultsView
              analysis={analysisResult}
              onAnalyzeAnother={() => setActiveTab('analyze')}
              onReturnOverview={() => setActiveTab('overview')}
              onError={setGlobalError}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              analysis={analysisResult}
              onNavigateAnalyze={() => setActiveTab('analyze')}
              onError={setGlobalError}
            />
          )}

          {activeTab === 'about' && <AboutView />}
        </main>
      </div>
    </div>
  );
};

export default App;
