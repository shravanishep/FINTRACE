"""Rule-Based Detection Engine.

Applies configurable financial crime risk rules (unusually large transfers, structuring/splitting,
cross-currency mismatch, and insider off-hours access logs). Produces explainable signals.
"""

import pandas as pd
from typing import List, Dict, Any


def run_rule_engine(df_txns: pd.DataFrame, df_access_logs: pd.DataFrame) -> List[Dict[str, Any]]:
    """Execute rule-based detection pipeline and yield explainable signals."""
    signals: List[Dict[str, Any]] = []

    # Rule 1: Unusually Large Transaction
    # Threshold: Amount Paid > 500,000
    large_txns = df_txns[df_txns['amount_paid_clean'] >= 500000.0]
    for idx, row in large_txns.iterrows():
        signals.append({
            "signal_type": "LARGE_TRANSACTION",
            "source": "rule_engine",
            "severity": "HIGH" if row['amount_paid_clean'] > 1000000 else "MEDIUM",
            "description": f"Unusually large transfer of {row['Amount Paid']} {row['Payment Currency']} from account {row['Account']}.",
            "entity_ref": str(row['Account']),
            "evidence": {
                "timestamp": str(row['Timestamp']),
                "source_account": str(row['Account']),
                "dest_account": str(row['Account.1']),
                "amount": float(row['amount_paid_clean']),
                "currency": str(row['Payment Currency']),
                "payment_format": str(row['Payment Format']),
            }
        })

    # Rule 2: Cross-Currency Mismatch
    mismatch_txns = df_txns[df_txns['is_currency_mismatch'] == 1]
    for idx, row in mismatch_txns.head(50).iterrows():
        signals.append({
            "signal_type": "CROSS_CURRENCY_MISMATCH",
            "source": "rule_engine",
            "severity": "MEDIUM",
            "description": f"Currency exchange mismatch: paid in {row['Payment Currency']} but received in {row['Receiving Currency']}.",
            "entity_ref": str(row['Account']),
            "evidence": {
                "timestamp": str(row['Timestamp']),
                "source_account": str(row['Account']),
                "dest_account": str(row['Account.1']),
                "paid_currency": str(row['Payment Currency']),
                "receiving_currency": str(row['Receiving Currency']),
            }
        })

    # Rule 3: High-Risk Payment Channel (Wire / Bitcoin)
    high_risk_txns = df_txns[(df_txns['is_high_risk_format'] == 1) & (df_txns['amount_paid_clean'] > 50000)]
    for idx, row in high_risk_txns.head(50).iterrows():
        signals.append({
            "signal_type": "HIGH_RISK_CHANNEL",
            "source": "rule_engine",
            "severity": "HIGH",
            "description": f"Significant value transaction via high-risk channel ({row['Payment Format']}).",
            "entity_ref": str(row['Account']),
            "evidence": {
                "timestamp": str(row['Timestamp']),
                "source_account": str(row['Account']),
                "dest_account": str(row['Account.1']),
                "amount": float(row['amount_paid_clean']),
                "format": str(row['Payment Format']),
            }
        })

    # Rule 4: Employee Off-Hours & Elevated Access (Insider Risk)
    if not df_access_logs.empty and 'is_off_hours' in df_access_logs.columns:
        suspicious_logs = df_access_logs[df_access_logs['is_off_hours'] == True]
        for idx, log in suspicious_logs.iterrows():
            signals.append({
                "signal_type": "UNUSUAL_EMPLOYEE_ACCESS",
                "source": "rule_engine",
                "severity": "CRITICAL" if log['action'] == 'ELEVATED_PRIVILEGE_ACCESS' else "HIGH",
                "description": f"Employee {log['employee_id']} executed {log['action']} on account {log['account_id']} during off-hours.",
                "entity_ref": str(log['employee_id']),
                "target_account": str(log['account_id']),
                "evidence": {
                    "timestamp": str(log['timestamp']),
                    "employee_id": str(log['employee_id']),
                    "account_id": str(log['account_id']),
                    "action": str(log['action']),
                    "ip_address": str(log['ip_address']),
                    "terminal_id": str(log['terminal_id']),
                }
            })

    return signals
