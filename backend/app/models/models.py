"""SQLAlchemy ORM models for FINTRACE.

Each investigation is fully isolated: its own dataset, signals, cases, entities,
and relationships. Uploading a new dataset never overwrites existing investigations.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Column, String, Integer, Float, Text, DateTime, Boolean, ForeignKey, JSON, Enum,
    Index
)
from sqlalchemy.orm import relationship

from app.database.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------
class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    username = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="admin")
    created_at = Column(DateTime, default=utcnow)

    investigations = relationship("Investigation", back_populates="created_by_user")


# ---------------------------------------------------------------------------
# Investigation (workspace)
# ---------------------------------------------------------------------------
class Investigation(Base):
    __tablename__ = "investigations"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(
        String(50), nullable=False, default="created"
    )  # created | uploading | validating | preprocessing | analyzing | completed | error
    created_by = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    # Summary stats (populated after analysis)
    total_transactions = Column(Integer, default=0)
    total_signals = Column(Integer, default=0)
    total_cases = Column(Integer, default=0)
    total_entities = Column(Integer, default=0)

    # Relationships
    created_by_user = relationship("User", back_populates="investigations")
    dataset = relationship("DatasetMeta", back_populates="investigation", uselist=False)
    signals = relationship("Signal", back_populates="investigation", cascade="all, delete-orphan")
    cases = relationship("Case", back_populates="investigation", cascade="all, delete-orphan")
    entities = relationship("Entity", back_populates="investigation", cascade="all, delete-orphan")
    relationships_list = relationship("Relationship", back_populates="investigation", cascade="all, delete-orphan")


# ---------------------------------------------------------------------------
# Dataset metadata (per investigation)
# ---------------------------------------------------------------------------
class DatasetMeta(Base):
    __tablename__ = "dataset_meta"

    id = Column(String, primary_key=True, default=generate_uuid)
    investigation_id = Column(String, ForeignKey("investigations.id"), nullable=False, unique=True)
    original_filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False)  # UUID-based filename on disk
    file_size_bytes = Column(Integer, nullable=False)
    row_count = Column(Integer, nullable=True)
    column_names = Column(JSON, nullable=True)  # List of column names
    validation_status = Column(String(50), default="pending")  # pending | valid | invalid
    validation_errors = Column(JSON, nullable=True)  # List of error messages
    sample_rows = Column(JSON, nullable=True)  # First N rows for preview
    uploaded_at = Column(DateTime, default=utcnow)

    investigation = relationship("Investigation", back_populates="dataset")


# ---------------------------------------------------------------------------
# Signal (from rule engine or ML)
# ---------------------------------------------------------------------------
class Signal(Base):
    __tablename__ = "signals"

    id = Column(String, primary_key=True, default=generate_uuid)
    investigation_id = Column(String, ForeignKey("investigations.id"), nullable=False)
    signal_type = Column(String(100), nullable=False)
    # Rule types: LARGE_TRANSACTION, RAPID_TRANSFERS, TRANSACTION_SPLITTING,
    #             UNUSUAL_FREQUENCY, CROSS_CURRENCY, ROUND_AMOUNT, FAN_OUT, FAN_IN
    # ML types: ML_ANOMALY
    source = Column(String(50), nullable=False)  # rule_engine | ml_engine
    severity = Column(String(20), nullable=False, default="MEDIUM")  # LOW | MEDIUM | HIGH | CRITICAL
    score = Column(Float, nullable=True)  # Anomaly score for ML signals
    entity_id = Column(String, ForeignKey("entities.id"), nullable=True)
    description = Column(Text, nullable=False)
    evidence = Column(JSON, nullable=True)  # Supporting data points
    metadata_json = Column(JSON, nullable=True)  # Additional structured data
    created_at = Column(DateTime, default=utcnow)

    investigation = relationship("Investigation", back_populates="signals")
    entity = relationship("Entity", back_populates="signals")
    case_links = relationship("CaseSignalLink", back_populates="signal", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_signals_investigation_type", "investigation_id", "signal_type"),
    )


# ---------------------------------------------------------------------------
# Case (generated from correlated signals)
# ---------------------------------------------------------------------------
class Case(Base):
    __tablename__ = "cases"

    id = Column(String, primary_key=True, default=generate_uuid)
    investigation_id = Column(String, ForeignKey("investigations.id"), nullable=False)
    case_number = Column(Integer, nullable=False)  # Sequential within investigation
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    severity = Column(String(20), nullable=False, default="MEDIUM")
    status = Column(String(50), nullable=False, default="open")  # open | reviewing | escalated | closed
    explanation = Column(Text, nullable=True)  # Human-readable case narrative
    timeline = Column(JSON, nullable=True)  # Ordered list of events
    evidence_summary = Column(JSON, nullable=True)  # Aggregated evidence
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    investigation = relationship("Investigation", back_populates="cases")
    signal_links = relationship("CaseSignalLink", back_populates="case", cascade="all, delete-orphan")
    entity_links = relationship("CaseEntityLink", back_populates="case", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_cases_investigation", "investigation_id"),
    )


# ---------------------------------------------------------------------------
# Entity (account, bank, customer/organization extracted from data)
# ---------------------------------------------------------------------------
class Entity(Base):
    __tablename__ = "entities"

    id = Column(String, primary_key=True, default=generate_uuid)
    investigation_id = Column(String, ForeignKey("investigations.id"), nullable=False)
    entity_type = Column(String(50), nullable=False)
    # Types: ACCOUNT, BANK, CUSTOMER, EMPLOYEE, TRANSACTION
    entity_ref = Column(String(255), nullable=False)  # Original ID from dataset
    label = Column(String(500), nullable=True)  # Display name
    properties = Column(JSON, nullable=True)  # Flexible key-value attributes
    created_at = Column(DateTime, default=utcnow)

    investigation = relationship("Investigation", back_populates="entities")
    signals = relationship("Signal", back_populates="entity")
    case_links = relationship("CaseEntityLink", back_populates="entity", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_entities_investigation_type", "investigation_id", "entity_type"),
        Index("ix_entities_ref", "investigation_id", "entity_ref"),
    )


# ---------------------------------------------------------------------------
# Relationship (edges in the entity graph)
# ---------------------------------------------------------------------------
class Relationship(Base):
    __tablename__ = "relationships"

    id = Column(String, primary_key=True, default=generate_uuid)
    investigation_id = Column(String, ForeignKey("investigations.id"), nullable=False)
    source_entity_id = Column(String, ForeignKey("entities.id"), nullable=False)
    target_entity_id = Column(String, ForeignKey("entities.id"), nullable=False)
    relationship_type = Column(String(100), nullable=False)
    # Types: SENT_TO, OWNS, OPERATES_AT, TRANSACTED, ACCESSED
    weight = Column(Float, default=1.0)  # Edge weight (e.g., transaction count or amount)
    properties = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=utcnow)

    investigation = relationship("Investigation", back_populates="relationships_list")
    source_entity = relationship("Entity", foreign_keys=[source_entity_id])
    target_entity = relationship("Entity", foreign_keys=[target_entity_id])

    __table_args__ = (
        Index("ix_relationships_investigation", "investigation_id"),
    )


# ---------------------------------------------------------------------------
# Association tables for Case <-> Signal and Case <-> Entity
# ---------------------------------------------------------------------------
class CaseSignalLink(Base):
    __tablename__ = "case_signal_links"

    id = Column(String, primary_key=True, default=generate_uuid)
    case_id = Column(String, ForeignKey("cases.id"), nullable=False)
    signal_id = Column(String, ForeignKey("signals.id"), nullable=False)

    case = relationship("Case", back_populates="signal_links")
    signal = relationship("Signal", back_populates="case_links")


class CaseEntityLink(Base):
    __tablename__ = "case_entity_links"

    id = Column(String, primary_key=True, default=generate_uuid)
    case_id = Column(String, ForeignKey("cases.id"), nullable=False)
    entity_id = Column(String, ForeignKey("entities.id"), nullable=False)
    role = Column(String(100), nullable=True)  # e.g., "sender", "receiver", "owner"

    case = relationship("Case", back_populates="entity_links")
    entity = relationship("Entity", back_populates="case_links")
