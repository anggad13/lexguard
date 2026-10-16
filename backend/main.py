"""
LexGuard FastAPI Backend Application
Provides endpoints for text & file analysis, report generation (CSV/PDF),
model evaluation metrics, and system health.
"""

import os
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from schemas import (
    AnalyzeTextRequest,
    PolicyAnalysisResponse,
    ModelMetricsResponse,
    HealthResponse,
    ModelComparisonRow,
    CVComparisonRow
)
from analyzer import (
    model_manager,
    analyze_policy,
    extract_text_from_file_bytes,
    generate_csv_report,
    generate_pdf_report,
    CATEGORIES,
    RISK_WEIGHTS
)

app = FastAPI(
    title="LexGuard API",
    description="NLP-Based Legal Terms & Conditions Risk Analyzer",
    version="1.0.0"
)

# CORS configuration for local development & deployment (Vercel)
origins_env = os.environ.get("CORS_ORIGINS", "*")
origins = [o.strip() for o in origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins_env != "*" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SAMPLE_POLICY_TEXT = """1. Acceptance of Terms
You may use the service for personal and non-commercial purposes only, provided you comply with these Terms of Service.

2. Modifications to Service and Terms
We reserve the right to modify or amend these Terms at any time without prior notice or obtaining user consent. Changes take effect immediately upon posting.

3. Dispute Resolution and Mandatory Arbitration
You agree that any dispute, claim, or controversy arising out of or relating to these Terms must be resolved through binding individual arbitration rather than in court. You expressly waive your right to a jury trial or to participate in any class action lawsuit against the company.

4. Limitation of Liability
To the maximum extent permitted by applicable law, we are not liable for any direct, indirect, incidental, punitive, or consequential damages resulting from service interruptions or data loss.

5. Content and Intellectual Property Rights
You grant us a worldwide, perpetual, royalty-free, transferable license to use, reproduce, modify, and distribute any content or submissions you upload to the platform for our commercial purposes.

6. Account Termination
We reserve the right to suspend or terminate your account and discontinue your access to the service at any time without notice or explanation, at our sole discretion.

7. Customer Inquiries and Settings
You can update your account information from your profile settings at any time, or contact our customer support team if you have questions regarding the platform."""

@app.get("/api/health", response_model=HealthResponse)
def health_check():
    """Returns backend availability and model status."""
    return {
        "status": "healthy",
        "model_loaded": model_manager.model is not None,
        "version": "1.0.0"
    }

@app.get("/api/sample")
def get_sample_policy():
    """Provides standard sample policy text for demonstration mode."""
    return {
        "document_name": "Standard Terms of Service (Sample)",
        "text": SAMPLE_POLICY_TEXT
    }

@app.post("/api/analyze/text", response_model=PolicyAnalysisResponse)
def analyze_text_endpoint(payload: AnalyzeTextRequest):
    """
    Analyzes submitted legal text using the trained classification pipeline
    and rule-based risk scoring engine.
    """
    cleaned_input = payload.text.strip()
    if len(cleaned_input) < 15:
        raise HTTPException(
            status_code=400,
            detail="The provided text is too short to extract legal clauses. Please provide at least one complete clause."
        )

    doc_name = (payload.document_name or "Pasted Policy").strip()
    try:
        result = analyze_policy(cleaned_input, document_name=doc_name)
        if result["total_clauses"] == 0:
            raise HTTPException(
                status_code=400,
                detail="Could not segment the text into meaningful legal clauses. Please ensure sentences are separated by punctuation."
            )
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis pipeline error: {str(e)}")

@app.post("/api/analyze/file", response_model=PolicyAnalysisResponse)
async def analyze_file_endpoint(
    file: UploadFile = File(...),
    document_name: str = Form(None)
):
    """
    Ingests and analyzes an uploaded PDF or TXT file.
    Validates file format, size, and text extractability.
    """
    filename = file.filename or "uploaded_document"
    ext = os.path.splitext(filename)[1].lower()

    if ext not in [".pdf", ".txt"]:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file extension '{ext}'. Only .pdf and .txt files are supported."
        )

    # Maximum file size 10MB
    MAX_FILE_SIZE = 10 * 1024 * 1024
    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File size exceeds the 10 MB limit. Please upload a smaller document."
        )
    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is completely empty."
        )

    try:
        extracted_text = extract_text_from_file_bytes(file_bytes, filename)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")

    doc_title = (document_name or os.path.splitext(filename)[0]).strip()
    try:
        result = analyze_policy(extracted_text, document_name=doc_title)
        if result["total_clauses"] == 0:
            raise HTTPException(
                status_code=400,
                detail="No clauses could be identified from the document text. Ensure the document contains complete sentences."
            )
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis pipeline error: {str(e)}")

@app.post("/api/reports/csv")
def download_csv_report(analysis_data: PolicyAnalysisResponse):
    """Generates and streams a downloadable CSV report."""
    try:
        csv_content = generate_csv_report(analysis_data.model_dump())
        clean_name = "".join(c if c.isalnum() or c in "-_" else "_" for c in analysis_data.document_name)
        filename = f"lexguard_{clean_name}.csv"
        return Response(
            content=csv_content,
            media_type="text/csv; charset=utf-8",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate CSV: {str(e)}")

@app.post("/api/reports/pdf")
def download_pdf_report(analysis_data: PolicyAnalysisResponse):
    """Generates and streams a downloadable PDF report."""
    try:
        pdf_bytes = generate_pdf_report(analysis_data.model_dump())
        clean_name = "".join(c if c.isalnum() or c in "-_" else "_" for c in analysis_data.document_name)
        filename = f"lexguard_{clean_name}.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")

@app.get("/api/metrics", response_model=ModelMetricsResponse)
def get_metrics_endpoint():
    """
    Returns verified research metrics: held-out test set evaluation,
    five-fold cross-validation comparison, and architecture details.
    """
    held_out_list = [ModelComparisonRow(**row) for row in model_manager.held_out_results]
    cv_list = [CVComparisonRow(**row) for row in model_manager.cv_results]

    selected_held_out = next((r for r in held_out_list if r.model == model_manager.selected_model_name), held_out_list[0])
    selected_cv = next((r for r in cv_list if r.model == model_manager.selected_model_name), cv_list[0])

    return {
        "selected_model_name": model_manager.selected_model_name,
        "selected_model_note": (
            "Calibrated Linear SVM achieved highest F1-score (79.73%) and accuracy (80.95%) on the held-out test split, "
            "while Logistic Regression achieved the highest average F1-score (77.07%) across 5-fold cross-validation."
        ),
        "held_out_metrics": selected_held_out,
        "cv_metrics": selected_cv,
        "models_comparison": held_out_list,
        "cv_comparison": cv_list,
        "categories": CATEGORIES,
        "risk_weights": RISK_WEIGHTS,
        "dataset_size": 105,
        "training_samples": 84,
        "testing_samples": 21,
        "disclaimer": (
            "LexGuard is an academic research prototype. The model was trained on an experimental dataset of 105 legal clauses. "
            "Risk scores reflect project-defined classification rules and do not constitute legal advice or formal enforceability rulings."
        )
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
