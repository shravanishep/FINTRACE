"""Data Preprocessing & Feature Engineering Service.

Loads raw CSV datasets, standardizes schema, enriches with account master metadata,
engineers numeric features for Isolation Forest ML, and merges synthetic access logs.
"""

import os
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple
from app.core.config import settings
from app.utils.synthetic import generate_synthetic_data

ACCOUNTS_CSV_PATH = settings.RAW_DATA_DIR / "IBM_AML_HI_SMALL" / "HI-Small_accounts.csv"


def load_and_preprocess_dataset(
    file_path: str,
    sample_size: int = settings.DEFAULT_SAMPLE_SIZE,
    enrich_accounts: bool = True
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Load dataset, run schema normalization, feature engineering, and entity enrichment.

    Returns:
        (df_features, df_accounts, df_access_logs)
    """
    # 1. Read dataset (sample for prototype performance if > sample_size)
    df_raw = pd.read_csv(file_path, nrows=sample_size)

    # 2. Normalize and clean columns
    df = df_raw.copy()

    # Calculate engineered features for ML & Rule detection
    df['amount_paid_clean'] = pd.to_numeric(df['Amount Paid'], errors='coerce').fillna(0.0)
    df['amount_received_clean'] = pd.to_numeric(df['Amount Received'], errors='coerce').fillna(0.0)
    df['amount_log'] = np.log1p(df['amount_paid_clean'])

    df['is_currency_mismatch'] = (df['Receiving Currency'] != df['Payment Currency']).astype(int)
    df['is_self_transfer'] = (df['Account'] == df['Account.1']).astype(int)
    df['amount_diff'] = (df['amount_paid_clean'] - df['amount_received_clean']).abs()

    # Parse timestamps safely
    df['dt'] = pd.to_datetime(df['Timestamp'], format='%Y/%m/%d %H:%M', errors='coerce')
    df['hour'] = df['dt'].dt.hour.fillna(0).astype(int)
    df['day_of_week'] = df['dt'].dt.dayofweek.fillna(0).astype(int)
    df['is_off_hours'] = ((df['hour'] < 6) | (df['hour'] >= 22)).astype(int)

    # Channel risk weights
    high_risk_formats = {'Wire', 'Bitcoin', 'Cash'}
    df['is_high_risk_format'] = df['Payment Format'].apply(lambda x: 1 if x in high_risk_formats else 0)

    # 3. Load Accounts Enrichment dataset if available
    df_accts = pd.DataFrame()
    if enrich_accounts and ACCOUNTS_CSV_PATH.exists():
        try:
            # Read first 100k account mappings for fast join
            df_accts = pd.read_csv(ACCOUNTS_CSV_PATH, nrows=100000)
        except Exception:
            df_accts = pd.DataFrame()

    # 4. Load Synthetic Employee & Access Logs
    emp_path, logs_path = generate_synthetic_data()
    df_logs = pd.read_csv(logs_path)

    return df, df_accts, df_logs
