"""Pydantic schemas for request/response validation."""

from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------
class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str
    role: str


# ---------------------------------------------------------------------------
# Investigation
# ---------------------------------------------------------------------------
class InvestigationCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None


class InvestigationSummary(BaseModel):
    id: str
    name: str
    description: Optional[str]
    status: str
    total_transactions: int
    total_signals: int
    total_cases: int
    total_entities: int
    created_at: datetime
    updated_at: datetime
    dataset_filename: Optional[str] = None

    model_config = {"from_attributes": True}


class InvestigationDetail(InvestigationSummary):
    created_by: str
    dataset: Optional["DatasetMetaResponse"] = None


# ---------------------------------------------------------------------------
# Dataset
# ---------------------------------------------------------------------------
class DatasetMetaResponse(BaseModel):
    id: str
    original_filename: str
    file_size_bytes: int
    row_count: Optional[int]
    column_names: Optional[list[str]]
    validation_status: str
    validation_errors: Optional[list[str]]
    sample_rows: Optional[list[dict[str, Any]]]
    uploaded_at: datetime

    model_config = {"from_attributes": True}


class DatasetValidationResponse(BaseModel):
    is_valid: bool
    row_count: int
    column_names: list[str]
    errors: list[str]
    warnings: list[str]
    preview: list[dict[str, Any]]


# ---------------------------------------------------------------------------
# Signal
# ---------------------------------------------------------------------------
class SignalResponse(BaseModel):
    id: str
    signal_type: str
    source: str
    severity: str
    score: Optional[float]
    entity_id: Optional[str]
    description: str
    evidence: Optional[Any]
    metadata_json: Optional[Any]
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Case
# ---------------------------------------------------------------------------
class CaseResponse(BaseModel):
    id: str
    case_number: int
    title: str
    description: Optional[str]
    severity: str
    status: str
    explanation: Optional[str]
    timeline: Optional[list[dict[str, Any]]]
    evidence_summary: Optional[Any]
    created_at: datetime
    updated_at: datetime
    signal_count: int = 0
    entity_count: int = 0

    model_config = {"from_attributes": True}


class CaseDetail(CaseResponse):
    signals: list[SignalResponse] = []
    entities: list["EntityResponse"] = []


class CaseStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(open|reviewing|escalated|closed)$")


# ---------------------------------------------------------------------------
# Entity
# ---------------------------------------------------------------------------
class EntityResponse(BaseModel):
    id: str
    entity_type: str
    entity_ref: str
    label: Optional[str]
    properties: Optional[dict[str, Any]]

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Relationship (for graph)
# ---------------------------------------------------------------------------
class RelationshipResponse(BaseModel):
    id: str
    source_entity_id: str
    target_entity_id: str
    relationship_type: str
    weight: float
    properties: Optional[dict[str, Any]]

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Graph data (combined for frontend)
# ---------------------------------------------------------------------------
class GraphNode(BaseModel):
    id: str
    entity_type: str
    label: str
    properties: Optional[dict[str, Any]]


class GraphEdge(BaseModel):
    source: str
    target: str
    relationship_type: str
    weight: float


class GraphData(BaseModel):
    nodes: list[GraphNode]
    edges: list[GraphEdge]


# ---------------------------------------------------------------------------
# Dashboard stats
# ---------------------------------------------------------------------------
class DashboardStats(BaseModel):
    total_investigations: int
    active_cases: int
    total_signals: int
    total_entities: int
    recent_investigations: list[InvestigationSummary]


# ---------------------------------------------------------------------------
# Generic
# ---------------------------------------------------------------------------
class MessageResponse(BaseModel):
    message: str
    detail: Optional[str] = None
