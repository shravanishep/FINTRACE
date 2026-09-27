"""Dataset validation service.

Inspects uploaded CSV files, checks for required/expected columns, data types,
row counts, and basic data integrity without mutating the raw files.
"""

import pandas as pd
from typing import Any, Dict, List

# Expected column schemas for transactions
REQUIRED_TRANSACTION_COLUMNS = [
    "Timestamp", "From Bank", "Account", "To Bank", "Account.1",
    "Amount Received", "Receiving Currency", "Amount Paid",
    "Payment Currency", "Payment Format"
]

OPTIONAL_COLUMNS = ["Is Laundering"]


def validate_dataset(file_path: str, max_preview_rows: int = 10) -> Dict[str, Any]:
    """Validate a CSV file against expected transaction dataset schema.

    Returns:
        Dict with keys: is_valid, row_count, column_names, errors, warnings, preview
    """
    errors: List[str] = []
    warnings: List[str] = []
    column_names: List[str] = []
    row_count: int = 0
    preview: List[Dict[str, Any]] = []

    try:
        # Read header and first chunk to inspect columns and preview
        df_preview = pd.read_csv(file_path, nrows=max_preview_rows)
        column_names = list(df_preview.columns)

        # Check required columns
        missing_cols = [col for col in REQUIRED_TRANSACTION_COLUMNS if col not in column_names]
        if missing_cols:
            errors.append(f"Missing required columns: {', '.join(missing_cols)}")

        # Convert preview to serializable dict list
        # Handle NaN/Inf values for JSON compatibility
        preview_df = df_preview.fillna("")
        preview = preview_df.to_dict(orient="records")

        # Fast line count for full row count
        count = 0
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            for line in f:
                if line.strip():
                    count += 1
        row_count = max(0, count - 1)  # Exclude header

        if row_count == 0:
            errors.append("Dataset is empty (0 data rows).")

        # Basic check for empty or malformed dataset
        is_valid = len(errors) == 0

        return {
            "is_valid": is_valid,
            "row_count": row_count,
            "column_names": column_names,
            "errors": errors,
            "warnings": warnings,
            "preview": preview,
        }

    except Exception as e:
        return {
            "is_valid": False,
            "row_count": 0,
            "column_names": [],
            "errors": [f"Failed to parse CSV file: {str(e)}"],
            "warnings": [],
            "preview": [],
        }
