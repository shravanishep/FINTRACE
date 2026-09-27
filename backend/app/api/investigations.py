"""Investigation management API endpoints."""

import os
import uuid
import shutil
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.models import Investigation, DatasetMeta, User
from app.schemas.schemas import (
    InvestigationCreate, InvestigationSummary, InvestigationDetail,
    DatasetMetaResponse, DashboardStats, MessageResponse
)
from app.core.security import get_current_user
from app.core.config import settings
from app.services.validation import validate_dataset

router = APIRouter(prefix="/api/investigations", tags=["Investigations"])


@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get dashboard overview stats."""
    user = db.query(User).filter(User.username == current_user["username"]).first()
    investigations = db.query(Investigation).filter(Investigation.created_by == user.id).all()

    total_signals = sum(inv.total_signals for inv in investigations)
    active_cases = sum(inv.total_cases for inv in investigations)
    total_entities = sum(inv.total_entities for inv in investigations)

    recent = sorted(investigations, key=lambda x: x.created_at, reverse=True)[:10]
    recent_summaries = []
    for inv in recent:
        ds_name = None
        if inv.dataset:
            ds_name = inv.dataset.original_filename
        recent_summaries.append(InvestigationSummary(
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
            dataset_filename=ds_name,
        ))

    return DashboardStats(
        total_investigations=len(investigations),
        active_cases=active_cases,
        total_signals=total_signals,
        total_entities=total_entities,
        recent_investigations=recent_summaries,
    )


@router.get("", response_model=list[InvestigationSummary])
def list_investigations(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """List all investigations for the current user."""
    user = db.query(User).filter(User.username == current_user["username"]).first()
    investigations = (
        db.query(Investigation)
        .filter(Investigation.created_by == user.id)
        .order_by(Investigation.created_at.desc())
        .all()
    )
    result = []
    for inv in investigations:
        ds_name = inv.dataset.original_filename if inv.dataset else None
        result.append(InvestigationSummary(
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
            dataset_filename=ds_name,
        ))
    return result


@router.post("", response_model=InvestigationSummary, status_code=status.HTTP_201_CREATED)
def create_investigation(
    payload: InvestigationCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Create a new investigation workspace."""
    user = db.query(User).filter(User.username == current_user["username"]).first()
    inv = Investigation(
        name=payload.name,
        description=payload.description,
        created_by=user.id,
    )
    db.add(inv)
    db.commit()
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
        dataset_filename=None,
    )


@router.get("/{investigation_id}", response_model=InvestigationDetail)
def get_investigation(
    investigation_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get full investigation details."""
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    dataset_resp = None
    ds_name = None
    if inv.dataset:
        ds_name = inv.dataset.original_filename
        dataset_resp = DatasetMetaResponse(
            id=inv.dataset.id,
            original_filename=inv.dataset.original_filename,
            file_size_bytes=inv.dataset.file_size_bytes,
            row_count=inv.dataset.row_count,
            column_names=inv.dataset.column_names,
            validation_status=inv.dataset.validation_status,
            validation_errors=inv.dataset.validation_errors,
            sample_rows=inv.dataset.sample_rows,
            uploaded_at=inv.dataset.uploaded_at,
        )

    return InvestigationDetail(
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
        created_by=inv.created_by,
        dataset=dataset_resp,
        dataset_filename=ds_name,
    )


@router.delete("/{investigation_id}", response_model=MessageResponse)
def delete_investigation(
    investigation_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Delete an investigation and its associated data."""
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    # Delete uploaded file if exists
    if inv.dataset:
        file_path = settings.UPLOAD_DIR / inv.dataset.stored_filename
        if file_path.exists():
            file_path.unlink()

    db.delete(inv)
    db.commit()
    return MessageResponse(message="Investigation deleted successfully")


@router.post("/{investigation_id}/upload", response_model=DatasetMetaResponse)
async def upload_dataset(
    investigation_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Upload a CSV dataset to an investigation."""
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    # Check if investigation already has a dataset
    if inv.dataset:
        raise HTTPException(
            status_code=400,
            detail="Investigation already has a dataset. Create a new investigation for a new dataset.",
        )

    # Validate file type
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    # Save file with UUID name to prevent collisions
    stored_filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = settings.UPLOAD_DIR / stored_filename

    try:
        inv.status = "uploading"
        db.commit()

        # Stream file to disk
        file_size = 0
        with open(file_path, "wb") as buffer:
            while chunk := await file.read(8192):
                buffer.write(chunk)
                file_size += len(chunk)

        # Validate the dataset
        inv.status = "validating"
        db.commit()

        validation = validate_dataset(str(file_path))

        # Create dataset metadata
        dataset_meta = DatasetMeta(
            investigation_id=investigation_id,
            original_filename=file.filename,
            stored_filename=stored_filename,
            file_size_bytes=file_size,
            row_count=validation["row_count"],
            column_names=validation["column_names"],
            validation_status="valid" if validation["is_valid"] else "invalid",
            validation_errors=validation["errors"] if validation["errors"] else None,
            sample_rows=validation["preview"],
        )
        db.add(dataset_meta)

        inv.status = "validated" if validation["is_valid"] else "error"
        inv.total_transactions = validation["row_count"] or 0
        db.commit()
        db.refresh(dataset_meta)

        # Trigger full pipeline analysis
        if validation["is_valid"]:
            try:
                from app.services.pipeline import run_investigation_pipeline
                run_investigation_pipeline(investigation_id, db)
            except Exception as pe:
                print(f"Pipeline error: {pe}")

        return DatasetMetaResponse(
            id=dataset_meta.id,
            original_filename=dataset_meta.original_filename,
            file_size_bytes=dataset_meta.file_size_bytes,
            row_count=dataset_meta.row_count,
            column_names=dataset_meta.column_names,
            validation_status=dataset_meta.validation_status,
            validation_errors=dataset_meta.validation_errors,
            sample_rows=dataset_meta.sample_rows,
            uploaded_at=dataset_meta.uploaded_at,
        )
    except Exception as e:
        # Clean up on failure
        if file_path.exists():
            file_path.unlink()
        inv.status = "error"
        db.commit()
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.post("/{investigation_id}/analyze", response_model=InvestigationSummary)
def trigger_analysis(
    investigation_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Manually trigger or re-run the detection, graph, and case pipeline."""
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")
    if not inv.dataset:
        raise HTTPException(status_code=400, detail="No dataset uploaded for this investigation")

    from app.services.pipeline import run_investigation_pipeline
    inv_updated = run_investigation_pipeline(investigation_id, db)

    ds_name = inv_updated.dataset.original_filename if inv_updated.dataset else None
    return InvestigationSummary(
        id=inv_updated.id,
        name=inv_updated.name,
        description=inv_updated.description,
        status=inv_updated.status,
        total_transactions=inv_updated.total_transactions,
        total_signals=inv_updated.total_signals,
        total_cases=inv_updated.total_cases,
        total_entities=inv_updated.total_entities,
        created_at=inv_updated.created_at,
        updated_at=inv_updated.updated_at,
        dataset_filename=ds_name,
    )

