import React, { useState, useRef, useId } from 'react';
import { 
  Upload, 
  FileText, 
  X, 
  File, 
  AlertCircle, 
  Loader2
} from 'lucide-react';
import { analyzeText, analyzeFile, getSamplePolicy } from '../api/client';
import type { PolicyAnalysisResponse } from '../types';

interface AnalyzeViewProps {
  onAnalysisComplete: (result: PolicyAnalysisResponse) => void;
  onError: (msg: string) => void;
}

export const AnalyzeView: React.FC<AnalyzeViewProps> = ({
  onAnalysisComplete,
  onError,
}) => {
  const [mode, setMode] = useState<'upload' | 'paste'>('upload');
  
  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDocName, setFileDocName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileDocNameId = useId();

  // Paste state
  const [pastedText, setPastedText] = useState('');
  const [pasteDocName, setPasteDocName] = useState('');
  const pasteDocNameId = useId();
  const pasteTextId = useId();

  // Processing state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // File size formatting helper
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Word count & char count
  const wordCount = pastedText.trim() ? pastedText.trim().split(/\s+/).length : 0;
  const charCount = pastedText.length;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setLocalError(null);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalError(null);
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (ext !== '.pdf' && ext !== '.txt') {
      setLocalError('Invalid file format. Please upload a .pdf or .txt document.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setLocalError('File size exceeds 10 MB limit.');
      return;
    }
    if (file.size === 0) {
      setLocalError('The selected file is empty.');
      return;
    }

    setSelectedFile(file);
    if (!fileDocName) {
      // Set default name without extension
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      setFileDocName(nameWithoutExt);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLoadSampleText = async () => {
    try {
      setLocalError(null);
      const sample = await getSamplePolicy();
      setPastedText(sample.text);
      setPasteDocName(sample.document_name);
    } catch {
      setLocalError('Could not retrieve sample text from backend.');
    }
  };

  const handleAnalyze = async () => {
    setLocalError(null);
    setIsAnalyzing(true);

    try {
      let result: PolicyAnalysisResponse;
      if (mode === 'upload') {
        if (!selectedFile) {
          throw new Error('Please select a file to analyze.');
        }
        result = await analyzeFile(selectedFile, fileDocName.trim() || undefined);
      } else {
        if (!pastedText.trim() || pastedText.trim().length < 15) {
          throw new Error('Please enter policy text (at least one complete sentence or clause).');
        }
        result = await analyzeText(pastedText.trim(), pasteDocName.trim() || undefined);
      }

      onAnalysisComplete(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Analysis failed. Please check your document and try again.';
      setLocalError(message);
      onError(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const isSubmitDisabled = isAnalyzing || (mode === 'upload' ? !selectedFile : pastedText.trim().length < 15);

  return (
    <div className="max-w-3xl mx-auto py-4 sm:py-8 space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Analyze Document</h1>
        <p className="text-sm text-slate-500 mt-1">
          Upload an existing agreement or paste clauses directly for risk assessment.
        </p>
      </div>

      {/* Mode Switcher */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => { setMode('upload'); setLocalError(null); }}
          className={`pb-3 px-4 text-sm font-medium border-b-2 flex items-center space-x-2 transition-colors ${
            mode === 'upload'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Upload File (.pdf, .txt)</span>
        </button>

        <button
          onClick={() => { setMode('paste'); setLocalError(null); }}
          className={`pb-3 px-4 text-sm font-medium border-b-2 flex items-center space-x-2 transition-colors ${
            mode === 'paste'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Paste Text</span>
        </button>
      </div>

      {/* Local Error Alert */}
      {localError && (
        <div className="p-4 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">Analysis Error</p>
            <p className="text-rose-700 text-xs mt-0.5 leading-relaxed">{localError}</p>
          </div>
          <button 
            onClick={() => setLocalError(null)} 
            className="text-rose-500 hover:text-rose-800"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Mode A: Upload File */}
      {mode === 'upload' && (
        <div className="space-y-4">
          <div className="space-y-1">
            <label htmlFor={fileDocNameId} className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Document Name (Optional)
            </label>
            <input
              id={fileDocNameId}
              type="text"
              value={fileDocName}
              onChange={(e) => setFileDocName(e.target.value)}
              placeholder="e.g., Company Terms of Service 2026"
              className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
            />
          </div>

          {!selectedFile ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 sm:p-12 text-center cursor-pointer transition-colors ${
                isDragging 
                  ? 'border-slate-900 bg-slate-50' 
                  : 'border-slate-300 hover:border-slate-400 bg-white'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <div className="mx-auto w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 mb-3">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-slate-800">
                Click to browse or drag and drop document here
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Supports standard text-based PDF or TXT files up to 10 MB
              </p>
              <p className="text-[11px] text-slate-400 mt-3">
                Note: Image-only scanned PDFs are not supported.
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-lg border border-slate-200 bg-white flex items-center justify-between">
              <div className="flex items-center space-x-3 truncate">
                <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-slate-700 flex-shrink-0">
                  <File className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <p className="text-sm font-medium text-slate-900 truncate">{selectedFile.name}</p>
                  <p className="text-xs text-slate-500">
                    {formatBytes(selectedFile.size)} · {selectedFile.name.split('.').pop()?.toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                >
                  Replace
                </button>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded"
                  title="Remove file"
                  aria-label="Remove selected file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          )}
        </div>
      )}

      {/* Mode B: Paste Text */}
      {mode === 'paste' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label htmlFor={pasteDocNameId} className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Document Name (Optional)
            </label>
            <button
              type="button"
              onClick={handleLoadSampleText}
              className="text-xs text-slate-600 hover:text-slate-900 underline font-medium"
            >
              Insert sample policy
            </button>
          </div>

          <input
            id={pasteDocNameId}
            type="text"
            value={pasteDocName}
            onChange={(e) => setPasteDocName(e.target.value)}
            placeholder="e.g., Privacy Policy 2026"
            className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
          />

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor={pasteTextId} className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Policy Text
              </label>
              <div className="text-[11px] text-slate-400 space-x-2">
                <span>{wordCount} words</span>
                <span>·</span>
                <span>{charCount} characters</span>
              </div>
            </div>

            <textarea
              id={pasteTextId}
              rows={12}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste terms and conditions, terms of service, privacy policies, or legal agreements here..."
              className="w-full p-3 text-sm font-mono leading-relaxed rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 resize-y"
            />
          </div>

          {pastedText && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setPastedText('')}
                className="text-xs text-slate-400 hover:text-slate-700"
              >
                Clear text
              </button>
            </div>
          )}
        </div>
      )}

      {/* Analyze Policy CTA Button */}
      <div className="pt-2">
        <button
          onClick={handleAnalyze}
          disabled={isSubmitDisabled}
          className="w-full sm:w-auto px-6 py-3 bg-slate-900 text-white rounded-md text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center justify-center space-x-2"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyzing policy clauses...</span>
            </>
          ) : (
            <span>Analyze policy</span>
          )}
        </button>

        {isAnalyzing && (
          <p className="text-xs text-slate-500 mt-2">
            Segmenting clauses, generating TF-IDF representations, and evaluating calibrated risk scores...
          </p>
        )}
      </div>
    </div>
  );
};
