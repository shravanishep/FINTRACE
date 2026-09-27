"""Isolation Forest ML Anomaly Detection Engine.

Uses scikit-learn Isolation Forest on engineered transaction features to detect statistically
anomalous transaction behaviour. Output is strictly labeled as ML_ANOMALY (not 'fraud').
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Any
from sklearn.ensemble import IsolationForest


def run_ml_anomaly_detection(df_txns: pd.DataFrame, contamination: float = 0.01) -> List[Dict[str, Any]]:
    """Run Isolation Forest algorithm on numerical engineered features.

    Returns list of ML_ANOMALY signals with anomaly scores.
    """
    signals: List[Dict[str, Any]] = []
    if df_txns.empty or len(df_txns) < 10:
        return signals

    # Prepare feature matrix for Isolation Forest
    feature_cols = [
        'amount_log',
        'is_currency_mismatch',
        'is_self_transfer',
        'amount_diff',
        'hour',
        'day_of_week',
        'is_off_hours',
        'is_high_risk_format',
    ]

    X = df_txns[feature_cols].copy().fillna(0)

    # Train Isolation Forest
    iso_forest = IsolationForest(
        n_estimators=100,
        contamination=contamination,
        random_state=42,
        n_jobs=-1
    )
    preds = iso_forest.fit_predict(X)
    # Convert raw decision function scores to positive anomaly score (0.0 to 1.0 range)
    raw_scores = iso_forest.decision_function(X)
    anomaly_scores = -raw_scores  # Higher score = more anomalous

    # Min-max scale score to [0, 1]
    min_s, max_s = anomaly_scores.min(), anomaly_scores.max()
    norm_scores = (anomaly_scores - min_s) / (max_s - min_s + 1e-9)

    # Extract top anomalous rows (where pred == -1)
    df_txns = df_txns.copy()
    df_txns['iso_pred'] = preds
    df_txns['anomaly_score'] = norm_scores

    anomalies = df_txns[df_txns['iso_pred'] == -1].sort_values(by='anomaly_score', ascending=False)

    for idx, row in anomalies.iterrows():
        score = float(row['anomaly_score'])
        severity = "HIGH" if score > 0.8 else "MEDIUM"

        signals.append({
            "signal_type": "ML_ANOMALY",
            "source": "ml_engine",
            "severity": severity,
            "score": round(score, 4),
            "description": f"Isolation Forest detected statistically anomalous transaction pattern (Anomaly Score: {score:.2f}).",
            "entity_ref": str(row['Account']),
            "evidence": {
                "timestamp": str(row['Timestamp']),
                "source_account": str(row['Account']),
                "dest_account": str(row['Account.1']),
                "amount": float(row['amount_paid_clean']),
                "payment_format": str(row['Payment Format']),
                "anomaly_score": round(score, 4),
                "explanation": "Transaction behavior differs significantly from normal multivariate baseline distribution."
            }
        })

    return signals
