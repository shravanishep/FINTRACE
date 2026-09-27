"""Synthetic employee and access log dataset generator for insider risk intelligence."""

import os
import random
import pandas as pd
from datetime import datetime, timedelta
from app.core.config import settings

EMPLOYEES_PATH = settings.SYNTHETIC_DATA_DIR / "employees.csv"
ACCESS_LOGS_PATH = settings.SYNTHETIC_DATA_DIR / "access_logs.csv"


def generate_synthetic_data(force_recreate: bool = False) -> tuple[str, str]:
    """Generate synthetic employee master records and system access logs.

    Creates realistic employee roles (Analyst, Teller, Manager, Admin) and access logs.
    Includes deterministic scenario data for Employee E104 accessing Account 8000F4580.
    """
    if not force_recreate and EMPLOYEES_PATH.exists() and ACCESS_LOGS_PATH.exists():
        return str(EMPLOYEES_PATH), str(ACCESS_LOGS_PATH)

    settings.SYNTHETIC_DATA_DIR.mkdir(parents=True, exist_ok=True)

    # 1. Generate Employee Master Data
    employees = [
        {"employee_id": "E101", "name": "Sarah Connor", "role": "Senior Teller", "department": "Retail Banking", "clearance_level": "L2"},
        {"employee_id": "E102", "name": "Marcus Vance", "role": "Compliance Analyst", "department": "AML Operations", "clearance_level": "L3"},
        {"employee_id": "E103", "name": "Elena Rostova", "role": "Account Manager", "department": "Private Wealth", "clearance_level": "L2"},
        {"employee_id": "E104", "name": "David Miller", "role": "IT System Admin", "department": "Core Systems", "clearance_level": "L4"},
        {"employee_id": "E105", "name": "Priya Sharma", "role": "Risk Officer", "department": "Financial Crime", "clearance_level": "L3"},
    ]
    df_emp = pd.DataFrame(employees)
    df_emp.to_csv(EMPLOYEES_PATH, index=False)

    # 2. Generate Access Logs (Normal + Suspicious Anomaly for E104)
    access_logs = []
    base_date = datetime(2022, 9, 1, 8, 0)  # Align with IBM dataset timestamps (2022/09/01)

    # Normal access logs during working hours (08:00 - 18:00)
    sample_accounts = ["8000EBD30", "8000F4670", "8000F5030", "8000F5200", "8000F5340"]
    actions = ["VIEW_ACCOUNT", "EXPORT_TRANSACTIONS", "MODIFY_LIMIT", "QUERY_BALANCE"]

    for i in range(50):
        emp = random.choice(employees)
        # Random daytime hour
        offset_minutes = random.randint(0, 10 * 60)
        log_time = base_date + timedelta(minutes=offset_minutes)
        account = random.choice(sample_accounts)
        action = random.choice(actions)

        access_logs.append({
            "log_id": f"LOG_{1000 + i}",
            "timestamp": log_time.strftime("%Y/%m/%d %H:%M"),
            "employee_id": emp["employee_id"],
            "account_id": account,
            "action": action,
            "ip_address": f"10.200.4.{random.randint(10, 200)}",
            "is_off_hours": False,
            "terminal_id": f"TERM_{random.randint(10, 50)}",
        })

    # Add Deterministic Suspicious Insider Logs for Demo (Employee E104 accessing 8000F4580 off-hours)
    demo_logs = [
        {
            "log_id": "LOG_E104_01",
            "timestamp": "2022/09/01 01:15",  # 1:15 AM - Off hours!
            "employee_id": "E104",
            "account_id": "8000F4580",
            "action": "ELEVATED_PRIVILEGE_ACCESS",
            "ip_address": "192.168.1.105",  # Remote VPN IP
            "is_off_hours": True,
            "terminal_id": "REMOTE_VPN_SESSION_88",
        },
        {
            "log_id": "LOG_E104_02",
            "timestamp": "2022/09/01 01:18",
            "employee_id": "E104",
            "account_id": "8000F4580",
            "action": "EXPORT_FULL_LEDGER",
            "ip_address": "192.168.1.105",
            "is_off_hours": True,
            "terminal_id": "REMOTE_VPN_SESSION_88",
        }
    ]
    access_logs.extend(demo_logs)

    df_logs = pd.DataFrame(access_logs)
    df_logs.to_csv(ACCESS_LOGS_PATH, index=False)

    return str(EMPLOYEES_PATH), str(ACCESS_LOGS_PATH)
