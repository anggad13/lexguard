import type { PolicyAnalysisResponse, ModelMetricsResponse, SamplePolicyResponse } from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = `Request failed with status ${res.status}`;
    try {
      const errorJson = await res.json();
      if (errorJson.detail) {
        errorDetail = errorJson.detail;
      }
    } catch {
      // Non-json response
    }
    throw new ApiError(errorDetail, res.status);
  }
  return res.json() as Promise<T>;
}

export async function checkHealth(): Promise<{ status: string; model_loaded: boolean }> {
  const res = await fetch(`${API_BASE_URL}/api/health`);
  return handleResponse(res);
}

export async function getSamplePolicy(): Promise<SamplePolicyResponse> {
  const res = await fetch(`${API_BASE_URL}/api/sample`);
  return handleResponse(res);
}

export async function analyzeText(text: string, documentName?: string): Promise<PolicyAnalysisResponse> {
  const res = await fetch(`${API_BASE_URL}/api/analyze/text`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      document_name: documentName || 'Pasted Policy',
    }),
  });
  return handleResponse<PolicyAnalysisResponse>(res);
}

export async function analyzeFile(file: File, documentName?: string): Promise<PolicyAnalysisResponse> {
  const formData = new FormData();
  formData.append('file', file);
  if (documentName) {
    formData.append('document_name', documentName);
  }

  const res = await fetch(`${API_BASE_URL}/api/analyze/file`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse<PolicyAnalysisResponse>(res);
}

export async function getModelMetrics(): Promise<ModelMetricsResponse> {
  const res = await fetch(`${API_BASE_URL}/api/metrics`);
  return handleResponse<ModelMetricsResponse>(res);
}

export async function downloadCsvReport(analysisData: PolicyAnalysisResponse): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/reports/csv`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(analysisData),
  });

  if (!res.ok) {
    throw new Error('Failed to generate CSV report');
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const cleanName = analysisData.document_name.replace(/[^a-zA-Z0-9_-]/g, '_');
  a.download = `lexguard_${cleanName}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

export async function downloadPdfReport(analysisData: PolicyAnalysisResponse): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/reports/pdf`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(analysisData),
  });

  if (!res.ok) {
    throw new Error('Failed to generate PDF report');
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const cleanName = analysisData.document_name.replace(/[^a-zA-Z0-9_-]/g, '_');
  a.download = `lexguard_${cleanName}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
