"""Signals and Graph API endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.models import Signal, Entity, Relationship, Investigation
from app.schemas.schemas import SignalResponse, GraphData, GraphNode, GraphEdge
from app.core.security import get_current_user

router = APIRouter(prefix="/api/investigations/{investigation_id}", tags=["Signals & Graph"])


@router.get("/signals", response_model=list[SignalResponse])
def list_signals(
    investigation_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """List all signals generated for an investigation."""
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    signals = db.query(Signal).filter(Signal.investigation_id == investigation_id).order_by(Signal.created_at.desc()).all()
    return [SignalResponse.model_validate(s) for s in signals]


@router.get("/graph", response_model=GraphData)
def get_graph_data(
    investigation_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get entity-relationship graph data for visualization."""
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    entities = db.query(Entity).filter(Entity.investigation_id == investigation_id).all()
    relationships = db.query(Relationship).filter(Relationship.investigation_id == investigation_id).all()

    nodes = [
        GraphNode(
            id=e.id,
            entity_type=e.entity_type,
            label=e.label or e.entity_ref,
            properties=e.properties,
        )
        for e in entities
    ]

    edges = [
        GraphEdge(
            source=r.source_entity_id,
            target=r.target_entity_id,
            relationship_type=r.relationship_type,
            weight=r.weight,
        )
        for r in relationships
    ]

    return GraphData(nodes=nodes, edges=edges)
