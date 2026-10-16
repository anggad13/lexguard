from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class AnalyzeTextRequest(BaseModel):
    text: str = Field(..., min_length=10, description="The legal text / policy to analyze")
    document_name: Optional[str] = Field("Pasted Policy", description="Optional user-provided title")

class ClauseAnalysis(BaseModel):
    clause_no: int
    clause: str
    category: str
    confidence_pct: Optional[float] = None
    risk_score: int
    risk_level: str
    important_terms: List[str] = []
    plain_english: str

class CategoryCount(BaseModel):
    category: str
    count: int
    percentage: float
    risk_weight: int

class PolicyAnalysisResponse(BaseModel):
    document_name: str
    analysis_timestamp: str
    overall_score: float
    risk_level: str
    total_clauses: int
    risky_clauses: int
    fair_or_unclassified_clauses: int
    severity_mean: float
    risk_density_pct: float
    category_distribution: List[CategoryCount]
    clauses: List[ClauseAnalysis]
    risky_clauses_summary: List[ClauseAnalysis]
    highest_risk_clause: Optional[ClauseAnalysis] = None

class ModelComparisonRow(BaseModel):
    model: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float

class CVComparisonRow(BaseModel):
    model: str
    mean_f1: float
    std_f1: float

class ModelMetricsResponse(BaseModel):
    selected_model_name: str
    selected_model_note: str
    held_out_metrics: ModelComparisonRow
    cv_metrics: CVComparisonRow
    models_comparison: List[ModelComparisonRow]
    cv_comparison: List[CVComparisonRow]
    categories: List[str]
    risk_weights: Dict[str, int]
    dataset_size: int
    training_samples: int
    testing_samples: int
    disclaimer: str

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    version: str = "1.0.0"
