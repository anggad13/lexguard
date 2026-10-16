export type RiskLevel = 'LOW' | 'MODERATE' | 'MEDIUM' | 'HIGH' | 'VERY HIGH';

export interface ClauseAnalysis {
  clause_no: number;
  clause: string;
  category: string;
  confidence_pct: number | null;
  risk_score: number;
  risk_level: RiskLevel;
  important_terms: string[];
  plain_english: string;
}

export interface CategoryDistribution {
  category: string;
  count: number;
  percentage: number;
  risk_weight: number;
}

export interface PolicyAnalysisResponse {
  document_name: string;
  analysis_timestamp: string;
  overall_score: number;
  risk_level: RiskLevel;
  total_clauses: number;
  risky_clauses: number;
  fair_or_unclassified_clauses: number;
  severity_mean: number;
  risk_density_pct: number;
  category_distribution: CategoryDistribution[];
  clauses: ClauseAnalysis[];
  risky_clauses_summary: ClauseAnalysis[];
  highest_risk_clause: ClauseAnalysis | null;
}

export interface ModelComparisonRow {
  model: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
}

export interface CVComparisonRow {
  model: string;
  mean_f1: number;
  std_f1: number;
}

export interface ModelMetricsResponse {
  selected_model_name: string;
  selected_model_note: string;
  held_out_metrics: ModelComparisonRow;
  cv_metrics: CVComparisonRow;
  models_comparison: ModelComparisonRow[];
  cv_comparison: CVComparisonRow[];
  categories: string[];
  risk_weights: Record<string, number>;
  dataset_size: number;
  training_samples: number;
  testing_samples: number;
  disclaimer: string;
}

export interface SamplePolicyResponse {
  document_name: string;
  text: string;
}

export type ActiveTab = 'overview' | 'analyze' | 'results' | 'reports' | 'about';
