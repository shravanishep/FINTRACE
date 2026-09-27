"""Demo Mode API endpoints."""

import os
import shutil
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.models import Investigation, DatasetMeta, User
from app.schemas.schemas import InvestigationSummary
from app.core.security import get_current_user
from app.core.config import settings
from app.services.pipeline import run_investigation_pipeline
from app.services.validation import validate_dataset

router = APIRouter(prefix="/api/demo", tags=["Demo Mode"])


@router.post("/load", response_model=InvestigationSummary, status_code=status.HTTP_201_CREATED)
def load_demo_investigation(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Load deterministic hackathon demo scenario using the real application pipeline."""
    user = db.query(User).filter(User.username == current_user["username"]).first()

    raw_dataset_path = settings.RAW_DATA_DIR / "IBM_AML_HI_SMALL" / "HI-Small_Trans.csv"
    if not raw_dataset_path.exists():
        raise HTTPException(
            status_code=400,
            detail=f"Sample raw dataset not found at {raw_dataset_path}. Please place HI-Small_Trans.csv in data/raw/IBM_AML_HI_SMALL/",
        )

    # Create deterministic Demo Workspace
    inv = Investigation(
        name="Demo Investigation — Financial Crime & Insider Risk (Case #1042)",
        description="Deterministic hackathon demo scenario: Employee E104 off-hours access correlated with Account 8000F4580 fund transfers.",
        created_by=user.id,
        status="uploading"
    )
    db.add(inv)
    db.commit()
    db.refresh(inv)

    # Copy raw dataset into uploads directory with UUID filename
    stored_filename = f"demo_{uuid.uuid4()}_HI-Small_Trans.csv"
    dest_path = settings.UPLOAD_DIR / stored_filename
    shutil.copyfile(raw_dataset_path, dest_path)

    file_size = dest_path.stat().st_size
    validation = validate_dataset(str(dest_path))

    dataset_meta = DatasetMeta(
        investigation_id=inv.id,
        original_filename="HI-Small_Trans.csv",
        stored_filename=stored_filename,
        file_size_bytes=file_size,
        row_count=validation["row_count"],
        column_names=validation["column_names"],
        validation_status="valid" if validation["is_valid"] else "invalid",
        sample_rows=validation["preview"],
    )
    db.add(dataset_meta)
    inv.status = "validated"
    db.commit()

    # Run full application pipeline
    run_investigation_pipeline(inv.id, db, sample_size=10000)
    db.refresh(inv)

    return InvestigationSummary(
        id=inv.id,
        name=inv.name,
        description=inv.description,
        status=inv.status,
        total_transactions=inv.total_transactions,
        total_signals=inv.total_signals,
        total_cases=inv.total_cases,
        total_entities=inv.total_entities,
        created_at=inv.created_at,
        updated_at=inv.updated_at,
        dataset_filename="HI-Small_Trans.csv",
    )
