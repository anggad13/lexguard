"""
LexGuard Analysis Engine
Replicates the exact NLP preprocessing, TF-IDF feature extraction,
calibrated Linear SVM classification, explainability, project-defined
risk scoring, and report generation from the research notebook.
"""

import os
import re
import io
import joblib
import numpy as np
import pandas as pd
from typing import List, Dict, Tuple, Optional, Any
from datetime import datetime

from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.svm import LinearSVC
from sklearn.naive_bayes import MultinomialNB
from sklearn.ensemble import RandomForestClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.metrics import accuracy_score, precision_recall_fscore_support

from pypdf import PdfReader
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, HRFlowable
)
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

from dataset import CLAUSE_DATA

# -------------------------------------------------------------------------
# CONSTANTS & PROJECT DEFINITIONS
# -------------------------------------------------------------------------

CATEGORIES = [
    "Unilateral Modification",
    "Liability Limitation",
    "Mandatory Arbitration",
    "Content/Data Ownership",
    "Unilateral Termination",
    "Fair / Normal",
    "Other / Unclassified"
]

RISK_WEIGHTS: Dict[str, int] = {
    "Mandatory Arbitration": 85,
    "Unilateral Modification": 75,
    "Liability Limitation": 70,
    "Unilateral Termination": 60,
    "Content/Data Ownership": 50,
    "Fair / Normal": 0,
    "Other / Unclassified": 0
}

EXPLANATIONS: Dict[str, str] = {
    "Unilateral Modification":
        "The provider may change rules, fees, or terms without obtaining explicit consent or giving timely advance notice.",
    "Liability Limitation":
        "The provider attempts to limit responsibility for losses, damages, service interruptions, or data loss.",
    "Mandatory Arbitration":
        "The clause may require disputes to be resolved through arbitration and could waive your right to a jury trial or class action.",
    "Content/Data Ownership":
        "The provider may receive broad rights to store, use, reproduce, modify, or commercially utilize content you upload.",
    "Unilateral Termination":
        "The provider may suspend or terminate an account or access with limited explanation, immediate effect, or without notice.",
    "Fair / Normal":
        "The clause does not match the project's defined potentially unfair categories and reflects standard operational terms.",
    "Other / Unclassified":
        "The clause does not match the project's defined legal-risk categories or contains neutral informational text."
}

MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "lexguard_best_model.pkl")
DATASET_CSV_PATH = os.path.join(os.path.dirname(__file__), "data", "lexguard_training_dataset.csv")

# -------------------------------------------------------------------------
# TEXT PREPROCESSING
# -------------------------------------------------------------------------

def clean_text(text: str) -> str:
    """
    Cleans raw text while preserving crucial legal negations like:
    not, without, except, unless, no.
    """
    text = str(text).replace("\n", " ")
    text = re.sub(r"[^A-Za-z0-9\s'’-]", " ", text)
    text = re.sub(r"\s+", " ", text).strip().lower()
    return text

# -------------------------------------------------------------------------
# RISK LEVEL MAPPING
# -------------------------------------------------------------------------

def risk_level(score: float) -> str:
    """Maps a risk score (0-100) to project risk level."""
    if score <= 20:
        return "LOW"
    elif score <= 40:
        return "MODERATE"
    elif score <= 60:
        return "MEDIUM"
    elif score <= 80:
        return "HIGH"
    return "VERY HIGH"

def clause_risk(category: str) -> int:
    """Returns the project-defined static risk weight for a clause category."""
    return RISK_WEIGHTS.get(category, 0)

# -------------------------------------------------------------------------
# MODEL PIPELINES & BENCHMARKS
# -------------------------------------------------------------------------

def get_model_definitions() -> Dict[str, Pipeline]:
    """Returns the exact dictionary of pipeline architectures from the research notebook."""
    return {
        "Logistic Regression": Pipeline([
            ("tfidf", TfidfVectorizer(
                ngram_range=(1, 3), sublinear_tf=True,
                min_df=1, max_df=0.95, max_features=5000
            )),
            ("clf", LogisticRegression(
                max_iter=3000, class_weight="balanced"
            ))
        ]),
        "Linear SVM": Pipeline([
            ("tfidf", TfidfVectorizer(
                ngram_range=(1, 3), sublinear_tf=True,
                min_df=1, max_df=0.95, max_features=5000
            )),
            ("clf", CalibratedClassifierCV(
                LinearSVC(class_weight="balanced", random_state=42), cv=3
            ))
        ]),
        "Naive Bayes": Pipeline([
            ("tfidf", TfidfVectorizer(
                ngram_range=(1, 3), sublinear_tf=True,
                min_df=1, max_df=0.95, max_features=5000
            )),
            ("clf", MultinomialNB(alpha=0.5))
        ]),
        "Random Forest": Pipeline([
            ("tfidf", TfidfVectorizer(
                ngram_range=(1, 2), sublinear_tf=True,
                min_df=1, max_df=0.95, max_features=5000
            )),
            ("clf", RandomForestClassifier(
                n_estimators=300, random_state=42,
                class_weight="balanced_subsample"
            ))
        ])
    }

class ModelManager:
    """
    Manages model training, evaluation metrics cache, and serialized artifacts.
    """
    def __init__(self):
        self.model: Optional[Pipeline] = None
        self.held_out_results: List[Dict[str, Any]] = []
        self.cv_results: List[Dict[str, Any]] = []
        self.selected_model_name: str = "Linear SVM"
        self._ensure_model_loaded()

    def train_and_evaluate(self):
        """Executes the exact training and evaluation split from the notebook."""
        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        os.makedirs(os.path.dirname(DATASET_CSV_PATH), exist_ok=True)

        df = pd.DataFrame(CLAUSE_DATA, columns=["clause", "category"])
        df["clean_clause"] = df["clause"].apply(clean_text)
        df[["clause", "category"]].to_csv(DATASET_CSV_PATH, index=False)

        X = df["clean_clause"]
        y = df["category"]

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.20, random_state=42, stratify=y
        )

        models = get_model_definitions()
        results = []
        fitted_models = {}

        for name, model_pipeline in models.items():
            model_pipeline.fit(X_train, y_train)
            pred = model_pipeline.predict(X_test)
            precision, recall, f1, _ = precision_recall_fscore_support(
                y_test, pred, average="weighted", zero_division=0
            )
            acc = accuracy_score(y_test, pred)
            results.append({
                "model": name,
                "accuracy": round(float(acc), 4),
                "precision": round(float(precision), 4),
                "recall": round(float(recall), 4),
                "f1_score": round(float(f1), 4)
            })
            fitted_models[name] = model_pipeline

        results_df = pd.DataFrame(results).sort_values("f1_score", ascending=False).reset_index(drop=True)
        self.held_out_results = results_df.to_dict(orient="records")

        # 5-fold cross validation across the whole dataset
        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        cv_rows = []
        for name, model_pipeline in models.items():
            scores = cross_val_score(model_pipeline, X, y, cv=cv, scoring="f1_weighted")
            cv_rows.append({
                "model": name,
                "mean_f1": round(float(scores.mean()), 4),
                "std_f1": round(float(scores.std()), 4)
            })
        cv_df = pd.DataFrame(cv_rows).sort_values("mean_f1", ascending=False).reset_index(drop=True)
        self.cv_results = cv_df.to_dict(orient="records")

        # Select highest F1 on held-out test as in the notebook (Linear SVM)
        best_name = results_df.iloc[0]["model"]
        self.selected_model_name = best_name
        self.model = fitted_models[best_name]

        # Save artifact
        joblib.dump(self.model, MODEL_PATH)

    def _ensure_model_loaded(self):
        """Loads artifact if available; otherwise trains and initializes."""
        if os.path.exists(MODEL_PATH):
            try:
                self.model = joblib.load(MODEL_PATH)
                self._load_fallback_metrics()
                return
            except Exception:
                pass
        self.train_and_evaluate()

    def _load_fallback_metrics(self):
        """Metrics documented directly from the notebook results table."""
        self.held_out_results = [
            {"model": "Linear SVM", "accuracy": 0.8095, "precision": 0.8095, "recall": 0.8095, "f1_score": 0.7973},
            {"model": "Logistic Regression", "accuracy": 0.7143, "precision": 0.7024, "recall": 0.7143, "f1_score": 0.6993},
            {"model": "Naive Bayes", "accuracy": 0.7143, "precision": 0.7024, "recall": 0.7143, "f1_score": 0.6993},
            {"model": "Random Forest", "accuracy": 0.5714, "precision": 0.7262, "recall": 0.5714, "f1_score": 0.5859}
        ]
        self.cv_results = [
            {"model": "Logistic Regression", "mean_f1": 0.7707, "std_f1": 0.0591},
            {"model": "Linear SVM", "mean_f1": 0.7584, "std_f1": 0.0815},
            {"model": "Naive Bayes", "mean_f1": 0.7574, "std_f1": 0.0945},
            {"model": "Random Forest", "mean_f1": 0.6829, "std_f1": 0.1302}
        ]
        self.selected_model_name = "Linear SVM"

# Global singleton model manager
model_manager = ModelManager()

# -------------------------------------------------------------------------
# EXPLAINABILITY & PREDICTION
# -------------------------------------------------------------------------

def get_prediction_probabilities(model: Pipeline, text: str) -> Dict[str, float]:
    """Retrieves class probability distributions if supported."""
    cleaned = clean_text(text)
    if hasattr(model, "predict_proba"):
        probabilities = model.predict_proba([cleaned])[0]
        return dict(zip(model.classes_, probabilities))
    return {}

def explain_prediction(model: Pipeline, text: str, top_n: int = 8) -> Dict[str, Any]:
    """
    Predicts category, calculates confidence, extracts top salient TF-IDF terms,
    and attaches project explanation and risk weight.
    """
    cleaned = clean_text(text)
    category = str(model.predict([cleaned])[0])
    probabilities = get_prediction_probabilities(model, text)
    confidence = probabilities.get(category, np.nan)
    important_terms: List[str] = []

    try:
        vectorizer: TfidfVectorizer = model.named_steps["tfidf"]
        classifier = model.named_steps["clf"]
        feature_names = np.array(vectorizer.get_feature_names_out())

        # Determine feature coefficients
        coef = None
        if hasattr(classifier, "coef_"):
            coef = classifier.coef_
        elif hasattr(classifier, "calibrated_classifiers_"):
            # CalibratedClassifierCV
            coefs = []
            for calibrated in classifier.calibrated_classifiers_:
                estimator = getattr(calibrated, "estimator", None) or getattr(calibrated, "base_estimator", None)
                if estimator is not None and hasattr(estimator, "coef_"):
                    coefs.append(estimator.coef_)
            if coefs:
                coef = np.mean(coefs, axis=0)

        if coef is not None:
            classes = list(classifier.classes_)
            if len(classes) == 2:
                idx = 1 if category == classes[1] else 0
                scores = coef[idx]
            elif category in classes:
                idx = classes.index(category)
                scores = coef[idx]
            else:
                scores = None

            if scores is not None:
                x_vec = vectorizer.transform([cleaned]).toarray()[0]
                present = np.where(x_vec > 0)[0]
                if len(present) > 0:
                    ranked = present[np.argsort(scores[present])[::-1]]
                    important_terms = [str(term) for term in feature_names[ranked[:top_n]]]
    except Exception:
        pass

    risk = clause_risk(category)
    conf_val = None if (confidence is None or np.isnan(confidence)) else round(float(confidence) * 100.0, 2)

    return {
        "clause": text,
        "category": category,
        "confidence_pct": conf_val,
        "risk_score": risk,
        "risk_level": risk_level(risk),
        "important_terms": important_terms,
        "plain_english": EXPLANATIONS.get(category, "")
    }

# -------------------------------------------------------------------------
# CLAUSE SEGMENTATION
# -------------------------------------------------------------------------

def segment_policy(text: str) -> List[str]:
    """
    Segments policy text into coherent clause blocks using numbered headers
    or paragraph boundaries, with sentence-level fallback.
    """
    text = str(text).replace("\r", "\n")
    # Break on numbered patterns like 1. 2. 1.1 etc.
    text = re.sub(r"(?m)\n\s*(?=\d+(?:\.\d+)*[.)]\s+)", "\n\n", text)
    blocks = re.split(r"\n\s*\n+", text.strip())

    if len(blocks) <= 1:
        blocks = re.split(r"(?<=[.!?])\s+(?=[A-Z])", text.strip())

    clauses: List[str] = []
    for block in blocks:
        block = re.sub(r"\s+", " ", block).strip()
        if len(block) >= 25:
            clauses.append(block)

    return clauses

# -------------------------------------------------------------------------
# COMPLETE POLICY ANALYSIS & RISK SCORING
# -------------------------------------------------------------------------

def analyze_policy(text: str, document_name: str = "Document") -> Dict[str, Any]:
    """
    Executes end-to-end analysis on policy text:
    - Segments into clauses
    - Classifies & explains each clause
    - Computes policy severity, risk density, and overall score
    """
    clauses = segment_policy(text)
    if not clauses:
        return {
            "document_name": document_name,
            "analysis_timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "overall_score": 0.0,
            "risk_level": "LOW",
            "total_clauses": 0,
            "risky_clauses": 0,
            "fair_or_unclassified_clauses": 0,
            "severity_mean": 0.0,
            "risk_density_pct": 0.0,
            "category_distribution": [],
            "clauses": [],
            "risky_clauses_summary": [],
            "highest_risk_clause": None
        }

    rows: List[Dict[str, Any]] = []
    category_counts: Dict[str, int] = {cat: 0 for cat in CATEGORIES}

    for i, clause in enumerate(clauses, start=1):
        res = explain_prediction(model_manager.model, clause)
        res["clause_no"] = i
        rows.append(res)
        cat = res["category"]
        category_counts[cat] = category_counts.get(cat, 0) + 1

    df = pd.DataFrame(rows)
    weights = df["risk_score"].astype(float)
    risky_count = int((weights > 0).sum())
    total_count = len(df)
    fair_or_unclassified = total_count - risky_count

    severity = float(weights.mean())
    risk_density = (risky_count / total_count) * 100.0
    overall_score = round((0.60 * severity) + (0.40 * risk_density), 1)
    overall_risk_lvl = risk_level(overall_score)

    # Category distribution
    cat_distribution = []
    for cat in CATEGORIES:
        cnt = category_counts.get(cat, 0)
        pct = round((cnt / total_count) * 100.0, 1) if total_count > 0 else 0.0
        cat_distribution.append({
            "category": cat,
            "count": cnt,
            "percentage": pct,
            "risk_weight": RISK_WEIGHTS.get(cat, 0)
        })

    # Risky clauses sorted highest risk first
    risky_clauses = [r for r in rows if r["risk_score"] > 0]
    risky_clauses.sort(key=lambda x: x["risk_score"], reverse=True)

    highest_risk_clause = risky_clauses[0] if risky_clauses else None

    return {
        "document_name": document_name,
        "analysis_timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "overall_score": overall_score,
        "risk_level": overall_risk_lvl,
        "total_clauses": total_count,
        "risky_clauses": risky_count,
        "fair_or_unclassified_clauses": fair_or_unclassified,
        "severity_mean": round(severity, 2),
        "risk_density_pct": round(risk_density, 1),
        "category_distribution": cat_distribution,
        "clauses": rows,
        "risky_clauses_summary": risky_clauses,
        "highest_risk_clause": highest_risk_clause
    }

# -------------------------------------------------------------------------
# FILE INGESTION (PDF / TXT)
# -------------------------------------------------------------------------

def extract_text_from_file_bytes(file_bytes: bytes, filename: str) -> str:
    """
    Extracts text from TXT or PDF bytes with comprehensive validation.
    """
    ext = os.path.splitext(filename)[1].lower()

    if ext == ".txt":
        try:
            return file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            try:
                return file_bytes.decode("latin-1")
            except Exception as e:
                raise ValueError(f"Could not decode TXT file: {str(e)}")

    elif ext == ".pdf":
        try:
            reader = PdfReader(io.BytesIO(file_bytes))
            if len(reader.pages) == 0:
                raise ValueError("PDF document has 0 pages.")
            extracted_pages = []
            for i, page in enumerate(reader.pages):
                txt = page.extract_text() or ""
                extracted_pages.append(txt)
            full_text = "\n".join(extracted_pages).strip()
            if not full_text:
                raise ValueError(
                    "No extractable text found in this PDF. It may be a scanned document or image-only PDF. "
                    "LexGuard requires text-based PDFs."
                )
            return full_text
        except Exception as e:
            if "scanned" in str(e).lower() or "no extractable text" in str(e).lower():
                raise
            raise ValueError(f"Failed to read PDF document: {str(e)}")

    else:
        raise ValueError(f"Unsupported file format '{ext}'. Only .pdf and .txt files are supported.")

# -------------------------------------------------------------------------
# CSV & PDF REPORT GENERATION
# -------------------------------------------------------------------------

def generate_csv_report(analysis_data: Dict[str, Any]) -> str:
    """Generates UTF-8 CSV content for the analysis."""
    output = io.StringIO()
    # Write UTF-8 BOM so Excel opens it with proper encoding
    output.write('\ufeff')

    rows = []
    for c in analysis_data.get("clauses", []):
        rows.append({
            "Clause #": c.get("clause_no"),
            "Predicted Category": c.get("category"),
            "Confidence (%)": c.get("confidence_pct", "N/A"),
            "Risk Score": c.get("risk_score"),
            "Risk Level": c.get("risk_level"),
            "Important Terms": ", ".join(c.get("important_terms", [])),
            "Original Clause Text": c.get("clause"),
            "Plain-English Explanation": c.get("plain_english")
        })

    df = pd.DataFrame(rows)
    df.to_csv(output, index=False)
    return output.getvalue()

def generate_pdf_report(analysis_data: Dict[str, Any]) -> bytes:
    """
    Generates a polished, professional multi-page PDF report matching legal-tech standards.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Custom styles
    primary_color = colors.HexColor("#0f172a")    # Slate 900
    accent_navy = colors.HexColor("#1e293b")      # Slate 800
    text_muted = colors.HexColor("#64748b")       # Slate 500
    border_color = colors.HexColor("#e2e8f0")     # Slate 200
    bg_light = colors.HexColor("#f8fafc")         # Slate 50

    risk_level_str = analysis_data.get("risk_level", "LOW")
    if risk_level_str in ["HIGH", "VERY HIGH"]:
        risk_color = colors.HexColor("#dc2626")   # Red
        risk_bg = colors.HexColor("#fef2f2")
    elif risk_level_str in ["MEDIUM", "MODERATE"]:
        risk_color = colors.HexColor("#d97706")   # Amber
        risk_bg = colors.HexColor("#fffbeb")
    else:
        risk_color = colors.HexColor("#16a34a")   # Green
        risk_bg = colors.HexColor("#f0fdf4")

    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=primary_color,
        spaceAfter=4
    )
    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=text_muted,
        spaceAfter=14
    )
    section_h2 = ParagraphStyle(
        "SectionH2",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=15,
        textColor=accent_navy,
        spaceBefore=14,
        spaceAfter=6
    )
    body_text = ParagraphStyle(
        "ReportBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11.5,
        textColor=primary_color
    )
    table_cell = ParagraphStyle(
        "TableCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=10.5,
        textColor=primary_color
    )
    table_header = ParagraphStyle(
        "TableHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10.5,
        textColor=primary_color
    )
    disclaimer_style = ParagraphStyle(
        "Disclaimer",
        parent=styles["Italic"],
        fontName="Helvetica-Oblique",
        fontSize=7.5,
        leading=10,
        textColor=text_muted,
        alignment=1
    )

    story = []

    # Title & Header
    story.append(Paragraph("LexGuard — Legal Terms Risk Analysis Report", title_style))
    doc_name = analysis_data.get("document_name", "Untitled Document")
    ts = analysis_data.get("analysis_timestamp", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    story.append(Paragraph(f"Document: <b>{doc_name}</b> &nbsp;|&nbsp; Generated on: <b>{ts}</b> &nbsp;|&nbsp; Model: Calibrated Linear SVM", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1, color=border_color, spaceBefore=0, spaceAfter=12))

    # Executive Summary Card
    overall_score = analysis_data.get("overall_score", 0.0)
    total_clauses = analysis_data.get("total_clauses", 0)
    risky_clauses = analysis_data.get("risky_clauses", 0)
    severity_mean = analysis_data.get("severity_mean", 0.0)
    risk_density = analysis_data.get("risk_density_pct", 0.0)

    summary_data = [
        [
            Paragraph("<b>Overall Policy Risk Score</b>", table_header),
            Paragraph("<b>Risk Level</b>", table_header),
            Paragraph("<b>Total Clauses</b>", table_header),
            Paragraph("<b>Flagged Clauses</b>", table_header),
            Paragraph("<b>Risk Density</b>", table_header)
        ],
        [
            Paragraph(f"<font size=14 color='{risk_color.hexval()}'><b>{overall_score}</b>/100</font>", table_cell),
            Paragraph(f"<font color='{risk_color.hexval()}'><b>{risk_level_str}</b></font>", table_cell),
            Paragraph(f"<b>{total_clauses}</b>", table_cell),
            Paragraph(f"<b>{risky_clauses}</b> ({round(risk_density, 1)}%)", table_cell),
            Paragraph(f"<b>{round(risk_density, 1)}%</b>", table_cell)
        ]
    ]

    t_summary = Table(summary_data, colWidths=[1.4*inch, 1.2*inch, 1.1*inch, 1.3*inch, 1.2*inch])
    t_summary.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg_light),
        ("BOX", (0, 0), (-1, -1), 1, border_color),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, border_color),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE")
    ]))
    story.append(t_summary)
    story.append(Spacer(1, 10))

    # Category Distribution Section
    story.append(Paragraph("Category Distribution", section_h2))
    cat_rows = [[
        Paragraph("<b>Category</b>", table_header),
        Paragraph("<b>Risk Weight</b>", table_header),
        Paragraph("<b>Detected Clauses</b>", table_header),
        Paragraph("<b>Share (%)</b>", table_header)
    ]]
    for item in analysis_data.get("category_distribution", []):
        cat_rows.append([
            Paragraph(item["category"], table_cell),
            Paragraph(str(item["risk_weight"]), table_cell),
            Paragraph(str(item["count"]), table_cell),
            Paragraph(f"{item['percentage']}%", table_cell)
        ])
    t_cat = Table(cat_rows, colWidths=[2.6*inch, 1.2*inch, 1.3*inch, 1.1*inch])
    t_cat.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), bg_light),
        ("BOX", (0, 0), (-1, -1), 1, border_color),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, border_color),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE")
    ]))
    story.append(t_cat)
    story.append(Spacer(1, 12))

    # Detailed Clause Breakdown Table
    story.append(Paragraph("Clause-by-Clause Detailed Assessment", section_h2))
    clause_table_data = [[
        Paragraph("<b>#</b>", table_header),
        Paragraph("<b>Clause Text & Key Salient Terms</b>", table_header),
        Paragraph("<b>Predicted Category & Explanation</b>", table_header),
        Paragraph("<b>Risk Score</b>", table_header),
        Paragraph("<b>Level</b>", table_header)
    ]]

    for c in analysis_data.get("clauses", []):
        c_text = c.get("clause", "")
        terms = c.get("important_terms", [])
        terms_str = f"<br/><font color='#64748b' size=7><b>Key terms:</b> {', '.join(terms)}</font>" if terms else ""
        expl = f"<br/><font color='#475569' size=7><i>{c.get('plain_english', '')}</i></font>"
        conf = f" ({c.get('confidence_pct')}% conf)" if c.get("confidence_pct") else ""

        clause_p = Paragraph(f"{c_text}{terms_str}", table_cell)
        cat_p = Paragraph(f"<b>{c.get('category')}</b>{conf}{expl}", table_cell)
        score_p = Paragraph(f"<b>{c.get('risk_score')}</b>", table_cell)
        lvl_p = Paragraph(f"<b>{c.get('risk_level')}</b>", table_cell)

        clause_table_data.append([
            Paragraph(str(c.get("clause_no")), table_cell),
            clause_p,
            cat_p,
            score_p,
            lvl_p
        ])

    t_clauses = Table(
        clause_table_data,
        repeatRows=1,
        colWidths=[0.35*inch, 2.75*inch, 2.2*inch, 0.6*inch, 0.65*inch]
    )
    t_clauses.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), bg_light),
        ("BOX", (0, 0), (-1, -1), 1, border_color),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, border_color),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("VALIGN", (0, 0), (-1, -1), "TOP")
    ]))
    story.append(t_clauses)
    story.append(Spacer(1, 14))

    # Academic Disclaimer Footer
    story.append(HRFlowable(width="100%", thickness=0.5, color=border_color, spaceBefore=4, spaceAfter=8))
    story.append(Paragraph(
        "Academic project output only; not legal advice. Risk scores and categories are generated through "
        "experimental NLP classification and rule-based weights. Consult qualified legal counsel before making "
        "decisions regarding contracts or terms of service.",
        disclaimer_style
    ))

    doc.build(story)
    return buffer.getvalue()
