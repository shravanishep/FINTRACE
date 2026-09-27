"""End-to-End Verification Test for FINTRACE Pipeline & Auth."""

import os
import sys
from app.core.config import settings
from app.database.database import init_db, SessionLocal
from app.main import create_default_admin
from app.core.security import verify_password
from app.models.models import User, Investigation, Signal, Case, Entity, Relationship
from app.services.pipeline import run_investigation_pipeline

print("=" * 60)
print("FINTRACE END-TO-END PIPELINE VERIFICATION")
print("=" * 60)

# 1. Test Auth Seeding
init_db()
create_default_admin()
db = SessionLocal()

admin = db.query(User).filter(User.username == "admin").first()
print(f"1. Admin user verified: {admin.username if admin else 'FAIL'}")
assert admin is not None and verify_password("fintrace2024", admin.password_hash)
print("   [SUCCESS] Password hash verification passed.")

# 2. Test Demo Pipeline Trigger
raw_dataset = settings.RAW_DATA_DIR / "IBM_AML_HI_SMALL" / "HI-Small_Trans.csv"
if raw_dataset.exists():
    print("\n2. Triggering Pipeline on sample dataset...")
    # Create test investigation
    inv = Investigation(
        name="Verification Test Workspace",
        description="E2E test pipeline run",
        created_by=admin.id,
        status="uploading"
    )
    db.add(inv)
    db.commit()
    db.refresh(inv)

    from app.models.models import DatasetMeta
    ds = DatasetMeta(
        investigation_id=inv.id,
        original_filename="HI-Small_Trans.csv",
        stored_filename="HI-Small_Trans.csv",
        file_size_bytes=os.path.getsize(raw_dataset),
        row_count=50000,
        column_names=["Timestamp", "From Bank", "Account", "To Bank", "Account.1", "Amount Received", "Receiving Currency", "Amount Paid", "Payment Currency", "Payment Format"],
        validation_status="valid"
    )

    from app.core import config
    original_upload_dir = config.settings.UPLOAD_DIR
    config.settings.UPLOAD_DIR = config.settings.RAW_DATA_DIR / "IBM_AML_HI_SMALL"
    ds.stored_filename = "HI-Small_Trans.csv"

    db.add(ds)
    inv.status = "validated"
    db.commit()

    inv_updated = run_investigation_pipeline(inv.id, db, sample_size=5000)
    config.settings.UPLOAD_DIR = original_upload_dir

    print(f"\n3. Pipeline Execution Results for '{inv_updated.name}':")
    print(f"   - Total Transactions Analyzed: {inv_updated.total_transactions}")
    print(f"   - Total Risk Signals Generated: {inv_updated.total_signals}")
    print(f"   - Total Correlated Cases Created: {inv_updated.total_cases}")
    print(f"   - Total Graph Entities Connected: {inv_updated.total_entities}")
    print(f"   - Status: {inv_updated.status}")

    # Inspect generated signals
    signals = db.query(Signal).filter(Signal.investigation_id == inv.id).all()
    rule_sigs = [s for s in signals if s.source == 'rule_engine']
    ml_sigs = [s for s in signals if s.source == 'ml_engine']

    print(f"\n4. Detection Engine Signals Breakdown:")
    print(f"   - Rule Engine Signals: {len(rule_sigs)}")
    print(f"   - Isolation Forest ML_ANOMALY Signals: {len(ml_sigs)}")

    # Inspect generated cases
    cases = db.query(Case).filter(Case.investigation_id == inv.id).all()
    print(f"\n5. Generated Correlated Cases:")
    for c in cases:
        print(f"   * [{c.severity}] {c.title} (Status: {c.status})")

    assert inv_updated.status == "completed"
    assert inv_updated.total_signals > 0
    assert inv_updated.total_cases > 0
    assert inv_updated.total_entities > 0
    print("\n[ALL TESTS PASSED] Pipeline end-to-end test completed successfully!")
else:
    print("\n[SKIP] Raw dataset not found at data/raw/IBM_AML_HI_SMALL/HI-Small_Trans.csv")

db.close()
