"""
LexGuard Standalone Model Trainer
Executes data preprocessing, train-test evaluation, 5-fold cross-validation,
and serializes the best model artifact.
"""

import os
import joblib
import pandas as pd
import numpy as np

from dataset import CLAUSE_DATA
from analyzer import (
    clean_text,
    get_model_definitions,
    MODEL_PATH,
    DATASET_CSV_PATH
)
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, classification_report, confusion_matrix

def main():
    print("=" * 60)
    print("LEXGUARD - MODEL TRAINING AND BENCHMARKING")
    print("=" * 60)

    # 1. Prepare Dataset
    df = pd.DataFrame(CLAUSE_DATA, columns=["clause", "category"])
    df["clean_clause"] = df["clause"].apply(clean_text)
    print(f"Total annotated clauses: {len(df)}")
    print("Class distribution:")
    print(df["category"].value_counts())
    print("-" * 60)

    os.makedirs(os.path.dirname(DATASET_CSV_PATH), exist_ok=True)
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    df[["clause", "category"]].to_csv(DATASET_CSV_PATH, index=False)
    print(f"Dataset saved to: {DATASET_CSV_PATH}")

    # 2. Train / Test Split (80 / 20 stratified)
    X = df["clean_clause"]
    y = df["category"]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f"Training samples: {len(X_train)}, Testing samples: {len(X_test)}")
    print("-" * 60)

    # 3. Model Comparison
    models = get_model_definitions()
    results = []
    fitted_models = {}

    for name, pipeline in models.items():
        pipeline.fit(X_train, y_train)
        pred = pipeline.predict(X_test)
        precision, recall, f1, _ = precision_recall_fscore_support(
            y_test, pred, average="weighted", zero_division=0
        )
        acc = accuracy_score(y_test, pred)
        results.append({
            "Model": name,
            "Accuracy": f"{acc:.2%}",
            "Precision": f"{precision:.2%}",
            "Recall": f"{recall:.2%}",
            "F1 Score": f"{f1:.2%}",
            "_raw_f1": f1
        })
        fitted_models[name] = pipeline

    res_df = pd.DataFrame(results).sort_values("_raw_f1", ascending=False).drop(columns=["_raw_f1"]).reset_index(drop=True)
    print("Held-out Test Split Results (20%):")
    print(res_df.to_string(index=False))
    print("-" * 60)

    # 4. Five-Fold Cross-Validation
    print("5-Fold Cross-Validation (Stratified):")
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_rows = []
    for name, pipeline in models.items():
        scores = cross_val_score(pipeline, X, y, cv=cv, scoring="f1_weighted")
        cv_rows.append({
            "Model": name,
            "Mean F1": f"{scores.mean():.2%}",
            "Std F1": f"{scores.std():.2%}",
            "_mean_raw": scores.mean()
        })
    cv_df = pd.DataFrame(cv_rows).sort_values("_mean_raw", ascending=False).drop(columns=["_mean_raw"]).reset_index(drop=True)
    print(cv_df.to_string(index=False))
    print("-" * 60)

    # 5. Best Model Evaluation & Serialization
    best_name = res_df.iloc[0]["Model"]
    best_model = fitted_models[best_name]
    joblib.dump(best_model, MODEL_PATH)
    print(f"Best model selected by held-out F1: {best_name}")
    print(f"Serialized model saved to: {MODEL_PATH}")

    # Detailed test report for best model
    best_pred = best_model.predict(X_test)
    print("\nClassification Report (Held-out Test Set):")
    print(classification_report(y_test, best_pred, zero_division=0))

    labels = sorted(y.unique())
    print("\nConfusion Matrix:")
    print(pd.DataFrame(confusion_matrix(y_test, best_pred, labels=labels), index=labels, columns=labels))
    print("=" * 60)

if __name__ == "__main__":
    main()
