"""Case Report API endpoint.

Generates a deterministic investigation report from actual case data.
No LLM or Gemini — purely structured evidence from the database.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Any, Dict

from app.database.database import get_db
from app.models.models import Case, Signal, Entity, Relationship, Investigation, CaseSignalLink, CaseEntityLink
from app.core.security import get_current_user

router = APIRouter(prefix="/api/investigations/{investigation_id}/cases", tags=["Case Report"])


@router.get("/{case_id}/report")
def get_case_report(
    investigation_id: str,
    case_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """Generate a structured investigation report for a specific case.

    Builds the report deterministically from database-persisted evidence.
    No LLM required.
    """
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    c = db.query(Case).filter(
        Case.id == case_id,
        Case.investigation_id == investigation_id
    ).first()
    if not c:
        raise HTTPException(status_code=404, detail="Case not found")

    # Fetch linked signals
    signal_links = db.query(CaseSignalLink).filter(CaseSignalLink.case_id == case_id).all()
    signal_ids = [lnk.signal_id for lnk in signal_links]
    signals = db.query(Signal).filter(Signal.id.in_(signal_ids)).all() if signal_ids else []

    # Fetch linked entities
    entity_links = db.query(CaseEntityLink).filter(CaseEntityLink.case_id == case_id).all()
    entity_ids = [lnk.entity_id for lnk in entity_links]
    entities = db.query(Entity).filter(Entity.id.in_(entity_ids)).all() if entity_ids else []

    # Fetch relationships between these entities
    ent_id_set = {e.id for e in entities}
    relationships = []
    if ent_id_set:
        rels = db.query(Relationship).filter(
            Relationship.investigation_id == investigation_id,
            Relationship.source_entity_id.in_(ent_id_set),
            Relationship.target_entity_id.in_(ent_id_set),
        ).all()
        for r in rels:
            src = next((e for e in entities if e.id == r.source_entity_id), None)
            tgt = next((e for e in entities if e.id == r.target_entity_id), None)
            relationships.append({
                "source_label": src.label or src.entity_ref if src else r.source_entity_id,
                "source_type": src.entity_type if src else "UNKNOWN",
                "target_label": tgt.label or tgt.entity_ref if tgt else r.target_entity_id,
                "target_type": tgt.entity_type if tgt else "UNKNOWN",
                "relationship_type": r.relationship_type,
                "weight": r.weight,
            })

    # Build risk indicators from signals
    risk_indicators = []
    for s in signals:
        evidence = s.evidence or {}
        risk_indicators.append({
            "signal_type": s.signal_type,
            "severity": s.severity,
            "source": "Rule Engine" if s.source == "rule_engine" else "Isolation Forest ML",
            "description": s.description,
            "transaction_id": evidence.get("source_account", ""),
            "account": evidence.get("source_account", ""),
            "dest_account": evidence.get("dest_account", ""),
            "amount": evidence.get("amount"),
            "timestamp": evidence.get("timestamp", ""),
            "currency": evidence.get("currency", evidence.get("paid_currency", "")),
            "anomaly_score": s.score,
        })

    # Build entity summary
    entity_summary = []
    for e in entities:
        props = e.properties or {}
        entity_summary.append({
            "entity_type": e.entity_type,
            "entity_ref": e.entity_ref,
            "label": e.label or e.entity_ref,
            "properties": props,
        })

    # Determine dataset name
    dataset_name = inv.dataset.original_filename if inv.dataset else "Unknown Dataset"

    report = {
        "case_id": c.id,
        "case_number": c.case_number,
        "investigation_id": investigation_id,
        "investigation_name": inv.name,
        "dataset": dataset_name,

        # Case header
        "title": c.title,
        "severity": c.severity,
        "status": c.status,
        "created_at": c.created_at.isoformat(),
        "updated_at": c.updated_at.isoformat(),

        # Section 1: Summary
        "summary": c.explanation or c.description or "No summary available.",

        # Section 2: Risk indicators
        "risk_indicators": risk_indicators,

        # Section 3: Entities
        "entities": entity_summary,

        # Section 4: Evidence
        "evidence_summary": c.evidence_summary,

        # Section 5: Timeline
        "timeline": c.timeline or [],

        # Section 6: Relationships
        "relationships": relationships,

        # Section 7: Signal count
        "signal_count": len(signals),
        "entity_count": len(entities),

        # Section 8: Analyst status
        "analyst_status": c.status,
    }

    return report
