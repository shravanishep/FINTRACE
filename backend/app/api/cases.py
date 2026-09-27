"""Case management API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.models import Case, Investigation, Signal, Entity, CaseSignalLink, CaseEntityLink
from app.schemas.schemas import CaseResponse, CaseDetail, CaseStatusUpdate, SignalResponse, EntityResponse
from app.core.security import get_current_user

router = APIRouter(prefix="/api/investigations/{investigation_id}/cases", tags=["Cases"])


@router.get("", response_model=list[CaseResponse])
def list_cases(
    investigation_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """List all cases generated for an investigation."""
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    cases = db.query(Case).filter(Case.investigation_id == investigation_id).order_by(Case.case_number.asc()).all()

    result = []
    for c in cases:
        sig_count = len(c.signal_links)
        ent_count = len(c.entity_links)
        result.append(CaseResponse(
            id=c.id,
            case_number=c.case_number,
            title=c.title,
            description=c.description,
            severity=c.severity,
            status=c.status,
            explanation=c.explanation,
            timeline=c.timeline,
            evidence_summary=c.evidence_summary,
            created_at=c.created_at,
            updated_at=c.updated_at,
            signal_count=sig_count,
            entity_count=ent_count,
        ))
    return result


@router.get("/{case_id}", response_model=CaseDetail)
def get_case_detail(
    investigation_id: str,
    case_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get detailed view of a case including associated signals and entities."""
    c = db.query(Case).filter(
        Case.id == case_id,
        Case.investigation_id == investigation_id
    ).first()

    if not c:
        raise HTTPException(status_code=404, detail="Case not found")

    # Fetch signals
    signal_links = db.query(CaseSignalLink).filter(CaseSignalLink.case_id == case_id).all()
    signal_ids = [link.signal_id for link in signal_links]
    signals = db.query(Signal).filter(Signal.id.in_(signal_ids)).all() if signal_ids else []

    # Fetch entities
    entity_links = db.query(CaseEntityLink).filter(CaseEntityLink.case_id == case_id).all()
    entity_ids = [link.entity_id for link in entity_links]
    entities = db.query(Entity).filter(Entity.id.in_(entity_ids)).all() if entity_ids else []

    sig_responses = [SignalResponse.model_validate(s) for s in signals]
    ent_responses = [EntityResponse.model_validate(e) for e in entities]

    return CaseDetail(
        id=c.id,
        case_number=c.case_number,
        title=c.title,
        description=c.description,
        severity=c.severity,
        status=c.status,
        explanation=c.explanation,
        timeline=c.timeline,
        evidence_summary=c.evidence_summary,
        created_at=c.created_at,
        updated_at=c.updated_at,
        signal_count=len(sig_responses),
        entity_count=len(ent_responses),
        signals=sig_responses,
        entities=ent_responses,
    )


@router.patch("/{case_id}/status", response_model=CaseResponse)
def update_case_status(
    investigation_id: str,
    case_id: str,
    payload: CaseStatusUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Update case status (open | reviewing | escalated | closed)."""
    c = db.query(Case).filter(
        Case.id == case_id,
        Case.investigation_id == investigation_id
    ).first()

    if not c:
        raise HTTPException(status_code=404, detail="Case not found")

    c.status = payload.status
    db.commit()
    db.refresh(c)

    return CaseResponse(
        id=c.id,
        case_number=c.case_number,
        title=c.title,
        description=c.description,
        severity=c.severity,
        status=c.status,
        explanation=c.explanation,
        timeline=c.timeline,
        evidence_summary=c.evidence_summary,
        created_at=c.created_at,
        updated_at=c.updated_at,
        signal_count=len(c.signal_links),
        entity_count=len(c.entity_links),
    )
